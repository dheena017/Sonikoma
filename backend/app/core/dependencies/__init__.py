"""
backend/core/dependencies
─────────────────────────────────────────────────────────────────────────────
Core FastAPI dependency injection exports.
─────────────────────────────────────────────────────────────────────────────
"""

from .auth import (
    get_current_user,
    get_optional_current_user,
    get_admin_user,
    clean_api_key,
    get_all_user_keys,
    oauth2_scheme,
    get_auth_service,
)

__all__ = [
    "get_current_user",
    "get_optional_current_user",
    "get_admin_user",
    "clean_api_key",
    "get_all_user_keys",
    "oauth2_scheme",
    "get_auth_service",
]
