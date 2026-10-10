"""
backend/app/repositories/system/admin.py
─────────────────────────────────────────────────────────────────────────────
Admin console raw database query handler.
─────────────────────────────────────────────────────────────────────────────
"""

from database.engine import get_db_connection


def admin_query_db(table: str, limit: int = 100, offset: int = 0) -> list[dict]:
    allowed_tables = [
        'admin_settings', 'admin_announcements', 'admin_moderation_logs',
        'auth_users', 'auth_sessions', 'auth_audit_logs',
        'workspace_chapters', 'image_panels', 'image_edit_history',
        'creative_youtube_channels', 'creative_youtube_tokens',
        'creative_youtube_profiles', 'creative_youtube_publications',
        'creative_youtube_credentials', 'creative_youtube_unlinked_channels',
        'creative_style_profiles', 'platform_series', 'platform_jobs',
        'platform_scrape_sessions', 'platform_series_cache', 'platform_system_logs',
        'profile_api_keys', 'profile_invoices', 'profile_credit_transactions',
        'intelligence_projects', 'intelligence_continuity_memory',
        'intelligence_feedback_events', 'intelligence_token_usage', 'intelligence_ledger',
    ]
    if table not in allowed_tables:
        raise ValueError("Table not allowed")

    conn = get_db_connection()
    try:
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY 1 DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
