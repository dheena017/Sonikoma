"""
backend/app/api/v1/auth/profile.py
─────────────────────────────────────────────────────────────────────────────
User Profile, Sessions, Invoices, and Account Deletion endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Request

from api.dependencies.auth import get_current_user
from backend.schemas.auth import ProfileUpdate
from repositories.user_repository import (
    update_user,
    get_user_sessions,
    terminate_user_session,
    get_user_invoices,
    seed_default_invoices_if_empty,
    get_user_achievements_and_points,
    delete_user,
    write_audit_log,
    get_audit_logs
)

logger = logging.getLogger("sonikoma.auth.profile")
router = APIRouter()


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


@router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    seed_default_invoices_if_empty(current_user["user_id"])
    invoices = get_user_invoices(current_user["user_id"])
    return {"success": True, "invoices": invoices}
