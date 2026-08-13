"""
backend/app/services/auth/__init__.py
─────────────────────────────────────────────────────────────────────────────
Authentication and authorization services package.
─────────────────────────────────────────────────────────────────────────────
"""

from services.auth.auth_service import AuthService

__all__ = ["AuthService"]
