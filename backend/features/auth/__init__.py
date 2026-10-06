"""
backend/features/auth/__init__.py
─────────────────────────────────────────────────────────────────────────────
Auth Feature Module:
- router:       Master FastAPI router for authentication
- service:      AuthService class and auth_service singleton
- schemas:      Pydantic request & response schemas for auth, profile, and tokens
─────────────────────────────────────────────────────────────────────────────
"""

from .router import auth_router, router
from .service import AuthService, auth_service
from . import schemas

__all__ = [
    "auth_router",
    "router",
    "AuthService",
    "auth_service",
    "schemas",
]
