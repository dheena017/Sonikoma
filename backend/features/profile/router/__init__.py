"""
backend/features/profile/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Profile Feature Router Package:
Aggregates profile details, avatar uploads, studio preferences/billing,
and developer API keys into unified `profile_router` / `router`.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.profile.router.profile import router as profile_details_router
from features.profile.router.avatar import router as avatar_router
from features.profile.router.preferences import router as preferences_router
from features.profile.router.api_keys import router as api_keys_router

profile_router = APIRouter()

# ── 1. User Profile Details, Sessions, Invoices & Audit Logs ─────────────────
profile_router.include_router(profile_details_router, tags=["01B. Creator Profile & API Keys"])

# ── 2. Avatar Upload & External YouTube OAuth Sync ───────────────────────────
profile_router.include_router(avatar_router, tags=["01B. Creator Profile & API Keys"])

# ── 3. Preferences, Points, MFA & Compute Credits ───────────────────────────
profile_router.include_router(preferences_router, tags=["01B. Creator Profile & API Keys"])

# ── 4. Developer API Keys Management ─────────────────────────────────────────
profile_router.include_router(api_keys_router, tags=["01B. Creator Profile & API Keys"])

router = profile_router

__all__ = [
    "profile_router",
    "router",
    "profile_details_router",
    "avatar_router",
    "preferences_router",
    "api_keys_router",
]
