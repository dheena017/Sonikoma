import os
import shutil
import tempfile
import sqlite3
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clean_all_data")

SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
REPO_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))

# Database paths to inspect and clean
DB_PATHS = [
    os.path.join(REPO_ROOT, "data", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "database", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "data", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "database", "webtoon_episodes_cache.db"),
]

# Cache & asset directories to clean
CACHE_DIRS = [
    os.path.join(REPO_ROOT, "data", "scraped_html"),
    os.path.join(REPO_ROOT, "data", "image_cache"),
    os.path.join(REPO_ROOT, "data", "media"),
    os.path.join(REPO_ROOT, "data", "training_data"),
    os.path.join(PROJECT_ROOT, "data", "scraped_html"),
    os.path.join(PROJECT_ROOT, "data", "image_cache"),
    os.path.join(PROJECT_ROOT, "data", "media"),
    os.path.join(PROJECT_ROOT, "data", "training_data"),
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _open_db(db_path):
    conn = sqlite3.connect(db_path, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


# ─── Database ─────────────────────────────────────────────────────────────────

def clean_databases():
    """Delete database files if possible; truncate all tables if locked."""
    logger.info("Starting database cleanup across all targets...")

    unique_db_paths = list(dict.fromkeys(DB_PATHS))
    for db_path in unique_db_paths:
        if not os.path.exists(db_path):
            continue

        logger.info(f"Cleaning database: {db_path}")
        db_files = [db_path, db_path + "-wal", db_path + "-shm"]

        all_deleted = True
        for db_file in db_files:
            if os.path.exists(db_file):
                try:
                    os.remove(db_file)
                    logger.info(f"  Deleted: {db_file}")
                except Exception as e:
                    logger.warning(f"  Could not delete {db_file}: {e}")
                    all_deleted = False

        # Fallback: truncate tables when the file is locked by a running process
        if not all_deleted and os.path.exists(db_path):
            logger.info(f"  Database locked — truncating tables in {db_path}...")
            try:
                conn = _open_db(db_path)
                cursor = conn.cursor()
                cursor.execute("PRAGMA foreign_keys = OFF")
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                )
                tables = [row[0] for row in cursor.fetchall()]
                for table in tables:
                    cursor.execute(f"DELETE FROM {table}")
                    logger.info(f"    Cleared table: {table}")
                cursor.execute("PRAGMA foreign_keys = ON")
                conn.commit()
                conn.close()

                # VACUUM
                conn2 = _open_db(db_path)
                conn2.execute("VACUUM")
                conn2.close()
                logger.info(f"    Database vacuumed: {db_path}")
            except Exception as e:
                logger.error(f"  Error truncating database tables in {db_path}: {e}")


def clean_svg_fallbacks():
    """Remove scrape_sessions / panels rows containing SVG or data-URI placeholders."""
    unique_db_paths = list(dict.fromkeys(DB_PATHS))
    for db_path in unique_db_paths:
        if not os.path.exists(db_path):
            continue

        logger.info(f"Cleaning SVG/data placeholders in {db_path}...")
        try:
            conn = _open_db(db_path)
            cursor = conn.cursor()

            scrape_patterns = ["%svg%", "%data:%", "%data%%", "%25svg%", "%253A%"]
            deleted = 0
            for pattern in scrape_patterns:
                try:
                    cursor.execute(
                        "DELETE FROM scrape_sessions WHERE image_urls LIKE ?", (pattern,)
                    )
                    deleted += cursor.rowcount
                except Exception:
                    pass

            try:
                cursor.execute(
                    "DELETE FROM panels WHERE image_url LIKE '%svg%' OR image_url LIKE '%data%' "
                    "OR original_url LIKE '%svg%' OR original_url LIKE '%data%'"
                )
                deleted += cursor.rowcount
            except Exception:
                pass

            conn.commit()
            conn.close()
            if deleted > 0:
                logger.info(f"  Removed {deleted} SVG/data placeholder record(s) from {db_path}.")
        except Exception as e:
            logger.error(f"Error cleaning SVG fallbacks in {db_path}: {e}")


# ─── File caches ──────────────────────────────────────────────────────────────

def clean_cache_directories():
    unique_cache_dirs = list(dict.fromkeys(CACHE_DIRS))
    for cache_dir in unique_cache_dirs:
        logger.info(f"Cleaning directory: {cache_dir}...")
        if not os.path.exists(cache_dir):
            logger.info("  Directory does not exist.")
            continue

        for item in os.listdir(cache_dir):
            item_path = os.path.join(cache_dir, item)
            try:
                if os.path.isfile(item_path) or os.path.islink(item_path):
                    os.remove(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path, ignore_errors=True)
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
    clean_svg_fallbacks()
    clean_databases()
    clean_cache_directories()
    clean_temp_directories()
    logger.info("=== Cleanup Process Completed ===")
