"""
backend/python/database/db.py
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
Local SQLite database connection and CRUD helpers for Webtoon-to-Video.
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
"""

import uuid
import os
import json
import sqlite3
import logging
import threading
from typing import List, Dict, Any, Optional

try:
    import psycopg2
    from psycopg2.extras import DictCursor
except ImportError:
    psycopg2 = None

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'database'))
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
_PROJECT_ROOT = os.path.abspath(os.path.join(_BACKEND_ROOT, '..'))
DATA_DIR = os.path.join(_PROJECT_ROOT, 'data')
DB_PATH = os.path.join(DATA_DIR, 'webtoon_local.db')
SCHEMA_PATH = os.path.join(DB_DIR, 'schema.sql')
SCHEMA_PG_PATH = os.path.join(DB_DIR, 'schema_postgres.sql')

logger = logging.getLogger("sonikoma.database")
LOW_BALANCE_THRESHOLD = 20

DATABASE_URL = os.environ.get("DATABASE_URL")
_is_postgres = bool(DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")))

_db_initialized = False
_db_init_lock = threading.Lock()
_db_init_in_progress = False
_db_init_complete = threading.Event()
_system_log_persist_in_progress = False

class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def _translate_query(self, query):
        # Convert SQLite placeholders to Postgres format
        query = query.replace("?", "%s")
        # Convert SQLite datetime to Postgres
        query = query.replace("datetime('now')", "NOW()")
        return query

    def execute(self, query, params=None):
        translated = self._translate_query(query)
        self.cursor.execute(translated, params or ())
        return self

    def fetchone(self):
        try:
            return self.cursor.fetchone()
        except Exception:
            return None

    def fetchall(self):
        try:
            rows = self.cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

    def close(self):
        self.cursor.close()

class PostgresConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return PostgresCursorWrapper(self.conn.cursor())

    def execute(self, query, params=None):
        cursor = self.cursor()
        return cursor.execute(query, params)

    def executescript(self, script):
        cursor = self.cursor()
        cursor.execute(script)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

def _create_db_connection():
    if _is_postgres:
        if not psycopg2:
            raise RuntimeError("psycopg2-binary is required for PostgreSQL support. Please install it.")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
        return PostgresConnectionWrapper(conn)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # WAL improves concurrency, but on some environments (e.g. transient disk
    # write issues / read-only mounts) SQLite can raise:
    #   sqlite3.OperationalError: disk I/O error
    # Auth and other read paths should still work, so we degrade gracefully.
    try:
        conn.execute('PRAGMA journal_mode = WAL')
    except sqlite3.OperationalError as e:
        logger.warning(
            f"[Database] PRAGMA journal_mode=WAL failed; continuing without WAL. error={e}"
        )
        try:
            # Explicitly set a safer journal mode if possible; otherwise just
            # keep SQLite defaults.
            conn.execute('PRAGMA journal_mode = DELETE')
        except Exception:
            pass

    conn.execute('PRAGMA foreign_keys = ON')
    return conn



def get_db_connection():
    if not _db_initialized:
        init_db()
    return _create_db_connection()


def _should_skip_system_log_persistence() -> bool:
    return _db_init_in_progress or not _db_init_complete.is_set() and not _db_initialized


def init_db() -> None:
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

    if _is_postgres:
        logger.info(f"[Database] Connecting to PostgreSQL (Supabase)...")
        conn = _create_db_connection()
        try:
            # Check if tables exist
            row = conn.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists").fetchone()
            if not row or not row.get('exists'):
                logger.info("[Database] Initializing PostgreSQL schema...")
                schema_file = SCHEMA_PG_PATH
                if os.path.exists(schema_file):
                    with open(schema_file, 'r', encoding='utf-8') as f:
                        schema = f.read()
                    conn.executescript(schema)
                    conn.commit()
                    logger.info("[Database] PostgreSQL schema applied successfully.")
                else:
                    logger.warning("[Database] schema_postgres.sql not found.")
            else:
                logger.info("[Database] Relational database schema is already initialized.")

            # Check and initialize YouTube tables in Postgres/Supabase
            row_yt = conn.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youtube_profiles') as exists").fetchone()
            if not row_yt or not row_yt.get('exists'):
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

            row_creds = conn.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youtube_credentials') as exists").fetchone()
            if not row_creds or not row_creds.get('exists'):
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

            # Check and initialize credit_transactions table
            row_tx = conn.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_transactions') as exists").fetchone()
            if not row_tx or not row_tx.get('exists'):
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

            # Check and add credit_balance column to users table if missing
            row_col = conn.execute("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'credit_balance') as exists").fetchone()
            if not row_col or not row_col.get('exists'):
                logger.info("[Database] Migration: adding 'credit_balance' column to 'users' table...")
                conn.execute("ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840")
                conn.commit()
        except Exception as e:
            logger.error(f"[Database] Error checking PostgreSQL schema: {e}")
        finally:
            conn.close()
        logger.info("[Database] PostgreSQL ready [OK]")
        with _db_init_lock:
            _db_initialized = True
            _db_init_in_progress = False
            _db_init_complete.set()
        return

    logger.info(f"[Database] Opening local SQLite database at: {DB_PATH}")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    os.makedirs(DB_DIR, exist_ok=True)
    conn = _create_db_connection()
    try:
        cursor = conn.cursor()

        # Check if users table exists. If so, inspect it for relational upgrade indicator.
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        users_table_exists = cursor.fetchone() is not None

        if users_table_exists:
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]

            # If the users table does not have 'username' column, it's the old flat schema.
            # Perform clean relational schema upgrade.
            if "username" not in columns:
                logger.info("[Database] Old database schema detected (missing 'username' in users). Dropping old tables to perform clean relational upgrade...")
                tables = ["panels", "projects", "user_sessions", "user_audit_logs", "user_invoices", "user_api_keys", "users", "series", "chapters", "scrape_sessions", "edit_history"]
                for table in tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                conn.commit()
                users_table_exists = False

        if not users_table_exists:
            schema_file = SCHEMA_PATH if os.path.exists(SCHEMA_PATH) else '/app/schema_backup.sql'
            if not os.path.exists(schema_file):
                schema_file = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'schema.sql')

            if os.path.exists(schema_file):
                logger.info(f"[Database] Re-initializing relational schema from {schema_file}...")
                with open(schema_file, 'r', encoding='utf-8') as f:
                    schema = f.read()
                conn.executescript(schema)
                logger.info("[Database] Relational schema applied successfully.")
            else:
                logger.warning("[Database] schema.sql not found ΓÇö skipping schema apply.")
        else:
            logger.info("[Database] Relational database schema is already initialized.")

        # Safe migration check: add synopsis column to series table if missing
        try:
            cursor.execute("ALTER TABLE series ADD COLUMN synopsis TEXT")
            conn.commit()
            logger.info("[Database] Successfully ran migration: added 'synopsis' column to 'series' table.")
        except Exception:
            pass

        # Slug Migration Check
        try:
            cursor.execute("ALTER TABLE series ADD COLUMN slug TEXT")
            conn.commit()
            logger.info("[Database] Migration: added 'slug' column to 'series' table.")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE chapters ADD COLUMN slug TEXT")
            conn.commit()
            logger.info("[Database] Migration: added 'slug' column to 'chapters' table.")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE chapters ADD COLUMN total_tokens_used INTEGER NOT NULL DEFAULT 0")
            conn.commit()
            logger.info("[Database] Migration: added 'total_tokens_used' column to 'chapters' table.")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE chapters ADD COLUMN audio_settings TEXT")
            conn.commit()
            logger.info("[Database] Migration: added 'audio_settings' column to 'chapters' table.")
        except Exception:
            pass

        # Create missing indexes for slugs
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug ON series(slug)")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug)")
            conn.commit()
        except Exception:
            pass

        # Admin Features Migration
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0")
            conn.commit()
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE series ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0")
            conn.commit()
        except Exception:
            pass

        # Run one-time slug generation for existing data
        generate_missing_slugs(conn)

        # Ensure token_usage_logs exists
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
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at)")
            conn.commit()
            logger.info("[Database] Migration: verified token_usage_logs table.")
        except:
            logger.error(f"[Database] Schema file not found: {schema_file}")

        # Ensure youtube_profiles and youtube_publications exist in SQLite
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
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_youtube_profiles_user ON youtube_profiles(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_youtube_publications_user ON youtube_publications(user_id)")

            # Ensure youtube_credentials exists in SQLite
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
        except Exception as e_yt:
            logger.error(f"[Database] Error checking SQLite YouTube schema: {e_yt}")

        # Ensure platform settings table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platform_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Ensure system_logs table exists
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

        # Migration: Add missing columns if table already exists
        try:
            cursor.execute("ALTER TABLE system_logs ADD COLUMN correlation_id TEXT")
        except: pass
        try:
            cursor.execute("ALTER TABLE system_logs ADD COLUMN user_id TEXT")
        except: pass
        try:
            cursor.execute("ALTER TABLE system_logs ADD COLUMN snapshot TEXT")
        except: pass

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)")

        # Populate default settings if empty
        cursor.execute("SELECT COUNT(*) FROM platform_settings")
        if cursor.fetchone()[0] == 0:
            defaults = [
                ('maintenance_mode', 'false'),
                ('disable_signups', 'false'),
                ('global_banner', ''),
                ('enable_beta', 'false'),
                ('max_upload_size_mb', '50'),
                ('max_scenes_per_project', '100'),
                ('default_starting_credits', '200'),
                ('smtp_host', 'smtp.mailgun.org'),
                ('smtp_port', '587'),
                ('smtp_user', ''),
                ('enforce_2fa', 'false'),
                ('strict_ip_binding', 'false'),
                ('session_timeout_min', '120'),
                ('webhook_url', 'https://api.sonikoma.com/webhooks'),
                ('log_retention_days', '7'),
                ('log_max_entries', '5000')
            ]
            cursor.executemany("INSERT INTO platform_settings (key, value) VALUES (?, ?)", defaults)
        # Migration: add credit_balance column to users table
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 840")
            # Sync credit_balance with existing credits balances
            cursor.execute("UPDATE users SET credit_balance = credits WHERE credit_balance = 840 AND credits != 840")
            logger.info("[Database] Migration: added 'credit_balance' column to 'users' table.")
        except Exception:
            pass  # Column already exists

        # Migration: ensure credit_transactions ledger table exists
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id)")
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
    with _db_init_lock:
        _db_initialized = True
        _db_init_in_progress = False
        _db_init_complete.set()
    logger.info("[Database] SQLite database ready [OK]")

