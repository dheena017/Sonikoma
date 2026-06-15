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
    create_user_api_key, delete_user_api_key
)

logger = logging.getLogger("anivox.auth")

router = APIRouter()

# ─── Configuration ────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "anivox_super_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ─── Models ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str



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

    access_token = create_access_token(data={"sub": user["user_id"]})
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

    import datetime
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    has_claimed_today = current_user.get("last_claimed_date") == today_str

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
        "has_claimed_today": has_claimed_today
    }


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
    ip_addr = request.client.host if request.client else "127.0.0.1"
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    if current_user.get("last_claimed_date") == today_str:
        raise HTTPException(status_code=400, detail="Daily credits already claimed for today.")
        
    current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
    new_credits = min(5000, current_credits + 50)
    
    update_user(current_user["user_id"], {
        "credits": new_credits,
        "last_claimed_date": today_str
    })
    
    write_audit_log(current_user["user_id"], "Claimed Daily Bonus Credits (+50)", ip_addr, "Success")
    return {"success": True, "credits": new_credits, "message": "Successfully claimed daily credits bonus."}

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
        update_user(current_user["user_id"], {"credits": new_credits})
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
    
    new_key = create_user_api_key(current_user["user_id"], body.name, masked_key)
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
