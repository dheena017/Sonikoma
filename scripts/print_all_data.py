import os
import sqlite3
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("print_all_data")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "backend", "database", "webtoon_local.db")

MAX_FIELD_LEN = 120  # truncate long field values for readability


def _open_db():
    if not os.path.exists(DB_PATH):
        logger.error("Database file does not exist.")
        return None
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def print_table_data(title, query, params=(), is_json_fields=None, is_masked_fields=None):
    if is_json_fields is None:
        is_json_fields = []
    if is_masked_fields is None:
        is_masked_fields = []

    logger.info("=" * 80)
    logger.info(f"📋 {title.upper()}")
    logger.info("=" * 80)

    conn = _open_db()
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


def print_summary():
    """Print row counts for every table in the database."""
    conn = _open_db()
    if conn is None:
        return

    logger.info("=" * 80)
    logger.info("📊 TABLE ROW COUNTS")
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
    logger.info("=" * 80)
    logger.info("🔍 PRINTING ALL SONIKOMA DATABASE DATA")
    logger.info("=" * 80)
    logger.info(f"   DB: {DB_PATH}\n")

    print_summary()

    print_table_data(
        "Users",
        "SELECT * FROM users",
        is_json_fields=["preferences", "portfolio_links", "unlocked_rewards", "social_connections"],
    )

    print_table_data("Series", "SELECT * FROM series")

    print_table_data("Chapters", "SELECT * FROM chapters")

    print_table_data(
        "Panels",
        "SELECT * FROM panels ORDER BY chapter_id, panel_index",
    )

    print_table_data(
        "Scrape Sessions Cache",
        "SELECT id, url, panel_count, scraped_at, SUBSTR(image_urls, 1, 200) AS image_urls_preview FROM scrape_sessions ORDER BY scraped_at DESC",
    )

    print_table_data("Edit History", "SELECT * FROM edit_history ORDER BY created_at DESC")

    print_table_data("User Sessions", "SELECT * FROM user_sessions ORDER BY created_at DESC")

    print_table_data("Audit Logs", "SELECT * FROM user_audit_logs ORDER BY created_at DESC")

    print_table_data("Invoices", "SELECT * FROM user_invoices ORDER BY created_at DESC")

    print_table_data("Developer API Keys", "SELECT * FROM user_api_keys", is_masked_fields=["api_key"])

    print_table_data("Credit Transactions", "SELECT * FROM credit_transactions ORDER BY created_at DESC")

    print_table_data("Token Usage Logs", "SELECT * FROM token_usage_logs ORDER BY created_at DESC LIMIT 50")

    print_table_data("System Announcements", "SELECT * FROM system_announcements ORDER BY created_at DESC")

    print_table_data("Platform Settings", "SELECT * FROM platform_settings")

    print_table_data("YouTube Profiles", "SELECT * FROM youtube_profiles")

    print_table_data(
        "YouTube Publications",
        "SELECT * FROM youtube_publications ORDER BY published_at DESC",
    )

    # youtube_credentials — query correct columns and mask the client_secret
    print_table_data(
        "YouTube Credentials",
        "SELECT user_id, client_id, client_secret, project_id, updated_at FROM youtube_credentials",
        is_masked_fields=["client_secret"],
    )

    print_table_data(
        "System Logs",
        "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100",
    )


if __name__ == "__main__":
    main()
