"""
backend/features/auth/login.py
─────────────────────────────────────────────────────────────────────────────
Authentication login routes:
- /token: OAuth2 Form and JSON password login with cookie injection
- /login: Email & password authentication endpoint
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from features.auth.schemas import UserLogin
from features.auth.service import auth_service

logger = logging.getLogger("sonikoma.auth.login")
from common import get_client_ip

router = APIRouter()


@router.post("/token", summary="Obtain OAuth2/JWT access token")
async def login_for_access_token_endpoint(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    ip_addr = get_client_ip(request)
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

    try:
        user_agent = request.headers.get("user-agent", "Unknown Browser")
        res = auth_service.login_user(
            username_or_email=username,
            password=password,
            remember_me=False,
            ip_addr=ip_addr,
            user_agent=user_agent,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    response = JSONResponse(content={
        "success": True,
        "access_token": res["access_token"],
        "token_type": res["token_type"],
        "user": res["user"],
    })
    response.set_cookie(
        key="access_token",
        value=res["access_token"],
        httponly=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    return response


@router.post("/login", summary="Authenticate user email and password")
async def login_endpoint(user_data: UserLogin, request: Request):
    ip_addr = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "Unknown Browser")
    try:
        return auth_service.login_user(
            username_or_email=user_data.email,
            password=user_data.password,
            remember_me=bool(user_data.rememberMe),
            ip_addr=ip_addr,
            user_agent=user_agent,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
