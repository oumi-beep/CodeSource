
import asyncio
import asyncpg
import datetime
from typing import List, Dict, Any, Optional

# Database connection parameters
DB_CONFIG = {
    "user": "postgres",
    "password": "Oumaima123",
    "database": "postgres",
    "host": "localhost",
    "port": 5432,
}

# For create_pool ONLY
POOL_CONFIG = {
    "min_size": 1,
    "max_size": 20,
}

async def get_db_pool():
    return await asyncpg.create_pool(**DB_CONFIG, **POOL_CONFIG)

# Initialize DB schema
async def init_db():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
    await pool.close()
    print("Database schema initialized successfully")
# Dependency to get a connection (for FastAPI endpoint)
async def get_db_connection():
    conn = await asyncpg.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        await conn.close()

# SQL Statements for database setup
CREATE_TABLES_SQL = """
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- CV Analysis table
CREATE TABLE IF NOT EXISTS cv_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255),
    keywords JSONB,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Internship Listings table
CREATE TABLE IF NOT EXISTS internship_listings (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    country TEXT,
    platform TEXT,
    description TEXT,
    skills TEXT,
    domain TEXT,
    link TEXT UNIQUE,
    hash_id TEXT UNIQUE,
    phase_1_complete BOOLEAN DEFAULT TRUE,
    phase_2_complete BOOLEAN DEFAULT FALSE,
    description_scraped_at TIMESTAMP NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    domain_weight FLOAT DEFAULT 0.4,
    skills_weight FLOAT DEFAULT 0.3,
    title_weight FLOAT DEFAULT 0.2,
    description_weight FLOAT DEFAULT 0.1,
    country_weights JSONB DEFAULT '{"Morocco": 1.0, "France": 1.0,"Canada":1.0}'::jsonb,
    platform_weights JSONB DEFAULT '{"LinkedIn": 1.0, "Indeed": 1.0, "Glassdoor": 1.0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- User Recommendations table
CREATE TABLE IF NOT EXISTS user_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    internship_id INTEGER REFERENCES internship_listings(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_viewed BOOLEAN DEFAULT FALSE,
    is_saved BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    UNIQUE(user_id, internship_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internship_listings_domain ON internship_listings(domain);
CREATE INDEX IF NOT EXISTS idx_internship_listings_platform ON internship_listings(platform);
CREATE INDEX IF NOT EXISTS idx_internship_listings_country ON internship_listings(country);
CREATE INDEX IF NOT EXISTS idx_internship_listings_scraped_at ON internship_listings(scraped_at);
CREATE INDEX IF NOT EXISTS idx_internship_listings_expires_at ON internship_listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_internship_listings_is_active ON internship_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_phase_1_complete ON internship_listings(phase_1_complete);
CREATE INDEX IF NOT EXISTS idx_phase_2_complete ON internship_listings(phase_2_complete);
CREATE INDEX IF NOT EXISTS idx_description_scraped_at ON internship_listings(description_scraped_at);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_similarity_score ON user_recommendations(similarity_score);
"""


