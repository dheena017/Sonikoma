"""
backend/app/api/v1/auth/login.py
─────────────────────────────────────────────────────────────────────────────
Authentication login routes.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import logging
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import verify_password, create_access_token
from repositories.user import get_user_by_email, get_user_by_username, create_user_session, write_audit_log
from schemas.auth import UserLogin

logger = logging.getLogger("sonikoma.auth.login")
router = APIRouter()


@router.post("/token", summary="Obtain OAuth2/JWT access token")
async def login_for_access_token_endpoint(
    request: Request,
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(),
):
    ip_addr = request.client.host if request and request.client else "127.0.0.1"
    content_type = request.headers.get("content-type", "")

    username = form_data.username if form_data else ""
    password = form_data.password if form_data else ""

    if not username or not password:
        if "application/json" in content_type:
            try:
                body = await request.json()
                username = username or body.get("username") or body.get("email") or ""
                password = password or body.get("password") or ""
            except Exception:
                pass
        else:
            try:
                form = await request.form()
                username = username or form.get("username") or form.get("email") or ""
                password = password or form.get("password") or ""
            except Exception:
                pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_email(username) or get_user_by_username(username)

    if (
        not user
        or not user.get("hashed_password")
        or not verify_password(password, user["hashed_password"])
    ):
        if user:
            write_audit_log(user["user_id"], "Token failed login attempt", ip_addr, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    write_audit_log(user["user_id"], "Token Login", ip_addr, "Success")
    access_token = create_access_token(data={"sub": user["user_id"]})
    user_info = {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "avatar_url": user.get("avatar_url")
    }
    from fastapi.responses import JSONResponse

    response = JSONResponse(content={
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    })
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    return response


@router.get("/token", summary="Verify active authentication token")
async def verify_token_endpoint(request: Request):
    auth_header = request.headers.get("authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    import jwt
    from app.core.security import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        from repositories.user import get_user_by_id
        user = get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return {
            "success": True,
            "valid": True,
            "user_id": user_id,
            "user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "full_name": user.get("full_name"),
                "avatar_url": user.get("avatar_url"),
                "creator_role": user.get("creator_role", "creator"),
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/login", summary="Authenticate user email and password")
async def login_endpoint(user_data: UserLogin, request: Request):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    user = get_user_by_email(user_data.email)

    if not user or not user.get("hashed_password") or not verify_password(user_data.password, user["hashed_password"]):
        if user:
            write_audit_log(user["user_id"], "Failed login attempt", ip_addr, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
