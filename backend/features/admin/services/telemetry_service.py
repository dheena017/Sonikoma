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

    def get_scraper_rules(self) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            rows = conn.execute("SELECT * FROM scraper_rules ORDER BY domain ASC").fetchall()
            rules = [dict(r) for r in rows]
            from features.platform.scraper.services.scraper_constants import ALLOWED_DOMAINS
            return {
                "success": True,
                "total": len(rules),
                "rules": rules,
                "whitelisted_domains": ALLOWED_DOMAINS
            }
        finally:
            conn.close()

    def save_scraper_rule(self, rule_data: Dict[str, Any], current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            domain = rule_data["domain"].strip().lower()
            blocked_val = 1 if rule_data.get("is_blocked") else 0
            proxy_val = 1 if rule_data.get("proxy_required") else 0
            engine_strategy = rule_data.get("engine_strategy") or "auto"
            timeout_sec = rule_data.get("timeout_sec") or 30
            max_concurrency = rule_data.get("max_concurrency") or 2
            retry_attempts = rule_data.get("retry_attempts") or 2
            notes = rule_data.get("notes") or ""
            custom_headers = rule_data.get("custom_headers") or "{}"

            conn.execute("""
                INSERT INTO scraper_rules (
                    domain, is_blocked, rate_limit_per_min, proxy_required,
                    engine_strategy, timeout_sec, max_concurrency, retry_attempts, notes, custom_headers
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(domain) DO UPDATE SET
                    is_blocked = excluded.is_blocked,
                    rate_limit_per_min = excluded.rate_limit_per_min,
                    proxy_required = excluded.proxy_required,
                    engine_strategy = excluded.engine_strategy,
                    timeout_sec = excluded.timeout_sec,
                    max_concurrency = excluded.max_concurrency,
                    retry_attempts = excluded.retry_attempts,
                    notes = excluded.notes,
                    custom_headers = excluded.custom_headers
            """, (
                domain, blocked_val, rule_data.get("rate_limit_per_min", 30), proxy_val,
                engine_strategy, timeout_sec, max_concurrency, retry_attempts, notes, custom_headers
            ))
            conn.commit()
            write_audit_log(current_admin_id, f"Admin updated scraper rule for domain '{domain}'", ip_addr, "Success")
            return {"success": True, "message": f"Scraper rule for '{domain}' saved successfully."}
        finally:
            conn.close()

    def delete_scraper_rule(self, rule_id: int, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            conn.execute("DELETE FROM scraper_rules WHERE id = ?", (rule_id,))
            conn.commit()
            write_audit_log(current_admin_id, f"Admin deleted scraper rule #{rule_id}", ip_addr, "Success")
            return {"success": True, "message": "Scraper rule deleted successfully."}
        finally:
            conn.close()


admin_telemetry_service = AdminTelemetryService()
