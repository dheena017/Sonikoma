"""
backend/features/admin/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Admin feature router aggregating all admin sub-routes:
- users:      User management, bulk actions, account locking, credit grants, impersonation
- settings:   Global platform settings, resets, cache purge, announcements
- finance:    Credit transaction ledger, user invoices, revenue metrics
- audit:      Audit activity logs, CSV/JSON exports, content moderation logs
- projects:   Global series/project moderation, flag/unflag, deletion
- jobs:       Background job inspection, cancellation, purge
- database:   Superuser database inspector for whitelisted tables
- telemetry:  Platform analytics, LLM token usage, domain scraper rules
- analytics:  AI intelligence analytics
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from .users import router as users_router
from .settings import router as settings_router
from .finance import router as finance_router
from .audit import router as audit_router
from .projects import router as projects_router
from .jobs import router as jobs_router
from .database import router as database_router
from .telemetry import router as telemetry_router

admin_router = APIRouter()

# Mount all modular admin sub-routers
admin_router.include_router(users_router, tags=["14. Superuser Admin - Users"])
admin_router.include_router(settings_router, tags=["14. Superuser Admin - Settings"])
admin_router.include_router(finance_router, tags=["14. Superuser Admin - Finance"])
admin_router.include_router(audit_router, tags=["14. Superuser Admin - Audit"])
admin_router.include_router(projects_router, tags=["14. Superuser Admin - Projects"])
admin_router.include_router(jobs_router, tags=["14. Superuser Admin - Jobs"])
admin_router.include_router(database_router, tags=["14. Superuser Admin - Database"])
admin_router.include_router(telemetry_router, tags=["14. Superuser Admin - Telemetry"])

router = admin_router

__all__ = [
    "admin_router",
    "router",
    "users_router",
    "settings_router",
    "finance_router",
    "audit_router",
    "projects_router",
    "jobs_router",
    "database_router",
    "telemetry_router",
]
