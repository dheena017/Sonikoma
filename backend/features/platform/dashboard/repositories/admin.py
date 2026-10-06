"""
backend/app/repositories/system/admin.py
─────────────────────────────────────────────────────────────────────────────
Admin console raw database query handler.
─────────────────────────────────────────────────────────────────────────────
"""

from database.engine import get_db_connection


def admin_query_db(table: str, limit: int = 100, offset: int = 0) -> list[dict]:
    allowed_tables = ['users', 'series', 'chapters', 'panels', 'user_audit_logs', 'platform_settings', 'system_announcements', 'user_invoices', 'scrape_sessions', 'user_api_keys', 'token_usage_logs', 'credit_transactions']
    if table not in allowed_tables:
        raise ValueError("Table not allowed")

    conn = get_db_connection()
    try:
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY 1 DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
