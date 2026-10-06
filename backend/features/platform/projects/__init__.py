"""
backend/app/api/v1/projects/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public package barrel export for Projects API module.
─────────────────────────────────────────────────────────────────────────────
"""

from features.platform.projects.router import project_router
from features.platform.projects.crud import router as crud_router
from features.platform.projects.panels import router as panels_router
from features.platform.projects.settings import router as settings_router
from features.platform.projects.transfers import router as transfers_router

__all__ = [
    "project_router",
    "crud_router",
    "panels_router",
    "settings_router",
    "transfers_router",
]
