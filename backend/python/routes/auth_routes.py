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
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
import requests
from google_auth_oauthlib.flow import Flow
from database.db import (
    create_user, get_user_by_email, get_user_by_id, update_user,
    create_user_session, get_user_sessions, terminate_user_session,
    write_audit_log, get_audit_logs, get_user_invoices,
    seed_default_invoices_if_empty, get_user_api_keys,
    create_user_api_key, delete_user_api_key, get_creator_analytics,
    get_user_by_api_key, create_user_invoice, get_user_achievements_and_points,
    get_all_users, delete_user,
    get_platform_settings, update_platform_settings, get_global_audit_logs,
    get_announcements, create_announcement, delete_announcement,
    reset_platform_settings, purge_global_cache,
    check_credits, get_available_credits, record_credit_transaction, get_credit_transactions
)

logger = logging.getLogger("sonikoma.auth")

router = APIRouter()

# ─── Configuration ────────────────────────────────────────────────────────────

# JWT_SECRET_KEY is required for signing JWTs.
# For local development, load backend/.env (and optionally project .env) before failing.
try:
    from dotenv import load_dotenv
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    load_dotenv(os.path.join(PROJECT_ROOT, ".env"), override=False)
    load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"), override=False)
except Exception:
    pass

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("FATAL: JWT_SECRET_KEY environment variable is not set (and not found in .env files).")


ALGORITHM = "HS256"

# PyJWT warns if the HMAC key is too short for the selected hash algorithm.
# Your log shows: "HMAC key is 20 bytes long ... below minimum recommended length of 32 bytes for SHA256".
# To keep backward compatibility with already-issued tokens, we only *derive* a longer key
# when the configured secret is too short.

def _harden_jwt_secret(secret: str) -> tuple[str, bool]:
    # HS256 uses SHA256 (recommended min key length is 32 bytes)
    # If the secret is already long enough, leave it unchanged.
    if isinstance(secret, str) and len(secret.encode("utf-8")) >= 32:
        return secret, False

    # Deterministically derive a 32-byte key from the provided secret so that
    # the server restarts verify the same tokens (for the same short secret).
    import hashlib

    derived = hashlib.sha256(secret.encode("utf-8")).digest()  # 32 bytes
    # JWT expects a str/bytes; keep it as hex string for readability.
    return derived.hex(), True


_SECRET_KEY_HARDENED, _WAS_DERIVED = _harden_jwt_secret(SECRET_KEY)
# Use the hardened secret for both encoding and decoding.
SECRET_KEY = _SECRET_KEY_HARDENED

if _WAS_DERIVED:
    logger.warning(
        "[Auth] JWT_SECRET_KEY was shorter than 32 bytes; using a hardened SHA256-derived key for HS256. "
        "This removes PyJWT InsecureKeyLengthWarning."
    )
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365  # 1 year default

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

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

async def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    # If called manually in middleware, token will be the Depends object.
    # We must extract the actual token string.
    if not token or not isinstance(token, str):
        auth_header = request.headers.get("Authorization")
        if auth_header:
            scheme, _, param = auth_header.partition(" ")
            if scheme.lower() == "bearer":
                token = param
            else:
                token = auth_header
        else:
            token = request.query_params.get("token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or not isinstance(token, str):
        raise credentials_exception

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

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('creator_role') != 'admin':
        raise HTTPException(status_code=403, detail="Administrative privileges required.")
    return current_user
# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/token", include_in_schema=False)
async def login_for_swagger_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
):
    """Used exclusively by Swagger UI 'Authorize' button.

    Swagger sends application/x-www-form-urlencoded with fields:
    - username (mapped here to user's email)
    - password
    """
    # Temporary debug (safe for dev): helps confirm Swagger form fields
    print(f"--- SWAGGER LOGIN ATTEMPT ---")
    print(f"Email entered: '{form_data.username}'")
    print(f"Password entered: '{form_data.password}'")

    user = get_user_by_email(form_data.username)
    ip_addr = request.client.host if request and request.client else "127.0.0.1"

    if (
        not user
        or not user.get("hashed_password")
        or not verify_password(form_data.password, user["hashed_password"])
    ):
        if user:
            write_audit_log(user["user_id"], "Swagger UI failed login attempt", ip_addr, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    write_audit_log(user["user_id"], "Swagger UI Login", ip_addr, "Success")

    access_token = create_access_token(data={"sub": user["user_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

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


@router.get("/google/login", summary="Initiate Google OAuth2 authentication flow")
async def google_login(request: Request):
    import urllib.parse
    import json

    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    client_secrets_file = os.path.join(PROJECT_ROOT, "client_secrets.json")
    if not os.path.exists(client_secrets_file):
        cwd_secrets = os.path.join(os.getcwd(), "client_secrets.json")
        if os.path.exists(cwd_secrets):
            client_secrets_file = cwd_secrets

    if not os.path.exists(client_secrets_file):
        repo_default = os.path.join(PROJECT_ROOT, "backend", "python", "client_secrets.json")
        if os.path.exists(repo_default):
            client_secrets_file = repo_default

    if not os.path.exists(client_secrets_file):
        raise HTTPException(
            status_code=400,
            detail="Google login is not configured on the server. Please add 'client_secrets.json' to the project root."
        )

    try:
        with open(client_secrets_file, "r", encoding="utf-8") as f:
            secrets_data = json.load(f)
        key = "web" if "web" in secrets_data else "installed"
        client_id = secrets_data[key]["client_id"]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse client_secrets.json: {e}"
        )

    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" else "http"
    redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.upload"
    ]

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent"
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(auth_url)


@router.get("/google/callback", summary="Google OAuth2 authentication callback")
async def google_callback(request: Request):
    import json
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    client_secrets_file = os.path.join(PROJECT_ROOT, "client_secrets.json")
    if not os.path.exists(client_secrets_file):
        cwd_secrets = os.path.join(os.getcwd(), "client_secrets.json")
        if os.path.exists(cwd_secrets):
            client_secrets_file = cwd_secrets

    if not os.path.exists(client_secrets_file):
        repo_default = os.path.join(PROJECT_ROOT, "backend", "python", "client_secrets.json")
        if os.path.exists(repo_default):
            client_secrets_file = repo_default

    try:
        with open(client_secrets_file, "r", encoding="utf-8") as f:
            secrets_data = json.load(f)
        key = "web" if "web" in secrets_data else "installed"
        client_id = secrets_data[key]["client_id"]
        client_secret = secrets_data[key]["client_secret"]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse client_secrets.json: {e}"
        )

    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" else "http"
    redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

    # Stateless POST request to exchange authorization code for access tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }

    try:
        token_resp = requests.post(token_url, data=token_payload)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_resp.text}")
        
        token_data = token_resp.json()
        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise HTTPException(status_code=400, detail="Google response did not return an access token")

        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {google_access_token}"}
        resp = requests.get(user_info_url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch userinfo from Google")
        
        info = resp.json()
        email = info.get("email")
        google_id = info.get("sub")
        name = info.get("name") or email.split("@")[0]
        picture = info.get("picture") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={google_id}"

        if not email:
            raise HTTPException(status_code=400, detail="Google account did not return a valid email address")

        user = get_user_by_email(email)
        if not user:
            user_uuid = f"user_{uuid.uuid4().hex[:8]}"
            user_data = {
                "id": user_uuid,
                "email": email,
                "google_id": google_id,
                "full_name": name,
                "avatar_url": picture,
                "password_hash": get_password_hash(f"google_oauth_{uuid.uuid4().hex}"),
            }
            create_user(user_data)
            user = get_user_by_email(email)
        elif not user.get("google_id"):
            update_user(user["user_id"], {"google_id": google_id})
            user["google_id"] = google_id

        access_token = create_access_token(data={"sub": user["user_id"]})
        frontend_url = "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/?token={access_token}")
    except Exception as e:
        logger.error(f"[Google Auth] Callback processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Google Callback processing failed: {e}")


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
async def get_admin_users(current_user: dict = Depends(get_admin_user)):
    users = get_all_users()
    return {"success": True, "users": users}