#----------
# Profile information 
# -------------
# 
async def get_user_profile(email: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Query to join users and cv_analysis tables on user_id and filter by email
        query = """
            SELECT
                u.username,
                u.email,
                c.domain,
                c.keywords
            FROM users u
            LEFT JOIN cv_analysis c ON u.id = c.user_id
            WHERE u.email = $1
        """
        result = await conn.fetchrow(query, email)
        if result:
            return {
                "username": result["username"],
                "email": result["email"],
                "domain": result["domain"],
                "keywords": result["keywords"],
            }
        return None 

# Function to clean up expired internship listings
async def cleanup_expired_listings(days=30):
    """
    Mark internship listings older than specified days as inactive.
    
    Args:
        days (int): Number of days to keep listings active
    """
    pool = await get_db_pool()
    expiry_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    
    async with pool.acquire() as conn:
        # Mark old listings as inactive
        result = await conn.execute("""
            UPDATE internship_listings
            SET is_active = FALSE
            WHERE scraped_at < $1 AND is_active = TRUE
        """, expiry_date)
        
        print(f"Marked {result.split()[1]} listings as inactive (older than {days} days)")
    
    await pool.close()

# User management functions
async def create_user(username: str, email: str, password_hash: str):
    """
    Create a new user.
    
    Args:
        username (str): Username
        email (str): Email address
        password_hash (str): Hashed password
        
    Returns:
        int: User ID if successful, None if error
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            user_id = await conn.fetchval("""
                INSERT INTO users (username, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id
            """, username, email, password_hash)
            return user_id
    except asyncpg.UniqueViolationError:
        print(f"User with username '{username}' or email '{email}' already exists")
        return None
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return None
    finally:
        await pool.close()

async def get_user_by_username(username: str):
    """
    Get user by username.
    
    Args:
        username (str): Username
        
    Returns:
        dict: User data if found, None otherwise
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            user = await conn.fetchrow("""
                SELECT id, username, email, password_hash, created_at, last_login
                FROM users
                WHERE username = $1
            """, username)
            
            if user:
                return dict(user)
            return None
    except Exception as e:
        print(f"Error getting user: {str(e)}")
        return None
    finally:
        await pool.close()

async def update_last_login(user_id: int):
    """
    Update user's last login timestamp.
    
    Args:
        user_id (int): User ID
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE id = $1
            """, user_id)
    except Exception as e:
        print(f"Error updating last login: {str(e)}")
    finally:
        await pool.close()

# CV Analysis functions
async def save_cv_analysis(user_id: int, domain: str, keywords: List[str], raw_text: str = None):
    """
    Save CV analysis results for a user.
    
    Args:
        user_id (int): User ID
        domain (str): Domain extracted from CV
        keywords (List[str]): Keywords extracted from CV
        raw_text (str, optional): Raw text of the CV
        
    Returns:
        int: CV analysis ID if successful, None if error
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # Check if user already has CV analysis
            existing = await conn.fetchval("""
                SELECT id FROM cv_analysis WHERE user_id = $1
            """, user_id)
            
            if existing:
                # Update existing analysis
                cv_id = await conn.fetchval("""
                    UPDATE cv_analysis
                    SET domain = $2, keywords = $3, raw_text = $4, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                    RETURNING id
                """, user_id, domain, keywords, raw_text)
            else:
                # Create new analysis
                cv_id = await conn.fetchval("""
                    INSERT INTO cv_analysis (user_id, domain, keywords, raw_text)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                """, user_id, domain, keywords, raw_text)
            
            return cv_id
    except Exception as e:
        print(f"Error saving CV analysis: {str(e)}")
        return None
    finally:
        await pool.close()

async def get_cv_analysis(user_id: int):
    """
    Get CV analysis for a user.
    
    Args:
        user_id (int): User ID
        
    Returns:
        dict: CV analysis data if found, None otherwise
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            analysis = await conn.fetchrow("""
                SELECT id, domain, keywords, created_at, updated_at
                FROM cv_analysis
                WHERE user_id = $1
            """, user_id)
            
            if analysis:
                return dict(analysis)
            return None
    except Exception as e:
        print(f"Error getting CV analysis: {str(e)}")
        return None
    finally:
        await pool.close()

# Internship listing functions
async def save_internship_listing(
    title: str,
    company: str,
    location: str,
    country: str,
    platform: str,
    description: str = None,
    skills: str = None,
    domain: str = None,
    link: str = None,
    hash_id: str = None
):
    """
    Save an internship listing to the database.
    
    Args:
        title (str): Job title
        company (str): Company name
        location (str): Job location
        country (str): Country (Morocco, France, etc.)
        platform (str): Platform (LinkedIn, Indeed, Glassdoor)
        description (str, optional): Job description
        skills (str, optional): Required skills
        domain (str, optional): Job domain
        link (str, optional): URL to the job listing
        hash_id (str, optional): Unique hash ID for deduplication
        
    Returns:
        int: Listing ID if successful, None if error or duplicate
    """
    pool = await get_db_pool()
    
    # Set expiration date (30 days from now)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    
    # Generate hash_id if not provided
    if not hash_id:
        import hashlib
        # Create a hash from title, company, and location to identify duplicates
        hash_str = f"{title}|{company}|{location}|{platform}".lower()
        hash_id = hashlib.sha256(hash_str.encode()).hexdigest()
    
    try:
        async with pool.acquire() as conn:
            # Check if listing with same hash_id already exists
            existing = await conn.fetchval("""
                SELECT id FROM internship_listings WHERE hash_id = $1
            """, hash_id)
            
            if existing:
                # Update existing listing
                listing_id = await conn.fetchval("""
                    UPDATE internship_listings
                    SET title = $2, company = $3, location = $4, country = $5,
                        platform = $6, description = $7, skills = $8, domain = $9,
                        link = $10, scraped_at = CURRENT_TIMESTAMP, expires_at = $11,
                        is_active = TRUE
                    WHERE hash_id = $1
                    RETURNING id
                """, hash_id, title, company, location, country, platform, 
                    description, skills, domain, link, expires_at)
                return listing_id
            else:
                # Create new listing
                listing_id = await conn.fetchval("""
                    INSERT INTO internship_listings (
                        title, company, location, country, platform,
                        description, skills, domain, link, hash_id, expires_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id
                """, title, company, location, country, platform,
                    description, skills, domain, link, hash_id, expires_at)
                return listing_id
    except Exception as e:
        print(f"Error saving internship listing: {str(e)}")
        return None
    finally:
        await pool.close()

async def get_active_internship_listings(
    domain: str = None,
    country: str = None,
    platform: str = None,
    limit: int = 1000
):
    """
    Get active internship listings with optional filters.
    
    Args:
        domain (str, optional): Filter by domain
        country (str, optional): Filter by country
        platform (str, optional): Filter by platform
        limit (int, optional): Maximum number of listings to return
        
    Returns:
        List[dict]: List of internship listings
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # Build query based on filters
            query = """
                SELECT id, title, company, location, country, platform,
                       description, skills, domain, link, scraped_at
                FROM internship_listings
                WHERE is_active = TRUE
            """
            params = []
            
            if domain:
                params.append(domain)
                query += f" AND domain = ${len(params)}"
            
            if country:
                params.append(country)
                query += f" AND country = ${len(params)}"
            
            if platform:
                params.append(platform)
                query += f" AND platform = ${len(params)}"
            
            # Add order by and limit
            query += " ORDER BY scraped_at DESC"
            
            if limit:
                params.append(limit)
                query += f" LIMIT ${len(params)}"
            
            # Execute query
            rows = await conn.fetch(query, *params)
            
            # Convert to list of dicts
            listings = [dict(row) for row in rows]
            return listings
    except Exception as e:
        print(f"Error getting internship listings: {str(e)}")
        return []
    finally:
        await pool.close()

async def get_internship_listing(listing_id: int):
    """
    Get a specific internship listing by ID.
    
    Args:
        listing_id (int): Listing ID
        
    Returns:
        dict: Internship listing data if found, None otherwise
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            listing = await conn.fetchrow("""
                SELECT id, title, company, location, country, platform,
                       description, skills, domain, link, scraped_at, expires_at, is_active
                FROM internship_listings
                WHERE id = $1
            """, listing_id)
            
            if listing:
                return dict(listing)
            return None
    except Exception as e:
        print(f"Error getting internship listing: {str(e)}")
        return None
    finally:
        await pool.close()

# User preferences functions
import json
async def save_user_preferences(
    user_id: int,
    domain_weight: float = 0.4,
    skills_weight: float = 0.3,
    title_weight: float = 0.2,
    description_weight: float = 0.1,
    country_weights: Optional[Dict[str, float]] = None,
    platform_weights: Optional[Dict[str, float]] = None
):
    """
    Save user preferences for recommendations.
    """
    pool = await get_db_pool()

    if country_weights is None:
        country_weights = {"Morocco": 1.0, "France": 1.0,"Canada":1.0}

    if platform_weights is None:
        platform_weights = {"LinkedIn": 1.0, "Indeed": 1.0, "Glassdoor": 1.0}

    # Serialize dicts to JSON strings
    country_weights_json = json.dumps(country_weights)
    platform_weights_json = json.dumps(platform_weights)

    try:
        async with pool.acquire() as conn:
            existing = await conn.fetchval("SELECT id FROM user_preferences WHERE user_id = $1", user_id)

            if existing:
                pref_id = await conn.fetchval(
                    """
                    UPDATE user_preferences
                    SET domain_weight = $2, skills_weight = $3, title_weight = $4,
                        description_weight = $5, country_weights = $6::jsonb, platform_weights = $7::jsonb,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                    RETURNING id
                    """,
                    user_id, domain_weight, skills_weight, title_weight,
                    description_weight, country_weights_json, platform_weights_json
                )
            else:
                pref_id = await conn.fetchval(
                    """
                    INSERT INTO user_preferences (
                        user_id, domain_weight, skills_weight, title_weight,
                        description_weight, country_weights, platform_weights
                    )
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
                    RETURNING id
                    """,
                    user_id, domain_weight, skills_weight, title_weight,
                    description_weight, country_weights_json, platform_weights_json
                )

            return pref_id

    except Exception as e:
        print(f"Error saving user preferences: {str(e)}")
        return None

    finally:
        await pool.close()

async def get_user_preferences(user_id: int):
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            preferences = await conn.fetchrow("""
                SELECT domain_weight, skills_weight, title_weight, description_weight,
                       country_weights, platform_weights
                FROM user_preferences
                WHERE user_id = $1
            """, user_id)
            
            if preferences:
                prefs_dict = dict(preferences)
                
                # Deserialize JSON strings to dicts
                prefs_dict['country_weights'] = json.loads(prefs_dict['country_weights'])
                prefs_dict['platform_weights'] = json.loads(prefs_dict['platform_weights'])
                
                return prefs_dict
            
            # Default preferences
            return {
                "domain_weight": 0.4,
                "skills_weight": 0.3,
                "title_weight": 0.2,
                "description_weight": 0.1,
                "country_weights": {"Morocco": 1.0, "France": 1.0,"Canada":1.0},
                "platform_weights": {"LinkedIn": 1.0, "Indeed": 1.0, "Glassdoor": 1.0}
            }
    except Exception as e:
        print(f"Error getting user preferences: {str(e)}")
        return None
    finally:
        await pool.close()

# Recommendation functions
async def save_user_recommendation(
    user_id: int,
    internship_id: int,
    similarity_score: float
):
    """
    Save a recommendation for a user.
    
    Args:
        user_id (int): User ID
        internship_id (int): Internship listing ID
        similarity_score (float): Similarity score
        
    Returns:
        int: Recommendation ID if successful, None if error
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # Check if recommendation already exists
            existing = await conn.fetchval("""
                SELECT id FROM user_recommendations
                WHERE user_id = $1 AND internship_id = $2
            """, user_id, internship_id)
            
            if existing:
                # Update existing recommendation
                rec_id = await conn.fetchval("""
                    UPDATE user_recommendations
                    SET similarity_score = $3, recommended_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1 AND internship_id = $2
                    RETURNING id
                """, user_id, internship_id, similarity_score)
            else:
                # Create new recommendation
                rec_id = await conn.fetchval("""
                    INSERT INTO user_recommendations (user_id, internship_id, similarity_score)
                    VALUES ($1, $2, $3)
                    RETURNING id
                """, user_id, internship_id, similarity_score)
            
            return rec_id
    except Exception as e:
        print(f"Error saving user recommendation: {str(e)}")
        return None
    finally:
        await pool.close()

async def get_user_recommendations(user_id: int, limit: int = 10):
    
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT r.internship_id,r.similarity_score, r.recommended_at, r.is_viewed, r.is_saved,
                       l.id, l.title, l.company, l.location, l.country, l.platform,
                       l.description, l.skills, l.domain, l.link
                FROM user_recommendations r
                JOIN internship_listings l ON r.internship_id = l.id
                WHERE r.user_id = $1 AND l.is_active = TRUE
                ORDER BY r.similarity_score DESC
                LIMIT $2
            """, user_id, limit)
            
            # Convert to list of dicts
            recommendations = []
            for row in rows:
                rec = dict(row)
                recommendations.append(rec)
            
            return recommendations
    except Exception as e:
        print(f"Error getting user recommendations: {str(e)}")
        return []
    finally:
        await pool.close()

