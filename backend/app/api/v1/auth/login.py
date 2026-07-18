"""
backend/app/api/v1/auth/login.py
─────────────────────────────────────────────────────────────────────────────
Authentication login routes.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm

from core.security import verify_password, create_access_token
from repositories.user import get_user_by_email, create_user_session, write_audit_log
from schemas.auth import UserLogin

logger = logging.getLogger("sonikoma.auth.login")
router = APIRouter()


@router.post("/token", include_in_schema=False)
async def login_for_swagger_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
):
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
