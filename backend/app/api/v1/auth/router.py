"""
backend/app/api/v1/auth/router.py
─────────────────────────────────────────────────────────────────────────────
Central router that assembles all auth sub-routers into a single router
to be mounted by api/router.py.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from api.v1.auth.login import router as login_router
from api.v1.auth.register import router as register_router
from api.v1.auth.profile import router as profile_router
from api.v1.auth.avatar import router as avatar_router
from api.v1.auth.preferences import router as preferences_router
from api.v1.auth.api_keys import router as api_keys_router
from api.v1.auth.admin_settings import router as settings_router
from api.v1.auth.password import router as password_router
from api.v1.auth.oauth import router as oauth_router

auth_router = APIRouter()

# ── Authentication & session ─────────────────────────────────────────────────
auth_router.include_router(login_router, tags=["01A. Authentication & Security"])
auth_router.include_router(register_router, tags=["01A. Authentication & Security"])
auth_router.include_router(password_router, tags=["01A. Authentication & Security"])
auth_router.include_router(oauth_router, prefix="/google", tags=["01A. Authentication & Security"])

# ── User profile & settings ──────────────────────────────────────────────────
auth_router.include_router(profile_router, tags=["01B. Creator Profile & API Keys"])
auth_router.include_router(avatar_router, tags=["01B. Creator Profile & API Keys"])
auth_router.include_router(preferences_router, tags=["01B. Creator Profile & API Keys"])
auth_router.include_router(api_keys_router, tags=["01B. Creator Profile & API Keys"])

# ── Superuser Admin Console ──────────────────────────────────────────────────
auth_router.include_router(settings_router, tags=["14. Superuser Admin Console"])
