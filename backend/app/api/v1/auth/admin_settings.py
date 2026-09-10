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
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.security import SECRET_KEY
from api.dependencies.auth import get_admin_user
from schemas.auth import (
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
from repositories.project.project import get_all_projects_admin
from repositories.system.analytics import get_global_analytics
from repositories.project.series import (
    delete_series_admin,
    update_series_admin,
)
from repositories.system.admin import admin_query_db

logger = logging.getLogger("sonikoma.auth.settings")
router = APIRouter()


@router.get("/admin/users", summary="Get all platform users with filtering and pagination")
async def get_admin_users(
    search: Optional[str] = Query(None, description="Search users by email, username, or full name"),
    role: Optional[str] = Query(None, description="Filter by creator role (e.g. admin, creator, pro)"),
    is_locked: Optional[bool] = Query(None, description="Filter by account lock state"),
    limit: int = Query(50, ge=1, le=500, description="Max users to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_admin_user),
):
    users = get_all_users()
    if search:
        q = search.lower()
        users = [
            u for u in users
            if q in (u.get("email") or "").lower()
            or q in (u.get("username") or "").lower()
            or q in (u.get("full_name") or "").lower()
        ]
    if role:
        users = [u for u in users if (u.get("creator_role") or "").lower() == role.lower()]
    if is_locked is not None:
        target_locked = 1 if is_locked else 0
        users = [u for u in users if u.get("is_locked", 0) == target_locked]

    total = len(users)
    paginated = users[offset:offset + limit]
    return {"success": True, "total": total, "users": paginated}


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


@router.get('/admin/activity/export', summary="Export platform audit activity logs")
async def admin_export_activity(
    format: str = Query("csv", description="Export file format: csv or json"),
    current_user: dict = Depends(get_admin_user),
):
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


@router.get('/admin/projects', summary="Get all system projects with filtering and pagination")
async def admin_get_projects(
    search: Optional[str] = Query(None, description="Search projects by title, author, or genre"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_flagged: Optional[bool] = Query(None, description="Filter by flagged state"),
    limit: int = Query(50, ge=1, le=500, description="Max projects to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_admin_user),
):
    try:
        projects = get_all_projects_admin()
        if search:
            q = search.lower()
            projects = [
                p for p in projects
                if q in (p.get("title") or "").lower()
                or q in (p.get("author") or "").lower()
                or q in (p.get("genre") or "").lower()
            ]
        if status:
            projects = [p for p in projects if (p.get("status") or "").lower() == status.lower()]
        if is_flagged is not None:
            target_flagged = 1 if is_flagged else 0
            projects = [p for p in projects if p.get("is_flagged", 0) == target_flagged]

        total = len(projects)
        paginated = projects[offset:offset + limit]
        return {'success': True, 'total': total, 'projects': paginated}
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
        announcement = create_announcement(body.title, body.message, body.type or 'info')
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


# ── Admin Background Job Management ──────────────────────────────────────────

from services.jobs import job_manager, JobListResponse, JobStatusResponse


@router.get('/admin/jobs', response_model=JobListResponse, summary="Get all background jobs across the system (Admin only)")
async def admin_get_all_jobs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    chapter_id: Optional[str] = Query(None, description="Filter by chapter ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves all background jobs in the system."""
    jobs = job_manager.list_all_jobs_admin(
        user_id=user_id,
        project_id=project_id,
        chapter_id=chapter_id,
        status=status,
        job_type=job_type,
        limit=limit,
        offset=offset
    )
    return JobListResponse(
        success=True,
        total=len(jobs),
        jobs=[j.to_status_response() for j in jobs]
    )


@router.post('/admin/jobs/{job_id}/cancel', response_model=JobStatusResponse, summary="Admin cancel a job")
async def admin_cancel_job(job_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    job = job_manager.cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    write_audit_log(current_user['user_id'], f'Admin cancelled job {job_id}', ip_addr, 'Success')
    return job.to_status_response()


@router.delete('/admin/jobs/{job_id}', summary="Admin delete a job record")
async def admin_delete_job(job_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    success = job_manager.delete_job_admin(job_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    write_audit_log(current_user['user_id'], f'Admin deleted job {job_id}', ip_addr, 'Success')
    return {'success': True, 'message': f"Job '{job_id}' deleted successfully"}


@router.post('/admin/jobs/purge-completed', summary="Admin purge completed/failed jobs")
async def admin_purge_completed_jobs(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    count = job_manager.purge_completed_jobs_admin()
    write_audit_log(current_user['user_id'], f'Admin purged {count} completed/failed jobs', ip_addr, 'Success')
    return {'success': True, 'purged_count': count, 'message': f'Successfully purged {count} finished jobs.'}


@router.post('/admin/jobs/cancel-all-active', summary="Admin cancel all currently active/queued jobs")
async def admin_cancel_all_active_jobs(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    count = job_manager.cancel_all_active_admin()
    write_audit_log(current_user['user_id'], f'Admin cancelled all {count} active jobs', ip_addr, 'Success')
    return {'success': True, 'cancelled_count': count, 'message': f'Successfully cancelled {count} active jobs.'}


# ── Dedicated Admin Subsystem Endpoints ─────────────────────────────────────

from database.engine import get_db_connection


@router.get('/admin/credits/transactions', summary="Get admin credit transactions ledger with real stats")
async def admin_get_credit_transactions(
    user_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    filter_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic credit transaction ledger records from the database."""
    conn = get_db_connection()
    try:
        query = """
            SELECT ct.*, u.email as user_email, u.username as creator_username
            FROM credit_transactions ct
            LEFT JOIN users u ON ct.user_id = u.id
            WHERE 1=1
        """
        params = []
        if user_id:
            query += " AND ct.user_id = ?"
            params.append(user_id)
        if filter_type == 'additions':
            query += " AND ct.amount > 0"
        elif filter_type == 'deductions':
            query += " AND ct.amount < 0"
        if search:
            query += " AND (u.email LIKE ? OR ct.feature_name LIKE ? OR ct.user_id LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " ORDER BY ct.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, tuple(params)).fetchall()
        transactions = [dict(r) for r in rows]

        stat_row = conn.execute("""
            SELECT 
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_added,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_deducted,
                COUNT(*) as total_count
            FROM credit_transactions
        """).fetchone()

        stats = {
            "total_transactions": stat_row["total_count"] if stat_row else 0,
            "total_added": stat_row["total_added"] or 0 if stat_row else 0,
            "total_deducted": stat_row["total_deducted"] or 0 if stat_row else 0,
        }

        return {
            "success": True,
            "total": len(transactions),
            "transactions": transactions,
            "stats": stats
        }
    finally:
        conn.close()


@router.get('/admin/finance/invoices', summary="Get admin finance ledger and real revenue metrics")
async def admin_get_finance_invoices(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic billing invoices from the database."""
    conn = get_db_connection()
    try:
        query = """
            SELECT inv.*, u.email as user_email, u.full_name as user_full_name
            FROM user_invoices inv
            LEFT JOIN users u ON inv.user_id = u.id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND LOWER(inv.status) = LOWER(?)"
            params.append(status)

        query += " ORDER BY inv.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, tuple(params)).fetchall()
        invoices = [dict(r) for r in rows]

        revenue_row = conn.execute("""
            SELECT 
                SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN LOWER(status) = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_count
            FROM user_invoices
        """).fetchone()

        summary = {
            "total_revenue": revenue_row["total_revenue"] or 0.0 if revenue_row else 0.0,
            "paid_count": revenue_row["paid_count"] if revenue_row else 0,
            "pending_count": revenue_row["pending_count"] if revenue_row else 0,
        }

        return {
            "success": True,
            "total": len(invoices),
            "invoices": invoices,
            "summary": summary
        }
    finally:
        conn.close()


@router.get('/admin/usage/tokens', summary="Get real AI model token usage and cost breakdown")
async def admin_get_token_usage(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic LLM token usage logs and cost breakdown from the database."""
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT t.*, s.title as series_title, u.email as user_email
            FROM token_usage_logs t
            LEFT JOIN series s ON t.project_id = s.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()
        logs = [dict(r) for r in rows]

        summary_row = conn.execute("""
            SELECT 
                SUM(input_tokens) as total_input,
                SUM(output_tokens) as total_output,
                SUM(total_tokens) as total_tokens,
                SUM(estimated_cost_usd) as total_cost_usd
            FROM token_usage_logs
        """).fetchone()

        summary = {
            "total_input_tokens": summary_row["total_input"] or 0 if summary_row else 0,
            "total_output_tokens": summary_row["total_output"] or 0 if summary_row else 0,
            "total_tokens": summary_row["total_tokens"] or 0 if summary_row else 0,
            "total_cost_usd": round(summary_row["total_cost_usd"] or 0.0, 4) if summary_row else 0.0,
        }

        return {
            "success": True,
            "total": len(logs),
            "logs": logs,
            "summary": summary
        }
    finally:
        conn.close()


@router.get('/admin/scrapers/rules', summary="Get registered domain scraping rules and blocklists")
async def admin_get_scraper_rules(current_user: dict = Depends(get_admin_user)):
    """Retrieves domain scraping rules from the database."""
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM scraper_rules ORDER BY domain ASC").fetchall()
        rules = [dict(r) for r in rows]
        from services.scraper.scraper_constants import ALLOWED_DOMAINS
        return {
            "success": True,
            "total": len(rules),
            "rules": rules,
            "whitelisted_domains": ALLOWED_DOMAINS
        }
    finally:
        conn.close()


class ScraperRulePayload(BaseModel):
    domain: str
    is_blocked: bool = False
    rate_limit_per_min: int = 30
    proxy_required: bool = False
    engine_strategy: Optional[str] = "auto"
    timeout_sec: Optional[int] = 30
    max_concurrency: Optional[int] = 2
    retry_attempts: Optional[int] = 2
    notes: Optional[str] = ""
    custom_headers: Optional[str] = "{}"


@router.post('/admin/scrapers/rules', summary="Add or update a domain scraping rule")
async def admin_save_scraper_rule(
    payload: ScraperRulePayload,
    request: Request = None,
    current_user: dict = Depends(get_admin_user)
):
    """Persists a domain scraping rule or blocklist entry in the database."""
    ip_addr = request.client.host if request and request.client else '127.0.0.1'
    conn = get_db_connection()
    try:
        domain = payload.domain.strip().lower()
        blocked_val = 1 if payload.is_blocked else 0
        proxy_val = 1 if payload.proxy_required else 0
        engine_strategy = payload.engine_strategy or "auto"
        timeout_sec = payload.timeout_sec or 30
        max_concurrency = payload.max_concurrency or 2
        retry_attempts = payload.retry_attempts or 2
        notes = payload.notes or ""
        custom_headers = payload.custom_headers or "{}"

        conn.execute("""
            INSERT INTO scraper_rules (
                domain, is_blocked, rate_limit_per_min, proxy_required,
                engine_strategy, timeout_sec, max_concurrency, retry_attempts, notes, custom_headers
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(domain) DO UPDATE SET
                is_blocked = excluded.is_blocked,
                rate_limit_per_min = excluded.rate_limit_per_min,
                proxy_required = excluded.proxy_required,
                engine_strategy = excluded.engine_strategy,
                timeout_sec = excluded.timeout_sec,
                max_concurrency = excluded.max_concurrency,
                retry_attempts = excluded.retry_attempts,
                notes = excluded.notes,
                custom_headers = excluded.custom_headers
        """, (
            domain, blocked_val, payload.rate_limit_per_min, proxy_val,
            engine_strategy, timeout_sec, max_concurrency, retry_attempts, notes, custom_headers
        ))
        conn.commit()
        write_audit_log(current_user['user_id'], f"Admin updated scraper rule for domain '{domain}'", ip_addr, "Success")
        return {"success": True, "message": f"Scraper rule for '{domain}' saved successfully."}
    finally:
        conn.close()


@router.delete('/admin/scrapers/rules/{rule_id}', summary="Delete a domain scraping rule")
async def admin_delete_scraper_rule(rule_id: int, request: Request, current_user: dict = Depends(get_admin_user)):
    """Deletes a domain scraping rule from the database."""
    ip_addr = request.client.host if request.client else '127.0.0.1'
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM scraper_rules WHERE id = ?", (rule_id,))
        conn.commit()
        write_audit_log(current_user['user_id'], f"Admin deleted scraper rule #{rule_id}", ip_addr, "Success")
        return {"success": True, "message": "Scraper rule deleted successfully."}
    finally:
        conn.close()


@router.get('/admin/moderation/logs', summary="Get content moderation audit logs with series & admin info")
async def admin_get_moderation_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves content moderation audit logs from the database."""
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT m.*, u.email as admin_email, s.title as series_title
            FROM content_moderation_logs m
            LEFT JOIN users u ON m.admin_id = u.id
            LEFT JOIN series s ON m.series_id = s.id
            ORDER BY m.created_at DESC LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()
        return {"success": True, "total": len(rows), "logs": [dict(r) for r in rows]}
    finally:
        conn.close()


