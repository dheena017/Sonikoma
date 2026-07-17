"""
backend/app/repositories/system/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public interface for system repository package.
─────────────────────────────────────────────────────────────────────────────
"""

from repositories.system.settings import (
    get_platform_settings,
    update_platform_settings,
    reset_platform_settings,
    purge_global_cache,
)
from repositories.system.logs import (
    get_global_audit_logs,
    insert_system_log,
    get_system_logs,
    prune_system_logs,
    wipe_system_logs,
)
from repositories.system.analytics import (
    get_db_stats,
    get_global_analytics,
)
from repositories.system.announcements import (
    get_announcements,
    create_announcement,
    delete_announcement,
)
from repositories.system.admin import (
    admin_query_db,
)

__all__ = [
    "get_platform_settings",
    "update_platform_settings",
    "reset_platform_settings",
    "purge_global_cache",
    "get_global_audit_logs",
    "insert_system_log",
    "get_system_logs",
    "prune_system_logs",
    "wipe_system_logs",
    "get_db_stats",
    "get_global_analytics",
    "get_announcements",
    "create_announcement",
    "delete_announcement",
    "admin_query_db",
]
