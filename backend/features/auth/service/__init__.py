"""
backend/features/auth/service/__init__.py
─────────────────────────────────────────────────────────────────────────────
Auth Service Domain Module:
Exports the AuthService class and singleton auth_service instance.
─────────────────────────────────────────────────────────────────────────────
"""

from .auth_service import AuthService, auth_service

__all__ = ["AuthService", "auth_service"]