async def mark_recommendation_viewed(user_id: int, internship_id: int):
    """
    Mark a recommendation as viewed by the user.
    
    Args:
        user_id (int): User ID
        internship_id (int): Internship listing ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE user_recommendations
                SET is_viewed = TRUE
                WHERE user_id = $1 AND internship_id = $2
            """, user_id, internship_id)
            
            return "UPDATE" in result
    except Exception as e:
        print(f"Error marking recommendation as viewed: {str(e)}")
        return False
    finally:
        await pool.close()

async def save_recommendation(user_id: int, internship_id: int, save: bool = True):
    """
    Save or unsave a recommendation for a user.
    
    Args:
        user_id (int): User ID
        internship_id (int): Internship listing ID
        save (bool, optional): Whether to save (True) or unsave (False)
        
    Returns:
        bool: True if successful, False otherwise
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE user_recommendations
                SET is_saved = $3
                WHERE user_id = $1 AND internship_id = $2
            """, user_id, internship_id, save)
            
            return "UPDATE" in result
    except Exception as e:
        print(f"Error saving/unsaving recommendation: {str(e)}")
        return False
    finally:
        await pool.close()

# Admin functions
async def get_stats():
    """
    Get database statistics for admin dashboard.
    
    Returns:
        dict: Statistics about the database
    """
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # Get counts
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            active_listings = await conn.fetchval("SELECT COUNT(*) FROM internship_listings WHERE is_active = TRUE")
            total_listings = await conn.fetchval("SELECT COUNT(*) FROM internship_listings")
            recommendations = await conn.fetchval("SELECT COUNT(*) FROM user_recommendations")
            
            # Get platform distribution
            platform_rows = await conn.fetch("""
                SELECT platform, COUNT(*) as count
                FROM internship_listings
                WHERE is_active = TRUE
                GROUP BY platform
                ORDER BY count DESC
            """)
            platforms = {row['platform']: row['count'] for row in platform_rows}
            
            # Get country distribution
            country_rows = await conn.fetch("""
                SELECT country, COUNT(*) as count
                FROM internship_listings
                WHERE is_active = TRUE
                GROUP BY country
                ORDER BY count DESC
            """)
            countries = {row['country']: row['count'] for row in country_rows}
            
            # Get recent listings
            recent_listings = await conn.fetchval("""
                SELECT COUNT(*) FROM internship_listings
                WHERE scraped_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
            """)
            
            return {
                "user_count": user_count,
                "active_listings": active_listings,
                "total_listings": total_listings,
                "recommendations": recommendations,
                "platforms": platforms,
                "countries": countries,
                "recent_listings": recent_listings
            }
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return {}
    finally:
        await pool.close()

# Main function to test the module
async def main():
    """Test the database module."""
    await init_db()
    
  
if __name__ == "__main__":
    asyncio.run(main())
