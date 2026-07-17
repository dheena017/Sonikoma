"""
backend/app/api/v1/auth/profile.py
─────────────────────────────────────────────────────────────────────────────
User Profile, Billing, Credits, developer keys, and Administrative endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import secrets
import datetime
from datetime import timedelta
import logging
import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse

from core.security import SECRET_KEY
from api.dependencies.auth import get_current_user, get_admin_user
from schemas.auth import (
    AdminUpdateUser,
    AdminAddCreditsRequest,
    AdminBulkAction,
    ProfileUpdate,
    RedeemPointsRequest,
    MfaUpdate,
    ApiKeyCreate,
    SaveCardRequest,
    PurchaseCreditsRequest,
    AdminUpdateSettings,
    AdminUpdateProject,
    AnnouncementCreateRequest
)

from repositories.user_repository import (
    get_user_by_id,
    update_user,
    get_user_sessions,
    terminate_user_session,
    get_user_invoices,
    seed_default_invoices_if_empty,
    get_user_api_keys,
    create_user_api_key,
    delete_user_api_key,
    get_creator_analytics,
    create_user_invoice,
    get_user_achievements_and_points,
    get_all_users,
    delete_user,
    get_available_credits,
    record_credit_transaction,
    get_credit_transactions,
    write_audit_log,
    get_audit_logs
)

from repositories.system_repository import (
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

logger = logging.getLogger("sonikoma.auth.profile")
router = APIRouter()

LOW_BALANCE_THRESHOLD = 100


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    seed_default_invoices_if_empty(current_user["user_id"])

    try:
        portfolio_links = json.loads(current_user.get("portfolio_links") or "[]")
    except Exception:
        portfolio_links = []

    try:
        social_connections = json.loads(current_user.get("social_connections") or '{"google":true,"github":false,"discord":false}')
    except Exception:
        social_connections = {"google": True, "github": False, "discord": False}

    try:
        unlocked_rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
    except Exception:
        unlocked_rewards = []

    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    streak = prefs.get("claim_streak", 1)
    if not isinstance(streak, int) or streak < 1 or streak > 7:
        streak = 1

    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    has_claimed_today = current_user.get("last_claimed_date") == today_str

    last_claimed = current_user.get("last_claimed_date")
    if last_claimed and last_claimed != today_str and last_claimed != yesterday_str:
        streak = 1
        prefs["claim_streak"] = 1
        update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})

    ach_data = get_user_achievements_and_points(current_user["user_id"])

    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "avatar_url": current_user["avatar_url"],
        "creator_role": current_user.get("creator_role") or "creator",
        "bio": current_user.get("bio") or "",
        "newsletter": bool(current_user.get("newsletter")),
        "language": current_user.get("language") or "en",
        "portfolio_links": portfolio_links,
        "credits": current_user.get("credits") if current_user.get("credits") is not None else 840,
        "unlocked_rewards": unlocked_rewards,
        "mfa_enabled": bool(current_user.get("mfa_enabled")),
        "social_connections": social_connections,
        "has_claimed_today": has_claimed_today,
        "streak_days": streak,
        "subscription_tier": prefs.get("subscription_tier", "free"),
        "preferences": prefs,
        "unlocked_achievements": ach_data["unlocked_achievements"],
        "achievement_points": ach_data["achievement_points"]
    }


@router.put("/profile")
async def update_profile(body: ProfileUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    updates = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.avatar_url is not None:
        updates["avatar_url"] = body.avatar_url
    if body.creator_role is not None:
        updates["creator_role"] = body.creator_role
    if body.bio is not None:
        updates["bio"] = body.bio
    if body.newsletter is not None:
        updates["newsletter"] = 1 if body.newsletter else 0
    if body.language is not None:
        updates["language"] = body.language
    if body.portfolio_links is not None:
        updates["portfolio_links"] = json.dumps(body.portfolio_links)
    if body.social_connections is not None:
        updates["social_connections"] = json.dumps(body.social_connections)

    ip_addr = request.client.host if request.client else "127.0.0.1"

    if updates:
        update_user(current_user["user_id"], updates)
        write_audit_log(current_user["user_id"], "Updated Profile Settings", ip_addr, "Success")

    return {"success": True, "message": "Profile updated successfully."}


@router.delete("/me")
async def delete_my_account(request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    user_id = current_user['user_id']
    try:
        write_audit_log(user_id, 'Self-deleted account', ip_addr, 'Success')
        delete_user(user_id)
        return {'success': True, 'message': 'Account deleted successfully'}
    except Exception as e:
        logger.error(f'Failed to delete account: {e}')
        write_audit_log(user_id, 'Self-delete account failed', ip_addr, 'Failure')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    sessions = get_user_sessions(current_user["user_id"])
    return {"success": True, "sessions": sessions}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    terminate_user_session(current_user["user_id"], session_id)
    write_audit_log(current_user["user_id"], f"Terminated Device Session: {session_id}", ip_addr, "Success")
    return {"success": True, "message": "Session terminated successfully."}


@router.post("/claim-credits")
async def claim_credits(request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    if current_user.get("last_claimed_date") == today_str:
        raise HTTPException(status_code=400, detail="Daily credits already claimed for today.")

    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    streak = prefs.get("claim_streak", 1)
    if not isinstance(streak, int) or streak < 1 or streak > 7:
        streak = 1

    last_claimed = current_user.get("last_claimed_date")
    if last_claimed == yesterday_str:
        current_streak_day = streak
    else:
        current_streak_day = 1

    REWARDS = {1: 50, 2: 60, 3: 75, 4: 90, 5: 110, 6: 130, 7: 150}
    reward = REWARDS.get(current_streak_day, 50)

    new_credits = record_credit_transaction(current_user["user_id"], reward, "daily_claim")

    next_streak_day = (current_streak_day % 7) + 1
    prefs["claim_streak"] = next_streak_day

    update_user(current_user["user_id"], {
        "last_claimed_date": today_str,
        "preferences": json.dumps(prefs)
    })

    write_audit_log(current_user["user_id"], f"Claimed Daily Bonus Credits (+{reward})", ip_addr, "Success")
    return {
        "success": True,
        "credits": new_credits,
        "streak_days": next_streak_day,
        "message": f"Successfully claimed Day {current_streak_day} reward (+{reward} credits)!"
    }


@router.post("/redeem-points")
async def redeem_points(body: RedeemPointsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if body.reward_type == "credits":
        credits_to_add = int(body.reward_value)
        new_credits = record_credit_transaction(current_user["user_id"], credits_to_add, "points_redemption")

        try:
            rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            rewards = []

        reward_name = f"+{credits_to_add} AI Credits"
        if reward_name not in rewards:
            rewards.append(reward_name)

        update_user(current_user["user_id"], {
            "unlocked_rewards": json.dumps(rewards)
        })
        write_audit_log(current_user["user_id"], f"Exchanged points for +{credits_to_add} compute credits", ip_addr, "Success")
        return {"success": True, "credits": new_credits, "message": f"Successfully exchanged points for +{credits_to_add} credits!"}

    elif body.reward_type == "badge":
        try:
            badges = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            badges = []
        if body.reward_value not in badges:
            badges.append(body.reward_value)
            update_user(current_user["user_id"], {"unlocked_rewards": json.dumps(badges)})
        write_audit_log(current_user["user_id"], f"Unlocked achievement badge: {body.reward_value}", ip_addr, "Success")
        return {"success": True, "badges": badges, "message": f"Badge '{body.reward_value}' unlocked!"}

    raise HTTPException(status_code=400, detail="Invalid reward type specified.")


@router.put("/mfa")
async def toggle_mfa(body: MfaUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    val = 1 if body.mfa_enabled else 0
    update_user(current_user["user_id"], {"mfa_enabled": val})

    event_name = "Activated Two-Factor Authentication (2FA)" if body.mfa_enabled else "Deactivated Two-Factor Authentication (2FA)"
    write_audit_log(current_user["user_id"], event_name, ip_addr, "Success")

    return {"success": True, "mfa_enabled": body.mfa_enabled, "message": f"2FA status set to {body.mfa_enabled}"}


@router.get("/audit-logs")
async def get_user_logs(query: str = "", page: int = 1, limit: int = 3, current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * limit
    logs, total = get_audit_logs(current_user["user_id"], query=query, limit=limit, offset=offset)
    return {
        "success": True,
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/api-keys")
async def get_keys(current_user: dict = Depends(get_current_user)):
    keys = get_user_api_keys(current_user["user_id"])
    return {"success": True, "keys": keys}


@router.post("/api-keys")
async def generate_key(body: ApiKeyCreate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    hex_str = secrets.token_hex(24)
    raw_key = f"av_live_{hex_str}"
    masked_key = f"av_live_{hex_str[:4]}...{hex_str[-4:]}"

    new_key = create_user_api_key(current_user["user_id"], body.name, raw_key)
    write_audit_log(current_user["user_id"], f"Generated Developer API Key: {body.name}", ip_addr, "Success")

    return {
        "success": True,
        "key": {
            "id": new_key["id"],
            "name": body.name,
            "key": masked_key,
            "created": new_key["created"]
        },
        "raw_key": raw_key
    }


@router.delete("/api-keys/{key_id}")
async def revoke_key(key_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    delete_user_api_key(current_user["user_id"], key_id)
    write_audit_log(current_user["user_id"], f"Revoked Developer API Key: {key_id}", ip_addr, "Success")
    return {"success": True, "message": "API Key revoked successfully."}


@router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    seed_default_invoices_if_empty(current_user["user_id"])
    invoices = get_user_invoices(current_user["user_id"])
    return {"success": True, "invoices": invoices}


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    data = get_creator_analytics(current_user["user_id"])
    return {"success": True, "analytics": data}


@router.post("/save-card")
async def save_card(body: SaveCardRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    prefs["card_info"] = {
        "cardHolder": body.cardHolder,
        "cardNo": body.cardNo,
        "cardExpiry": body.cardExpiry,
        "cardCvv": body.cardCvv,
        "isCardSaved": True
    }

    update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})
    write_audit_log(current_user["user_id"], "Saved payment method", ip_addr, "Success")
    return {"success": True, "message": "Card details saved successfully."}


@router.post("/upgrade-plan")
async def upgrade_plan(request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    if prefs.get("subscription_tier") == "pro":
        raise HTTPException(status_code=400, detail="Account is already upgraded to Studio Pro.")

    prefs["subscription_tier"] = "pro"

    current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
    new_credits = min(5000, current_credits + 1000)

    update_user(current_user["user_id"], {
        "creator_role": "pro",
        "credits": new_credits,
        "preferences": json.dumps(prefs)
    })

    create_user_invoice(current_user["user_id"], 19.00, "Paid")
    write_audit_log(current_user["user_id"], "Upgraded subscription to Studio Pro", ip_addr, "Success")
    return {"success": True, "message": "Successfully upgraded to Studio Pro."}


@router.post("/purchase-credits")
async def purchase_credits(body: PurchaseCreditsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    new_credits = record_credit_transaction(current_user["user_id"], body.credits, "purchase")
    create_user_invoice(current_user["user_id"], body.amount, "Paid")

    write_audit_log(current_user["user_id"], f"Purchased {body.credits} compute credits", ip_addr, "Success")
    return {
        "success": True,
        "credits": new_credits,
        "message": f"Successfully purchased {body.credits} credits."
    }


@router.get("/credits")
async def get_credits(current_user: dict = Depends(get_current_user)):
    balance = get_available_credits(current_user["user_id"])
    return {
        "success": True,
        "credits": balance,
        "low_balance": balance < LOW_BALANCE_THRESHOLD,
        "threshold": LOW_BALANCE_THRESHOLD,
    }


@router.get("/transactions")
async def get_transactions(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    limit = min(max(1, limit), 500)
    txs = get_credit_transactions(current_user["user_id"], limit=limit)
    return {"success": True, "transactions": txs, "count": len(txs)}


# ─────────────────────────────────────────────────────────────────────────────
# Admin settings/impersonate & User Management
# ─────────────────────────────────────────────────────────────────────────────

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
        logger.error(f'Failed to create announcement: {e}')
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
