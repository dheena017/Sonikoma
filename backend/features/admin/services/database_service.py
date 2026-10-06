"""
backend/features/admin/services/database_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Database Service:
- Whitelisted direct table querying for system superusers
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any

from features.platform.dashboard.repositories.admin import admin_query_db

logger = logging.getLogger("sonikoma.admin.database_service")


class AdminDatabaseService:
    """Specialized service for administrative direct database queries."""

    def query_db(self, table: str = "series", limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        return admin_query_db(table, limit, offset)


admin_database_service = AdminDatabaseService()
