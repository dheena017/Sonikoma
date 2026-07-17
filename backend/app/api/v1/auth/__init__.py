"""
backend/app/api/v1/auth/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public surface of the auth package. Import `auth_router` from here.
─────────────────────────────────────────────────────────────────────────────
"""

from api.v1.auth.router import auth_router

__all__ = ["auth_router"]
