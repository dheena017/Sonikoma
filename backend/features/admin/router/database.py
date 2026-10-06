"""
backend/features/admin/database/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Raw Database Inspector Router:
- Superuser query interface for whitelisted tables with pagination
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies.auth import get_admin_user
from features.admin.services import admin_database_service

logger = logging.getLogger("sonikoma.admin.database")
router = APIRouter()


@router.get('/admin/db/query', summary="Query raw database tables (Admin Superuser only)")
async def admin_db_query(
    table: str = 'series',
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_admin_user)
):
    try:
        data = admin_database_service.query_db(table, limit, offset)
        return {'success': True, 'data': data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f'DB Query failed: {e}')
        raise HTTPException(status_code=500, detail=str(e))
