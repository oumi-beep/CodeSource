"""
Utility functions for the enhanced scraper
"""

import asyncio
import asyncpg
from typing import List, Dict
import logging

log = logging.getLogger("scraper_utils")

DB_CONFIG = {
    "user": "postgres",
    "password": "Oumaima123",
    "database": "postgres",
    "host": "localhost",
    "port": 5432,
    "ssl": False,
}

async def get_scraping_stats():
    """Get statistics about scraped data"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            # Total count
            total = await conn.fetchval("SELECT COUNT(*) FROM internship_listings")
            
            # Count by platform
            platform_stats = await conn.fetch("""
                SELECT platform, COUNT(*) as count 
                FROM internship_listings 
                GROUP BY platform 
                ORDER BY count DESC
            """)
            
            # Count by country
            country_stats = await conn.fetch("""
                SELECT country, COUNT(*) as count 
                FROM internship_listings 
                GROUP BY country 
                ORDER BY count DESC
            """)
            
            # Recent additions
            recent = await conn.fetchval("""
                SELECT COUNT(*) FROM internship_listings 
                WHERE scraped_at >= NOW() - INTERVAL '24 hours'
            """)
            
            print(f"\n=== SCRAPING STATISTICS ===")
            print(f"Total job listings: {total}")
            print(f"Added in last 24h: {recent}")
            
            print(f"\nBy Platform:")
            for row in platform_stats:
                print(f"  {row['platform']}: {row['count']}")
            
            print(f"\nBy Country:")
            for row in country_stats:
                print(f"  {row['country']}: {row['count']}")
                
    finally:
        await pool.close()

async def cleanup_duplicates():
    """Remove duplicate entries based on hash_id"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            # Find duplicates
            duplicates = await conn.fetch("""
                SELECT hash_id, COUNT(*) as count
                FROM internship_listings
                GROUP BY hash_id
                HAVING COUNT(*) > 1
            """)
            
            if duplicates:
                print(f"Found {len(duplicates)} duplicate hash_ids")
                
                # Keep only the most recent entry for each hash_id
                await conn.execute("""
                    DELETE FROM internship_listings
                    WHERE id NOT IN (
                        SELECT DISTINCT ON (hash_id) id
                        FROM internship_listings
                        ORDER BY hash_id, scraped_at DESC
                    )
                """)
                
                print("Duplicates cleaned up successfully")
            else:
                print("No duplicates found")
                
    finally:
        await pool.close()

async def save_internship_listing(conn: asyncpg.Connection, row: Dict) -> None:
    """Save internship listing to database with simplified SQL"""
    sql = """
    INSERT INTO internship_listings (
        title, company, location, country, platform, description,
        skills, domain, link, hash_id, scraped_at, is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),TRUE)
    ON CONFLICT (hash_id) DO UPDATE SET
        title=$1, company=$2, location=$3, country=$4, platform=$5,
        description=$6, skills=$7, domain=$8, link=$9, scraped_at=NOW(), is_active=TRUE;
    """
    
    await conn.execute(sql,
        row["Title"], row.get("Company"), row.get("Location"), row.get("Country"),
        row.get("Platform"), row.get("Description"), row.get("Skills"), row.get("Domain"),
        row.get("Link"), row["Hash_ID"]
    )

async def get_phase_statistics():
    """Get statistics about phase completion"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            # Overall phase statistics
            phase_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN phase_1_complete = TRUE THEN 1 END) as phase_1_complete,
                    COUNT(CASE WHEN phase_2_complete = TRUE THEN 1 END) as phase_2_complete,
                    COUNT(CASE WHEN phase_1_complete = TRUE AND phase_2_complete = FALSE THEN 1 END) as needs_phase_2,
                    COUNT(CASE WHEN description != '' AND description IS NOT NULL THEN 1 END) as with_descriptions
                FROM internship_listings
            """)
            
            # Platform breakdown
            platform_stats = await conn.fetch("""
                SELECT 
                    platform,
                    COUNT(*) as total,
                    COUNT(CASE WHEN phase_2_complete = TRUE THEN 1 END) as with_descriptions
                FROM internship_listings 
                GROUP BY platform 
                ORDER BY total DESC
            """)
            
            print(f"\n=== PHASE STATISTICS ===")
            print(f"Total records: {phase_stats['total_records']}")
            print(f"Phase 1 complete: {phase_stats['phase_1_complete']}")
            print(f"Phase 2 complete: {phase_stats['phase_2_complete']}")
            print(f"Needs Phase 2: {phase_stats['needs_phase_2']}")
            print(f"With descriptions: {phase_stats['with_descriptions']}")
            
            print(f"\nPlatform Breakdown:")
            for row in platform_stats:
                completion_rate = (row['with_descriptions'] / row['total'] * 100) if row['total'] > 0 else 0
                print(f"  {row['platform']}: {row['total']} total, {row['with_descriptions']} with descriptions ({completion_rate:.1f}%)")
                
    finally:
        await pool.close()

