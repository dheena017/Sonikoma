"""
infrastructure/database/seed.py
─────────────────────────────────────────────────────────────────────────────
Initial platform seeding utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

logger = logging.getLogger("sonikoma.database.seed")


def seed_default_settings(conn) -> None:
    """Seeds default platform settings if the platform_settings table is empty."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM platform_settings")
        if cursor.fetchone()[0] == 0:
            logger.info("[Database] Seeding default platform settings...")
            defaults = [
                ("maintenance_mode", "false"),
                ("disable_signups", "false"),
                ("global_banner", ""),
                ("enable_beta", "false"),
                ("max_upload_size_mb", "50"),
                ("max_scenes_per_project", "100"),
                ("default_starting_credits", "200"),
                ("smtp_host", "smtp.mailgun.org"),
                ("smtp_port", "587"),
                ("smtp_user", ""),
                ("enforce_2fa", "false"),
                ("strict_ip_binding", "false"),
                ("session_timeout_min", "120"),
                ("webhook_url", "https://api.sonikoma.com/webhooks"),
                ("log_retention_days", "7"),
                ("log_max_entries", "5000"),
            ]
            cursor.executemany(
                "INSERT INTO platform_settings (key, value) VALUES (?, ?)", defaults
            )
            conn.commit()
            logger.info("[Database] Seeding default platform settings completed.")
    except Exception as e:
        logger.error(f"[Database] Failed to seed default platform settings: {e}")
