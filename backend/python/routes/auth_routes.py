"""
backend/python/routes/auth_routes.py
─────────────────────────────────────────────────────────────────────────────
Authentication routes for User Registration, Login, and Google Auth.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from database.db import (
    create_user, get_user_by_email, get_user_by_id, update_user,
    create_user_session, get_user_sessions, terminate_user_session,
    write_audit_log, get_audit_logs, get_user_invoices,
    seed_default_invoices_if_empty, get_user_api_keys,
    create_user_api_key, delete_user_api_key, get_creator_analytics,
    get_user_by_api_key, create_user_invoice, get_user_achievements_and_points,
    get_all_users, delete_user,
    get_platform_settings, update_platform_settings, get_global_audit_logs
)

logger = logging.getLogger("sonikoma.auth")

router = APIRouter()

# ─── Configuration ────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sonikoma_super_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365  # 1 year default

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ─── Models ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    rememberMe: Optional[bool] = False



class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# ─── Helpers ──────────────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"[Auth] Password verification failed: {e}")
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Authenticate via Developer API key if token starts with av_live_
    if token.startswith("av_live_"):
        user = get_user_by_api_key(token)
        if user is None:
            raise credentials_exception
        return user

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_id = f"user_{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(user_data.password)

    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "full_name": user_data.full_name,
        "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"
    }

    try:
        create_user(new_user)
        logger.info(f"[Auth] Registered new user: {user_data.email}")

        # Return token immediately after registration
        access_token = create_access_token(data={"sub": user_id})
        user_info = {
            "user_id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "avatar_url": new_user["avatar_url"]
        }
        return {"access_token": access_token, "token_type": "bearer", "user": user_info}
    except Exception as e:
        logger.error(f"[Auth] Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(user_data: UserLogin, request: Request):
    user = get_user_by_email(user_data.email)
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    if not user or not user["hashed_password"] or not verify_password(user_data.password, user["hashed_password"]):
        if user:
            write_audit_log(user["user_id"], "Failed login attempt", ip_addr, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log device session on successful login
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    user_agent = request.headers.get("user-agent", "Unknown Browser")
    browser_name = "Chrome on Windows"
    if "Firefox" in user_agent:
        browser_name = "Firefox on Linux"
    elif "Safari" in user_agent and "Chrome" not in user_agent:
        browser_name = "Safari on macOS"
    elif "Edge" in user_agent:
        browser_name = "Edge on Windows"
        
    create_user_session(user["user_id"], session_id, browser_name, ip_addr, "New York, USA")
    write_audit_log(user["user_id"], f"User login via {browser_name}", ip_addr, "Success")

    expires_delta = timedelta(days=365) if user_data.rememberMe else timedelta(days=30)
    access_token = create_access_token(data={"sub": user["user_id"]}, expires_delta=expires_delta)
    user_info = {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "avatar_url": user["avatar_url"]
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}



@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = get_user_by_email(request.email)
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If an account exists for this email, you will receive a reset link shortly."}

    # In a real app, generate a reset token and send an email
    logger.info(f"[Auth] Forgot password request for {request.email}. Reset link would be sent.")

    return {"message": "If an account exists for this email, you will receive a reset link shortly."}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    seed_default_invoices_if_empty(current_user["user_id"])
    
    import json
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

    import datetime
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

@router.get("/admin/users")
async def get_admin_users(current_user: dict = Depends(get_current_user)):
    # For now, allow any authenticated user or specific admins
    users = get_all_users()
    return {"success": True, "users": users}

class AdminUpdateUser(BaseModel):
    creator_role: Optional[str] = None
    credits: Optional[int] = None

@router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUpdateUser, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    updates = {}
    if body.creator_role is not None:
        updates["creator_role"] = body.creator_role
    if body.credits is not None:
        updates["credits"] = body.credits
        
    if updates:
        update_user(user_id, updates)
        write_audit_log(current_user["user_id"], f"Admin updated user {user_id} settings", ip_addr, "Success")
        
    return {"success": True, "message": "User updated successfully."}

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    delete_user(user_id)
    write_audit_log(current_user["user_id"], f"Admin deleted user {user_id}", ip_addr, "Success")
    
    return {"success": True, "message": "User deleted successfully."}

@router.get("/admin/users/{user_id}/logs")
async def admin_get_user_logs(user_id: str, query: str = "", page: int = 1, limit: int = 20, current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * limit
    logs, total = get_audit_logs(user_id, query=query, limit=limit, offset=offset)
    return {
        "success": True, 
        "logs": logs, 
        "total": total, 
        "page": page, 
        "limit": limit
    }

class AdminBulkAction(BaseModel):
    user_ids: list[str]
    action: str  # 'add_credits', 'set_role', 'delete'
    value: Optional[str] = None

@router.post("/admin/users/bulk")
async def admin_bulk_action(body: AdminBulkAction, request: Request, current_user: dict = Depends(get_current_user)):
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

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    creator_role: Optional[str] = None
    bio: Optional[str] = None
    newsletter: Optional[bool] = None
    language: Optional[str] = None
    portfolio_links: Optional[list[str]] = None
    social_connections: Optional[dict[str, bool]] = None

@router.put("/profile")
async def update_profile(body: ProfileUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    import json
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

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/password")
async def update_password(body: PasswordUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    if not current_user["hashed_password"] or not verify_password(body.current_password, current_user["hashed_password"]):
        write_audit_log(current_user["user_id"], "Change Password Attempt", ip_addr, "Failed")
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed = get_password_hash(body.new_password)
    update_user(current_user["user_id"], {"hashed_password": hashed})
    write_audit_log(current_user["user_id"], "Changed Account Password", ip_addr, "Success")
    
    return {"success": True, "message": "Password updated successfully."}

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
    import datetime
    import json
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
    
    current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
    new_credits = min(5000, current_credits + reward)
    
    next_streak_day = (current_streak_day % 7) + 1
    prefs["claim_streak"] = next_streak_day
    
    update_user(current_user["user_id"], {
        "credits": new_credits,
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

class RedeemPointsRequest(BaseModel):
    points: int
    reward_type: str
    reward_value: str

@router.post("/redeem-points")
async def redeem_points(body: RedeemPointsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    import json
    
    if body.reward_type == "credits":
        credits_to_add = int(body.reward_value)
        current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
        new_credits = min(5000, current_credits + credits_to_add)
        
        try:
            rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            rewards = []
            
        reward_name = f"+{credits_to_add} AI Credits"
        if reward_name not in rewards:
            rewards.append(reward_name)
            
        update_user(current_user["user_id"], {
            "credits": new_credits,
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

class MfaUpdate(BaseModel):
    mfa_enabled: bool

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

class ApiKeyCreate(BaseModel):
    name: str

@router.get("/api-keys")
async def get_keys(current_user: dict = Depends(get_current_user)):
    keys = get_user_api_keys(current_user["user_id"])
    return {"success": True, "keys": keys}

@router.post("/api-keys")
async def generate_key(body: ApiKeyCreate, request: Request, current_user: dict = Depends(get_current_user)):
    import secrets
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

class SaveCardRequest(BaseModel):
    cardHolder: str
    cardNo: str
    cardExpiry: str
    cardCvv: str

@router.post("/save-card")
async def save_card(body: SaveCardRequest, request: Request, current_user: dict = Depends(get_current_user)):
    import json
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
    import json
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

class PurchaseCreditsRequest(BaseModel):
    credits: int
    amount: float

@router.post("/purchase-credits")
async def purchase_credits(body: PurchaseCreditsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    import json
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
    new_credits = min(5000, current_credits + body.credits)
    
    update_user(current_user["user_id"], {
        "credits": new_credits
    })
    
    create_user_invoice(current_user["user_id"], body.amount, "Paid")
    
    write_audit_log(current_user["user_id"], f"Purchased {body.credits} compute credits", ip_addr, "Success")
    return {
        "success": True, 
        "credits": new_credits, 
        "message": f"Successfully purchased {body.credits} credits."
    }

# --- Ultimate Admin Features -----------------------------------------------

@router.get('/admin/settings')
async def admin_get_settings(current_user: dict = Depends(get_current_user)):
    return {'success': True, 'settings': get_platform_settings()}

class AdminUpdateSettings(BaseModel):
    settings: dict[str, str]

@router.put('/admin/settings')
async def admin_update_settings(body: AdminUpdateSettings, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    update_platform_settings(body.settings)
    write_audit_log(current_user['user_id'], 'Admin updated global platform settings', ip_addr, 'Success')
    return {'success': True, 'message': 'Settings updated successfully.'}

@router.get('/admin/audit-logs')
async def admin_get_global_audit_logs(limit: int = 50, current_user: dict = Depends(get_current_user)):
    return {'success': True, 'logs': get_global_audit_logs(limit)}

@router.post('/admin/impersonate/{user_id}')
async def admin_impersonate_user(user_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    target_user = get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail='User not found')
        
    # Generate an access token for the target user
    access_token_expires = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440')))
    expire = datetime.utcnow() + access_token_expires
    to_encode = {'sub': target_user['email'], 'user_id': target_user['id'], 'exp': expire, 'is_impersonation': True}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm='HS256')
    
    write_audit_log(current_user['user_id'], f'Admin impersonated user {user_id}', ip_addr, 'Success')
    return {'success': True, 'access_token': encoded_jwt, 'token_type': 'bearer', 'impersonated_user': target_user}

