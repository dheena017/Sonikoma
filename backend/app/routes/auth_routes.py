"""
routes/auth_routes.py
─────────────────────────────────────────────────────────────────────────────
Compatibility shim — re-exports auth symbols that legacy modules import
directly from this path.

Real implementations live in:
  • api/v1/auth/          (router, login, register, profile, …)
  • api/dependencies/auth (get_current_user, get_admin_user, …)
  • core/security.py      (SECRET_KEY, ALGORITHM, …)
─────────────────────────────────────────────────────────────────────────────
"""

# Auth router (from the modularised auth package)
try:
    from api.v1.auth import auth_router
    from api.v1.auth.router import auth_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.auth import auth_router
    from app.api.v1.auth.router import auth_router as router  # noqa: F401

# Core auth dependencies (get_current_user, get_admin_user, …)
try:
    from api.dependencies.auth import (
        get_current_user,
        get_admin_user,
        clean_api_key,
        get_all_user_keys,
        oauth2_scheme,
    )
except ModuleNotFoundError:
    from app.api.dependencies.auth import (
        get_current_user,
        get_admin_user,
        clean_api_key,
        get_all_user_keys,
        oauth2_scheme,
    )

# JWT secret / algorithm (imported by scraper.py etc.)
try:
    from core.security import SECRET_KEY, ALGORITHM
except ModuleNotFoundError:
    from app.core.security import SECRET_KEY, ALGORITHM

__all__ = [
    "auth_router",
    "router",
    "get_current_user",
    "get_admin_user",
    "clean_api_key",
    "get_all_user_keys",
    "oauth2_scheme",
    "SECRET_KEY",
    "ALGORITHM",
]
