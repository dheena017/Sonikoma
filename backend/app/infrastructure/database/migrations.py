"""
infrastructure/database/migrations.py
─────────────────────────────────────────────────────────────────────────────
Schema initialisation and incremental migration runner.

Provides:
  - init_db()                          – idempotent schema bootstrap
  - _should_skip_system_log_persistence() – guard used by the log handler
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import sqlite3
import threading

import infrastructure.database.config as config
from infrastructure.database.engine import _create_db_connection
from infrastructure.database.transaction import generate_missing_slugs

logger = logging.getLogger("sonikoma.database.migrations")

# ── Initialisation state ──────────────────────────────────────────────────

_db_initialized: bool = False
_db_init_lock = threading.Lock()
_db_init_in_progress: bool = False
_db_init_complete = threading.Event()
_system_log_persist_in_progress: bool = False


def _should_skip_system_log_persistence() -> bool:
    return _db_init_in_progress or (
        not _db_init_complete.is_set() and not _db_initialized
    )


# ── PostgreSQL initialisation ─────────────────────────────────────────────


def _init_postgres(conn) -> None:
    """Apply the Postgres schema and incremental table migrations."""
    try:
        row = conn.execute(
            "SELECT EXISTS ("
            "  SELECT FROM information_schema.tables"
            "  WHERE table_schema = 'public' AND table_name = 'users'"
            ") as exists"
        ).fetchone()
        if not row or not row.get("exists"):
            logger.info("[Database] Initializing PostgreSQL schema...")
            if os.path.exists(config.SCHEMA_PG_PATH):
                with open(config.SCHEMA_PG_PATH, "r", encoding="utf-8") as f:
                    schema = f.read()
                conn.executescript(schema)
                conn.commit()
                logger.info("[Database] PostgreSQL schema applied successfully.")
            else:
                logger.warning("[Database] schema_postgres.sql not found.")
        else:
            logger.info("[Database] Relational database schema is already initialized.")

        # YouTube tables
        row_yt = conn.execute(
            "SELECT EXISTS ("
            "  SELECT FROM information_schema.tables"
            "  WHERE table_schema = 'public' AND table_name = 'youtube_profiles'"
            ") as exists"
        ).fetchone()
        if not row_yt or not row_yt.get("exists"):
            logger.info("[Database] Initializing PostgreSQL YouTube schema...")
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS youtube_profiles (
              id                  SERIAL PRIMARY KEY,
              user_id             TEXT    NOT NULL,
              name                TEXT    NOT NULL,
              title_template      TEXT    NOT NULL,
              description_template TEXT   NOT NULL,
              tags                TEXT    NOT NULL,
              category_id         TEXT    NOT NULL DEFAULT '1',
              privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
              is_short            INTEGER NOT NULL DEFAULT 0,
              made_for_kids       TEXT    NOT NULL DEFAULT 'no',
              paid_promotion      INTEGER NOT NULL DEFAULT 0,
              license             TEXT    NOT NULL DEFAULT 'youtube',
              video_language      TEXT    NOT NULL DEFAULT 'en',
              channel_link        TEXT,
              discord_link        TEXT,
              patreon_link        TEXT,
              created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              UNIQUE(user_id, name)
            );
            CREATE TABLE IF NOT EXISTS youtube_publications (
              id                  SERIAL PRIMARY KEY,
              user_id             TEXT    NOT NULL,
              chapter_id          TEXT,
              youtube_url         TEXT    NOT NULL,
              title               TEXT    NOT NULL,
              privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
              published_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
            );
            CREATE INDEX IF NOT EXISTS idx_youtube_profiles_user ON youtube_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_youtube_publications_user ON youtube_publications(user_id);
            """)
            conn.commit()
            logger.info("[Database] PostgreSQL YouTube schema applied successfully.")

        # YouTube credentials
        row_creds = conn.execute(
            "SELECT EXISTS ("
            "  SELECT FROM information_schema.tables"
            "  WHERE table_schema = 'public' AND table_name = 'youtube_credentials'"
            ") as exists"
        ).fetchone()
        if not row_creds or not row_creds.get("exists"):
            logger.info("[Database] Initializing PostgreSQL YouTube credentials schema...")
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS youtube_credentials (
              user_id             TEXT    PRIMARY KEY,
              client_id           TEXT    NOT NULL,
              client_secret       TEXT    NOT NULL,
              project_id          TEXT    NOT NULL,
              updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            conn.commit()

        # credit_transactions
        row_tx = conn.execute(
            "SELECT EXISTS ("
            "  SELECT FROM information_schema.tables"
            "  WHERE table_schema = 'public' AND table_name = 'credit_transactions'"
            ") as exists"
        ).fetchone()
        if not row_tx or not row_tx.get("exists"):
            logger.info("[Database] Initializing PostgreSQL credit_transactions schema...")
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS credit_transactions (
              id              TEXT PRIMARY KEY,
              user_id         TEXT NOT NULL,
              amount          INTEGER NOT NULL,
              feature_name    TEXT NOT NULL,
              created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
            """)
            conn.commit()

        # credit_balance column on users
        row_col = conn.execute(
            "SELECT EXISTS ("
            "  SELECT FROM information_schema.columns"
            "  WHERE table_schema = 'public'"
            "    AND table_name = 'users'"
            "    AND column_name = 'credit_balance'"
            ") as exists"
        ).fetchone()
        if not row_col or not row_col.get("exists"):
            logger.info(
                "[Database] Migration: adding 'credit_balance' column to 'users' table..."
            )
            conn.execute(
                "ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840"
            )
            conn.commit()

    except Exception as e:
        logger.error(f"[Database] Error checking PostgreSQL schema: {e}")
    finally:
        conn.close()


# ── SQLite initialisation ─────────────────────────────────────────────────


def _init_sqlite(conn) -> None:
    """Apply the SQLite schema and incremental column/table migrations."""
    try:
        cursor = conn.cursor()

        # ── Detect old flat schema and drop if necessary ──────────────────
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        users_table_exists = cursor.fetchone() is not None

        if users_table_exists:
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]
            if "username" not in columns:
                logger.info(
                    "[Database] Old schema detected (missing 'username'). "
                    "Dropping old tables for clean relational upgrade..."
                )
                tables = [
                    "panels", "projects", "user_sessions", "user_audit_logs",
                    "user_invoices", "user_api_keys", "users", "series",
                    "chapters", "scrape_sessions", "edit_history",
                ]
                for table in tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                conn.commit()
                users_table_exists = False

        # ── Apply base schema if tables are missing ───────────────────────
        if not users_table_exists:
            schema_file = config.SCHEMA_PATH if os.path.exists(config.SCHEMA_PATH) else "/app/schema_backup.sql"
            if not os.path.exists(schema_file):
                schema_file = os.path.join(
                    os.path.dirname(__file__), "..", "..", "database", "schema.sql"
                )
            if os.path.exists(schema_file):
                logger.info(f"[Database] Re-initializing schema from {schema_file}...")
                with open(schema_file, "r", encoding="utf-8") as f:
                    schema = f.read()
                conn.executescript(schema)
                logger.info("[Database] Relational schema applied successfully.")
            else:
                logger.warning("[Database] schema.sql not found — skipping schema apply.")
        else:
            logger.info("[Database] Relational database schema is already initialized.")

        # ── Column migrations ─────────────────────────────────────────────
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN synopsis TEXT",
                        "added 'synopsis' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN slug TEXT",
                        "added 'slug' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN slug TEXT",
                        "added 'slug' to 'chapters'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE chapters ADD COLUMN total_tokens_used INTEGER NOT NULL DEFAULT 0",
                        "added 'total_tokens_used' to 'chapters'")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN audio_settings TEXT",
                        "added 'audio_settings' to 'chapters'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE users ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0",
                        "added 'is_locked' to 'users'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE series ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0",
                        "added 'is_flagged' to 'series'")

        # ── Slug indexes ──────────────────────────────────────────────────
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug ON series(slug)")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug)")
            conn.commit()
        except Exception:
            pass

        # ── Backfill missing slugs ────────────────────────────────────────
        generate_missing_slugs(conn)

        # ── token_usage_logs table ────────────────────────────────────────
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_usage_logs (
              id                  TEXT PRIMARY KEY,
              project_id          TEXT NOT NULL,
              input_tokens        INTEGER NOT NULL DEFAULT 0,
              output_tokens       INTEGER NOT NULL DEFAULT 0,
              total_tokens        INTEGER NOT NULL DEFAULT 0,
              estimated_cost_usd  REAL NOT NULL,
              created_at          TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """)
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at)"
            )
            conn.commit()
            logger.info("[Database] Migration: verified token_usage_logs table.")
        except Exception:
            logger.error("[Database] Failed to verify token_usage_logs table.")

        # ── YouTube tables ────────────────────────────────────────────────
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS youtube_profiles (
              id                  INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id             TEXT    NOT NULL,
              name                TEXT    NOT NULL,
              title_template      TEXT    NOT NULL,
              description_template TEXT   NOT NULL,
              tags                TEXT    NOT NULL,
              category_id         TEXT    NOT NULL DEFAULT '1',
              privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
              is_short            INTEGER NOT NULL DEFAULT 0,
              made_for_kids       TEXT    NOT NULL DEFAULT 'no',
              paid_promotion      INTEGER NOT NULL DEFAULT 0,
              license             TEXT    NOT NULL DEFAULT 'youtube',
              video_language      TEXT    NOT NULL DEFAULT 'en',
              channel_link        TEXT,
              discord_link        TEXT,
              patreon_link        TEXT,
              created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              UNIQUE(user_id, name)
            )""")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS youtube_publications (
              id                  INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id             TEXT    NOT NULL,
              chapter_id          TEXT,
              youtube_url         TEXT    NOT NULL,
              title               TEXT    NOT NULL,
              privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
              published_at        TEXT    NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
            )""")
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_youtube_profiles_user ON youtube_profiles(user_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_youtube_publications_user ON youtube_publications(user_id)"
            )
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS youtube_credentials (
              user_id             TEXT    PRIMARY KEY,
              client_id           TEXT    NOT NULL,
              client_secret       TEXT    NOT NULL,
              project_id          TEXT    NOT NULL,
              updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )""")
            logger.info("[Database] SQLite YouTube tables and credentials checked.")
        except Exception as e:
            logger.error(f"[Database] Error checking SQLite YouTube schema: {e}")

        # ── platform_settings table ───────────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS platform_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # ── system_logs table ─────────────────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
          id                  INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp           TEXT NOT NULL,
          message             TEXT NOT NULL,
          level               TEXT NOT NULL,
          module              TEXT NOT NULL,
          details             TEXT,
          correlation_id      TEXT,
          user_id             TEXT,
          snapshot            TEXT,
          created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """)
        for col in ("correlation_id TEXT", "user_id TEXT", "snapshot TEXT"):
            try:
                cursor.execute(f"ALTER TABLE system_logs ADD COLUMN {col}")
            except Exception:
                pass

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)"
        )

        # ── Default platform settings ─────────────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM platform_settings")
        if cursor.fetchone()[0] == 0:
            defaults = [
                ("maintenance_mode", "false"),
                ("disable_signups", "false"),
                ("global_banner", ""),
                ("enable_beta", "false"),
                ("max_upload_size_mb", "50"),
                ("max_scenes_per_project", "100"),
                ("default_starting_credits", "200"),
                ("smtp_host", "smtp.mailgun.org"),
                ("smtp_port", "587"),
                ("smtp_user", ""),
                ("enforce_2fa", "false"),
                ("strict_ip_binding", "false"),
                ("session_timeout_min", "120"),
                ("webhook_url", "https://api.sonikoma.com/webhooks"),
                ("log_retention_days", "7"),
                ("log_max_entries", "5000"),
            ]
            cursor.executemany(
                "INSERT INTO platform_settings (key, value) VALUES (?, ?)", defaults
            )

        # ── credit_balance column on users ────────────────────────────────
        _run_safe_alter(
            cursor, conn,
            "ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840",
            "added 'credit_balance' to 'users'",
        )
        try:
            cursor.execute(
                "UPDATE users SET credit_balance = credits "
                "WHERE credit_balance = 840 AND credits != 840"
            )
        except Exception:
            pass

        # ── credit_transactions table ─────────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id              TEXT PRIMARY KEY,
          user_id         TEXT NOT NULL,
          amount          INTEGER NOT NULL,
          feature_name    TEXT NOT NULL,
          created_at      TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_credit_transactions_user "
            "ON credit_transactions(user_id)"
        )
        logger.info("[Database] Migration: verified credit_transactions table.")

        conn.commit()

    except sqlite3.Error as e:
        logger.error(f"[Database] Error checking or applying schema: {e}")
        with _db_init_lock:
            _db_init_in_progress = False
            _db_init_complete.set()
        raise
    finally:
        conn.close()


