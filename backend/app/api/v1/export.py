"""
api/v1/export.py
─────────────────────────────────────────────────────────────────────────────
Compatibility shim — all logic has moved to api/v1/export/ sub-package.

Real implementations live in:
  api/v1/export/router.py      – export_router
  api/v1/export/youtube.py     – _execute_youtube_upload_workflow, upload/export
  api/v1/export/profiles.py    – profiles CRUD
  api/v1/export/credentials.py – custom OAuth secrets CRUD
─────────────────────────────────────────────────────────────────────────────
"""

from api.v1.export.router import export_router
from api.v1.export.youtube import HAS_YOUTUBE_API

router = export_router

__all__ = ["export_router", "router", "HAS_YOUTUBE_API"]
