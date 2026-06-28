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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _open_db():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


# ─── Database ─────────────────────────────────────────────────────────────────

def clean_database():
    """Delete the database file if possible; truncate all tables if locked."""
    logger.info("Starting database cleanup...")

    db_files = [DB_PATH, DB_PATH + "-wal", DB_PATH + "-shm"]

    all_deleted = True
    for db_file in db_files:
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
                logger.info(f"  Deleted database file: {db_file}")
            except Exception as e:
                logger.warning(f"  Could not delete {db_file}: {e}")
                all_deleted = False

    # Fallback: truncate tables when the file is locked by the running server
    if not all_deleted and os.path.exists(DB_PATH):
        logger.info("Database locked — truncating tables instead...")
        try:
            conn = _open_db()
            cursor = conn.cursor()
            cursor.execute("PRAGMA foreign_keys = OFF")
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
            tables = [row[0] for row in cursor.fetchall()]
            for table in tables:
                cursor.execute(f"DELETE FROM {table}")
                logger.info(f"  Cleared table: {table}")
            cursor.execute("PRAGMA foreign_keys = ON")
            conn.commit()
            conn.close()
            logger.info("All tables truncated.")

            # VACUUM must run outside any transaction (can't VACUUM inside BEGIN)
            conn2 = _open_db()
            conn2.execute("VACUUM")
            conn2.close()
            logger.info("Database vacuumed.")
        except Exception as e:
            logger.error(f"Error truncating database tables: {e}")


def clean_svg_fallbacks():
    """Remove scrape_sessions / panels rows containing SVG or data-URI placeholders."""
    if not os.path.exists(DB_PATH):
        logger.info("Database not found — skipping SVG fallback cleanup.")
        return

    logger.info("Removing SVG/data placeholder rows from database...")
    try:
        conn = _open_db()
        cursor = conn.cursor()

        # Covers raw ('data:', 'svg') and URL-encoded variants ('data%', '%25svg%', etc.)
        scrape_patterns = ["%svg%", "%data:%", "%data%%", "%25svg%", "%253A%"]
        deleted = 0
        for pattern in scrape_patterns:
            cursor.execute(
                "DELETE FROM scrape_sessions WHERE image_urls LIKE ?", (pattern,)
            )
            deleted += cursor.rowcount

        # Clean panels table if contaminated
        cursor.execute(
            "DELETE FROM panels WHERE image_url LIKE '%svg%' OR image_url LIKE '%data%' "
            "OR original_url LIKE '%svg%' OR original_url LIKE '%data%'"
        )
        deleted += cursor.rowcount

        conn.commit()
        conn.close()
        logger.info(f"  Removed {deleted} SVG/data placeholder record(s).")
    except Exception as e:
        logger.error(f"Error cleaning SVG fallbacks: {e}")


# ─── File caches ──────────────────────────────────────────────────────────────

def clean_scraped_html():
    logger.info(f"Cleaning scraped HTML cache: {SCRAPED_HTML_DIR}...")
    if not os.path.exists(SCRAPED_HTML_DIR):
        logger.info("  Scraped HTML cache directory does not exist.")
        return
    for item in os.listdir(SCRAPED_HTML_DIR):
        item_path = os.path.join(SCRAPED_HTML_DIR, item)
        try:
            if os.path.isfile(item_path):
                os.remove(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
            logger.info(f"  Deleted: {item_path}")
        except Exception as e:
            logger.error(f"  Failed to delete {item_path}: {e}")


def clean_temp_directories():
    tmp = tempfile.gettempdir()
    temp_dirs = [
        os.path.join(tmp, "sonikoma_disk_cache"),
        os.path.join(tmp, "sonikoma_renders"),
        os.path.join(tmp, "sonikoma_cache"),
        os.path.join(tmp, "sonikoma_tmp"),
        os.path.join(tmp, "webtoon_workspace"),
    ]
    for temp_dir in temp_dirs:
        logger.info(f"Cleaning temp directory: {temp_dir}...")
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                logger.info(f"  Cleaned: {temp_dir}")
            except Exception as e:
                logger.error(f"  Failed to clean {temp_dir}: {e}")
        else:
            logger.info(f"  Does not exist: {temp_dir}")


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("=== Sonikoma Webtoon-to-Video Complete Data Cleanup Started ===")
    clean_svg_fallbacks()   # targeted — safe while server is running
    clean_database()        # full wipe (or table truncate if locked)
    clean_scraped_html()
    clean_temp_directories()
    logger.info("=== Cleanup Process Completed ===")
