import os
import shutil
import tempfile
import sqlite3
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clean_all_data")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "backend", "database", "webtoon_local.db")
SCRAPED_HTML_DIR = os.path.join(PROJECT_ROOT, "data", "scraped_html")

def clean_database():
    logger.info("Starting database cleanup...")
    
    # Files to delete
    db_files = [
        DB_PATH,
        DB_PATH + "-wal",
        DB_PATH + "-shm"
    ]
    
    # Try deleting the files first
    deleted_files = True
    for db_file in db_files:
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
                logger.info(f"Successfully deleted database file: {db_file}")
            except Exception as e:
                logger.warning(f"Could not delete database file {db_file}: {e}")
                deleted_files = False

    # If the file couldn't be deleted (e.g. locked by running server), truncate tables instead
    if not deleted_files and os.path.exists(DB_PATH):
        logger.info("Database file is locked or couldn't be deleted. Truncating tables instead...")
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Disable foreign key checks to truncate tables cleanly
            cursor.execute("PRAGMA foreign_keys = OFF")
            
            # Fetch all user tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [row[0] for row in cursor.fetchall()]
            
            for table in tables:
                cursor.execute(f"DELETE FROM {table}")
                logger.info(f"Cleared all records from table: {table}")
            
            # Re-enable foreign keys
            cursor.execute("PRAGMA foreign_keys = ON")
            
            # Reclaim unused space
            cursor.execute("VACUUM")
            conn.commit()
            conn.close()
            logger.info("All database tables truncated and vacuumed successfully.")
        except Exception as e:
            logger.error(f"Error truncating database tables: {e}")

def clean_scraped_html():
    logger.info(f"Cleaning scraped HTML cache at: {SCRAPED_HTML_DIR}...")
    if os.path.exists(SCRAPED_HTML_DIR):
        for item in os.listdir(SCRAPED_HTML_DIR):
            item_path = os.path.join(SCRAPED_HTML_DIR, item)
            try:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                    logger.info(f"Deleted file: {item_path}")
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                    logger.info(f"Deleted directory: {item_path}")
            except Exception as e:
                logger.error(f"Failed to delete {item_path}: {e}")
    else:
        logger.info("Scraped HTML cache directory does not exist.")

def clean_temp_directories():
    temp_dirs = [
        os.path.join(tempfile.gettempdir(), "anivox_disk_cache"),
        os.path.join(tempfile.gettempdir(), "anivox_renders"),
        os.path.join(tempfile.gettempdir(), "webtoon_workspace")
    ]
    
    for temp_dir in temp_dirs:
        logger.info(f"Cleaning temporary directory: {temp_dir}...")
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                logger.info(f"Successfully cleaned temporary directory: {temp_dir}")
            except Exception as e:
                logger.error(f"Failed to clean temporary directory {temp_dir}: {e}")
        else:
            logger.info(f"Directory {temp_dir} does not exist.")

if __name__ == "__main__":
    logger.info("=== Anivox Webtoon-to-Video Complete Data Cleanup Started ===")
    clean_database()
    clean_scraped_html()
    clean_temp_directories()
    logger.info("=== Cleanup Process Completed ===")
