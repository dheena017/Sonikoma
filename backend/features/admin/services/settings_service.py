"""
backend/features/admin/services/settings_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Settings & Announcements Service:
- Global platform configuration retrieval and modification
- Cache purge and reset to factory defaults
- Global announcements publication and management
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any

from features.auth.repositories import write_audit_log
from features.platform.dashboard.repositories import (
    get_platform_settings,
    update_platform_settings,
    get_announcements,
    create_announcement,
    delete_announcement,
    reset_platform_settings,
    purge_global_cache,
)

logger = logging.getLogger("sonikoma.admin.settings_service")


class AdminSettingsService:
    """Specialized service for platform settings and announcements."""

    def get_settings(self) -> Dict[str, Any]:
        return {"success": True, "settings": get_platform_settings()}

    def update_settings(self, settings: Dict[str, str], current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        update_platform_settings(settings)
        write_audit_log(current_admin_id, "Admin updated global platform settings", ip_addr, "Success")
        return {"success": True, "message": "Settings updated successfully."}

    def reset_settings(self, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        defaults = reset_platform_settings()
        write_audit_log(current_admin_id, "Admin reset global platform settings to defaults", ip_addr, "Success")
        return {"success": True, "settings": defaults, "message": "Settings reset successfully."}

    def purge_cache(self, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        purge_global_cache()
        write_audit_log(current_admin_id, "Admin purged global scraped image cache", ip_addr, "Success")
        return {"success": True, "message": "Global scraped image cache purged successfully."}

    def get_announcements(self) -> Dict[str, Any]:
        return {"success": True, "announcements": get_announcements()}

    def create_announcement(self, title: str, message: str, announcement_type: str, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        announcement = create_announcement(title, message, announcement_type or "info")
        write_audit_log(current_admin_id, f"Admin created announcement {title}", ip_addr, "Success")
        return {"success": True, "announcement": announcement}

    def delete_announcement(self, announcement_id: int, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        success = delete_announcement(announcement_id)
        if not success:
            raise KeyError("Announcement not found")
        write_audit_log(current_admin_id, f"Admin deleted announcement {announcement_id}", ip_addr, "Success")
        return {"success": True, "message": "Announcement deleted successfully"}


admin_settings_service = AdminSettingsService()
