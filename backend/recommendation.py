import asyncio
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
import logging
import json
import datetime 

from database_schema import (
    get_db_pool,
    get_cv_analysis,
    get_active_internship_listings,
    get_user_preferences,
    get_user_recommendations, 
)

logger = logging.getLogger("recommendation_engine")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# --- Helper Functions ---

def safe_get(data, key, default=""):
    """Safely get a value from a dict or record, handling None."""
    if data is None:
        return default
    val = data.get(key)
    return val if val is not None else default

def normalize_scores(scores):
    """Normalize scores to a 0-1 range."""
    # Ensure scores is a numpy array for calculations
    scores = np.array(scores)
    if len(scores) == 0:
        return scores
    min_score = np.min(scores)
    max_score = np.max(scores)
    if max_score == min_score:
      
        return np.full_like(scores, 0.5) if min_score != 0 else np.zeros_like(scores)
    return (scores - min_score) / (max_score - min_score)

# --- Content-Based Filtering ---

async def calculate_content_scores(user_id: int, user_profile: dict, all_listings_df: pd.DataFrame, user_prefs: dict):
    """Calculates content-based scores for all active listings for a given user."""
    logger.info(f"Calculating content scores for user {user_id}")

    if all_listings_df.empty:
        logger.warning(f"No listings provided for content scoring for user {user_id}.")
        return pd.Series(dtype=float)

    keywords_list = [] 
    if user_profile and user_profile.get("keywords"):
        raw_keywords = user_profile.get("keywords")
        if isinstance(raw_keywords, str):
            try:
                parsed_keywords = json.loads(raw_keywords)
                if isinstance(parsed_keywords, list):
                    keywords_list = parsed_keywords
                else:
                     logger.warning(f"Parsed keywords for user {user_id} is not a list: {parsed_keywords}")
                     keywords_list = [] 
            except json.JSONDecodeError:
                logger.error(f"Failed to parse keywords JSON string for user {user_id}: {raw_keywords}")
                keywords_list = []
        elif isinstance(raw_keywords, list):
            # If it's already a list, use it directly
            keywords_list = raw_keywords
        else:
             # Handle unexpected types waaaaaaaaaaa3
             logger.warning(f"Keywords for user {user_id} has unexpected type: {type(raw_keywords)}")
             keywords_list = []
    else:
        # Handle case where user_profile is None or 'keywords' key is missing
        logger.warning(f"User profile or keywords key missing for user {user_id}.")
        keywords_list = []

    # Check if the final keywords_list is effectively empty
    if not keywords_list: 
        logger.warning(f"User {user_id} has no valid profile keywords after processing. Skipping content-based scoring.")
        # Return Series of zeros with listing IDs as index
        return pd.Series(0.0, index=all_listings_df.index)

    # --- Proceed with keyword processing and scoring --- 
    user_keywords_str = " ".join(keywords_list)

    # Prepare listing texts
    all_listings_df["combined_text"] = all_listings_df.apply(
        lambda row: f"{safe_get(row, 'title')} {safe_get(row, 'description')} {safe_get(row, 'skills')} {safe_get(row, 'domain')}",
        axis=1
    )
    # Handle potential NaN values in combined_text
    all_listings_df["combined_text"] = all_listings_df["combined_text"].fillna("")


    # Vectorize using TF-IDF
    vectorizer = TfidfVectorizer(stop_words='english')
    listing_vectors = vectorizer.fit_transform(all_listings_df["combined_text"])
    user_vector = vectorizer.transform([user_keywords_str])
    content_similarity = cosine_similarity(user_vector, listing_vectors).flatten()
    scores = content_similarity
    if user_prefs:
        country_weights = user_prefs.get("country_weights", {})
        if isinstance(country_weights, str):
            try:
                country_weights = json.loads(country_weights)
            except json.JSONDecodeError: country_weights = {}
        platform_weights = user_prefs.get("platform_weights", {})
        if isinstance(platform_weights, str):
            try:
                platform_weights = json.loads(platform_weights)
            except json.JSONDecodeError: platform_weights = {}

        # Default weight is 1.0 if not specified in prefs
        country_multipliers = all_listings_df["country"].map(lambda c: country_weights.get(c, 1.0)).fillna(1.0).values
        platform_multipliers = all_listings_df["platform"].map(lambda p: platform_weights.get(p, 1.0)).fillna(1.0).values

        # Apply multipliers (ensure scores don't exceed 1 if similarity is already 1)
        scores = np.minimum(scores * country_multipliers * platform_multipliers, 1.0)
    content_scores_series = pd.Series(scores, index=all_listings_df.index)

    logger.info(f"Finished calculating content scores for user {user_id}")
    return content_scores_series

