"""
backend/features/admin/audit/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Audit Logs & Activity Router:
- View global admin & user activity logs
- Export audit activity logs to CSV/JSON streaming format
- View content moderation audit logs
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.dependencies.auth import get_admin_user
from features.admin.services import admin_audit_service

logger = logging.getLogger("sonikoma.admin.audit")
router = APIRouter()


@router.get('/admin/audit-logs', summary="Get global audit logs")
async def admin_get_global_audit_logs(limit: int = 50, current_user: dict = Depends(get_admin_user)):
    return admin_audit_service.get_audit_logs(limit)


@router.get('/admin/activity/export', summary="Export platform audit activity logs")
async def admin_export_activity(
    format: str = Query("csv", description="Export file format: csv or json"),
    current_user: dict = Depends(get_admin_user),
):
    try:
        csv_content = admin_audit_service.export_activity_csv()
        return StreamingResponse(
            iter([csv_content]),
            media_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename=audit_logs.csv'}
        )
    except Exception as e:
        logger.error(f'Failed to export activity: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/moderation/logs', summary="Get content moderation audit logs with series & admin info")
async def admin_get_moderation_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves content moderation audit logs from the database."""
    try:
        return admin_audit_service.get_moderation_logs(limit, offset)
    except Exception as e:
        logger.error(f'Failed to fetch moderation logs: {e}')
        raise HTTPException(status_code=500, detail=str(e))
