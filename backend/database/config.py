"""
backend/database/config.py
─────────────────────────────────────────────────────────────────────────────
Database path constants, application thresholds, and configuration settings.
─────────────────────────────────────────────────────────────────────────────
"""

import os

# ── Directory & File Paths ─────────────────────────────────────────────────

DB_DIR = os.path.abspath(os.path.dirname(__file__))
_BACKEND_ROOT = os.path.abspath(os.path.join(DB_DIR, ".."))
DATA_DIR = os.path.join(_BACKEND_ROOT, "data")

DB_PATH = os.path.join(DATA_DIR, "webtoon_local.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")
SCHEMA_PG_PATH = SCHEMA_PATH

# ── Environment & Engine Configuration ────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL")
NODE_ENV = os.environ.get("NODE_ENV", "development").lower()

# Local SQLite is the primary database engine
is_postgres: bool = False

# ── Application Thresholds ────────────────────────────────────────────────

LOW_BALANCE_THRESHOLD: int = 20

# ── Storage & Cloud Client Helpers ────────────────────────────────────────

from database.supabase import get_supabase_client

__all__ = [
    "DB_DIR",
    "DATA_DIR",
    "DB_PATH",
    "SCHEMA_PATH",
    "SCHEMA_PG_PATH",
    "DATABASE_URL",
    "NODE_ENV",
    "is_postgres",
    "LOW_BALANCE_THRESHOLD",
    "get_supabase_client",
]
