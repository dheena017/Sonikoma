import os
import sqlite3
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("print_all_data")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "backend", "database", "webtoon_local.db")

def print_table_data(title, query, params=(), is_json_fields=None):
    if is_json_fields is None:
        is_json_fields = []
        
    logger.info("=" * 80)
    logger.info(f"📋 {title.upper()}")
    logger.info("=" * 80)
    
    if not os.path.exists(DB_PATH):
        logger.error("Database file does not exist.")
        return
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        if not rows:
            logger.info("No records found.\n")
            return
            
        for i, row in enumerate(rows):
            logger.info(f"--- Record #{i+1} ---")
            row_dict = dict(row)
            for k, v in row_dict.items():
                if k in is_json_fields and v:
                    try:
                        v = json.loads(v)
                    except Exception:
                        pass
                logger.info(f"  {k:18}: {v}")
            logger.info("")
    except Exception as e:
        logger.error(f"Error querying database: {e}")
    finally:
        conn.close()

def main():
    logger.info("================================================================================")
    logger.info("🔍 PRINTING ALL SONIKOMA DATABASE DATA")
    logger.info("================================================================================")
    
    print_table_data(
        "Users", 
        "SELECT * FROM users", 
        is_json_fields=["preferences", "portfolio_links", "unlocked_rewards", "social_connections"]
    )
    
    print_table_data(
        "Series", 
        "SELECT * FROM series"
    )
    
    print_table_data(
        "Chapters", 
        "SELECT * FROM chapters"
    )
    
    print_table_data(
        "Panels", 
        "SELECT * FROM panels ORDER BY chapter_id, panel_index"
    )
    
    print_table_data(
        "Scrape Sessions Cache", 
        "SELECT * FROM scrape_sessions",
        is_json_fields=["image_urls"]
    )
    
    print_table_data(
        "Edit History", 
        "SELECT * FROM edit_history"
    )
    
    print_table_data(
        "User Sessions", 
        "SELECT * FROM user_sessions"
    )
    
    print_table_data(
        "Audit Logs", 
        "SELECT * FROM user_audit_logs"
    )
    
    print_table_data(
        "Invoices", 
        "SELECT * FROM user_invoices"
    )
    
    print_table_data(
        "Developer API Keys", 
        "SELECT * FROM user_api_keys"
    )

if __name__ == "__main__":
    main()
