"""
backend/app/repositories/system/settings.py
─────────────────────────────────────────────────────────────────────────────
Platform settings management operations.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict

from database.connection import get_db_connection

logger = logging.getLogger("sonikoma.repositories.system.settings")


def get_platform_settings() -> Dict[str, str]:
    defaults = {
        'platform_name': 'Sonikoma',
        'support_email': 'support@sonikoma.com',
        'maintenance_mode': 'false',
        'registration_enabled': 'true',
        'max_login_attempts': '5',
        'jwt_expiry_hours': '24',
        'smtp_host': 'smtp.mailgun.org',
        'smtp_port': '587',
        'smtp_user': '',
        'smtp_pass': '',
        'max_upload_size_mb': '50',
        'concurrent_scrapes_per_user': '3',
        'disable_signups': 'false',
        'global_banner': '',
        'enable_beta': 'false',
        'max_scenes_per_project': '100',
        'default_starting_credits': '200',
        'enforce_2fa': 'false',
        'strict_ip_binding': 'false',
        'session_timeout_min': '120',
        'webhook_url': 'https://api.sonikoma.com/webhooks',
        'log_retention_days': '7',
        'log_max_entries': '5000'
    }
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT key, value FROM platform_settings').fetchall()
        db_settings = {r['key']: r['value'] for r in rows}
        defaults.update(db_settings)
        return defaults
    finally:
        conn.close()


def update_platform_settings(settings: Dict[str, str]) -> None:
    conn = get_db_connection()
    try:
        for k, v in settings.items():
            conn.execute('INSERT INTO platform_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP', (k, v))
        conn.commit()
    finally:
        conn.close()


def reset_platform_settings() -> Dict[str, str]:
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM platform_settings')
        conn.commit()
    finally:
        conn.close()
    return get_platform_settings()


def purge_global_cache() -> None:
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM scrape_sessions')
        conn.execute('VACUUM')
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to purge global cache: {e}")
        raise e
    finally:
        conn.close()
