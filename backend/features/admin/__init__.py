"""
backend/features/admin/__init__.py
─────────────────────────────────────────────────────────────────────────────
Admin Feature Module:
- router:       Aggregated FastAPI router for admin capabilities
- service:      AdminService facade and singleton instance admin_service
- services:     Modular admin domain services (user, settings, audit, projects, finance, database, jobs, telemetry)
- schemas:      Pydantic request & response schemas for admin
─────────────────────────────────────────────────────────────────────────────
"""

from .router import admin_router, router
from .services import (
    admin_user_service,
    admin_settings_service,
    admin_audit_service,
    admin_project_service,
    admin_finance_service,
    admin_database_service,
    admin_job_service,
    admin_telemetry_service,
)
from . import services
from . import schemas

__all__ = [
    "admin_router",
    "router",
    "services",
    "schemas",
    "admin_user_service",
    "admin_settings_service",
    "admin_audit_service",
    "admin_project_service",
    "admin_finance_service",
    "admin_database_service",
    "admin_job_service",
    "admin_telemetry_service",
]
