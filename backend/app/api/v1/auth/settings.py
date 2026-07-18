"""
backend/app/api/v1/auth/settings.py
─────────────────────────────────────────────────────────────────────────────
Administrative setting, impersonation, user management, and platform configuration endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import datetime
from datetime import timedelta
import logging
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from core.security import SECRET_KEY
from api.dependencies.auth import get_admin_user
from backend.schemas.auth import (
    AdminUpdateUser,
    AdminAddCreditsRequest,
    AdminBulkAction,
    AdminUpdateSettings,
    AdminUpdateProject,
    AnnouncementCreateRequest
)
from repositories.user import (
    get_user_by_id,
    update_user,
    delete_user,
    get_audit_logs,
    record_credit_transaction,
    write_audit_log,
    get_all_users
)
from repositories.system import (
    get_platform_settings,
    update_platform_settings,
    get_global_audit_logs,
    get_announcements,
    create_announcement,
    delete_announcement,
    reset_platform_settings,
    purge_global_cache
)
from database.db import (
    get_all_projects_admin,
    get_global_analytics,
    delete_series_admin,
    update_series_admin,
    admin_query_db
)

logger = logging.getLogger("sonikoma.auth.settings")
router = APIRouter()


@router.get("/admin/users")
async def get_admin_users(current_user: dict = Depends(get_admin_user)):
    users = get_all_users()
    return {"success": True, "users": users}


@router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUpdateUser, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if user_id == current_user['user_id']:
        if body.is_locked is True:
            raise HTTPException(status_code=400, detail="Admins cannot lock their own account.")
        if body.creator_role and body.creator_role != 'admin':
             raise HTTPException(status_code=400, detail="Admins cannot downgrade their own role.")

    updates = {}
    if body.creator_role is not None:
        updates["creator_role"] = body.creator_role
    if body.credits is not None:
        updates["credits"] = body.credits
    if body.is_locked is not None:
        updates["is_locked"] = 1 if body.is_locked else 0

    if updates:
        update_user(user_id, updates)
        log_msg = f"Admin updated user {user_id} settings"
        if "is_locked" in updates:
            action = "locked" if updates["is_locked"] else "unlocked"
            log_msg = f"Admin {action} account of user {user_id}"

        write_audit_log(current_user["user_id"], log_msg, ip_addr, "Success")

    return {"success": True, "message": "User updated successfully."}


@router.post("/admin/users/{user_id}/add-credits")
async def admin_add_credits(user_id: str, body: AdminAddCreditsRequest, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    try:
        new_balance = record_credit_transaction(
            user_id,
            body.amount,
            f"admin_grant: {body.reason}" if body.reason else "admin_grant"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_msg = f"Admin granted {body.amount} credits to user {user_id}. New balance: {new_balance}"
    write_audit_log(current_user["user_id"], log_msg, ip_addr, "Success")

    return {
        "success": True,
        "new_balance": new_balance,
        "message": f"Successfully updated user credits by {body.amount}."
    }


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account.")

    delete_user(user_id)
    write_audit_log(current_user["user_id"], f"Admin deleted user {user_id}", ip_addr, "Success")
    return {"success": True, "message": "User deleted successfully."}


@router.get("/admin/users/{user_id}/logs")
async def admin_get_user_logs(user_id: str, query: str = "", page: int = 1, limit: int = 20, current_user: dict = Depends(get_admin_user)):
    offset = (page - 1) * limit
    logs, total = get_audit_logs(user_id, query=query, limit=limit, offset=offset)
    return {
        "success": True,
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.post("/admin/users/bulk")
async def admin_bulk_action(body: AdminBulkAction, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    success_count = 0
    for uid in body.user_ids:
        if body.action == "delete":
            delete_user(uid)
            success_count += 1
        elif body.action == "set_role" and body.value:
            update_user(uid, {"creator_role": body.value})
            success_count += 1
        elif body.action == "add_credits" and body.value:
            try:
                u = get_user_by_id(uid)
                if u:
                    current_credits = u.get("credits") if u.get("credits") is not None else 840
                    added = int(body.value)
                    update_user(uid, {"credits": current_credits + added})
                    success_count += 1
            except Exception as e:
                logger.error(f"Failed to add credits to {uid}: {e}")

    write_audit_log(current_user["user_id"], f"Admin performed bulk '{body.action}' on {success_count} users", ip_addr, "Success")
    return {"success": True, "message": f"Successfully applied {body.action} to {success_count} users."}


@router.get('/admin/settings')
async def admin_get_settings(current_user: dict = Depends(get_admin_user)):
    return {'success': True, 'settings': get_platform_settings()}


@router.put('/admin/settings')
async def admin_update_settings(body: AdminUpdateSettings, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    update_platform_settings(body.settings)
    write_audit_log(current_user['user_id'], 'Admin updated global platform settings', ip_addr, 'Success')
    return {'success': True, 'message': 'Settings updated successfully.'}


@router.post('/admin/settings/reset')
async def admin_reset_settings(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    defaults = reset_platform_settings()
    write_audit_log(current_user['user_id'], 'Admin reset global platform settings to defaults', ip_addr, 'Success')
    return {'success': True, 'settings': defaults, 'message': 'Settings reset successfully.'}


@router.post('/admin/settings/purge-cache')
async def admin_purge_cache(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    purge_global_cache()
    write_audit_log(current_user['user_id'], 'Admin purged global scraped image cache', ip_addr, 'Success')
    return {'success': True, 'message': 'Global scraped image cache purged successfully.'}


@router.get('/admin/audit-logs')
async def admin_get_global_audit_logs(limit: int = 50, current_user: dict = Depends(get_admin_user)):
    return {'success': True, 'logs': get_global_audit_logs(limit)}


@router.post('/admin/impersonate/{user_id}')
async def admin_impersonate_user(user_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    target_user = get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail='User not found')

    access_token_expires = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440')))
    expire = datetime.datetime.utcnow() + access_token_expires
    to_encode = {'sub': target_user['email'], 'user_id': target_user['id'], 'exp': expire, 'is_impersonation': True}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm='HS256')

    write_audit_log(current_user['user_id'], f'Admin impersonated user {user_id}', ip_addr, 'Success')
    return {'success': True, 'access_token': encoded_jwt, 'token_type': 'bearer', 'impersonated_user': target_user}


@router.get('/admin/analytics')
async def admin_get_analytics(current_user: dict = Depends(get_admin_user)):
    try:
        return {'success': True, 'analytics': get_global_analytics()}
    except Exception as e:
        logger.error(f'Failed to fetch analytics: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/activity/export')
async def admin_export_activity(current_user: dict = Depends(get_admin_user)):
    try:
        import io
        import csv
        logs = get_global_audit_logs()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'User ID', 'Email', 'Action', 'IP Address', 'Timestamp', 'Status'])

        for log in logs:
            writer.writerow([
                log.get('id'),
                log.get('user_id'),
                log.get('email'),
                log.get('action'),
                log.get('ip_address'),
                log.get('created_at'),
                log.get('status')
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename=audit_logs.csv'}
        )
    except Exception as e:
        logger.error(f'Failed to export activity: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/projects')
async def admin_get_projects(current_user: dict = Depends(get_admin_user)):
    try:
        return {'success': True, 'projects': get_all_projects_admin()}
    except Exception as e:
        logger.error(f'Failed to fetch projects: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/db/query')
async def admin_db_query(table: str = 'series', limit: int = 100, offset: int = 0, current_user: dict = Depends(get_admin_user)):
    try:
        data = admin_query_db(table, limit, offset)
        return {'success': True, 'data': data}
    except Exception as e:
        logger.error(f'DB Query failed: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/admin/projects/{project_id}')
async def admin_update_project(project_id: str, body: AdminUpdateProject, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    try:
        updates = body.dict(exclude_unset=True)
        if 'reason' in updates:
            del updates['reason']

        update_series_admin(project_id, updates)

        log_msg = f'Admin updated project {project_id}'
        if 'is_flagged' in updates:
            action = "flagged" if updates['is_flagged'] else "unflagged"
            log_msg = f'Admin {action} project {project_id}'
        elif 'status' in updates:
            log_msg = f'Admin set status of project {project_id} to {updates["status"]}'

        if body.reason:
            log_msg += f" (Reason: {body.reason})"

        write_audit_log(current_user['user_id'], log_msg, ip_addr, 'Success')
        return {'success': True, 'message': 'Project updated successfully'}
    except Exception as e:
        logger.error(f'Failed to update project: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/admin/projects/{project_id}')
async def admin_delete_project(project_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    try:
        delete_series_admin(project_id)
        write_audit_log(current_user['user_id'], f'Admin deleted project {project_id}', ip_addr, 'Success')
        return {'success': True, 'message': 'Project deleted successfully'}
    except Exception as e:
        logger.error(f'Failed to delete project: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/announcements')
async def admin_get_announcements(current_user: dict = Depends(get_admin_user)):
    try:
        return {'success': True, 'announcements': get_announcements()}
    except Exception as e:
        logger.error(f'Failed to fetch announcements: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/admin/announcements')
async def admin_create_announcement(body: AnnouncementCreateRequest, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    try:
        announcement = create_announcement(body.title, body.message, body.type)
        write_audit_log(current_user['user_id'], f'Admin created announcement {body.title}', ip_addr, 'Success')
        return {'success': True, 'announcement': announcement}
    except Exception as e:
        logger.error(f"Failed to create announcement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/admin/announcements/{announcement_id}')
async def admin_delete_announcement(announcement_id: int, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    try:
        success = delete_announcement(announcement_id)
        if success:
            write_audit_log(current_user['user_id'], f'Admin deleted announcement {announcement_id}', ip_addr, 'Success')
            return {'success': True, 'message': 'Announcement deleted successfully'}
        else:
            raise HTTPException(status_code=404, detail='Announcement not found')
    except Exception as e:
        logger.error(f'Failed to delete announcement: {e}')
        raise HTTPException(status_code=500, detail=str(e))
