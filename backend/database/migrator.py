"""
backend/database/migrator.py
─────────────────────────────────────────────────────────────────────────────
Schema initialisation and incremental migration runner for SQLite.
Ensures the canonical schema is applied and provides idempotent, safe column
alterations and data backfills for pre-existing databases.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import os
import sqlite3

from database import config
from database.utils import generate_missing_slugs

logger = logging.getLogger("sonikoma.database.migrator")


def init_sqlite(conn: sqlite3.Connection) -> None:
    """Apply the canonical SQLite schema and incremental column migrations."""
    try:
        cursor = conn.cursor()

        # ── 1. Apply canonical schema (idempotent CREATE TABLE / INDEX IF NOT EXISTS) ──
        schema_file = config.SCHEMA_PATH if os.path.exists(config.SCHEMA_PATH) else os.path.join(
            os.path.dirname(__file__), "schema.sql"
        )
        if os.path.exists(schema_file):
            logger.info(f"[Database] Verifying canonical schema from {schema_file}...")
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            conn.executescript(schema_sql)
            logger.info("[Database] Canonical schema verified.")
        else:
            logger.warning(f"[Database] Schema file {schema_file} not found; skipping schema apply.")

        # ── 2. Safe incremental column migrations (for pre-existing databases) ──
        # Series
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN synopsis TEXT", "added synopsis to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN slug TEXT", "added slug to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN status TEXT NOT NULL DEFAULT 'ready'", "added status to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0", "added is_flagged to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flag_reason TEXT", "added flag_reason to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flagged_by TEXT", "added flagged_by to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flagged_at TEXT", "added flagged_at to series")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN updated_at TEXT", "added updated_at to series")

        # Chapters
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN slug TEXT", "added slug to chapters")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN job_id TEXT", "added job_id to chapters")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN total_tokens_used INTEGER NOT NULL DEFAULT 0", "added total_tokens_used to chapters")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN audio_settings TEXT", "added audio_settings to chapters")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN project_type TEXT NOT NULL DEFAULT 'permanent'", "added project_type to chapters")

        # Panels
        _run_safe_alter(cursor, conn, "ALTER TABLE panels ADD COLUMN narrative TEXT", "added narrative to panels")

        # Users
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0", "added is_locked to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0", "added is_banned to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN ban_reason TEXT", "added ban_reason to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN last_login_at TEXT", "added last_login_at to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN last_login_ip TEXT", "added last_login_ip to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT ''", "added location to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN website TEXT NOT NULL DEFAULT ''", "added website to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'", "added timezone to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840", "added credit_balance to users")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN google_access_token TEXT", "added google_access_token to users")

        # Synchronize credit balance
        try:
            cursor.execute(
                "UPDATE users SET credit_balance = credits WHERE credit_balance = 840 AND credits != 840"
            )
        except Exception:
            pass

        # Scraper rules
        _run_safe_alter(cursor, conn, "ALTER TABLE scraper_rules ADD COLUMN engine_strategy TEXT DEFAULT 'auto'", "added engine_strategy to scraper_rules")
        _run_safe_alter(cursor, conn, "ALTER TABLE scraper_rules ADD COLUMN timeout_sec INTEGER DEFAULT 30", "added timeout_sec to scraper_rules")
        _run_safe_alter(cursor, conn, "ALTER TABLE scraper_rules ADD COLUMN max_concurrency INTEGER DEFAULT 2", "added max_concurrency to scraper_rules")
        _run_safe_alter(cursor, conn, "ALTER TABLE scraper_rules ADD COLUMN retry_attempts INTEGER DEFAULT 2", "added retry_attempts to scraper_rules")
        _run_safe_alter(cursor, conn, "ALTER TABLE scraper_rules ADD COLUMN notes TEXT DEFAULT ''", "added notes to scraper_rules")

        # Token usage logs
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN user_id TEXT", "added user_id to token_usage_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN chapter_id TEXT", "added chapter_id to token_usage_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN job_id TEXT", "added job_id to token_usage_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN model_name TEXT", "added model_name to token_usage_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN provider TEXT", "added provider to token_usage_logs")

        # System logs
        _run_safe_alter(cursor, conn, "ALTER TABLE system_logs ADD COLUMN correlation_id TEXT", "added correlation_id to system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE system_logs ADD COLUMN user_id TEXT", "added user_id to system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE system_logs ADD COLUMN snapshot TEXT", "added snapshot to system_logs")

        # YouTube OAuth tokens
        _run_safe_alter(cursor, conn, "ALTER TABLE youtube_oauth_tokens ADD COLUMN google_email TEXT", "added google_email to youtube_oauth_tokens")

        # ── 3. Prune dead legacy tables ──
        for dead_table in [
            "franchise_continuity",
            "generation_feedback",
            "creator_style_profiles",
            "user_unlinked_youtube_channels",
            "edit_history",
        ]:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {dead_table}")
            except Exception:
                pass

        # ── 4. Normalize legacy date formats to standard ISO 8601 UTC ──
        _normalize_legacy_dates(cursor, conn)

        # ── 5. Backfill missing slugs ──
        generate_missing_slugs(conn)

        conn.commit()
        logger.info("[Database] Database schema verification and migrations completed successfully.")

    except sqlite3.Error as e:
        logger.error(f"[Database] Error checking or applying schema: {e}")
        raise


def _run_safe_alter(cursor: sqlite3.Cursor, conn: sqlite3.Connection, sql: str, description: str) -> None:
    """Execute an ALTER TABLE statement, silently ignoring already-exists errors."""
    try:
        cursor.execute(sql)
        conn.commit()
    except Exception:
        pass  # Column already exists or table structure is up to date


def _normalize_legacy_dates(cursor: sqlite3.Cursor, conn: sqlite3.Connection) -> None:
    """Normalize non-standard date strings across tables to standard ISO 8601 UTC."""
    date_columns_map = {
        "series": ["created_at", "updated_at", "flagged_at"],
        "chapters": ["created_at", "updated_at"],
        "panels": ["created_at"],
        "credit_transactions": ["created_at"],
        "user_audit_logs": ["created_at"],
        "user_invoices": ["created_at"],
        "platform_settings": ["updated_at"],
        "user_youtube_channels": ["created_at", "updated_at"],
        "youtube_oauth_tokens": ["updated_at"],
        "users": ["created_at", "updated_at", "last_login_at"],
        "scrape_sessions": ["scraped_at"],
        "token_usage_logs": ["created_at"],
    }
    for tbl, cols in date_columns_map.items():
        try:
            existing_cols = [c[1] for c in cursor.execute(f'PRAGMA table_info("{tbl}")').fetchall()]
            for col in cols:
                if col in existing_cols:
                    cursor.execute(
                        f'UPDATE "{tbl}" SET "{col}" = strftime(\'%Y-%m-%dT%H:%M:%SZ\', "{col}") WHERE "{col}" IS NOT NULL AND "{col}" LIKE \'% %\''
                    )
        except Exception:
            pass
    try:
        cursor.execute(
            "UPDATE series_chapters_cache SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', datetime(updated_at, 'unixepoch')) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%-%'"
        )
    except Exception:
        pass
    conn.commit()

