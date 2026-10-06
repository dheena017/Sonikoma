"""
backend/features/workspace/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Workspace Router Package:
Exports aggregated and sub-domain routers:
- router / workspace_router
- shell_router
- storyboard_router
- viewer_router
- imported_assets_router
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

__all__ = [
    "router",
    "workspace_router",
    "shell_router",
    "storyboard_router",
    "viewer_router",
    "imported_assets_router",
]
