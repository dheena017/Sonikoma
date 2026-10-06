"""
backend/app/features
─────────────────────────────────────────────────────────────────────────────
Sonikoma Domain-Driven Architecture Package
Exposes 10 domain feature routers mirroring the frontend feature layout:
  1. auth
  2. profile
  3. admin
  4. platform
  5. workspace
  6. image_editor
  7. video_editor
  8. creative
  9. intelligence
  10. landing
─────────────────────────────────────────────────────────────────────────────
"""

from .auth.router import router as auth_router
from .profile.router import router as profile_router
from .admin.router import router as admin_router
from .platform.router import router as platform_router
from .workspace.router import router as workspace_router
from .image_editor.router import router as image_editor_router
from .video_editor.router import router as video_editor_router
from .creative.router import router as creative_router
from .intelligence.router import router as intelligence_router
from .landing.router import router as landing_router

__all__ = [
    "auth_router",
    "profile_router",
    "admin_router",
    "platform_router",
    "workspace_router",
    "image_editor_router",
    "video_editor_router",
    "creative_router",
    "intelligence_router",
    "landing_router",
]
