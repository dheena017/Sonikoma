"""
backend/features/admin/telemetry/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Telemetry & Analytics Router:
- Global system analytics & metrics overview
- AI model token usage & cost tracking
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies.auth import get_admin_user
from features.admin.services import admin_telemetry_service

logger = logging.getLogger("sonikoma.admin.telemetry")
router = APIRouter()


@router.get('/admin/analytics', summary="Get platform global analytics")
async def admin_get_analytics(current_user: dict = Depends(get_admin_user)):
    try:
        return {'success': True, 'analytics': admin_telemetry_service.get_analytics()}
    except Exception as e:
        logger.error(f'Failed to fetch analytics: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/usage/tokens', summary="Get real AI model token usage and cost breakdown")
async def admin_get_token_usage(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic LLM token usage logs and cost breakdown from the database."""
    try:
        return admin_telemetry_service.get_token_usage(limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"Failed to fetch token usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

