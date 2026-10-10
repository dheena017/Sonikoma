"""
backend/database/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified database infrastructure package providing:
- Configuration and engine connection factories
- Startup orchestration and idempotent schema migrations
- High-level utilities: UUID/datetime helpers, slugs, transactions, proxy unwrapping
- Supabase cloud storage integration
─────────────────────────────────────────────────────────────────────────────
"""

from database import config, migrator, supabase
from database.bootstrap import init_db, is_database_initialized
from database.engine import get_db_connection
from database.supabase import get_supabase_client, upload_to_supabase_bucket
from database.utils import (
    create_slug,
    datetime_now_date,
    datetime_now_iso,
    ensure_user_exists,
    generate_missing_slugs,
    generate_unique_slug,
    managed_transaction,
    unwrap_proxy_url,
    uuid_hex,
)

__all__ = [
    "config",
    "migrator",
    "supabase",
    "get_db_connection",
    "init_db",
    "is_database_initialized",
    "get_supabase_client",
    "upload_to_supabase_bucket",
    "create_slug",
    "datetime_now_date",
    "datetime_now_iso",
    "ensure_user_exists",
    "generate_missing_slugs",
    "generate_unique_slug",
    "managed_transaction",
    "unwrap_proxy_url",
    "uuid_hex",
]
