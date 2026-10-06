"""
backend/app/features/platform/router.py
─────────────────────────────────────────────────────────────────────────────
Aggregate router for the Platform domain.
Combines sub-domains: shell, dashboard, projects, scraper, shortcuts,
terminal, notifications, and jobs.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from .shell.router import router as shell_router
from .dashboard.router import router as dashboard_router
from .projects.router import router as projects_router
from .scraper.router import router as scraper_router
from .shortcuts.router import router as shortcuts_router
from .terminal.router import router as terminal_router
from .notifications.router import router as notifications_router
from .jobs.router import router as jobs_router
from .health.router import router as health_router

router = APIRouter(prefix="/platform", tags=["Platform"])

router.include_router(shell_router)
router.include_router(dashboard_router)
router.include_router(projects_router, prefix="/projects")
router.include_router(scraper_router, prefix="/scraper")
router.include_router(shortcuts_router)
router.include_router(terminal_router)
router.include_router(notifications_router)
router.include_router(jobs_router, prefix="/jobs")
router.include_router(health_router)
