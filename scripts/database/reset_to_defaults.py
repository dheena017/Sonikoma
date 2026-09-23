"""
backend/scripts/reset_to_defaults.py
─────────────────────────────────────────────────────────────────────────────
Safely resets all project data:
1. Creates a timestamped backup of the database in data/backups/.
2. Cleans temporary and generated media files (local_media, temp, media, image_cache).
3. Clears all operational tables in SQLite database.
4. Re-initializes clean schema and runs migrations.
5. Seeds the complete set of default platform settings, default series,
   chapters, storyboard panels, test accounts, and preserved admin user.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import shutil
import sqlite3
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reset_to_defaults")

SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
SCRIPTS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(REPO_ROOT, "backend"))

DATA_DIR = os.path.join(REPO_ROOT, "data")
DB_PATH = os.path.join(DATA_DIR, "webtoon_local.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")

CACHE_AND_MEDIA_DIRS = [
    os.path.join(DATA_DIR, "temp"),
    os.path.join(DATA_DIR, "local_media"),
    os.path.join(DATA_DIR, "media"),
    os.path.join(DATA_DIR, "image_cache"),
    os.path.join(DATA_DIR, "training_data"),
    os.path.join(PROJECT_ROOT, "data", "temp"),
    os.path.join(PROJECT_ROOT, "data", "local_media"),
    os.path.join(PROJECT_ROOT, "data", "media"),
    os.path.join(PROJECT_ROOT, "data", "image_cache"),
]


def backup_database():
    """Create a safe snapshot of the current database before doing any destructive operations."""
    if not os.path.exists(DB_PATH):
        logger.info(f"No existing database found at {DB_PATH} to backup.")
        return None

    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"webtoon_local_{timestamp}.db")
    try:
        shutil.copy2(DB_PATH, backup_file)
        logger.info(f" [BACKUP CREATED] Successfully backed up database to: {backup_file}")
        return backup_file
    except Exception as e:
        logger.error(f"Failed to create database backup: {e}")
        raise


def clean_media_and_caches():
    """Remove generated slices, temporary audio/video, and cached artifacts."""
    logger.info("Cleaning generated media and temporary directories...")
    cleaned_count = 0
    unique_dirs = list(dict.fromkeys(CACHE_AND_MEDIA_DIRS))

    for target_dir in unique_dirs:
        if not os.path.exists(target_dir):
            continue

        for item in os.listdir(target_dir):
            item_path = os.path.join(target_dir, item)
            # Never delete the backups folder if nested
            if item == "backups" or item == "ai_routing_config.json":
                continue
            try:
                if os.path.isfile(item_path) or os.path.islink(item_path):
                    os.remove(item_path)
                    cleaned_count += 1
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path, ignore_errors=True)
                    cleaned_count += 1
            except Exception as e:
                logger.warning(f"Could not remove {item_path}: {e}")

    logger.info(f" Cleaned {cleaned_count} generated/cached files and directories.")


def run_database_seed():
    """Seed default settings, demo webtoon series, panels, and default users."""
    logger.info("Seeding default data (series, chapters, panels, settings, users)...")
    
    # Import and run seed script
    import seed_test_data

    # First run the seed data
    seed_test_data.seed_data()

    # Clear remaining execution history tables
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        for tbl in ["jobs", "ai_token_usage_ledger", "content_moderation_logs"]:
            try:
                cursor.execute(f"DELETE FROM {tbl}")
            except Exception:
                pass
        conn.commit()
    finally:
        conn.close()

    # Ensure admin user (Dheenadayalan_R) is preserved with admin privileges
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = 'dheenadayalan017@gmail.com'")
        if not cursor.fetchone():
            logger.info("Adding default admin account (dheenadayalan017@gmail.com)...")
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, preferences, avatar_url,
                    full_name, google_id, creator_role, bio, newsletter, language, portfolio_links,
                    credits, credit_balance, last_claimed_date, unlocked_rewards, mfa_enabled,
                    social_connections, created_at, updated_at
                ) VALUES (
                    'user_cacfbef1',
                    'Dheenadayalan_R',
                    'dheenadayalan017@gmail.com',
                    '$2b$12$MI9pPwCXwr4F4sEbUTzNZe/Or.T6iRXQbu2Ka3EKyK7CqXL6WrV6m',
                    '{"theme":"dark","autoSave":true,"volume":1.0}',
                    'https://lh3.googleusercontent.com/a/default-user',
                    'Dheenadayalan R',
                    NULL,
                    'admin',
                    'Platform Administrator',
                    1, 'en', '[]', 9999, 9999, NULL, '["badge_pro_creator","badge_admin"]', 0,
                    '{"google":true,"github":true,"discord":true}',
                    datetime('now'), datetime('now')
                )
            """)
            conn.commit()
            logger.info(" Default admin account added.")

        # Reassign all series, chapters, invoices, and transactions to Dheenadayalan_R
        admin_id = "user_cacfbef1"
        cursor.execute("UPDATE series SET user_id = ?", (admin_id,))
        cursor.execute("UPDATE user_audit_logs SET user_id = ?", (admin_id,))
        cursor.execute("UPDATE user_invoices SET user_id = ?", (admin_id,))
        cursor.execute("UPDATE credit_transactions SET user_id = ?", (admin_id,))
        cursor.execute("UPDATE token_usage_logs SET user_id = ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_credentials WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_profiles WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_publications WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_sessions WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_api_keys WHERE user_id != ?", (admin_id,))
        
        # Remove all other users so only Dheenadayalan_R remains
        cursor.execute("DELETE FROM users WHERE id != ?", (admin_id,))
        cursor.execute("UPDATE users SET creator_role = 'admin' WHERE id = ?", (admin_id,))
        conn.commit()
        logger.info(" Ensured Dheenadayalan_R is the only user and admin in the system.")
    finally:
        conn.close()


def print_summary():
    """Print the final state of the database."""
    if not os.path.exists(DB_PATH):
        logger.warning("Database does not exist.")
        return

    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [r[0] for r in cursor.fetchall()]
        
        logger.info("\n" + "=" * 60)
        logger.info("📊 SONIKOMA DATABASE SUMMARY AFTER RESET TO DEFAULTS")
        logger.info("=" * 60)
        for t in sorted(tables):
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cursor.fetchone()[0]
            logger.info(f"  {t:30}: {cnt} records")
        logger.info("=" * 60)
    finally:
        conn.close()


def main():
    logger.info("==================================================================")
    logger.info("🚀 STARTING SONIKOMA DATA REMOVAL & DEFAULT RESTORATION")
    logger.info("==================================================================")

    # 1. Safe Backup
    backup_file = backup_database()

    # 2. Clean media & caches
    clean_media_and_caches()

    # 3. Seed default data & settings
    run_database_seed()

    # 4. Summary report
    print_summary()

    logger.info("\n🎉 All previous data successfully removed and default system restored!")
    if backup_file:
        logger.info(f"📁 Previous database snapshot safely preserved at:\n   {backup_file}")


if __name__ == "__main__":
    main()
