"""Development/demo seed entrypoint."""

from __future__ import annotations

from database.seed.projects import seed_demo_project
from database.seed.seed import seed_default_settings
from database.seed.users import seed_system_user


def seed_demo_data(conn) -> None:
    """Seed defaults plus a lightweight demo user and project."""
    seed_default_settings(conn)
    seed_system_user(conn)
    seed_demo_project(conn)
