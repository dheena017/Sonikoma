"""
backend/app/database/__init__.py
─────────────────────────────────────────────────────────────────────────────
Database infrastructure package providing database initialization, connection
factories, schema migrations, and transaction utilities.
─────────────────────────────────────────────────────────────────────────────
"""

try:
    from . import config
    from .engine import get_db_connection
    from .bootstrap import init_db
    from .dependencies import get_db
    from .health import ensure_user_exists
    from .transaction import (
        managed_transaction,
        create_slug,
        generate_unique_slug,
        generate_missing_slugs,
        unwrap_proxy_url,
    )
    from .session import uuid_hex, datetime_now_date
    from . import migrator
    from . import seed
    from . import backup
    from . import supabase
except ImportError:
    import database.config as config
    from database.engine import get_db_connection
    from database.bootstrap import init_db
    from database.dependencies import get_db
    from database.health import ensure_user_exists
    from database.transaction import (
        managed_transaction,
        create_slug,
        generate_unique_slug,
        generate_missing_slugs,
        unwrap_proxy_url,
    )
    from database.session import uuid_hex, datetime_now_date
    import database.migrator as migrator
    import database.seed as seed
    import database.backup as backup
    import database.supabase as supabase

__all__ = [
    "config",
    "get_db_connection",
    "init_db",
    "get_db",
    "ensure_user_exists",
    "managed_transaction",
    "create_slug",
    "generate_unique_slug",
    "generate_missing_slugs",
    "unwrap_proxy_url",
    "uuid_hex",
    "datetime_now_date",
    "migrator",
    "seed",
    "backup",
    "supabase",
]
