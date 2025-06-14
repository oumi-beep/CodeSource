import os
import io
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import difflib
import unicodedata
from fastapi import BackgroundTasks   
from recommendation import generate_hybrid_recommendations
import asyncio
from database_schema import get_db_connection
import asyncpg

import uvicorn
from fastapi import (
    FastAPI, Depends, HTTPException, status,
    BackgroundTasks, File, UploadFile
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

import pdfplumber
import docx

from database_schema import (
    create_user,
    get_user_by_username,
    update_last_login,
    get_active_internship_listings,
    get_internship_listing,
    save_user_preferences,
    get_user_preferences,
  
    mark_recommendation_viewed,
  
)

from improved_scraper import EnhancedInternshipScraper, get_pool
import joblib


# ---------------------
# Logging configuration
# ---------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("internship_api")

# ---------------------
# JWT and Security Setup
# ---------------------
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---------------------
# FastAPI app and middleware
# ---------------------
app = FastAPI(
    title="Internship Recommendation API",
    description="API for internship recommendation system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------///////////
# Prediction fields 
# ---------------------///////////

model = joblib.load("modelCatboostbest.pkl")
label_encoder = joblib.load("label_encoder.pkl")
encoded_columns = joblib.load("X_encoded_columns.pkl")
import pandas as pd

# Définir la structure attendue pour un étudiant
class Etudiant(BaseModel):
    Algebre1: float
    Analyse1: float
    Physique1_Meca: float
    Meca_Poin: float
    Informatique1: float
    LC1: float
    Algebre2: float
    Analyse2: float
    Physique2: float
    Chimie: float
    Informatique2: float
    LC2: float
    Algebre3: float
    Analyse3: float
    Mecanique2: float
    Electronique1: float
    Informatique3: float
    LC3: float
    Analyse4: float
    Math_applique: float
    Physique3: float
    Physique4: float
    Electronique2: float
    LC4: float

    Sexe: str
    Age: int
    Statut_socio: str
    Situation_geo: str
    Orientation_Lycee: str
    Mention_Bac: str

    Programmation: int
    Reseaux_Cyber: int
    Data_AI: int
    Electronique_Embarque: int
    Genie_Proc: int
    Management_SI: int

# Route pour la prédiction
@app.post("/predict")
def predict(etudiant: Etudiant):
    # Convertir en DataFrame
    etudiant_dict = etudiant.dict()
    etudiant_df = pd.DataFrame([etudiant_dict])

    # Encoder exactement comme l'entraînement
    etudiant_encoded = pd.get_dummies(etudiant_df)

    # Aligner les colonnes
    etudiant_encoded = etudiant_encoded.reindex(columns=encoded_columns, fill_value=0)

    # Prédiction
    prediction_encoded = model.predict(etudiant_encoded)
    prediction_label = label_encoder.inverse_transform(prediction_encoded)

    # Probabilités
    probabilities = model.predict_proba(etudiant_encoded)[0]
    probability_per_filiere = dict(zip(label_encoder.classes_, probabilities))

    return {
        "filiere_predite": prediction_label[0],
        "probabilites": probability_per_filiere
    }



# ---------------------
# Pydantic Models
# ---------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True

class CVAnalysis(BaseModel):
    message: str
    filename: str
    domain: str
    keywords: List[str]

class InternshipListing(BaseModel):
    id: int
    title: str
    company: str
    location: str
    country: str
    platform: str
    description: Optional[str] = None
    skills: Optional[str] = None
    domain: Optional[str] = None
    link: Optional[str] = None
    scraped_at: datetime

class UserPreferences(BaseModel):
    domain_weight: float = 0.4
    skills_weight: float = 0.3
    title_weight: float = 0.2
    description_weight: float = 0.1
    country_weights: Dict[str, float] = {"Morocco": 1.0}
    platform_weights: Dict[str, float] = {"LinkedIn": 1.0, "Indeed": 1.0, "Glassdoor": 1.0}
    

class Recommendation(BaseModel):
    id: int
    title: str
    company: str
    location: str
    country: str
    platform: str
    description: Optional[str] = None
    skills: Optional[str] = None
    domain: Optional[str] = None
    link: Optional[str] = None
    similarity_score: float
    recommended_at: datetime
    is_viewed: bool
    is_saved: bool

class Stats(BaseModel):
    user_count: int
    active_listings: int
    total_listings: int
    recommendations: int
    platforms: Dict[str, int]
    countries: Dict[str, int]
    recent_listings: int

# ---------------------
# Helper functions
# ---------------------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user_by_username(token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    return current_user


# ---------------------
# Authentication Endpoints
# ---------------------
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    await update_last_login(user["id"])
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["username"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=User)
async def register_user(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_id = await create_user(user.username, user.email, hashed_password)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")
    created_user = await get_user_by_username(user.username)
    return created_user

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    return current_user

# ---------------------
# CV Upload & Analysis Endpoint
# ---------------------


@app.post("/upload_cv", response_model=CVAnalysis)
async def upload_cv(file: UploadFile = File(...), current_user: dict = Depends(get_current_active_user)):
    print(f"[DEBUG] Infos du fichier : filename={file.filename}, content_type={file.content_type}")
    
    if not file.filename or not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Format de fichier non supporté")

    contents = await file.read()
        
    GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_API_KEY = "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"

    def extract_text_from_CV_bytes(file_bytes: bytes, filename: str) -> str:
        print(f"[DEBUG] Nom du fichier reçu: '{filename}'")
        _, ext = os.path.splitext(filename.lower())

        try:
            if ext == '.pdf':
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    text = ""
                    for page in pdf.pages:
                        text += page.extract_text() or ""
                    return text
            elif ext == '.docx':
                doc = docx.Document(io.BytesIO(file_bytes))
                return "\n".join(p.text for p in doc.paragraphs)
            else:
                raise ValueError(f"File format not supported. Please upload a PDF or DOCX file. Extension reçue : '{ext}'")
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")

    def query_groq(prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {"role": "system", "content": "You are an assistant specialized in analyzing student resumes."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 512
        }
        response = requests.post(GROQ_ENDPOINT, headers=headers, json=payload)
        print("[DEBUG] Réponse GROQ brute:", response.text)
        try:
            return response.json()["choices"][0]["message"]["content"]
        except Exception:
            return f"Erreur dans la réponse : {response.text}"

    def analyze_resume(file_bytes: bytes, filename: str):
      resume_text = extract_text_from_CV_bytes(file_bytes, filename)
      prompt = f"""
        Here is a student's resume:

        {resume_text}

        Give me only a response containing:
        1. The targeted internship domain
        2. A list of keywords to search for offers online (LinkedIn, Indeed...)

        Response format:
        {{
          "domain": "...",
          "keywords": ["...", "..."]
        }}

        Only generate the above JSON — no explanation or extra text.
        """
      response = query_groq(prompt)

      # Nettoyage de la réponse
      cleaned_response = response.strip()
      if cleaned_response.startswith("```json"):
          cleaned_response = cleaned_response[7:-3].strip()
      elif cleaned_response.startswith("```"):
          cleaned_response = cleaned_response[3:-3].strip()

      print("[DEBUG] Réponse GROQ nettoyée:", cleaned_response)

      try:
        result = json.loads(cleaned_response)
        return result
          
      except json.JSONDecodeError as e:
          print("[ERREUR] Impossible de parser le JSON :", e)
          return {"error": f"Parsing error: {str(e)}", "raw_response": response}

    try:
        analysis_result = analyze_resume(contents, file.filename)
        print("[DEBUG] Résultat de l'analyse:", analysis_result)
        

        if "error" not in analysis_result:
            await generate_hybrid_recommendations(current_user, alpha=0.6, top_n=20) 
            return {
                "message": "CV traité avec succès",
                "filename": file.filename,
                "domain": analysis_result.get("domain", ""),
                "keywords": analysis_result.get("keywords", [])
                
            }
        else:
            raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse : {analysis_result['raw_response']}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du CV: {str(e)}")

import psycopg2
import json
 
def save_keywords_to_db(user_id: int, domain: str, keywords: list):
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="Oumaima123",
            host="localhost",
            port=5432
        )
        cur = conn.cursor()

        query = """
        INSERT INTO cv_analysis (user_id, domain, keywords, created_at, updated_at)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
            domain = EXCLUDED.domain,
            keywords = EXCLUDED.keywords,
            updated_at = CURRENT_TIMESTAMP;
        """

        cur.execute(query, (user_id, domain, json.dumps(keywords)))
        conn.commit()
        logger.info(f"Keywords for user_id {user_id} saved successfully.")
    except Exception as e:
        logger.error(f"Error saving keywords to DB: {str(e)}")
        raise
    finally:
        cur.close()
        conn.close()

class SaveAnalysisRequest(BaseModel):
    domain: str
    keywords: List[str]


@app.post("/save_analysis")
async def save_analysis(
    data: SaveAnalysisRequest,
    background_tasks: BackgroundTasks,               
    current_user: dict = Depends(get_current_user)
):
    try:
        save_keywords_to_db(current_user["id"], data.domain, data.keywords)

        background_tasks.add_task(
            asyncio.create_task,
            generate_hybrid_recommendations(current_user["id"])
        )

        return {"message": "Analysis saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
        
from fastapi import Depends, HTTPException, status
from typing import List
import psycopg2
import traceback
from fastapi import HTTPException

@app.get("/get_saved_analysis", response_model=List[CVAnalysis])
async def get_saved_analysis(current_user: dict = Depends(get_current_active_user)):
    
    print("current_user =", current_user)
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="Oumaima123",
            host="localhost",
            port=5432
        )

        with conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT user_id, domain, keywords
                    FROM cv_analysis
                    WHERE user_id = %s;
                """
                cursor.execute(query, (current_user["id"],))
                rows = cursor.fetchall()

        result = []
        for _, domain, keywords in rows:
          keywords_list = keywords if isinstance(keywords, list) else keywords.split(',') if keywords else []
          some_message = "CV analysé avec succès"
          some_filename = ""  # Remplacez par le nom de fichier réel si disponible
          result.append(CVAnalysis(domain=domain, keywords=keywords_list, message=some_message, filename=some_filename))
          print(f"[DEBUG] Résultat de l'analyse : {result}")
        return result

    except Exception as e:
        traceback.print_exc()  
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
# ---------------------
# Internship Scrapping Endpoint
# ---------------------

@app.get("/scraping/status")
async def get_scraping_status(current_user: dict = Depends(get_current_active_user)):
    #return a basic response
    return {"status": "ready", "message": "Scraping system is ready"}

@app.get("/user/domains")
async def get_user_domains_endpoint(current_user: dict = Depends(get_current_active_user)):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            from improved_scraper import get_user_domains
            domains = await get_user_domains(conn, current_user["id"])
            return {"domains": domains or ["Computer Science"]}
    except Exception as e:
        logger.error(f"Error getting user domains: {e}")
        return {"domains": ["Computer Science"]}

@app.post("/scraping/enhanced")
async def trigger_enhanced_scrape(
    background_tasks: BackgroundTasks,
    with_descriptions: bool = False,
    max_descriptions: int = 20,
    current_user: dict = Depends(get_current_active_user)
):
    background_tasks.add_task(
        enhanced_scrape_for_user_background, 
        current_user["id"],
        with_descriptions,
        max_descriptions
    )
    return {
        "message": "Enhanced scraping started",
        "with_descriptions": with_descriptions,
        "max_descriptions": max_descriptions if with_descriptions else 0
    }

async def enhanced_scrape_for_user_background(
    user_id: int, 
    with_descriptions: bool = False, 
    max_descriptions: int = 20
):
    try:
        scraper = EnhancedInternshipScraper(headless=True)
        
        if with_descriptions:
            await scraper.scrape_for_user_with_descriptions(user_id, max_descriptions)
        else:
            await scraper.scrape_for_user(user_id)
        
        logger.info(f"Enhanced scraping completed for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error in enhanced scraping for user {user_id}: {e}")


# ---------------------
# User Preferences Endpoints
# ---------------------

@app.get("/preferences", response_model=UserPreferences)
async def get_preferences(current_user: dict = Depends(get_current_active_user)):
    prefs = await get_user_preferences(current_user["id"])
    return prefs

@app.post("/preferences", response_model=UserPreferences)
async def set_preferences(prefs: UserPreferences, current_user: dict = Depends(get_current_active_user)):
    await save_user_preferences(current_user["id"], **prefs.dict())
    await generate_hybrid_recommendations(current_user["id"], alpha=0.6, top_n=20)
    return prefs
# ---------------------
# Profil Informations Endpoints
# ---------------------
from database_schema import get_user_profile
from sqlalchemy.orm import Session
@app.get("/api/user-profile")
async def user_profile(email: str):
    profile = await get_user_profile(email)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile
# ---------------------
# Recommendations Endpoints
# ---------------------

@app.get("/recommendations")
async def get_recommendations(user_id: dict = Depends(get_current_active_user)): # Assuming you have auth/user_id extraction
    logger.info(f"Frontend requested recommendations for user {user_id["id"]}. Triggering recalculation.")
    calculated_recommendations = await generate_hybrid_recommendations(user_id["id"], alpha=0.6, top_n=20)
    return {"recommendations": calculated_recommendations, "hasRecommendations": len(calculated_recommendations) > 0}


# Pydantic models
class RecommendationUpdate(BaseModel):
    is_saved: Optional[bool] = None
    is_viewed: Optional[bool] = None

class RecommendationResponse(BaseModel):
    message: str
    recommendation_id: int
    is_saved: Optional[bool] = None
    is_viewed: Optional[bool] = None

async def mark_recommendation_viewed(user_id: int, listing_id: int, conn: asyncpg.Connection) -> bool:
    """Mark a recommendation as viewed in the database."""
    try:
        await conn.execute(
            """
            INSERT INTO user_recommendations (user_id, internship_id, is_viewed, viewed_at)
            VALUES ($1, $2, TRUE, NOW())
            ON CONFLICT (user_id, internship_id) DO UPDATE
            SET is_viewed = TRUE, viewed_at = NOW()
            """,
            user_id,
            listing_id,
        )
        return True
    except Exception as e:
        print(f"Error marking recommendation as viewed: {e}")
        return False

async def mark_recommendation_saved(user_id: int, listing_id: int, is_saved: bool, conn: asyncpg.Connection) -> bool:
    """Mark a recommendation as saved/unsaved in the database."""
    try:
        # Use ON CONFLICT to handle both insert and update scenarios
        await conn.execute(
            """
            INSERT INTO user_recommendations (user_id, internship_id, is_saved, saved_at)
            VALUES ($1, $2, $3, CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END)
            ON CONFLICT (user_id, internship_id) DO UPDATE
            SET is_saved = $3, saved_at = CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END
            """,
            user_id,
            listing_id,
            is_saved,
        )
        return True
    except Exception as e:
        print(f"Error updating recommendation saved status: {e}")
        return False

async def update_recommendation_status(user_id: int, listing_id: int, conn: asyncpg.Connection, is_saved: Optional[bool] = None, is_viewed: Optional[bool] = None) -> bool:
    """Update both saved and viewed status of a recommendation."""
    updates = []
    params = []
    param_count = 1

    if is_saved is not None:
        updates.append(f"is_saved = ${param_count}")
        params.append(is_saved)
        param_count += 1
        updates.append(f"saved_at = CASE WHEN ${param_count-1} = TRUE THEN NOW() ELSE NULL END")

    if is_viewed is not None:
        updates.append(f"is_viewed = ${param_count}")
        params.append(is_viewed)
        param_count += 1
        updates.append(f"viewed_at = CASE WHEN ${param_count-1} = TRUE THEN NOW() ELSE NULL END")

    if not updates:
        return True  # Nothing to update

    query = f"""
    INSERT INTO user_recommendations (user_id, internship_id, {', '.join([u.split(' = ')[0] for u in updates if 'NOW()' not in u])}, viewed_at, saved_at)
    VALUES ($1, $2, {', '.join([f'${i+3}' for i in range(len(params))])}, NOW(), 
            CASE WHEN $4 = TRUE THEN NOW() ELSE NULL END, 
            CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id, internship_id) DO UPDATE
    SET {', '.join(updates)}
    """

    set_clauses = []
    current_param_idx = 3 # user_id and internship_id are $1, $2
    if is_saved is not None:
        set_clauses.append(f"is_saved = ${current_param_idx}")
        set_clauses.append(f"saved_at = CASE WHEN ${current_param_idx} = TRUE THEN NOW() ELSE NULL END")
        current_param_idx += 1
    if is_viewed is not None:
        set_clauses.append(f"is_viewed = ${current_param_idx}")
        set_clauses.append(f"viewed_at = CASE WHEN ${current_param_idx} = TRUE THEN NOW() ELSE NULL END")
        current_param_idx += 1

    query = f"""
    INSERT INTO user_recommendations (user_id, internship_id, is_saved, is_viewed, saved_at, viewed_at)
    VALUES ($1, $2, $3, $4, CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END, CASE WHEN $4 = TRUE THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id, internship_id) DO UPDATE
    SET {', '.join(set_clauses)}
    """
    try:
        update_params = []
        update_set_clauses = []
        update_param_idx = 1

        if is_saved is not None:
            update_set_clauses.append(f"is_saved = ${update_param_idx}")
            update_params.append(is_saved)
            update_param_idx += 1
            update_set_clauses.append(f"saved_at = CASE WHEN ${update_param_idx-1} = TRUE THEN NOW() ELSE NULL END")

        if is_viewed is not None:
            update_set_clauses.append(f"is_viewed = ${update_param_idx}")
            update_params.append(is_viewed)
            update_param_idx += 1
            update_set_clauses.append(f"viewed_at = CASE WHEN ${update_param_idx-1} = TRUE THEN NOW() ELSE NULL END")
        

        if update_set_clauses:
            update_query = f"""
            UPDATE user_recommendations
            SET {', '.join(update_set_clauses)}
            WHERE user_id = ${update_param_idx} AND internship_id = ${update_param_idx + 1}
            """
            result = await conn.execute(update_query, *update_params, user_id, listing_id)
            if conn.row_count > 0:
                return True

        # If no row was updated (meaning it didn't exist), then insert
        # Ensure we have values for both is_saved and is_viewed for INSERT
        final_is_saved = is_saved if is_saved is not None else False
        final_is_viewed = is_viewed if is_viewed is not None else False

        insert_query = """
        INSERT INTO user_recommendations (user_id, internship_id, is_saved, is_viewed, saved_at, viewed_at)
        VALUES ($1, $2, $3, $4, CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END, CASE WHEN $4 = TRUE THEN NOW() ELSE NULL END)
        """
        await conn.execute(insert_query, user_id, listing_id, final_is_saved, final_is_viewed)
        return True

    except Exception as e:
        print(f"Error updating recommendation status: {e}")
        return False

async def get_recommendation_status(user_id: int, listing_id: int, conn: asyncpg.Connection) -> Optional[dict]:
    """Get current status of a recommendation."""
    try:
        row = await conn.fetchrow(
            """
            SELECT is_saved, is_viewed, saved_at, viewed_at
            FROM user_recommendations
            WHERE user_id = $1 AND internship_id = $2
            """,
            user_id,
            listing_id,
        )
        if row:
            return {
                "is_saved": row["is_saved"],
                "is_viewed": row["is_viewed"],
                "listing_id": listing_id,
                "user_id": user_id,
                "saved_at": row["saved_at"].isoformat() if row["saved_at"] else None,
                "viewed_at": row["viewed_at"].isoformat() if row["viewed_at"] else None,
            }
        else:
            return {
                "is_saved": False,
                "is_viewed": False,
                "listing_id": listing_id,
                "user_id": user_id,
                "saved_at": None,
                "viewed_at": None,
            }
    except Exception as e:
        print(f"Error getting recommendation status: {e}")
        return None

# API Endpoints

@app.post("/recommendations/{listing_id}/view")
async def view_recommendation(
    listing_id: int,
    current_user: dict = Depends(get_current_active_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """Mark a recommendation as viewed."""
    success = await mark_recommendation_viewed(current_user["id"], listing_id, conn)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark recommendation as viewed"
        )
    
    return RecommendationResponse(
        message="Recommendation marked as viewed",
        recommendation_id=listing_id,
        is_viewed=True
    )

@app.post("/recommendations/{listing_id}/save")
async def save_recommendation(
    listing_id: int,
    current_user: dict = Depends(get_current_active_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """Mark a recommendation as saved."""
    success = await mark_recommendation_saved(current_user["id"], listing_id, True, conn)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save recommendation"
        )
    
    return RecommendationResponse(
        message="Recommendation saved successfully",
        recommendation_id=listing_id,
        is_saved=True
    )


@app.patch("/recommendations/{listing_id}/status")
async def update_recommendation(
    listing_id: int,
    update_data: RecommendationUpdate,
    current_user: dict = Depends(get_current_active_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """Update recommendation status (saved and/or viewed)."""
    success = await update_recommendation_status(
        current_user["id"], 
        listing_id, 
        update_data.is_saved, 
        update_data.is_viewed,
        conn
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update recommendation status"
        )
    
    # Fetch the latest status to return accurate response
    latest_status = await get_recommendation_status(current_user["id"], listing_id, conn)
    if not latest_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found after update"
        )
    
    return {"message": f"Recommendation {'saved' if is_saved else 'unsaved'}"}

@app.delete("/recommendations/{listing_id}/save")
async def unsave_recommendation(
    listing_id: int,
    current_user: dict = Depends(get_current_active_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """Unsave a recommendation."""
    success = await mark_recommendation_saved(current_user["id"], listing_id, False, conn)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsave recommendation"
        )
    
    return RecommendationResponse(
        message="Recommendation unsaved successfully",
        recommendation_id=listing_id,
        is_saved=False
    )




#-----------------------///////////////////////
# Chatbot section
#-------------------------///////////////////

# --- 🔐 API GROQ ---
API_KEY1 = "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"
API_URL1 = "https://api.groq.com/openai/v1/chat/completions"
MODEL1 = "meta-llama/llama-4-scout-17b-16e-instruct"

# --- 📄 Chargement de données ENSAKH ---
def load_data():
    sources = []

    def load_json_file(filename, process_func):
        try:
            with open(filename, "r", encoding="utf-8") as f:
                process_func(json.load(f))
        except FileNotFoundError:
            print(f"Warning: {filename} not found")

    load_json_file("event_ENSAKH.json", lambda events: sources.extend([
        {"type": "Événement", "title": ev["event_name"], "content": ev["description"]}
        for ev in events
    ]))

    load_json_file("chiffres_ENSAKH.json", lambda chiffres: sources.extend([
        {
            "type": "Chiffre",
            "title": ch["Titre"].split('(')[0].strip(),
            "content": f"{ch['Titre'].split('(')[0].strip()} : {ch['Nombre']} ({ch['Titre']})",
            "raw_data": ch  # Stockage des données brutes pour recherche
        }
        for ch in chiffres
    ]))

    load_json_file("clubs_ENSAKH.json", lambda clubs: sources.extend([
        {"type": "Club", "title": club["Nom du Club"], "content": club["Résumé"]}
        for club in clubs
    ]))

    load_json_file("ecoles_modalites_DD_ENSAKH.json", lambda ecoles: sources.extend([
        {
            "type": "Partenariat",
            "title": ecole["École"],
            "content": f"École: {ecole['École']} - Modalités: {ecole['Modalités']}",
            "raw_data": ecole  # Stockage des données brutes pour recherche
        }
        for ecole in ecoles
    ]))

    load_json_file("enseignants_ENSAKH.json", lambda enseignants: sources.extend([
        {
            "type": "Enseignant",
            "title": prof["Nom"],
            "content": f"{prof['Nom']} - {prof['Fonction']} - {prof['Description']} - Email: {prof['Email']}"
        }
        for prof in enseignants
    ]))

    load_json_file("departement_ENSAKH.json", lambda depts: sources.extend([
        {
            "type": "Département",
            "title": dept.get("Nom Département", "Nom inconnu"),
            "content": (
                f"Département : {dept.get('Nom Département', 'Nom inconnu')}\n"
                f"Chef de département : {dept.get('Chef', 'N\'existe pas')}\n"
                f"Adjoint : {dept.get('Adjoint', 'N\'existe pas')}\n\n"
                f"Filières proposées :\n" +
                "\n".join([f"* {f.strip()}" for f in dept.get("Filières", [])]) +
                "\n\nListe des professeurs :\n" +
                "\n".join([f"* {prof['Nom']} (Email: {prof['Email']})"
                           for prof in dept.get("Professeurs", [])])
            )
        }
        for dept in depts
    ]))
    
   # 7. Filières - Stockage des données brutes pour extraction ciblée
    # 7. Filières - Stockage des données brutes pour extraction ciblée
    load_json_file("filières_ENSAKH.json", lambda filieres: sources.extend([
        {
            "type": "Filière",
            "title": f["nom"],
            "content": (
                f"## Filière : {f['nom']}\n\n"
                f"**Description :**\n{f['description']}\n\n"
                f"**Débouchés professionnels :**\n" + 
                "\n".join([f"- {d}" for d in f['debouchees']]) + "\n\n"
                f"**Compétences acquises :**\n" + 
                "\n".join([f"- {c}" for c in f['competences_acquises']]) + "\n\n"
                f"**Prérequis :**\n" + 
                "\n".join([f"- {p}" for p in f.get('prerequis', [])]) + "\n\n"
                f"**Modalités d'admission :**\n" +
                f"Conditions d'accès :\n" +
                "\n".join([f"- {c}" for c in f.get('modalite_admission', {}).get('conditions_acces', [])]) + "\n" +
                f"Procédures de sélection :\n" +
                "\n".join([f"- {p}" for p in f.get('modalite_admission', {}).get('procedures_selection', [])])
            ),
            "raw_data": f
        }
        for f in filieres
    ]))
    
    return sources


def extract_specific_section(filiere_data, section_type):
    """Extrait une section spécifique d'une filière"""
    raw_data = filiere_data.get("raw_data", {})
    filiere_name = filiere_data["title"]
    
    if section_type == "débouchés":
        debouches = raw_data.get("debouchees", [])
        if debouches:
            return f"## Débouchés professionnels - {filiere_name}\n\n" + "\n".join([f"- {d}" for d in debouches])
        else:
            return f"Aucun débouché spécifié pour la filière {filiere_name}"
    
    elif section_type == "compétences":
        competences = raw_data.get("competences_acquises", [])
        if competences:
            return f"## Compétences acquises - {filiere_name}\n\n" + "\n".join([f"- {c}" for c in competences])
        else:
            return f"Aucune compétence spécifiée pour la filière {filiere_name}"
    
    elif section_type == "prérequis":
        prerequis = raw_data.get("prerequis", [])
        if prerequis:
            return f"## Prérequis - {filiere_name}\n\n" + "\n".join([f"- {p}" for p in prerequis])
        else:
            return f"Aucun prérequis spécifié pour la filière {filiere_name}"
    
    elif section_type == "admission":
        modalites = raw_data.get("modalite_admission", {})
        conditions = modalites.get("conditions_acces", [])
        procedures = modalites.get("procedures_selection", [])
        
        result = f"## Modalités d'admission - {filiere_name}\n\n"
        if conditions:
            result += "**Conditions d'accès :**\n" + "\n".join([f"- {c}" for c in conditions]) + "\n\n"
        if procedures:
            result += "**Procédures de sélection :**\n" + "\n".join([f"- {p}" for p in procedures])
        
        return result if (conditions or procedures) else f"Aucune modalité d'admission spécifiée pour la filière {filiere_name}"
    
    elif section_type == "description":
        description = raw_data.get("description", "")
        if description:
            return f"## Description - {filiere_name}\n\n{description}"
        else:
            return f"Aucune description disponible pour la filière {filiere_name}"
    
    else:
        return filiere_data["content"]
def search_chiffres(keyword):
    """Recherche dans les chiffres selon un mot-clé"""
    keyword_lower = keyword.lower()
    results = []
    
    for src in data_sources:
        if src["type"] == "Chiffre":
            # Recherche dans le titre et le contenu
            if (keyword_lower in src["title"].lower() or 
                keyword_lower in src["content"].lower()):
                results.append(f"- {src['content']}")
    
    if results:
        return f"## Statistiques ENSAKH :\n\n" + "\n".join(results)
    else:
        return f"Aucune statistique trouvée pour : {keyword}"
    
def filter_by_modalite(modalite_keyword):
    """Recherche les écoles par modalité de partenariat"""
    modalite_lower = modalite_keyword.lower()
    results = []
    
    for src in data_sources:
        if src["type"] == "Partenariat":
            raw_data = src.get("raw_data", {})
            modalites = raw_data.get("Modalités", "")

            # Si modalites est une liste, convertir en chaîne jointe
            if isinstance(modalites, list):
                modalites_str = " ".join(modalites)
            else:
                modalites_str = str(modalites)

            # Recherche flexible dans les modalités
            if modalite_lower in modalites_str.lower():
                results.append(f"- **{src['title']}** : {modalites_str}")
    
    if results:
        return f"## Écoles avec la modalité '{modalite_keyword}' :\n\n" + "\n".join(results)
    else:
        return f"Aucune école trouvée avec la modalité : {modalite_keyword}"

    
def filter_filieres_by_criteria(criteria):
    """Filtre les filières selon différents critères"""
    results = []
    
    for src in data_sources:
        if src["type"] == "Filière":
            section_content = extract_specific_section(src, criteria)
            if section_content and "aucun" not in section_content.lower():
                results.append(section_content + "\n")
    
    if results:
        return "\n".join(results)
    else:
        return f"Aucune information trouvée pour le critère : {criteria}"

# --- Chargement des données ---
print("🔄 Chargement des données ENSAKH...")
data_sources = load_data()
texts = [entry["content"] for entry in data_sources]

if not texts:
    print("⚠️ Aucune donnée trouvée. Ajout de données fictives pour test.")
    data_sources = [{
        "type": "Test",
        "title": "Test Data",
        "content": "Ceci est un test. L'ENSAKH est une école d'ingénieurs située à Khouribga."
    }]
    texts = [data_sources[0]["content"]]

# --- Embedding et FAISS ---
print("⚙️ Chargement du modèle d'embedding...")
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
text_embeddings = embedding_model.encode(texts, show_progress_bar=True)

print("🧊 Création de l'index FAISS...")
dimension = text_embeddings[0].shape[0]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(text_embeddings))

# --- Recherche contextuelle ---
def retrieve_context_faiss(user_input, top_k=4):
    query_embedding = embedding_model.encode([user_input])
    D, I = index.search(np.array(query_embedding), top_k)
    top_contexts = []
    for idx in I[0]:
        if idx < len(data_sources):
            src = data_sources[idx]
            top_contexts.append(f"{src['type']} - {src['title']}\n{src['content']}")
    return "\n\n".join(top_contexts)


def normalize_text(text):
    return unicodedata.normalize('NFD', text.lower()).encode('ascii', 'ignore').decode('utf-8').strip()


# --- Commandes globales ---
def handle_global(user_input):
    u = user_input.lower()
    # Modalité spécifique demandée ?
    # Autres cas avec "avec la modalité" directement
    # 1. Recherche de chiffres/statistiques avec "combien"
    if re.search(r"combien", u):
        # Extraire le mot-clé après "combien"
        combien_patterns = [
            r"combien.*?(?:de|d')\s+([\w\s\-éèêàâïîç']+)",
            r"combien.*?(étudiants?|professeurs?|enseignants?|clubs?|départements?|filières?)",
            r"combien.*?(lauréats?|diplômés?|ingénieurs?)"
        ]
        
        for pattern in combien_patterns:
            match = re.search(pattern, u)
            if match:
                keyword = match.group(1).strip()
                return search_chiffres(keyword)
        
        # Si aucun mot-clé spécifique trouvé, recherche générale dans les chiffres
        return search_chiffres("nombre")
    
    # 2. Recherche de modalités de partenariat - Patterns améliorés
    modalite_patterns = [
        r"(?:écoles?|partenariats?).*?(?:avec|où existe|qui ont|proposent).*?(?:la )?modalité\s+([\w\s\-éèêàâïîç']+)",
        r"(?:quelles?|quels?).*?écoles?.*?(double diplôme|échange|stage|mobilité)",
        r"modalité\s+([\w\s\-éèêàâïîç']+)",
        r"(double diplôme[\w\s\-éèêàâïîç']*)",
        r"(échange[\w\s\-éèêàâïîç']*)",
        r"(stage[\w\s\-éèêàâïîç']*)",
        r"(mobilité[\w\s\-éèêàâïîç']*)"
    ]
    
    for pattern in modalite_patterns:
        match = re.search(pattern, u)
        if match:
            modalite = match.group(1).strip()
            return filter_by_modalite(modalite)
    


    # 🔍 Liste des titres de filières normalisés
    filiere_titles = [
        normalize_text(src["title"]) for src in data_sources if src["type"] == "Filière"
    ]

    # 🧠 Étape 1 : Vérification d'une correspondance explicite dans la question
    matched_filiere_name = None
    normalized_input = normalize_text(u)
    for filiere in filiere_titles:
        if filiere in normalized_input:
            matched_filiere_name = filiere
            break

    best_match = None
    highest_ratio = 0

    # ✅ Étape 2 : Si on a une correspondance explicite
    if matched_filiere_name:
        for src in data_sources:
            if src["type"] == "Filière" and normalize_text(src["title"]) == matched_filiere_name:
                best_match = src
                break
    else:
        # 🔁 Étape 3 : Sinon, on cherche la filière la plus proche (recherche floue)
        for src in data_sources:
            if src["type"] == "Filière":
                nom_filiere = normalize_text(src["title"])
                ratio = difflib.SequenceMatcher(None, normalized_input, nom_filiere).ratio()
                if ratio > highest_ratio:
                    highest_ratio = ratio
                    best_match = src

    # ✅ Étape 4 : Si on a trouvé une filière (exacte ou approximative)
    if best_match and (highest_ratio > 0.6 or highest_ratio == 0):  # 0 si exact match
        if any(keyword in u for keyword in ["débouchés", "métiers", "emploi", "travail", "carrière"]):
            return extract_specific_section(best_match, "débouchés")
        elif any(keyword in u for keyword in ["compétences", "skills", "savoir", "aptitudes"]):
            return extract_specific_section(best_match, "compétences")
        elif any(keyword in u for keyword in ["admission", "inscription", "accès", "conditions", "modalités"]):
            return extract_specific_section(best_match, "admission")
        elif any(keyword in u for keyword in ["prérequis", "prerequis", "requis", "exigences"]):
            return extract_specific_section(best_match, "prérequis")
        elif any(keyword in u for keyword in ["description", "présentation", "qu'est-ce", "c'est quoi"]):
            return extract_specific_section(best_match, "description")
        else:
            return best_match["content"]


    

    mapping = {
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*événements?": "Événement",
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*clubs?": "Club",
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*départements?": "Département",
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*(enseignants?|professeurs?)": "Enseignant",
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*chiffres?": "Chiffre",
        r"(tous les|toutes les|liste des|quels sont les|affiche|montre).*partenariats?": "Partenariat",
        r"(tous les|toutes les|liste des|quelles sont les|affiche|montre).*filières?": "Filière",

    }
    for pattern, ttype in mapping.items():
        if re.search(pattern, u):
            if ttype == "Filière":
                return "## Filières disponibles à l'ENSAKH :\n\n" + "\n".join(f"- **{src['title']}**" for src in data_sources if src["type"] == ttype)
            else:
                return "\n".join(f"- {src['title']}" for src in data_sources if src["type"] == ttype)
    return None

# --- Appel Groq + FAISS ---
def ask_with_faiss(user_input, history):
    global_result = handle_global(user_input)
    if global_result:
        return global_result

    context = retrieve_context_faiss(user_input)
    system_prompt = (
        "Tu es un assistant intelligent spécialisé dans les informations concernant l'École Nationale des Sciences Appliquées de Khouribga (ENSAKH).\n"
        "Utilise uniquement les informations suivantes :\n\n"
        f"{context}\n\n"
        "Réponds à la question de l'utilisateur de manière claire, concise et uniquement basée sur les descriptions ci-dessus."
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY1}"
    }

    payload = {
        "model": MODEL1,
        "messages": messages
    }

    try:
        response = requests.post(API_URL1, headers=headers, json=payload)
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"].strip()
        return reply
    except Exception as e:
        return f"Erreur lors de la génération de la réponse : {str(e)}"

# --- Modèles de requête ---
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

# --- Routes FastAPI ---
@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message:
        return {"error": "Message is required"}
    response = ask_with_faiss(req.message, req.history)
    return {"response": response}

@app.get("/health")
async def health():
    return {"status": "healthy", "data_sources": len(data_sources)}


# ---------------------
# Root
# ---------------------
@app.get("/")
async def root():
    return {"message": "Welcome to the Internship Recommendation API"}

# ---------------------
# Main Execution
# ---------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
