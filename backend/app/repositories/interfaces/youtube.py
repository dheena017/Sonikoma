"""
backend/app/repositories/interfaces/youtube.py
─────────────────────────────────────────────────────────────────────────────
Abstract interface contracts for YouTube integration credentials, profiles, and logs.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IYouTubeRepository(ABC):
    """Abstract interface contract for managing YouTube settings, publishing history, and OAuth credentials."""

    @abstractmethod
    def save_youtube_profile(self, user_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or updates a YouTube publishing profile (templates, license, kids flags, etc.)."""
        pass

    @abstractmethod
    def get_youtube_profiles(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists all registered YouTube publishing profiles for a creator."""
        pass

    @abstractmethod
    def delete_youtube_profile(self, user_id: str, name: str) -> bool:
        """Removes a YouTube publishing profile."""
        pass

    @abstractmethod
    def log_youtube_publication(self, user_id: str, chapter_id: Optional[str], youtube_url: str, title: str, privacy_status: str) -> Dict[str, Any]:
        """Logs a successful video publishing event to a YouTube channel."""
        pass

    @abstractmethod
    def get_youtube_publications(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves history of published YouTube video items for a creator."""
        pass

    @abstractmethod
    def save_youtube_credentials(self, user_id: str, client_id: str, client_secret: str, project_id: str) -> Dict[str, Any]:
        """Saves API client secret configurations for YouTube API authentication."""
        pass

    @abstractmethod
    def get_youtube_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves YouTube OAuth client configuration for a user."""
        pass

    @abstractmethod
    def delete_youtube_credentials(self, user_id: str) -> bool:
        """Revokes and wipes API credentials."""
        pass
