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
from api.v1.auth.password import router as password_router
from api.v1.auth.oauth import router as oauth_router

auth_router = APIRouter()

# ── Authentication & session ─────────────────────────────────────────────────
auth_router.include_router(login_router, tags=["Auth - Login"])
auth_router.include_router(register_router, tags=["Auth - Register"])

# ── Password management ───────────────────────────────────────────────────────
auth_router.include_router(password_router, tags=["Auth - Password"])

# ── User profile, admin & settings ───────────────────────────────────────────
auth_router.include_router(profile_router, tags=["Auth - Profile"])

# ── OAuth (Google) ────────────────────────────────────────────────────────────
auth_router.include_router(oauth_router, prefix="/google", tags=["Auth - OAuth"])