class AdminUpdateUser(BaseModel):
    creator_role: Optional[str] = None
    credits: Optional[int] = None
    is_locked: Optional[bool] = None
    reason: Optional[str] = None

@router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUpdateUser, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    # Self-protection
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

class AdminAddCreditsRequest(BaseModel):
    amount: int
    reason: Optional[str] = "Manual admin credit grant"

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

class AdminBulkAction(BaseModel):
    user_ids: list[str]
    action: str  # 'add_credits', 'set_role', 'delete'
    value: Optional[str] = None

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
    
    # Record daily claim transaction in ledger and update balances
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
        # Record points exchange transaction
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
    """
    Return the current credit balance for the authenticated user.
    This lightweight endpoint is polled by the header to keep the UI in sync.
    """
    balance = get_available_credits(current_user["user_id"])
    return {"success": True, "credits": balance}

@router.get("/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """
    Return the transaction ledger history list for the authenticated user.
    """
    txs = get_credit_transactions(current_user["user_id"])
    return {"success": True, "transactions": txs}


# --- Ultimate Admin Features -----------------------------------------------

@router.get('/admin/settings')
async def admin_get_settings(current_user: dict = Depends(get_admin_user)):
    return {'success': True, 'settings': get_platform_settings()}

class AdminUpdateSettings(BaseModel):
    settings: dict[str, str]

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
        
    # Generate an access token for the target user
    access_token_expires = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440')))
    expire = datetime.utcnow() + access_token_expires
    to_encode = {'sub': target_user['email'], 'user_id': target_user['id'], 'exp': expire, 'is_impersonation': True}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm='HS256')
    
    write_audit_log(current_user['user_id'], f'Admin impersonated user {user_id}', ip_addr, 'Success')
    return {'success': True, 'access_token': encoded_jwt, 'token_type': 'bearer', 'impersonated_user': target_user}


# --- Ultimate Admin V2 Endpoints ------------------------------------------

from database.db import get_all_projects_admin, get_global_analytics, delete_series_admin

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
        from fastapi.responses import StreamingResponse

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
        from database.db import admin_query_db
        data = admin_query_db(table, limit, offset)
        return {'success': True, 'data': data}
    except Exception as e:
        logger.error(f'DB Query failed: {e}')
        raise HTTPException(status_code=500, detail=str(e))

class AdminUpdateProject(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    is_flagged: Optional[int] = None
    reason: Optional[str] = None

@router.put('/admin/projects/{project_id}')
async def admin_update_project(project_id: str, body: AdminUpdateProject, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = request.client.host if request.client else '127.0.0.1'
    try:
        from database.db import update_series_admin
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


@router.delete('/me')
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

@router.get('/admin/announcements')
async def admin_get_announcements(current_user: dict = Depends(get_admin_user)):
    try:
        return {'success': True, 'announcements': get_announcements()}
    except Exception as e:
        logger.error(f'Failed to fetch announcements: {e}')
        raise HTTPException(status_code=500, detail=str(e))

class AnnouncementCreateRequest(BaseModel):
    title: str
    message: str
    type: Optional[str] = 'info'

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
