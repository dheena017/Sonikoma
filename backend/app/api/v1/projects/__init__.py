"""
api/v1/projects/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public surface of the projects package.
─────────────────────────────────────────────────────────────────────────────
"""

from api.v1.projects.router import project_router, panel_router

__all__ = ["project_router", "panel_router"]
