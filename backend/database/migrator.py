"""
backend/app/database/migrator.py
─────────────────────────────────────────────────────────────────────────────
Schema initialisation and incremental migration runner for SQLite and PostgreSQL.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import sqlite3

try:
    from . import config
    from .transaction import generate_missing_slugs
except ImportError:
    import database.config as config
    from database.transaction import generate_missing_slugs

logger = logging.getLogger("sonikoma.database.migrator")

# ── SQLite initialisation & incremental migration runner ──────────────────


def init_sqlite(conn) -> None:
    """Apply the SQLite schema and incremental column/table migrations."""
    try:
        cursor = conn.cursor()

        # ── Apply base schema if users table is missing ───────────────────
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        users_table_exists = cursor.fetchone() is not None

        if not users_table_exists:
            schema_file = config.SCHEMA_PATH if os.path.exists(config.SCHEMA_PATH) else "/app/schema_backup.sql"
            if not os.path.exists(schema_file):
                schema_file = os.path.join(
                    os.path.dirname(__file__), "schema.sql"
                )
            if os.path.exists(schema_file):
                logger.info(f"[Database] Initializing relational schema from {schema_file}...")
                with open(schema_file, "r", encoding="utf-8") as f:
                    schema = f.read()
                conn.executescript(schema)
                logger.info("[Database] Relational schema applied successfully.")
            else:
                logger.warning("[Database] schema.sql not found — skipping schema apply.")

        # ── Column migrations ─────────────────────────────────────────────
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN synopsis TEXT",
                        "added 'synopsis' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN slug TEXT",
                        "added 'slug' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN slug TEXT",
                        "added 'slug' to 'chapters'")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN job_id TEXT",
                        "added 'job_id' to 'chapters'")
        _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN job_id TEXT",
                        "added 'job_id' to 'token_usage_logs'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE chapters ADD COLUMN total_tokens_used INTEGER NOT NULL DEFAULT 0",
                        "added 'total_tokens_used' to 'chapters'")
        _run_safe_alter(cursor, conn, "ALTER TABLE chapters ADD COLUMN audio_settings TEXT",
                        "added 'audio_settings' to 'chapters'")
        _run_safe_alter(cursor, conn, "ALTER TABLE panels ADD COLUMN narrative TEXT",
                        "added 'narrative' to 'panels'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE users ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0",
                        "added 'is_locked' to 'users'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0",
                        "added 'is_banned' to 'users'")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN ban_reason TEXT",
                        "added 'ban_reason' to 'users'")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN last_login_at TEXT",
                        "added 'last_login_at' to 'users'")
        _run_safe_alter(cursor, conn, "ALTER TABLE users ADD COLUMN last_login_ip TEXT",
                        "added 'last_login_ip' to 'users'")
        _run_safe_alter(cursor, conn,
                "ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT ''",
                "added 'location' to 'users'")
        _run_safe_alter(cursor, conn,
                "ALTER TABLE users ADD COLUMN website TEXT NOT NULL DEFAULT ''",
                "added 'website' to 'users'")
        _run_safe_alter(cursor, conn,
                "ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'",
                "added 'timezone' to 'users'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE series ADD COLUMN status TEXT NOT NULL DEFAULT 'ready'",
                        "added 'status' to 'series'")
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE series ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0",
                        "added 'is_flagged' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flag_reason TEXT",
                        "added 'flag_reason' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flagged_by TEXT",
                        "added 'flagged_by' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN flagged_at TEXT",
                        "added 'flagged_at' to 'series'")
        _run_safe_alter(cursor, conn, "ALTER TABLE series ADD COLUMN updated_at TEXT",
                        "added 'updated_at' to 'series'")
        # project_type lifecycle column: 'temp' | 'permanent'
        _run_safe_alter(cursor, conn,
                        "ALTER TABLE chapters ADD COLUMN project_type TEXT NOT NULL DEFAULT 'permanent'",
                        "added 'project_type' to 'chapters'")

        # ── Slug indexes & Date performance indexes ─────────────────────────────
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug ON series(slug)")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_series_is_flagged ON series(is_flagged)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_series_status ON series(status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_series_created_at ON series(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_series_updated_at ON series(updated_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chapters_created_at ON chapters(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_youtube_pubs_published_at ON youtube_publications(published_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_scrape_sessions_scraped_at ON scrape_sessions(scraped_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_series_ch_cache_url ON series_chapters_cache(series_url)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_created_at ON ai_token_usage_ledger(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_user ON ai_token_usage_ledger(user_id)")

            # Prune dead/redundant empty tables
            for dead_tbl in [
                "franchise_continuity",
                "generation_feedback",
                "creator_style_profiles",
                "user_unlinked_youtube_channels",
                "edit_history",
            ]:
                cursor.execute(f"DROP TABLE IF EXISTS {dead_tbl}")

            conn.commit()
        except Exception:
            pass

        # ── Backfill missing slugs ────────────────────────────────────────
        generate_missing_slugs(conn)

        # ── content_moderation_logs table ─────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_moderation_logs (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          series_id     TEXT,
          chapter_id    TEXT,
          admin_id      TEXT NOT NULL,
          action        TEXT NOT NULL,
          reason        TEXT NOT NULL,
          previous_state TEXT,
          new_state     TEXT,
          created_at    TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # ── scraper_rules table ───────────────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraper_rules (
          id                  INTEGER PRIMARY KEY AUTOINCREMENT,
          domain              TEXT UNIQUE NOT NULL,
          is_blocked          INTEGER NOT NULL DEFAULT 0,
          rate_limit_per_min  INTEGER NOT NULL DEFAULT 30,
          proxy_required      INTEGER NOT NULL DEFAULT 0,
          custom_headers      TEXT DEFAULT '{}',
          engine_strategy     TEXT DEFAULT 'auto',
          timeout_sec         INTEGER DEFAULT 30,
          max_concurrency     INTEGER DEFAULT 2,
          retry_attempts      INTEGER DEFAULT 2,
          notes               TEXT DEFAULT '',
          created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """)

        try:
            existing_cols = [r[1] for r in cursor.execute("PRAGMA table_info(scraper_rules)").fetchall()]
            if "engine_strategy" not in existing_cols:
                cursor.execute("ALTER TABLE scraper_rules ADD COLUMN engine_strategy TEXT DEFAULT 'auto'")
            if "timeout_sec" not in existing_cols:
                cursor.execute("ALTER TABLE scraper_rules ADD COLUMN timeout_sec INTEGER DEFAULT 30")
            if "max_concurrency" not in existing_cols:
                cursor.execute("ALTER TABLE scraper_rules ADD COLUMN max_concurrency INTEGER DEFAULT 2")
            if "retry_attempts" not in existing_cols:
                cursor.execute("ALTER TABLE scraper_rules ADD COLUMN retry_attempts INTEGER DEFAULT 2")
            if "notes" not in existing_cols:
                cursor.execute("ALTER TABLE scraper_rules ADD COLUMN notes TEXT DEFAULT ''")
        except Exception as e:
            logger.warning(f"Could not alter scraper_rules table: {e}")


        # ── token_usage_logs table ────────────────────────────────────────
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_usage_logs (
              id                  TEXT PRIMARY KEY,
              user_id             TEXT,
              project_id          TEXT NOT NULL,
              chapter_id          TEXT,
              job_id              TEXT,
              model_name          TEXT,
              provider            TEXT,
              input_tokens        INTEGER NOT NULL DEFAULT 0,
              output_tokens       INTEGER NOT NULL DEFAULT 0,
              total_tokens        INTEGER NOT NULL DEFAULT 0,
              estimated_cost_usd  REAL NOT NULL,
              created_at          TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """)
            _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN user_id TEXT", "added user_id to token_usage_logs")
            _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN chapter_id TEXT", "added chapter_id to token_usage_logs")
            _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN model_name TEXT", "added model_name to token_usage_logs")
            _run_safe_alter(cursor, conn, "ALTER TABLE token_usage_logs ADD COLUMN provider TEXT", "added provider to token_usage_logs")
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at)"
            )
            conn.commit()
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

        # ── credit_balance column on users ────────────────────────────────
        _run_safe_alter(
            cursor, conn,
            "ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840",
            "added 'credit_balance' to 'users'",
        )

        _run_safe_alter(
            cursor, conn,
            "ALTER TABLE users ADD COLUMN google_access_token TEXT",
            "added 'google_access_token' to 'users'",
        )
        try:
            cursor.execute(
                "UPDATE users SET credit_balance = credits "
                "WHERE credit_balance = 840 AND credits != 840"
            )
        except Exception:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS youtube_oauth_tokens (
          user_id             TEXT    PRIMARY KEY,
          access_token        TEXT    NOT NULL,
          refresh_token       TEXT,
          token_uri           TEXT    NOT NULL DEFAULT 'https://oauth2.googleapis.com/token',
          client_id           TEXT,
          client_secret       TEXT,
          scopes              TEXT,
          google_email        TEXT,
          selected_channel_id TEXT,
          selected_channel_title TEXT,
          selected_channel_thumbnail TEXT,
          selected_channel_handle TEXT,
          updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        try:
            cursor.execute("ALTER TABLE youtube_oauth_tokens ADD COLUMN google_email TEXT")
        except Exception:
            pass
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_youtube_channels (
          channel_id          TEXT NOT NULL,
          user_id             TEXT NOT NULL,
          title               TEXT NOT NULL,
          description         TEXT,
          custom_url          TEXT,
          thumbnail           TEXT,
          subscriber_count    TEXT,
          view_count          TEXT,
          video_count         TEXT,
          channel_type        TEXT DEFAULT 'personal',
          is_selected         INTEGER DEFAULT 0,
          created_at          TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (user_id, channel_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_user_yt_channels_user ON user_youtube_channels(user_id)"
        )

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
        # ── jobs table ───────────────────────────────────────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
          id              TEXT    PRIMARY KEY,
          user_id         TEXT    NOT NULL,
          project_id      TEXT,
          chapter_id      TEXT,
          type            TEXT    NOT NULL,
          status          TEXT    NOT NULL DEFAULT 'QUEUED',
          progress        REAL    NOT NULL DEFAULT 0.0,
          stage           TEXT    NOT NULL DEFAULT 'QUEUED',
          result          TEXT,
          error           TEXT,
          metadata        TEXT,
          created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
          started_at      TEXT,
          completed_at    TEXT,
          cancelled_at    TEXT
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)")

        # ── AI Series and Continuous Improvement tables ──────────────────
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_series_projects (
          series_id   TEXT PRIMARY KEY,
          title       TEXT NOT NULL,
          format_type TEXT NOT NULL,
          art_style   TEXT NOT NULL,
          status      TEXT NOT NULL,
          created_at  TEXT NOT NULL,
          updated_at  TEXT NOT NULL,
          data_json   TEXT NOT NULL
        )
        """)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_ai_series_updated ON ai_series_projects(updated_at DESC)"
        )
        conn.commit()
        logger.info("[Database] Database schema verification and migrations completed successfully.")

    except sqlite3.Error as e:
        logger.error(f"[Database] Error checking or applying schema: {e}")
        raise
    finally:
        conn.close()


# ── Shared helper ─────────────────────────────────────────────────────────


def _run_safe_alter(cursor, conn, sql: str, description: str) -> None:
    """Execute an ALTER TABLE statement, silently ignoring already-exists errors."""
    try:
        cursor.execute(sql)
        conn.commit()
    except Exception:
        pass  # column/index already exists
