"""
backend/features/admin/telemetry/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Telemetry, Analytics & Scraper Rules Router:
- Global system analytics & metrics overview
- AI model token usage & cost tracking
- Scraper domain rules, blocklists, and rate-limiting controls
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.dependencies.auth import get_admin_user
from features.admin.schemas import ScraperRulePayload
from features.admin.services import admin_telemetry_service
from common import get_client_ip

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


@router.get('/admin/scrapers/rules', summary="Get registered domain scraping rules and blocklists")
async def admin_get_scraper_rules(current_user: dict = Depends(get_admin_user)):
    """Retrieves domain scraping rules from the database."""
    try:
        return admin_telemetry_service.get_scraper_rules()
    except Exception as e:
        logger.error(f"Failed to fetch scraper rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/admin/scrapers/rules', summary="Add or update a domain scraping rule")
async def admin_save_scraper_rule(
    payload: ScraperRulePayload,
    request: Request = None,
    current_user: dict = Depends(get_admin_user)
):
    """Persists a domain scraping rule or blocklist entry in the database."""
    ip_addr = get_client_ip(request)
    try:
        return admin_telemetry_service.save_scraper_rule(payload.dict(), current_user["user_id"], ip_addr)
    except Exception as e:
        logger.error(f"Failed to save scraper rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/admin/scrapers/rules/{rule_id}', summary="Delete a domain scraping rule")
async def admin_delete_scraper_rule(rule_id: int, request: Request, current_user: dict = Depends(get_admin_user)):
    """Deletes a domain scraping rule from the database."""
    ip_addr = get_client_ip(request)
    try:
        return admin_telemetry_service.delete_scraper_rule(rule_id, current_user["user_id"], ip_addr)
    except Exception as e:
        logger.error(f"Failed to delete scraper rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))
