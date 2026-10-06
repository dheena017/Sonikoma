"""
backend/features/admin/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Admin Services Module:
Aggregates and exposes all specialized administrative domain services:
- user_service:       User lifecycle, credentials, roles, moderation, impersonation
- settings_service:   Platform settings, cache purge, announcements
- audit_service:      Audit logs, CSV export, content moderation logs
- project_service:    Global series & projects moderation
- finance_service:    Credit transactions ledger and user invoices
- database_service:   Superuser database inspector
- job_service:        Background jobs inspection and cancellation
- telemetry_service:  Global telemetry, LLM token usage, scraping rules
─────────────────────────────────────────────────────────────────────────────
"""

from .user_service import AdminUserService, admin_user_service
from .settings_service import AdminSettingsService, admin_settings_service
from .audit_service import AdminAuditService, admin_audit_service
from .project_service import AdminProjectService, admin_project_service
from .finance_service import AdminFinanceService, admin_finance_service
from .database_service import AdminDatabaseService, admin_database_service
from .job_service import AdminJobService, admin_job_service
from .telemetry_service import AdminTelemetryService, admin_telemetry_service

__all__ = [
    "AdminUserService",
    "admin_user_service",
    "AdminSettingsService",
    "admin_settings_service",
    "AdminAuditService",
    "admin_audit_service",
    "AdminProjectService",
    "admin_project_service",
    "AdminFinanceService",
    "admin_finance_service",
    "AdminDatabaseService",
    "admin_database_service",
    "AdminJobService",
    "admin_job_service",
    "AdminTelemetryService",
    "admin_telemetry_service",
]