# Database initialization is deferred and handled by the app lifespan or on first query.

# ΓöÇΓöÇΓöÇ User Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ



def uuid_hex() -> str:
    import uuid
    return uuid.uuid4().hex[:8]

def datetime_now_date() -> str:
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%d")

def create_slug(title: str) -> str:
    """
    Converts a title into a URL-friendly slug. Supports Unicode characters.
    """
    import re
    if not title:
        return ""

    # Lowercase and remove punctuation except dashes and whitespace
    slug = title.lower()
    # \w matches alphanumeric characters plus underscore. We use Unicode flag by default in Py3.
    # We want to keep alphanumeric, spaces and dashes.
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace spaces and underscores with dashes
    slug = re.sub(r'[\s_]+', '-', slug)
    # Collapse multiple dashes
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def generate_unique_slug(title: str, table: str, conn: sqlite3.Connection) -> str:
    """
    Generates a unique slug by appending a counter if the slug already exists.
    """
    base_slug = create_slug(title)
    if not base_slug:
        import uuid
        base_slug = f"untitled-{uuid.uuid4().hex[:6]}"

    slug = base_slug
    counter = 1

    while True:
        row = conn.execute(f"SELECT id FROM {table} WHERE slug = ? LIMIT 1", (slug,)).fetchone()
        if not row:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def generate_missing_slugs(conn: sqlite3.Connection) -> None:
    """
    Loops through existing series and chapters to generate missing slugs.
    """
    try:
        # Generate for series
        rows = conn.execute("SELECT id, title FROM series WHERE slug IS NULL").fetchall()
        for r in rows:
            unique_slug = generate_unique_slug(r['title'], 'series', conn)
            conn.execute("UPDATE series SET slug = ? WHERE id = ?", (unique_slug, r['id']))

        # Generate for chapters
        rows = conn.execute("""
            SELECT c.id, c.episode_number, s.title as series_title
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.slug IS NULL
        """).fetchall()
        for r in rows:
            # For chapters, use "Series Title - Episode Number" as base for slug
            base_title = f"{r['series_title']} {r['episode_number']}"
            unique_slug = generate_unique_slug(base_title, 'chapters', conn)
            conn.execute("UPDATE chapters SET slug = ? WHERE id = ?", (unique_slug, r['id']))

        conn.commit()
    except Exception as e:
        logger.error(f"[Database] Error generating missing slugs: {e}")

