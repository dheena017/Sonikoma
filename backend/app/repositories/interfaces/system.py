"""
backend/app/repositories/interfaces/system.py
─────────────────────────────────────────────────────────────────────────────
Abstract interface contracts for System Settings, Logs, and Administrative actions.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class ISystemRepository(ABC):
    """Abstract interface contract for administrative platform controls, global analytics, logging, and settings."""

    @abstractmethod
    def get_platform_settings(self) -> Dict[str, Any]:
        """Gets all global environment variables, API toggles, and feature settings."""
        pass

    @abstractmethod
    def update_platform_settings(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Updates and merges new global environment variables or flags."""
        pass

    @abstractmethod
    def reset_platform_settings(self) -> Dict[str, Any]:
        """Resets platform setting configurations back to default constants."""
        pass

    @abstractmethod
    def purge_global_cache(self) -> bool:
        """Triggers clean up across all caches (in-memory and disk caching)."""
        pass

    @abstractmethod
    def get_global_audit_logs(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Retrieves audit entries globally across all users for admin review."""
        pass

    @abstractmethod
    def insert_system_log(self, level: str, message: str, service: Optional[str] = None, details: Optional[str] = None) -> None:
        """Inserts a new backend logger entry in the system_logs table."""
        pass

    @abstractmethod
    def get_system_logs(self, level: Optional[str] = None, service: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Retrieves raw system log rows filtered optionally by level or service."""
        pass

    @abstractmethod
    def prune_system_logs(self, retention_days: int = 30) -> int:
        """Deletes historical logs older than selected days."""
        pass

    @abstractmethod
    def wipe_system_logs(self) -> None:
        """Purges all entries from system logs."""
        pass

    @abstractmethod
    def get_db_stats(self) -> Dict[str, Any]:
        """Gathers disk sizing, row counts, and structural statistics from the database engine."""
        pass

    @abstractmethod
    def get_global_analytics(self) -> Dict[str, Any]:
        """Collects dashboard metrics: total registered users, credits, compiled videos, active projects."""
        pass

    @abstractmethod
    def get_announcements(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Retrieves list of active/all dashboard system announcements."""
        pass

    @abstractmethod
    def create_announcement(self, title: str, content: str, level: str = "info", expires_at: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new broadcast announcement for the creator portal dashboard."""
        pass

    @abstractmethod
    def delete_announcement(self, id: str) -> bool:
        """Removes an announcement."""
        pass

    @abstractmethod
    def admin_query_db(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Allows direct execution of raw SQL queries (read-only restriction check usually applied)."""
        pass
