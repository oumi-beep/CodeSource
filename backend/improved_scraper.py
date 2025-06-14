import asyncio
import random
import time
import hashlib
import logging
import json
import re
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

import asyncpg

# ─────────────────────── logging ───────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.FileHandler("scraper.log", encoding="utf-8"), logging.StreamHandler()],
)
log = logging.getLogger("enhanced_scraper")

# ─────────────────────── DB CONFIG ───────────────────────
DB_CONFIG = {
    "user": "postgres",
    "password": "Oumaima123",
    "database": "postgres",
    "host": "localhost",
    "port": 5432,
    "ssl": False,
    "max_size": 20 ,
}

_pool: Optional[asyncpg.Pool] = None 

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(**DB_CONFIG)
        async with _pool.acquire() as conn:
            await conn.execute(CREATE_TABLE_SQL)
    return _pool

async def get_user_domains(conn: asyncpg.Connection, user_id: int) -> List[str]:
    r = await conn.fetchrow("SELECT domain FROM cv_analysis WHERE user_id=$1", user_id)
    if r and r["domain"]:
        return [d.strip() for d in r["domain"].split(",") if d.strip()]
    return []

async def save_internship_listing(conn: asyncpg.Connection, row: Dict) -> None:
    sql = """
    INSERT INTO internship_listings (
        title, company, location, country, platform, description,
        skills, domain, link, hash_id, scraped_at, is_active,
        phase_1_complete, phase_2_complete
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),TRUE,$11,$12)
    ON CONFLICT (hash_id) DO UPDATE SET
        title=$1, company=$2, location=$3, country=$4, platform=$5,
        description=$6, skills=$7, domain=$8, link=$9, scraped_at=NOW(), is_active=TRUE,
        phase_1_complete=$11, phase_2_complete=$12;
    """
    
    try:
        # Truncate very long fields to prevent database errors
        title = (row.get("Title", "") or "")[:500]
        company = (row.get("Company", "") or "")[:200]
        location = (row.get("Location", "") or "")[:200]
        country = (row.get("Country", "") or "")[:100]
        platform = (row.get("Platform", "") or "")[:50]
        description = (row.get("Description", "") or "")[:5000]
        skills = (row.get("Skills", "") or "")[:1000]
        domain = (row.get("Domain", "") or "")[:100]
        link = (row.get("Link", "") or "")[:1000]
        hash_id = row.get("Hash_ID", "")
        
        # Phase tracking
        phase_1_complete = row.get("phase_1_complete", True)
        phase_2_complete = row.get("phase_2_complete", False)
        
        # Skip if essential fields are missing
        if not title or not hash_id:
            log.warning(f"Skipping job with missing title or hash_id")
            return
            
        await conn.execute(sql,
            title, company, location, country, platform,
            description, skills, domain, link, hash_id,
            phase_1_complete, phase_2_complete
        )
        
    except Exception as e:
        log.error(f"Error saving job listing ")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS internship_listings (
    id SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    company     TEXT,
    location    TEXT,
    country     TEXT,
    platform    TEXT,
    description TEXT DEFAULT \'\',
    skills      TEXT DEFAULT \'\',
    domain      TEXT,
    link        TEXT,
    hash_id     TEXT UNIQUE NOT NULL,
    scraped_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    description_scraped_at TIMESTAMP NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    phase_1_complete BOOLEAN DEFAULT TRUE,
    phase_2_complete BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_hash_id ON internship_listings(hash_id);
CREATE INDEX IF NOT EXISTS idx_platform ON internship_listings(platform);
CREATE INDEX IF NOT EXISTS idx_country ON internship_listings(country);
CREATE INDEX IF NOT EXISTS idx_domain ON internship_listings(domain);
CREATE INDEX IF NOT EXISTS idx_scraped_at ON internship_listings(scraped_at);
CREATE INDEX IF NOT EXISTS idx_phase_2_complete ON internship_listings(phase_2_complete);
"""

# ─────────────────────── Data Cleaning Utils ───────────────────────
class DataCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text data"""
        if not text or text == "N/A":
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s\-.,()&/]', '', text)
        
        return text
    
    @staticmethod
    def clean_company_name(company: str) -> str:
        """Clean company names"""
        if not company:
            return ""
        
        company = DataCleaner.clean_text(company)
        
        # Remove common suffixes
        suffixes = ['Inc.', 'Inc', 'LLC', 'Ltd.', 'Ltd', 'Corp.', 'Corp', 'Co.', 'Co']
        for suffix in suffixes:
            if company.endswith(f' {suffix}'):
                company = company[:-len(suffix)-1].strip()
        
        return company
    
    @staticmethod
    def clean_location(location: str) -> str:
        """Clean and standardize location data"""
        if not location:
            return ""
        
        location = DataCleaner.clean_text(location)
        
        # Remove common location prefixes/suffixes
        location = re.sub(r'^(Remote|Hybrid|On-site)\s*[-•]?\s*', '', location, flags=re.IGNORECASE)
        
        return location
    
    @staticmethod
    def extract_skills(description: str) -> str:
        """Extract skills from job description"""
        if not description:
            return ""
        
        # Common technical skills to look for
        skills_patterns = [
            r'\b(Python|Java|JavaScript|React|Node\.js|SQL|HTML|CSS|Git|Docker|AWS|Azure|GCP)\b',
            r'\b(Machine Learning|Data Science|AI|Analytics|Statistics)\b',
            r'\b(Marketing|SEO|SEM|Social Media|Content Marketing)\b',
            r'\b(Finance|Accounting|Excel|Financial Analysis)\b',
        ]
        
        found_skills = set()
        for pattern in skills_patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            found_skills.update([match.title() for match in matches])
        
        return ', '.join(sorted(found_skills))