# --- Collaborative Filtering (User-Based) ---

async def get_all_user_interactions():
    """Fetches all user-item interactions (saved internships)."""
    pool = await get_db_pool()
    interactions = []
    conn = None 
    try:
        conn = await pool.acquire()
        rows = await conn.fetch("""
            SELECT user_id, internship_id
            FROM user_recommendations
            WHERE is_saved = TRUE
        """)
        interactions = [(row["user_id"], row["internship_id"]) for row in rows]
    except Exception as e:
        logger.error(f"Error fetching user interactions: {e}")
    finally:
        if conn: await pool.release(conn)
    return interactions

async def calculate_collaborative_scores(user_id: int, all_listings_df: pd.DataFrame, all_interactions: list, n_neighbors=10):
    """Calculates user-based collaborative filtering scores."""
    logger.info(f"Calculating collaborative scores for user {user_id}")

    if all_listings_df.empty:
        logger.warning(f"No listings provided for collaborative scoring for user {user_id}.")
        return pd.Series(dtype=float)

    if not all_interactions:
        logger.warning("No interaction data available. Skipping collaborative filtering.")
        return pd.Series(0.0, index=all_listings_df.index)

    # Create user-item interaction matrix (implicit feedback: 1 if saved, 0 otherwise)
    interactions_df = pd.DataFrame(all_interactions, columns=["user_id", "internship_id"])
    interactions_df["saved"] = 1
    # Ensure internship_id is present in all_listings_df index for pivoting
    valid_interactions = interactions_df[interactions_df['internship_id'].isin(all_listings_df.index)]
    if valid_interactions.empty:
        logger.warning("No valid interactions found matching current listings. Skipping collaborative filtering.")
        return pd.Series(0.0, index=all_listings_df.index)
    try:
        user_item_matrix = valid_interactions.pivot_table(index="user_id", columns="internship_id", values="saved", fill_value=0)
    except Exception as e:
        logger.error(f"Error creating user-item matrix: {e}. Check for duplicate interactions.")
        # Handle duplicates: group by user/item and take max (or first)
        valid_interactions = valid_interactions.groupby(['user_id', 'internship_id']).max().reset_index()
        user_item_matrix = valid_interactions.pivot_table(index="user_id", columns="internship_id", values="saved", fill_value=0)


    if user_id not in user_item_matrix.index:
        logger.warning(f"User {user_id} has no interactions with current listings. Skipping collaborative filtering.")
        return pd.Series(0.0, index=all_listings_df.index)

    # Fit k-NN model (cosine similarity on user vectors)
    effective_n_neighbors = min(n_neighbors + 1, user_item_matrix.shape[0])
    if effective_n_neighbors <= 1:
         logger.warning(f"Not enough users ({user_item_matrix.shape[0]}) for collaborative filtering with k={n_neighbors}. Skipping.")
         return pd.Series(0.0, index=all_listings_df.index)

    knn_model = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=effective_n_neighbors)
    knn_model.fit(user_item_matrix)

    # Find neighbors for the target user
    try:
        user_index = user_item_matrix.index.get_loc(user_id)
        distances, indices = knn_model.kneighbors(user_item_matrix.iloc[user_index, :].values.reshape(1, -1))

        # Exclude self from neighbors
        neighbor_indices = indices.flatten()[1:]
        neighbor_distances = distances.flatten()[1:]
        if len(neighbor_indices) == 0:
            logger.warning(f"User {user_id} has no similar neighbors found. Skipping collaborative filtering.")
            return pd.Series(0.0, index=all_listings_df.index)

        neighbor_similarities = 1 - neighbor_distances # Convert distance to similarity
        neighbor_user_ids = user_item_matrix.index[neighbor_indices]

    except Exception as e:
        logger.error(f"Error finding neighbors for user {user_id}: {e}")
        return pd.Series(0.0, index=all_listings_df.index)

    # Predict scores based on neighbors' interactions
    neighbor_interactions = user_item_matrix.loc[neighbor_user_ids]
    sim_sum = np.sum(neighbor_similarities)
    if sim_sum == 0:
         weighted_scores = neighbor_interactions.mean(axis=0)
    else:
      
        weighted_scores = neighbor_interactions.multiply(neighbor_similarities, axis=0).sum(axis=0) / sim_sum


    collab_scores_series = pd.Series(0.0, index=all_listings_df.index)
    valid_items = weighted_scores.index.intersection(collab_scores_series.index)
    collab_scores_series.loc[valid_items] = weighted_scores[valid_items]

    logger.info(f"Finished calculating collaborative scores for user {user_id}")
    return collab_scores_series


