import os
import sqlite3
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("print_all_data")

SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
REPO_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))

POSSIBLE_DB_PATHS = [
    os.path.join(REPO_ROOT, "data", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "database", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "data", "webtoon_local.db"),
    os.path.join(PROJECT_ROOT, "database", "webtoon_episodes_cache.db"),
]

MAX_FIELD_LEN = 120  # truncate long field values for readability


def find_existing_db():
    for p in POSSIBLE_DB_PATHS:
        if os.path.exists(p):
            return p
    return POSSIBLE_DB_PATHS[0]


DB_PATH = find_existing_db()


def _open_db(db_path=None):
    target_path = db_path or DB_PATH
    if not os.path.exists(target_path):
        logger.error(f"Database file does not exist: {target_path}")
        return None
    conn = sqlite3.connect(target_path, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def get_existing_tables(db_path):
    conn = _open_db(db_path)
    if not conn:
        return set()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return {row[0] for row in cursor.fetchall()}
    except Exception:
        return set()
    finally:
        conn.close()


def print_table_data(table_name, title, query, params=(), is_json_fields=None, is_masked_fields=None, db_path=None, existing_tables=None):
    if existing_tables and table_name not in existing_tables:
        return

    if is_json_fields is None:
        is_json_fields = []
    if is_masked_fields is None:
        is_masked_fields = []

    logger.info("=" * 80)
    logger.info(f"📋 {title.upper()}")
    logger.info("=" * 80)

    conn = _open_db(db_path)
    if conn is None:
        return

    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

        if not rows:
            logger.info("No records found.\n")
            return

        for i, row in enumerate(rows):
            logger.info(f"--- Record #{i + 1} ---")
            row_dict = dict(row)
            for k, v in row_dict.items():
                if k in is_masked_fields and v:
                    v = "***"
                elif k in is_json_fields and v:
                    try:
                        parsed = json.loads(v)
                        v = json.dumps(parsed, ensure_ascii=False)
                    except Exception:
                        pass
                v_str = str(v) if v is not None else "NULL"
                if len(v_str) > MAX_FIELD_LEN:
                    v_str = v_str[:MAX_FIELD_LEN] + "…"
                logger.info(f"  {k:22}: {v_str}")
            logger.info("")
    except Exception as e:
        logger.error(f"Error querying database: {e}")
    finally:
        conn.close()


def print_summary(db_path=None):
    """Print row counts for every table in the database."""
    conn = _open_db(db_path)
    if conn is None:
        return

    target = db_path or DB_PATH
    logger.info("=" * 80)
    logger.info(f"📊 TABLE ROW COUNTS ({target})")
    logger.info("=" * 80)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            logger.info(f"  {table:30}: {count} row(s)")
    except Exception as e:
        logger.error(f"Error getting table counts: {e}")
    finally:
        conn.close()
    logger.info("")


def main():
    unique_dbs = [p for p in dict.fromkeys(POSSIBLE_DB_PATHS) if os.path.exists(p)]
    if not unique_dbs:
        unique_dbs = [POSSIBLE_DB_PATHS[0]]

    logger.info("=" * 80)
    logger.info("🔍 PRINTING ALL SONIKOMA DATABASE DATA")
    logger.info("=" * 80)
    logger.info(f"   Target DBs found: {unique_dbs}\n")

    for target_db in unique_dbs:
        logger.info(f"\n>>>>>>>> DATABASE TARGET: {target_db} <<<<<<<<\n")
        print_summary(target_db)
        existing_tables = get_existing_tables(target_db)

        print_table_data(
            "users",
            "Users",
            "SELECT * FROM users",
            is_json_fields=["preferences", "portfolio_links", "unlocked_rewards", "social_connections"],
            is_masked_fields=["password_hash"],
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data("series", "Series", "SELECT * FROM series", db_path=target_db, existing_tables=existing_tables)

        print_table_data(
            "chapters",
            "Chapters",
            "SELECT * FROM chapters",
            is_json_fields=["audio_settings"],
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data(
            "panels",
            "Panels",
            "SELECT * FROM panels ORDER BY chapter_id, panel_index",
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data(
            "scrape_sessions",
            "Scrape Sessions Cache",
            "SELECT id, url, panel_count, scraped_at, SUBSTR(image_urls, 1, 200) AS image_urls_preview FROM scrape_sessions ORDER BY scraped_at DESC",
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data("edit_history", "Edit History", "SELECT * FROM edit_history ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("user_sessions", "User Sessions", "SELECT * FROM user_sessions ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("user_audit_logs", "Audit Logs", "SELECT * FROM user_audit_logs ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("user_invoices", "Invoices", "SELECT * FROM user_invoices ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("user_api_keys", "Developer API Keys", "SELECT * FROM user_api_keys", is_masked_fields=["api_key"], db_path=target_db, existing_tables=existing_tables)

        print_table_data("credit_transactions", "Credit Transactions", "SELECT * FROM credit_transactions ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("token_usage_logs", "Token Usage Logs", "SELECT * FROM token_usage_logs ORDER BY created_at DESC LIMIT 50", db_path=target_db, existing_tables=existing_tables)

        print_table_data("system_announcements", "System Announcements", "SELECT * FROM system_announcements ORDER BY created_at DESC", db_path=target_db, existing_tables=existing_tables)

        print_table_data("platform_settings", "Platform Settings", "SELECT * FROM platform_settings", db_path=target_db, existing_tables=existing_tables)

        print_table_data("youtube_profiles", "YouTube Profiles", "SELECT * FROM youtube_profiles", is_json_fields=["tags"], db_path=target_db, existing_tables=existing_tables)

        print_table_data(
            "youtube_publications",
            "YouTube Publications",
            "SELECT * FROM youtube_publications ORDER BY published_at DESC",
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data(
            "youtube_credentials",
            "YouTube Credentials",
            "SELECT user_id, client_id, client_secret, project_id, updated_at FROM youtube_credentials",
            is_masked_fields=["client_secret"],
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data(
            "system_logs",
            "System Logs",
            "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100",
            is_json_fields=["details"],
            db_path=target_db,
            existing_tables=existing_tables,
        )

        print_table_data("episode_cache", "Episode Cache", "SELECT * FROM episode_cache", is_json_fields=["episodes_json", "series_metadata"], db_path=target_db, existing_tables=existing_tables)

    print_training_data_summary()


def print_training_data_summary():
    training_dirs = [
        os.path.join(REPO_ROOT, "data", "training_data"),
        os.path.join(PROJECT_ROOT, "data", "training_data"),
    ]
    logger.info("=" * 80)
    logger.info("📂 LOCAL TRAINING DATA SAMPLES (DATA FLYWHEEL)")
    logger.info("=" * 80)
    import glob
    found = False
    for training_dir in dict.fromkeys(training_dirs):
        if os.path.exists(training_dir):
            found = True
            orig_files = glob.glob(os.path.join(training_dir, "original_*.*"))
            mask_files = glob.glob(os.path.join(training_dir, "mask_*.*"))
            logger.info(f"  Training Directory: {training_dir}")
            logger.info(f"  Total Original Panels: {len(orig_files)}")
            logger.info(f"  Total Segment Masks:   {len(mask_files)}")
            if orig_files:
                logger.info("  Saved Sample Pairs:")
                for f in sorted(orig_files)[:10]:
                    filename = os.path.basename(f)
                    pair_id = filename.replace("original_", "").split(".")[0]
                    logger.info(f"    - Pair ID: {pair_id} ({filename})")
                if len(orig_files) > 10:
                    logger.info(f"    ... and {len(orig_files) - 10} more samples")
    if not found:
        logger.info("  Training Directory does not exist.")
    logger.info("")


if __name__ == "__main__":
    main()
