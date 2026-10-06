"""
backend/app/router
─────────────────────────────────────────────────────────────────────────────
Master router package (mirrors frontend/src/app/router/).
─────────────────────────────────────────────────────────────────────────────
"""

from .router import api_router, register_routers

__all__ = ["api_router", "register_routers"]
