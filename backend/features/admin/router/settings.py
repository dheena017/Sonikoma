"""
backend/features/admin/settings/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Platform Settings & Announcements Router:
- Retrieve, update, and reset platform settings
- Purge global scrape/media cache
- System announcements creation & deletion
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.dependencies.auth import get_admin_user
from features.admin.schemas import (
    AdminUpdateSettings,
    AnnouncementCreateRequest,
)
from features.admin.services import admin_settings_service
from common import get_client_ip

logger = logging.getLogger("sonikoma.admin.settings")
router = APIRouter()


@router.get('/admin/settings', summary="Get global platform settings")
async def admin_get_settings(current_user: dict = Depends(get_admin_user)):
    return admin_settings_service.get_settings()


@router.put('/admin/settings', summary="Update global platform settings")
async def admin_update_settings(
    body: AdminUpdateSettings,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    return admin_settings_service.update_settings(body.settings, current_user["user_id"], ip_addr)


@router.post('/admin/settings/reset', summary="Reset global platform settings to defaults")
async def admin_reset_settings(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    return admin_settings_service.reset_settings(current_user["user_id"], ip_addr)


@router.post('/admin/settings/purge-cache', summary="Purge global scraped image cache")
async def admin_purge_cache(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    return admin_settings_service.purge_cache(current_user["user_id"], ip_addr)


@router.get('/admin/announcements', summary="Get active system announcements")
async def admin_get_announcements(current_user: dict = Depends(get_admin_user)):
    try:
        return admin_settings_service.get_announcements()
    except Exception as e:
        logger.error(f'Failed to fetch announcements: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/admin/announcements', summary="Create system announcement")
async def admin_create_announcement(
    body: AnnouncementCreateRequest,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_settings_service.create_announcement(
            body.title, body.message, body.type or 'info', current_user["user_id"], ip_addr
        )
    except Exception as e:
        logger.error(f"Failed to create announcement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/admin/announcements/{announcement_id}', summary="Delete system announcement")
async def admin_delete_announcement(
    announcement_id: int,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_settings_service.delete_announcement(announcement_id, current_user["user_id"], ip_addr)
    except KeyError:
        raise HTTPException(status_code=404, detail='Announcement not found')
    except Exception as e:
        logger.error(f'Failed to delete announcement: {e}')
        raise HTTPException(status_code=500, detail=str(e))
