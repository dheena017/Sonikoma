"""
infrastructure/database/config.py
─────────────────────────────────────────────────────────────────────────────
Database path constants and environment configuration.
─────────────────────────────────────────────────────────────────────────────
"""

import os

# ── Directory & file paths ────────────────────────────────────────────────

DB_DIR = os.path.abspath(os.path.dirname(__file__))
_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
_PROJECT_ROOT = os.path.abspath(os.path.join(_BACKEND_ROOT, ".."))
DATA_DIR = os.path.join(_PROJECT_ROOT, "data")

DB_PATH = os.path.join(DATA_DIR, "webtoon_local.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")
SCHEMA_PG_PATH = os.path.join(DB_DIR, "schema_postgres.sql")

# ── Environment flags ─────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL")
is_postgres: bool = bool(
    DATABASE_URL
    and (
        DATABASE_URL.startswith("postgresql://")
        or DATABASE_URL.startswith("postgres://")
    )
)

# ── Application constants ─────────────────────────────────────────────────

LOW_BALANCE_THRESHOLD: int = 20
