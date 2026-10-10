"""
backend/database/config.py
─────────────────────────────────────────────────────────────────────────────
Database path constants, storage tier definitions, and configuration settings.
─────────────────────────────────────────────────────────────────────────────
"""

import os

# ── Base Directory Paths ───────────────────────────────────────────────────

DB_DIR = os.path.abspath(os.path.dirname(__file__))
_BACKEND_ROOT = os.path.abspath(os.path.join(DB_DIR, ".."))
DATA_DIR = os.path.join(_BACKEND_ROOT, "data")

# ── Tier 1: Relational Persistence & Safeguards ───────────────────────────

DB_PATH = os.path.join(DATA_DIR, "webtoon_local.db")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")
SCHEMA_PG_PATH = SCHEMA_PATH

# ── Tier 2: Persistent Media Assets ───────────────────────────────────────

MEDIA_DIR = os.path.join(DATA_DIR, "media")
MEDIA_VIDEOS_DIR = os.path.join(MEDIA_DIR, "videos")
MEDIA_PANELS_DIR = os.path.join(MEDIA_DIR, "panels")
MEDIA_AUDIO_DIR = os.path.join(MEDIA_DIR, "audio")
MEDIA_EXPORTS_DIR = os.path.join(MEDIA_DIR, "exports")
MEDIA_SERIES_IMAGES_DIR = os.path.join(MEDIA_DIR, "series_images")
MEDIA_SERIES_AUDIO_DIR = os.path.join(MEDIA_DIR, "series_audio")
MEDIA_SERIES_VIDEOS_DIR = os.path.join(MEDIA_DIR, "series_videos")
LOCAL_MEDIA_DIR = MEDIA_DIR  # Canonical alias pointing directly to MEDIA_DIR

# ── Tier 3: High-Performance Ephemeral Caches ─────────────────────────────

CACHE_DIR = os.path.join(DATA_DIR, "cache")
CACHE_STITCHED_DIR = os.path.join(CACHE_DIR, "stitched")
CACHE_EDITS_DIR = os.path.join(CACHE_DIR, "edits")
CACHE_AUDIO_DIR = os.path.join(CACHE_DIR, "audio")
IMAGE_CACHE_DIR = os.path.join(DATA_DIR, "image_cache")  # Backward-compatible alias

# ── Tier 4 & 5: Diagnostics, Temp & Machine Learning ──────────────────────

LOGS_DIR = os.path.join(DATA_DIR, "logs")
TEMP_DIR = os.path.join(DATA_DIR, "temp")
STORAGE_DIR = os.path.join(DATA_DIR, "storage")
TRAINING_DATA_DIR = os.path.join(DATA_DIR, "training_data")

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
    "BACKUPS_DIR",
    "SCHEMA_PATH",
    "SCHEMA_PG_PATH",
    "MEDIA_DIR",
    "MEDIA_VIDEOS_DIR",
    "MEDIA_PANELS_DIR",
    "MEDIA_AUDIO_DIR",
    "MEDIA_EXPORTS_DIR",
    "MEDIA_SERIES_IMAGES_DIR",
    "MEDIA_SERIES_AUDIO_DIR",
    "MEDIA_SERIES_VIDEOS_DIR",
    "LOCAL_MEDIA_DIR",
    "CACHE_DIR",
    "CACHE_STITCHED_DIR",
    "CACHE_EDITS_DIR",
    "CACHE_AUDIO_DIR",
    "IMAGE_CACHE_DIR",
    "LOGS_DIR",
    "TEMP_DIR",
    "STORAGE_DIR",
    "TRAINING_DATA_DIR",
    "DATABASE_URL",
    "NODE_ENV",
    "is_postgres",
    "LOW_BALANCE_THRESHOLD",
    "get_supabase_client",
]
