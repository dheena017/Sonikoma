"""
backend/features/admin/services/telemetry_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Telemetry & AI Analytics Service:
- Global analytics metrics & telemetry
- LLM token usage tracking & cost estimation
- Web scraper domain rules, policies, and rate limits
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any

from database.engine import get_db_connection
from features.auth.repositories import write_audit_log
from features.platform.dashboard.repositories.analytics import get_global_analytics

logger = logging.getLogger("sonikoma.admin.telemetry_service")


class AdminTelemetryService:
    """Specialized service for telemetry, AI token monitoring, and scraper rules."""

    def get_analytics(self) -> Dict[str, Any]:
        return get_global_analytics()

    def get_token_usage(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            rows = conn.execute("""
                SELECT t.*, s.title as series_title, u.email as user_email
                FROM token_usage_logs t
                LEFT JOIN series s ON t.project_id = s.id
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC LIMIT ? OFFSET ?
            """, (limit, offset)).fetchall()
            logs = [dict(r) for r in rows]

            summary_row = conn.execute("""
                SELECT 
                    SUM(input_tokens) as total_input,
                    SUM(output_tokens) as total_output,
                    SUM(total_tokens) as total_tokens,
                    SUM(estimated_cost_usd) as total_cost_usd
                FROM token_usage_logs
            """).fetchone()

            summary = {
                "total_input_tokens": summary_row["total_input"] or 0 if summary_row else 0,
                "total_output_tokens": summary_row["total_output"] or 0 if summary_row else 0,
                "total_tokens": summary_row["total_tokens"] or 0 if summary_row else 0,
                "total_cost_usd": round(summary_row["total_cost_usd"] or 0.0, 4) if summary_row else 0.0,
            }

            return {"success": True, "total": len(logs), "logs": logs, "summary": summary}
        finally:
            conn.close()


admin_telemetry_service = AdminTelemetryService()
