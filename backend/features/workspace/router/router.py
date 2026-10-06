"""
backend/features/workspace/router/router.py
─────────────────────────────────────────────────────────────────────────────
Aggregate router for the Workspace domain.
Combines sub-domains:
- /workspace/shell: Workspace mode layout, session state, and canvas settings
- /workspace/storyboard: Storyboard generation, frame updates, and scripts
- /workspace/viewer: Webtoon & manga chapter reader and progress tracking
- /workspace/imported-assets: Project media asset library and file uploads
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from .shell import router as shell_router
from .storyboard import router as storyboard_router
from .viewer import router as viewer_router
from .imported_assets import router as imported_assets_router

router = APIRouter(prefix="/workspace", tags=["Workspace"])

router.include_router(shell_router)
router.include_router(storyboard_router)
router.include_router(viewer_router)
router.include_router(imported_assets_router)

workspace_router = router

__all__ = [
    "router",
    "workspace_router",
    "shell_router",
    "storyboard_router",
    "viewer_router",
    "imported_assets_router",
]
