"""
backend/features/workspace/__init__.py
─────────────────────────────────────────────────────────────────────────────
Workspace Feature Domain Module:
- router:                  Master FastAPI router for creator workspace
- workspace_router:        Alias for router
- Sub-domain routers:      shell_router, storyboard_router, viewer_router, imported_assets_router
- Sub-domain services:     shell_service, storyboard_service, viewer_service, imported_assets_service
- schemas:                 Pydantic models for workspace shell, storyboard, viewer, assets
─────────────────────────────────────────────────────────────────────────────
"""

from .router import (
    router,
    workspace_router,
    shell_router,
    storyboard_router,
    viewer_router,
    imported_assets_router,
)
from .services import (
    ShellService,
    shell_service,
    StoryboardService,
    storyboard_service,
    ViewerService,
    viewer_service,
    ImportedAssetsService,
    imported_assets_service,
    generate_dynamic_panels,
    get_programmatic_panels,
    generate_storyboard_ai,
)
from . import schemas
from . import services

__all__ = [
    # Routers
    "router",
    "workspace_router",
    "shell_router",
    "storyboard_router",
    "viewer_router",
    "imported_assets_router",
    # Services
    "ShellService",
    "shell_service",
    "StoryboardService",
    "storyboard_service",
    "ViewerService",
    "viewer_service",
    "ImportedAssetsService",
    "imported_assets_service",
    "generate_dynamic_panels",
    "get_programmatic_panels",
    "generate_storyboard_ai",
    # Modules
    "schemas",
    "services",
]
