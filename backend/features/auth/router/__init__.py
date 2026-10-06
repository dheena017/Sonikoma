"""
backend/features/auth/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Auth Feature Router Package:
Aggregates authentication, account creation, password management, and OAuth2:
- login:      /token, /login (form & JSON credentials)
- register:   /register (new creator onboarding)
- password:   /forgot-password, /password (credential updates)
- oauth:      /google/login, /google/callback, /google/session
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from .login import router as login_router
from .register import router as register_router
from .password import router as password_router
from .oauth import router as oauth_router

auth_router = APIRouter()

auth_router.include_router(login_router, tags=["01A. Authentication & Security"])
auth_router.include_router(register_router, tags=["01A. Authentication & Security"])
auth_router.include_router(password_router, tags=["01A. Authentication & Security"])
auth_router.include_router(oauth_router, prefix="/google", tags=["01A. Authentication & Security"])

router = auth_router

__all__ = [
    "auth_router",
    "router",
    "login_router",
    "register_router",
    "password_router",
    "oauth_router",
]