async def get_records_needing_phase_2(limit: int = 100):
    """Get records that need Phase 2 processing"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            records = await conn.fetch("""
                SELECT id, title, company, platform, link, scraped_at
                FROM internship_listings
                WHERE phase_1_complete = TRUE 
                AND phase_2_complete = FALSE
                AND (description = '' OR description IS NULL)
                AND link IS NOT NULL AND link != ''
                ORDER BY scraped_at DESC
                LIMIT $1
            """, limit)
            
            print(f"\n=== RECORDS NEEDING PHASE 2 ===")
            print(f"Found {len(records)} records needing description enhancement")
            
            if records:
                print(f"\nSample records:")
                for i, record in enumerate(records[:10]):
                    print(f"  {i+1}. {record['title']} at {record['company']} ({record['platform']})")
                
                if len(records) > 10:
                    print(f"  ... and {len(records) - 10} more")
            
            return records
                
    finally:
        await pool.close()

async def mark_phase_2_complete(record_ids: List[int]):
    """Mark specific records as Phase 2 complete"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            updated = await conn.fetchval("""
                UPDATE internship_listings 
                SET phase_2_complete = TRUE, description_scraped_at = NOW()
                WHERE id = ANY($1)
            """, record_ids)
            
            print(f"Marked {updated} records as Phase 2 complete")
            
    finally:
        await pool.close()

async def reset_phase_2_status():
    """Reset Phase 2 status for all records (useful for testing)"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            updated = await conn.fetchval("""
                UPDATE internship_listings 
                SET phase_2_complete = FALSE, description_scraped_at = NULL
                WHERE phase_2_complete = TRUE
            """)
            
            print(f"Reset Phase 2 status for {updated} records")
            
    finally:
        await pool.close()

async def cleanup_phase_data():
    """Clean up data between phases"""
    pool = await asyncpg.create_pool(**DB_CONFIG)
    
    try:
        async with pool.acquire() as conn:
            # Remove duplicates
            duplicates_removed = await conn.fetchval("""
                DELETE FROM internship_listings
                WHERE id NOT IN (
                    SELECT DISTINCT ON (hash_id) id
                    FROM internship_listings
                    ORDER BY hash_id, scraped_at DESC
                )
            """)
            
            # Remove records with missing essential data
            missing_removed = await conn.fetchval("""
                DELETE FROM internship_listings
                WHERE title IS NULL OR title = '' OR hash_id IS NULL OR hash_id = ''
            """)
            
            # Update empty fields
            await conn.execute("""
                UPDATE internship_listings 
                SET 
                    company = COALESCE(NULLIF(company, ''), 'Unknown Company'),
                    location = COALESCE(NULLIF(location, ''), 'Location Not Specified'),
                    description = COALESCE(description, ''),
                    skills = COALESCE(skills, '')
                WHERE company = '' OR location = '' OR description IS NULL OR skills IS NULL
            """)
            
            print(f"\n=== DATA CLEANUP COMPLETED ===")
            print(f"Duplicates removed: {duplicates_removed}")
            print(f"Invalid records removed: {missing_removed}")
            
    finally:
        await pool.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "stats":
            asyncio.run(get_scraping_stats())
        elif sys.argv[1] == "cleanup":
            asyncio.run(cleanup_duplicates())
        elif sys.argv[1] == "phase-stats":
            asyncio.run(get_phase_statistics())
        elif sys.argv[1] == "phase-2-needed":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            asyncio.run(get_records_needing_phase_2(limit))
        elif sys.argv[1] == "cleanup-phases":
            asyncio.run(cleanup_phase_data())
        elif sys.argv[1] == "reset-phase-2":
            asyncio.run(reset_phase_2_status())
    else:
        print("Usage: python scraper_utils.py [stats|cleanup|phase-stats|phase-2-needed|cleanup-phases|reset-phase-2]")
