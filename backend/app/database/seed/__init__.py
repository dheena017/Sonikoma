"""
backend/app/database/seed/__init__.py
─────────────────────────────────────────────────────────────────────────────
Database seed module entry points.
─────────────────────────────────────────────────────────────────────────────
"""

try:
    from .seed import run_seed, seed_default_settings
    from .users import seed_system_user
    from .projects import seed_demo_project
except ImportError:
    from database.seed.seed import run_seed, seed_default_settings
    from database.seed.users import seed_system_user
    from database.seed.projects import seed_demo_project

__all__ = [
    "run_seed",
    "seed_default_settings",
    "seed_system_user",
    "seed_demo_project",
]
