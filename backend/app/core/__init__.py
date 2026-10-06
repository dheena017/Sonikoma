"""
backend/core
─────────────────────────────────────────────────────────────────────────────
Sonikoma Core Infrastructure Package
Centralizes settings, security, logging, cache, middleware, and exception handling.
─────────────────────────────────────────────────────────────────────────────
"""

from .config import (
    API_VERSION,
    IS_PRODUCTION,
    NODE_ENV,
    BACKEND_PORT,
    FRONTEND_PORT,
    PROJECT_ROOT,
    STORAGE_DIR,
)
from .security import (
    SECRET_KEY,
    ALGORITHM,
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from .logging import logger, setup_logging
from .cache import get_all_cache_stats, clear_all_caches
from .exceptions import global_exception_handler
from .middleware import setup_middleware
from .dependencies import (
    get_current_user,
    get_optional_current_user,
    get_admin_user,
    clean_api_key,
    get_all_user_keys,
    oauth2_scheme,
    get_auth_service,
)

__all__ = [
    "API_VERSION",
    "IS_PRODUCTION",
    "NODE_ENV",
    "BACKEND_PORT",
    "FRONTEND_PORT",
    "PROJECT_ROOT",
    "STORAGE_DIR",
    "SECRET_KEY",
    "ALGORITHM",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "logger",
    "setup_logging",
    "get_all_cache_stats",
    "clear_all_caches",
    "global_exception_handler",
    "setup_middleware",
    "get_current_user",
    "get_optional_current_user",
    "get_admin_user",
    "clean_api_key",
    "get_all_user_keys",
    "oauth2_scheme",
    "get_auth_service",
]