# ΓöÇΓöÇΓöÇ Query Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

def unwrap_proxy_url(url_str: str) -> str:
    if not url_str:
        return ""
    import urllib.parse
    current = url_str.strip()
    while "/api/proxy-image" in current:
        parsed = urllib.parse.urlparse(current)
        query = urllib.parse.parse_qs(parsed.query)
        if "url" in query:
            current = query["url"][0]
        else:
            break
    return current


def ensure_user_exists(conn: sqlite3.Connection, user_id: Optional[str], fallback_username: Optional[str] = None) -> str:
    """
    Ensure a user row exists so foreign-key references from series/chapters remain valid.
    For anonymous scraper requests, a lightweight fallback user is created automatically.
    """
    normalized_user_id = (user_id or 'system_default').strip() or 'system_default'
    if not normalized_user_id:
        normalized_user_id = 'system_default'

    existing = conn.execute("SELECT id FROM users WHERE id = ? LIMIT 1", (normalized_user_id,)).fetchone()
    if existing:
        return normalized_user_id

    username = (fallback_username or normalized_user_id).strip() or normalized_user_id
    email = f"{normalized_user_id}@local.invalid"
    conn.execute("""
        INSERT INTO users (id, username, email, password_hash, preferences, avatar_url, full_name, google_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        normalized_user_id,
        username,
        email,
        'system_generated',
        '{}',
        None,
        None,
        None,
    ))
    return normalized_user_id