# --- Hybrid Recommendation Generation ---

async def generate_hybrid_recommendations(user_id: int, alpha: float = 0.6, top_n: int = 10):
    logger.info(f"Generating hybrid recommendations for user {user_id} with alpha={alpha}")

    # 1. Fetch necessary data
    pool = await get_db_pool() 
    conn = None
    user_profile = None 
    user_prefs = None
    all_listings = []
    all_interactions = []
    user_existing_recs = []
    interacted_item_ids = set()

    try:
        conn = await pool.acquire()
        user_profile = await get_cv_analysis(user_id) # Assumes uses external pool or manages its own
        user_prefs = await get_user_preferences(user_id)
        all_listings = await get_active_internship_listings(limit=5000) # Consider pagination/chunking for very large sets
        all_interactions = await get_all_user_interactions() # Fetches saved items
        user_existing_recs = await get_user_recommendations(user_id) # Assumes this returns list of dicts {internship_id: X, ...}
        interacted_item_ids = {rec["internship_id"] for rec in user_existing_recs} if user_existing_recs else set()

        if not user_profile or not user_profile.get("keywords"):
             temp_keywords_list = []
             if user_profile and user_profile.get("keywords"):
                 raw_keywords = user_profile.get("keywords")
                 if isinstance(raw_keywords, str):
                     try: temp_keywords_list = json.loads(raw_keywords)
                     except: pass
                 elif isinstance(raw_keywords, list): temp_keywords_list = raw_keywords
             
             if not temp_keywords_list or not isinstance(temp_keywords_list, list):
                 logger.warning(f"User {user_id} has no valid CV analysis (keywords). Cannot generate recommendations.")
                 return [] 

    except Exception as e:
        logger.error(f"Error fetching initial data for user {user_id}: {e}")

        if conn: await pool.release(conn) 
        
        return [] 
    finally:
        if conn: await pool.release(conn)

    if not all_listings:
        logger.warning("No active internship listings found.")
        return []

    all_listings_df = pd.DataFrame(all_listings)
    if "id" not in all_listings_df.columns:
         logger.error("Column 'id' not found in listings dataframe.")
         return []
    if all_listings_df.index.name != "id":
        all_listings_df.set_index("id", inplace=True, drop=False) # Keep id column
    if all_listings_df.index.isnull().any():
        logger.warning("Found null values in listing IDs, removing them.")
        all_listings_df = all_listings_df[all_listings_df.index.notnull()]

    if all_listings_df.empty:
        logger.warning("No valid listings remain after cleaning.")
        return []

    # 2. Calculate Content-Based Scores
    # Pass the already fetched user_profile and user_prefs
    content_scores = await calculate_content_scores(user_id, user_profile, all_listings_df.copy(), user_prefs)

    # 3. Calculate Collaborative Filtering Scores
    # Pass the already fetched all_interactions
    collab_scores = await calculate_collaborative_scores(user_id, all_listings_df.copy(), all_interactions)

    # Ensure scores are aligned to the same index (all_listings_df.index)
    content_scores = content_scores.reindex(all_listings_df.index, fill_value=0.0)
    collab_scores = collab_scores.reindex(all_listings_df.index, fill_value=0.0)

    # 4. Normalize Scores (handle cases where one score type is all zeros)
    norm_content_scores = normalize_scores(content_scores.values) if np.any(content_scores.values > 0) else content_scores.values
    norm_collab_scores = normalize_scores(collab_scores.values) if np.any(collab_scores.values > 0) else collab_scores.values

    content_scores_norm_series = pd.Series(norm_content_scores, index=content_scores.index)
    collab_scores_norm_series = pd.Series(norm_collab_scores, index=collab_scores.index)

    # 5. Combine Scores (Weighted Hybrid)
    hybrid_scores = alpha * content_scores_norm_series + (1 - alpha) * collab_scores_norm_series

    # 6. Filter out already interacted items and Rank
    # Ensure interacted_item_ids are valid listing IDs present in the index
    valid_interacted_ids = interacted_item_ids.intersection(hybrid_scores.index)
    hybrid_scores_filtered = hybrid_scores.drop(index=valid_interacted_ids, errors='ignore') # Use errors='ignore'
    top_recommendations = hybrid_scores_filtered.nlargest(top_n)

    # 7. Format and Save Results
    recommendations_to_save = []
    final_recommendations = []
    # Use the DataFrame directly for lookup

    for listing_id, score in top_recommendations.items():
        if pd.isna(score) or score <= 1e-6: # Skip NaN or near-zero scores
            continue

        # Use .loc for safe lookup
        try:
            # Ensure listing_id is of the correct type for indexing (usually int)
            listing_info = all_listings_df.loc[int(listing_id)].to_dict()
        except (KeyError, ValueError) as e:
            logger.warning(f"Listing ID {listing_id} not found or invalid in DataFrame during formatting: {e}")
            continue

        if listing_info:
            rec_data = {
                "user_id": user_id,
                "internship_id": int(listing_id), 
                "similarity_score": float(score), 
                "recommended_at": datetime.datetime.now(datetime.timezone.utc),
                "is_viewed": False,
                "is_saved": False
            }
            recommendations_to_save.append(rec_data)
            api_rec = {
                "id": int(listing_id),
                "title": listing_info.get("title", ""),
                "company": listing_info.get("company", ""),
                "location": listing_info.get("location", ""),
                "country": listing_info.get("country", ""),
                "platform": listing_info.get("platform", ""),
                "description": listing_info.get("description", ""),
                "skills": listing_info.get("skills", ""),
                "domain": listing_info.get("domain", ""),
                "link": listing_info.get("link", ""),
                "similarity_score": float(score),
                "recommended_at": rec_data["recommended_at"],
                "is_viewed": False,
                "is_saved": False
            }
            final_recommendations.append(api_rec)


    # Save recommendations to database
    if recommendations_to_save:
        pool = await get_db_pool()
        conn = None
        try:
            conn = await pool.acquire()
            data_tuples = [
                (r["user_id"], r["internship_id"], r["similarity_score"],
                 r["recommended_at"], r["is_viewed"], r["is_saved"])
                for r in recommendations_to_save
            ]
            await conn.executemany("""
                INSERT INTO user_recommendations (user_id, internship_id, similarity_score, recommended_at, is_viewed, is_saved)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, internship_id) DO UPDATE SET
                    similarity_score = EXCLUDED.similarity_score,
                    recommended_at = EXCLUDED.recommended_at,
                    is_viewed = FALSE, -- Reset viewed/saved status on new recommendation
                    is_saved = FALSE
            """, data_tuples)
            logger.info(f"Saved/Updated {len(recommendations_to_save)} recommendations for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving recommendations for user {user_id}: {e}")
        finally:
            if conn: await pool.release(conn)

    logger.info(f"Generated {len(final_recommendations)} recommendations for user {user_id}")
    return final_recommendations

from pydantic import BaseModel, EmailStr

class Recommendation(BaseModel):
    id: int
    title: str
    company: str
    location: str
    country: str
    platform: str    
    similarity_score: float
    recommended_at: datetime.datetime
    is_viewed: bool
    is_saved: bool

# services/recommendation_service.py (ou équivalent)
async def mark_recommendation_viewed(user_id: int, listing_id: int) -> bool:
    rec = await Recommendation.get_or_none(id=listing_id, user_id=user_id)
    if not rec:
        return False
    rec.is_viewed = True
    await rec.save()
    return True

async def mark_recommendation_saved(user_id: int, listing_id: int, is_saved: bool):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rec = await conn.fetchrow(
            "SELECT id FROM user_recommendations WHERE id = $1 AND user_id = $2",
            listing_id, user_id
        )
        if not rec:
            print(f"Recommandation non trouvée: id={listing_id}, user_id={user_id}")
            return False
        
        await conn.execute(
            "UPDATE user_recommendations SET is_saved = $1 WHERE id = $2 AND user_id = $3",
            is_saved, listing_id, user_id
        )
        print(f"Recommandation mise à jour: id={listing_id}, saved={is_saved}")
        return True