# ─────────────────────── Local Storage Manager ───────────────────────
class LocalStorage:
    def __init__(self, storage_dir: str = "scraped_data"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.current_session = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def save_batch(self, platform: str, country: str, domain: str, data: List[Dict]):
        """Save scraped data batch locally"""
        filename = f"{platform}_{country}_{domain}_{self.current_session}.json"
        filepath = self.storage_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        log.info(f"Saved {len(data)} items to {filename}")
    
    def load_all_data(self) -> List[Dict]:
        """Load all scraped data from current session"""
        all_data = []
        pattern = f"*_{self.current_session}.json"
        
        for filepath in self.storage_dir.glob(pattern):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                all_data.extend(data)
        
        log.info(f"Loaded {len(all_data)} total items from local storage")
        return all_data
    
    def cleanup_old_files(self, days_old: int = 7):
        """Clean up old scraped data files"""
        cutoff_time = time.time() - (days_old * 24 * 60 * 60)
        
        for filepath in self.storage_dir.glob("*.json"):
            if filepath.stat().st_mtime < cutoff_time:
                filepath.unlink()
                log.info(f"Cleaned up old file: {filepath.name}")

# ─────────────────────── Enhanced Scraper ───────────────────────
class EnhancedInternshipScraper:
    def __init__(self, *, headless: bool = True, countries: Optional[List[str]] = None):
        self.headless = headless
        self.countries = countries or ["Morocco","France","Canada"]
        self.driver: Optional[uc.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
        self.storage = LocalStorage()
        self.cleaner = DataCleaner()
        
        # Glassdoor country mapping
        self.country_slug = {
            "Morocco": ("Maroc", "IN162"),
            "France": ("France", "IN86"),
            "Canada": ("Canada", "IN3"),
        }
    
    def _setup_driver(self):
        """Setup Chrome driver with enhanced options"""
        opts = uc.ChromeOptions()
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument("--disable-notifications")
        opts.add_argument("--disable-popup-blocking")
        opts.add_argument("--disable-extensions")
        
        
        self.driver = uc.Chrome(options=opts)
        self.wait = WebDriverWait(self.driver, 20)
    
    @staticmethod
    def _kw(q: str) -> str:
        return q.strip().replace(" ", "+") + "+Internship"
    
    @staticmethod
    def _sleep(a=2, b=5):
        time.sleep(random.uniform(a, b))
    
    def _scrape_linkedin(self, kw: str, country: str) -> List[Dict]:
        """Enhanced LinkedIn scraping"""
        out: List[Dict] = []
        url = f"https://www.linkedin.com/jobs/search/?keywords={self._kw(kw)}&location={country}&f_JT=I"
        
        try:
            log.info("LinkedIn  • %-15s • %-10s", kw, country)
            self.driver.get(url)
            self._sleep(3, 6)
            
            # Scroll to load more jobs
            for _ in range(5):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                self._sleep(2, 4)
            
            cards = self.driver.find_elements(By.CSS_SELECTOR, ".job-search-card")
            log.info("  -> %d job cards found", len(cards))
            
            for c in cards:
                try:
                    title = c.find_element(By.CLASS_NAME, "base-search-card__title").text.strip()
                    company = c.find_element(By.CLASS_NAME, "base-search-card__subtitle").text.strip()
                    loc = c.find_element(By.CLASS_NAME, "job-search-card__location").text.strip()
                    link = c.find_element(By.TAG_NAME, "a").get_attribute("href")
                    
                    # Try to get additional info
                    salary_info = ""
                    try:
                        salary_elem = c.find_element(By.CLASS_NAME, "job-search-card__salary-info")
                        salary_info = salary_elem.text.strip()
                    except NoSuchElementException:
                        pass
                    
                    h = hashlib.sha256(f"{title}|{company}|{loc}|linkedin".encode()).hexdigest()
                    
                    out.append({
                        "Title": title,
                        "Company": company,
                        "Location": loc,
                        "Country": country,
                        "Platform": "LinkedIn",
                        "Description": "",  # Will be filled in phase 2
                        "Skills": "",
                        "Domain": kw,
                        "Link": link,
                        "Hash_ID": h,
                        "Salary_Info": salary_info,
                        "Job_Type": "Internship"
                    })
                except NoSuchElementException:
                    continue
                    
        except Exception as e:
            log.error("LinkedIn scrape error: %s", e)
        
        return out
    
    def _scrape_indeed(self, kw: str, country: str) -> List[Dict]:
        """Enhanced Indeed scraping"""
        out: List[Dict] = []
        tld = "ma" if country == "Morocco" else "fr"
        url = f"https://{tld}.indeed.com/jobs?q={self._kw(kw)}&l={country}"
        
        try:
            log.info("Indeed    • %-15s • %-10s", kw, country)
            self.driver.get(url)
            self._sleep(3, 6)
            
            # Handle cookie consent
            try:
                self.driver.find_element(By.ID, "onetrust-accept-btn-handler").click()
                self._sleep(1, 2)
            except Exception:
                pass
            
            # Scroll to load more jobs
            for _ in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                self._sleep(2, 4)
            
            cards = self.driver.find_elements(By.CSS_SELECTOR, ".job_seen_beacon")
            log.info("  -> %d job cards found", len(cards))
            
            for c in cards:
                try:
                    title = c.find_element(By.CSS_SELECTOR, "h2.jobTitle span[title]").text.strip()
                    company = c.find_element(By.CSS_SELECTOR, 'span[data-testid="company-name"]').text.strip()
                    loc = c.find_element(By.CSS_SELECTOR, 'div[data-testid="text-location"]').text.strip()
                    link = c.find_element(By.CSS_SELECTOR, "h2.jobTitle > a").get_attribute("href")
                    
                    # Try to get salary info
                    salary_info = ""
                    try:
                        salary_elem = c.find_element(By.CSS_SELECTOR, '.salary-snippet')
                        salary_info = salary_elem.text.strip()
                    except NoSuchElementException:
                        pass
                    
                    h = hashlib.sha256(f"{title}|{company}|{loc}|indeed".encode()).hexdigest()
                    
                    out.append({
                        "Title": title,
                        "Company": company,
                        "Location": loc,
                        "Country": country,
                        "Platform": "Indeed",
                        "Description": "",  
                        "Skills": "",
                        "Domain": kw,
                        "Link": link,
                        "Hash_ID": h,
                        "Salary_Info": salary_info,
                        "Job_Type": "Internship"
                    })
                except Exception:
                    continue
                    
        except Exception as e:
            log.error("Indeed scrape error: %s", e)
        
        return out
    
    def _scrape_glassdoor(self, kw: str, country: str) -> List[Dict]:
      """Enhanced Glassdoor scraping using specific CSS selectors"""
      out: List[Dict] = []

      try:
          slug_loc, geo = self.country_slug.get(country, (country.replace(" ", "-"), "IN162"))
          slug_kw = self._kw(kw).lower().replace(" ", "-")
          start = len(slug_loc) + 1
          end = start + len(slug_kw)
          url = (
              "https://www.glassdoor.fr/Emploi/"
              f"{slug_loc.lower()}-{slug_kw}-emplois-SRCH_IL.0,{len(slug_loc)}_{geo}_KO{start},{end}.htm"
          )

          log.info("Glassdoor • %-15s • %-10s", self._kw(kw), country)
          self.driver.get(url)
          self._sleep(4, 7)

          try:
              self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a.JobCard_jobTitle__GLyJ1')))
          except TimeoutException:
              log.warning("Glassdoor: No job cards found or page didn't load properly")
              return out

          for _ in range(3):
              self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
              self._sleep(2, 4)

          cards = self.driver.find_elements(By.CSS_SELECTOR, 'a.JobCard_jobTitle__GLyJ1')
          log.info("  -> %d job cards found", len(cards))

          for card in cards:
              try:
                  parent = card.find_element(By.XPATH, "./ancestor::*[contains(@class, 'react-job-listing') or contains(@class, 'JobCard')]")

                  # Scraping based on your updated selectors
                  nom_stage = parent.find_element(By.CSS_SELECTOR, 'a.JobCard_jobTitle__GLyJ1').text.strip()
                  entreprise = parent.find_element(By.CSS_SELECTOR, 'span.EmployerProfile_compactEmployerName__9MGcV').text.strip()
                  lieu = parent.find_element(By.CSS_SELECTOR, 'div.JobCard_location__Ds1fM').text.strip()
                  lien = parent.find_element(By.CSS_SELECTOR, 'a.JobCard_jobTitle__GLyJ1').get_attribute('href')

                  if nom_stage and entreprise:
                      h = hashlib.sha256(f"{nom_stage}|{entreprise}|{lieu}|glassdoor".encode()).hexdigest()

                      out.append({
                          "Title": nom_stage,
                          "Company": entreprise,
                          "Location": lieu,
                          "Country": country,
                          "Platform": "Glassdoor",
                          "Description": "",
                          "Skills": "",
                          "Domain": kw,
                          "Link": lien,
                          "Hash_ID": h,
                          "Salary_Info": "",
                          "Job_Type": "Internship"
                      })

              except Exception as e:
                  log.debug(f"Error processing Glassdoor card: {e}")
                  continue

      except Exception as e:
          log.error("Glassdoor scrape error: %s", e)

      return out

    def _scrape_job_description(self, job_data: Dict) -> str:
        """Scrape detailed job description from job link"""
        try:
            self.driver.get(job_data["Link"])
            self._sleep(2, 4)
            
            platform = job_data["Platform"].lower()
            description = ""
            
            if platform == "linkedin":
              try:
                  description = self.driver.find_element(By.CLASS_NAME, "description__text").text.strip()
              except Exception:
                  try:
                      # Fallback to the older class
                      description = self.driver.find_element(By.CLASS_NAME, "show-more-less-html__markup").text.strip()
                  except Exception as e:
                      log.debug(f"LinkedIn description extraction failed: {e}")
                      description = ""
              
              return description

                    
            elif platform == "indeed":
              try:
                  description = self.driver.find_element(By.CSS_SELECTOR, "div.jobsearch-JobComponent-description").text.strip()
              except Exception as e: 
                  log.debug(f"Indeed description extraction failed: {e}")
                  description = ""

              return description
                    
            elif platform == "glassdoor":
              try:
                  soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                  desc = soup.find('div', class_='JobDetails_jobDescription__uW_fK')
                  if desc:
                      description = desc.get_text(separator=' ').strip()
                  else:
                      description = ""
              except Exception as e:
                  log.debug(f"Glassdoor description extraction failed: {e}")
                  description = ""
              
              return description

            
        except Exception as e:
            log.debug(f"Error scraping description for {job_data.get('Title', 'Unknown')}: {e}")
            return ""
    
    async def phase1_collect_listings(self, domains: List[str]) -> None:
        """Phase 1: Collect all job listings with basic info"""
        log.info("=== PHASE 1: Collecting job listings ===")
        self._setup_driver()
        
        try:
            for country in self.countries:
                for domain in domains:
                    # LinkedIn
                    linkedin_data = self._scrape_linkedin(domain, country)
                    if linkedin_data:
                        self.storage.save_batch("LinkedIn", country, domain, linkedin_data)
                    
                    # Indeed
                    indeed_data = self._scrape_indeed(domain, country)
                    if indeed_data:
                        self.storage.save_batch("Indeed", country, domain, indeed_data)
                    
                    # Glassdoor
                    glassdoor_data = self._scrape_glassdoor(domain, country)
                    if glassdoor_data:
                        self.storage.save_batch("Glassdoor", country, domain, glassdoor_data)
                    
                    log.info(f"Completed scraping for {domain} in {country}")
                    await asyncio.sleep(5)  # Polite delay between domains
                    
        finally:
            if self.driver:
                self.driver.quit()
    
    async def phase2_collect_descriptions(self, jobs_to_process: List[Dict], max_descriptions: int = 100) -> List[Dict]:
        """Phase 2: Collect detailed descriptions for a subset of jobs"""
        log.info("=== PHASE 2: Collecting job descriptions ===")
        
        # Prioritize jobs without descriptions and limit to max_descriptions
        # Create a copy to avoid modifying the original list while iterating for selection
        jobs_to_scrape_descriptions = [job for job in jobs_to_process if not job.get("Description")]
        jobs_to_scrape_descriptions = jobs_to_scrape_descriptions[:max_descriptions]
        
        if not jobs_to_scrape_descriptions:
            log.info("No jobs need description scraping")
            return jobs_to_process # Return original list if no descriptions to scrape
        
        self._setup_driver()
        
        try:
            for i, job in enumerate(jobs_to_scrape_descriptions):
                log.info(f"Scraping description {i+1}/{len(jobs_to_scrape_descriptions)}: {job['Title']}")
                
                description = self._scrape_job_description(job)
                job["Description"] = description
                
                if description:
                    # Extract skills from description
                    job["Skills"] = self.cleaner.extract_skills(description)
                    job["phase_2_complete"] = True # Mark as complete after description is scraped
                
                await asyncio.sleep(random.uniform(3, 6))  # Polite delay
                
        finally:
            if self.driver:
                self.driver.quit()
        
        return jobs_to_process # Return the list with updated descriptions
    
    async def phase3_clean_and_save(self, pool: asyncpg.Pool, all_jobs: List[Dict]) -> None:
        """Phase 3: Clean data and save to database"""
        log.info("=== PHASE 3: Cleaning and saving to database ===")
        
        # all_jobs is now passed directly, no need to load from storage again
        
        async with pool.acquire() as conn:
            saved_count = 0
            
            for job in all_jobs:
                try:
                    # Clean the data
                    cleaned_job = {
                        "Title": self.cleaner.clean_text(job.get("Title", "")),
                        "Company": self.cleaner.clean_company_name(job.get("Company", "")),
                        "Location": self.cleaner.clean_location(job.get("Location", "")),
                        "Country": job.get("Country", ""),
                        "Platform": job.get("Platform", ""),
                        "Description": self.cleaner.clean_text(job.get("Description", "")),
                        "Skills": job.get("Skills", ""),
                        "Domain": job.get("Domain", ""),
                        "Link": job.get("Link", ""),
                        "Hash_ID": job.get("Hash_ID", ""),
                        "Salary_Info": self.cleaner.clean_text(job.get("Salary_Info", "")),
                        "Job_Type": job.get("Job_Type", "Internship"),
                        "Experience_Level": "Entry Level"  # Default for internships
                    }
                    
                    # Include phase completion flags
                    cleaned_job["phase_1_complete"] = job.get("phase_1_complete", True)
                    cleaned_job["phase_2_complete"] = job.get("phase_2_complete", False)

                    # Skip if essential fields are missing
                    if not cleaned_job["Title"] or not cleaned_job["Hash_ID"]:
                        log.warning(f"Skipping job with missing title or hash_id during final save: {job.get('Title', 'Unknown')}")
                        continue
                    
                    # Save to database
                    await save_internship_listing(conn, cleaned_job)
                    saved_count += 1
                    
                except Exception as e:
                    log.error(f"Error processing job {job.get('Title', 'Unknown')}: {e}")
                    continue
            
            log.info(f"Successfully saved {saved_count} cleaned job listings to database")
    
    async def scrape_for_user(self, user_id: int) -> None:
        """Scrape internships for a specific user based on their domains"""
        log.info(f"=== SCRAPING FOR USER {user_id} ===")
        
        pool = await get_pool()
        
        try:
            async with pool.acquire() as conn:
                user_domains = await get_user_domains(conn, user_id)
                if not user_domains:
                    user_domains = ["Computer Science"]  # fallback
                    log.info(f"No domains found for user {user_id}, using fallback: {user_domains}")
                else:
                    log.info(f"User {user_id} domains: {user_domains}")
            
            # --- Phase 1: Collect listings ---
            await self.phase1_collect_listings(user_domains)
            
            # --- Phase 2: Collect detailed descriptions ---
            # Load all data after Phase 1, and pass it to Phase 2 for updates
            all_jobs_after_phase1 = self.storage.load_all_data()
            updated_jobs_after_phase2 = await self.phase2_collect_descriptions(jobs_to_process=all_jobs_after_phase1)
            
            # --- Phase 3: Clean and save to database ---
            # Pass the updated jobs directly to Phase 3
            await self.phase3_clean_and_save(pool, updated_jobs_after_phase2)
            
            log.info(f"=== SCRAPING FOR USER {user_id} COMPLETED ===")
            
        except Exception as e:
            log.error(f"An error occurred during scraping for user {user_id}: {e}")
        finally:
            # Ensure the driver is quit if it was set up in any phase
            if self.driver:
                self.driver.quit()


