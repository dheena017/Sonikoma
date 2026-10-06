"""
backend/app/api/v1/projects/router.py
─────────────────────────────────────────────────────────────────────────────
Master Consolidated Router for all Projects & Workspace APIs:
- Transfers & Analytics:  /transfer, /analytics/tokens, /series
- Dedicated Settings:     /{projectId}/settings (video, audio, autocrop)
- Panels & CV Detection:  /{projectId}/panels, /detect, /detect-base64
- Core Project CRUD:      /, /public/{id}, /{projectId}, /batch-delete
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.platform.projects.transfers import router as transfers_router
from features.platform.projects.settings import router as settings_router
from features.platform.projects.panels import router as panels_router
from features.platform.projects.crud import (
    router as crud_router,
    get_projects_endpoint,
    create_project_endpoint,
)

project_router = APIRouter()

# 1. Mount specific workflows first (ensures clean routing precedence)
project_router.include_router(transfers_router)
project_router.include_router(settings_router)
project_router.include_router(panels_router)

# 2. Mount CRUD router (contains list, create, update, delete, and wildcard /{project_id_or_slug})
project_router.include_router(crud_router)

# 3. Support root endpoints without trailing slash (/api/v1/projects) in addition to (/api/v1/projects/)
project_router.add_api_route("", get_projects_endpoint, methods=["GET"], include_in_schema=False)
project_router.add_api_route("", create_project_endpoint, methods=["POST"], include_in_schema=False)

router = project_router

__all__ = ["router", "project_router"]