# ── Shared helper ─────────────────────────────────────────────────────────


def _run_safe_alter(cursor, conn, sql: str, description: str) -> None:
    """Execute an ALTER TABLE statement, silently ignoring already-exists errors."""
    try:
        cursor.execute(sql)
        conn.commit()
        logger.info(f"[Database] Migration: {description}.")
    except Exception:
        pass  # column/index already exists


# ── Public entry point ────────────────────────────────────────────────────


def init_db() -> None:
    """Idempotent schema bootstrap. Thread-safe; safe to call from multiple
    workers simultaneously."""
    global _db_initialized, _db_init_in_progress

    if _db_initialized:
        return

    with _db_init_lock:
        if _db_initialized:
            return
        if _db_init_in_progress:
            wait_for_init = True
        else:
            _db_init_in_progress = True
            _db_init_complete.clear()
            wait_for_init = False

    if wait_for_init:
        _db_init_complete.wait(timeout=60)
        return

    if config.is_postgres:
        logger.info("[Database] Connecting to PostgreSQL (Supabase)...")
        conn = _create_db_connection()
        _init_postgres(conn)
        logger.info("[Database] PostgreSQL ready [OK]")
    else:
        logger.info(f"[Database] Opening local SQLite database at: {config.DB_PATH}")
        os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
        os.makedirs(config.DB_DIR, exist_ok=True)
        conn = _create_db_connection()
        _init_sqlite(conn)
        logger.info("[Database] SQLite database ready [OK]")

    with _db_init_lock:
        _db_initialized = True
        _db_init_in_progress = False
        _db_init_complete.set()
