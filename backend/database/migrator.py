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

LEGACY_TABLE_MIGRATIONS = (
    ("users", "auth_users"),
    ("user_sessions", "auth_sessions"),
    ("user_audit_logs", "auth_audit_logs"),
    ("platform_settings", "admin_settings"),
    ("system_announcements", "admin_announcements"),
    ("content_moderation_logs", "admin_moderation_logs"),
    ("series", "platform_series"),
    ("chapters", "workspace_chapters"),
    ("panels", "image_panels"),
    ("edit_history", "image_edit_history"),
    ("user_youtube_channels", "creative_youtube_channels"),
    ("user_unlinked_youtube_channels", "creative_youtube_unlinked_channels"),
    ("youtube_oauth_tokens", "creative_youtube_tokens"),
    ("youtube_profiles", "creative_youtube_profiles"),
    ("youtube_publications", "creative_youtube_publications"),
    ("youtube_credentials", "creative_youtube_credentials"),
    ("creator_style_profiles", "creative_style_profiles"),
    ("jobs", "platform_jobs"),
    ("scrape_sessions", "platform_scrape_sessions"),
    ("series_chapters_cache", "platform_series_cache"),
    ("series_episodes_cache", "platform_series_cache"),
    ("system_logs", "platform_system_logs"),
    ("user_api_keys", "profile_api_keys"),
    ("user_invoices", "profile_invoices"),
    ("credit_transactions", "profile_credit_transactions"),
    ("ai_series_projects", "intelligence_projects"),
    ("series_continuity_memory", "intelligence_continuity_memory"),
    ("franchise_continuity", "intelligence_continuity_memory"),
    ("series_feedback_events", "intelligence_feedback_events"),
    ("generation_feedback", "intelligence_feedback_events"),
    ("token_usage_logs", "intelligence_token_usage"),
    ("ai_token_usage_ledger", "intelligence_ledger"),
)

LEGACY_COLUMN_MAPPINGS = {
    ("user_api_keys", "profile_api_keys"): {"id": None},
    ("series_feedback_events", "intelligence_feedback_events"): {"id": "feedback_id"},
    ("generation_feedback", "intelligence_feedback_events"): {"id": "feedback_id"},
    ("ai_token_usage_ledger", "intelligence_ledger"): {"id": "request_id"},
}


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

        # ── 2. Add columns introduced after earlier canonical schema versions ──
        _run_safe_alter(cursor, conn, "ALTER TABLE platform_system_logs ADD COLUMN timestamp TEXT", "added timestamp to platform_system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE platform_system_logs ADD COLUMN correlation_id TEXT", "added correlation_id to platform_system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE platform_system_logs ADD COLUMN user_id TEXT", "added user_id to platform_system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE platform_system_logs ADD COLUMN snapshot TEXT", "added snapshot to platform_system_logs")
        _run_safe_alter(cursor, conn, "ALTER TABLE creative_youtube_tokens ADD COLUMN google_email TEXT", "added google_email to creative_youtube_tokens")
        _run_safe_alter(cursor, conn, "ALTER TABLE intelligence_feedback_events ADD COLUMN feedback_id TEXT", "added feedback_id to intelligence_feedback_events")
        _run_safe_alter(cursor, conn, "ALTER TABLE intelligence_ledger ADD COLUMN request_id TEXT", "added request_id to intelligence_ledger")

        # ── 3. Copy legacy tables without deleting their source data ──
        _migrate_legacy_tables(cursor, conn)

        # ── 4. Normalize legacy date formats to standard ISO 8601 UTC ──
        _normalize_legacy_dates(cursor, conn)

        # ── 5. Backfill missing slugs ──
        generate_missing_slugs(conn)

        conn.commit()
        logger.info("[Database] Database schema verification and migrations completed successfully.")

    except sqlite3.Error as e:
        conn.rollback()
        logger.error(f"[Database] Error checking or applying schema: {e}")
        raise


def _migrate_legacy_tables(cursor: sqlite3.Cursor, conn: sqlite3.Connection) -> None:
    """Copy legacy table rows into canonical tables, keeping sources for rollback."""
    table_names = {
        row[0]
        for row in cursor.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
    }
    for source, target in LEGACY_TABLE_MIGRATIONS:
        if source not in table_names or target not in table_names:
            continue

        source_columns = {
            row[1]
            for row in cursor.execute(f'PRAGMA table_info("{source}")').fetchall()
        }
        target_info = {
            row[1]: row
            for row in cursor.execute(f'PRAGMA table_info("{target}")').fetchall()
        }
        target_columns = set(target_info)
        explicit_mappings = LEGACY_COLUMN_MAPPINGS.get((source, target), {})
        column_pairs = []
        consumed_source_columns = set()
        consumed_target_columns = set()

        for source_column, target_column in explicit_mappings.items():
            consumed_source_columns.add(source_column)
            if target_column and source_column in source_columns and target_column in target_columns:
                column_pairs.append((source_column, target_column))
                consumed_target_columns.add(target_column)

        for column in sorted(source_columns & target_columns):
            if column not in consumed_source_columns and column not in consumed_target_columns:
                column_pairs.append((column, column))

        if not column_pairs:
            logger.warning("[Database] No shared columns to migrate from %s to %s.", source, target)
            continue

        target_sql_columns = ", ".join(f'"{target_column}"' for _, target_column in column_pairs)
        source_sql_columns = ", ".join(
            f'COALESCE("{source_column}", {target_info[target_column][4]})'
            if target_info[target_column][3] and target_info[target_column][4] is not None
            else f'"{source_column}"'
            for source_column, target_column in column_pairs
        )
        cursor.execute(
            f'INSERT OR IGNORE INTO "{target}" ({target_sql_columns}) '
            f'SELECT {source_sql_columns} FROM "{source}"'
        )
        if cursor.rowcount:
            logger.info(
                "[Database] Copied %s rows from legacy table %s to %s.",
                cursor.rowcount,
                source,
                target,
            )
    conn.commit()


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
        "platform_series": ["created_at", "updated_at", "flagged_at"],
        "workspace_chapters": ["created_at", "updated_at"],
        "image_panels": ["created_at"],
        "profile_credit_transactions": ["created_at"],
        "auth_audit_logs": ["created_at"],
        "profile_invoices": ["created_at"],
        "admin_settings": ["updated_at"],
        "creative_youtube_channels": ["created_at", "updated_at"],
        "creative_youtube_tokens": ["updated_at"],
        "auth_users": ["created_at", "updated_at", "last_login_at"],
        "platform_scrape_sessions": ["scraped_at"],
        "intelligence_token_usage": ["created_at"],
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
            "UPDATE platform_series_cache SET updated_at = CAST(strftime('%s', updated_at) AS REAL) "
            "WHERE updated_at IS NOT NULL AND CAST(updated_at AS REAL) = 0 AND strftime('%s', updated_at) IS NOT NULL"
        )
    except Exception:
        pass
    conn.commit()

