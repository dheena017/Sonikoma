"""
backend/features/admin/services/audit_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Audit & Logging Service:
- Global audit activity logs retrieval
- CSV export for administrative activities
- Content moderation logs inspection
─────────────────────────────────────────────────────────────────────────────
"""

import csv
import io
import logging
from typing import Dict, Any

from database.engine import get_db_connection
from features.platform.dashboard.repositories import get_global_audit_logs

logger = logging.getLogger("sonikoma.admin.audit_service")


class AdminAuditService:
    """Specialized service for administrative audits and moderation logs."""

    def get_audit_logs(self, limit: int = 50) -> Dict[str, Any]:
        return {"success": True, "logs": get_global_audit_logs(limit)}

    def export_activity_csv(self) -> str:
        logs = get_global_audit_logs()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "User ID", "Email", "Action", "IP Address", "Timestamp", "Status"])
        for log in logs:
            writer.writerow([
                log.get("id"),
                log.get("user_id"),
                log.get("email"),
                log.get("action"),
                log.get("ip_address"),
                log.get("created_at"),
                log.get("status")
            ])
        output.seek(0)
        return output.getvalue()

    def get_moderation_logs(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            rows = conn.execute("""
                SELECT m.*, u.email as admin_email, s.title as series_title
                FROM content_moderation_logs m
                LEFT JOIN users u ON m.admin_id = u.id
                LEFT JOIN series s ON m.series_id = s.id
                ORDER BY m.created_at DESC LIMIT ? OFFSET ?
            """, (limit, offset)).fetchall()
            return {"success": True, "total": len(rows), "logs": [dict(r) for r in rows]}
        finally:
            conn.close()


admin_audit_service = AdminAuditService()
