"""
api/v1/projects.py
─────────────────────────────────────────────────────────────────────────────
Compatibility shim — all logic has moved to api/v1/projects/ sub-package.

Real implementations live in:
  api/v1/projects/router.py    – project_router, panel_router (read/delete)
  api/v1/projects/create.py   – create_project, calculate_and_save_token_usage
  api/v1/projects/update.py   – update_project_details, save_project_panels,
                                 increment_project_tokens_route
  api/v1/projects/files.py    – detect_panels_upload, detect_panels_base64
  api/v1/projects/settings.py – series routes, batch-delete, token analytics
  api/v1/projects/_helpers.py – wrap_proxy_url
─────────────────────────────────────────────────────────────────────────────
"""

from api.v1.projects.router import project_router, panel_router
from api.v1.projects._helpers import wrap_proxy_url
from api.v1.projects.create import calculate_and_save_token_usage

# Legacy aliases
router = project_router

__all__ = [
    "project_router",
    "panel_router",
    "router",
    "wrap_proxy_url",
    "calculate_and_save_token_usage",
]
