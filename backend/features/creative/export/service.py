"""
backend/features/creative/export/service.py
─────────────────────────────────────────────────────────────────────────────
Export Sub-Domain Service Facade:
Encapsulates operations for:
- Video export pipelines & YouTube publishing workflows
- Channel publishing profiles and template configuration
- YouTube OAuth2 credentials & token life-cycle management
- Publishing history and analytics tracking
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any

from features.creative.repositories import (
    get_youtube_publications,
    log_youtube_publication,
    save_youtube_credentials,
    get_youtube_credentials,
    delete_youtube_credentials,
    save_youtube_profile,
    get_youtube_profiles,
    delete_youtube_profile,
    get_selected_youtube_channel,
    get_user_youtube_channels,
)
from features.creative.export.services.youtube.workflow import execute_youtube_upload_workflow
from features.creative.export.services.youtube.service import YouTubeService

logger = logging.getLogger("sonikoma.creative.export.service")


class ExportService:
    """Consolidated business service for creative video publishing and export."""

    def __init__(self, youtube_service: Optional[YouTubeService] = None):
        self.youtube_service = youtube_service or YouTubeService()

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube History & Publishing
    # ─────────────────────────────────────────────────────────────────────────

    def get_publishing_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves user's YouTube publication history."""
        return get_youtube_publications(user_id)

    async def publish_video(
        self,
        user_id: str,
        video_url: str,
        title: str = "Untitled Video",
        synopsis: str = "",
        tags: Optional[List[str]] = None,
        privacy_status: str = "unlisted",
        category_id: str = "1",
        is_short: bool = False,
        thumbnail_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Executes full automated YouTube upload workflow."""
        return await execute_youtube_upload_workflow(
            user_id=user_id,
            video_url=video_url,
            title=title,
            synopsis=synopsis,
            tags=tags or [],
            privacy_status=privacy_status,
            category_id=category_id,
            is_short=is_short,
            thumbnail_url=thumbnail_url,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube Profiles
    # ─────────────────────────────────────────────────────────────────────────

    def list_profiles(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves stored channel publishing profiles for user."""
        return get_youtube_profiles(user_id)

    def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or updates a publishing profile."""
        save_youtube_profile(user_id, profile_data)
        return {"success": True, "message": "Profile saved successfully."}

    def delete_profile(self, user_id: str, profile_id: str) -> Dict[str, Any]:
        """Deletes a publishing profile."""
        delete_youtube_profile(user_id, profile_id)
        return {"success": True, "message": "Profile deleted successfully."}

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube Credentials
    # ─────────────────────────────────────────────────────────────────────────

    def get_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves stored client credentials for user."""
        return get_youtube_credentials(user_id)

    def save_credentials(self, user_id: str, credentials_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves custom Google/YouTube client credentials."""
        save_youtube_credentials(user_id, credentials_data)
        return {"success": True, "message": "Credentials saved successfully."}

    def delete_credentials(self, user_id: str) -> Dict[str, Any]:
        """Removes custom client credentials."""
        delete_youtube_credentials(user_id)
        return {"success": True, "message": "Credentials removed."}

    # ─────────────────────────────────────────────────────────────────────────
    # Channel Context
    # ─────────────────────────────────────────────────────────────────────────

    def get_active_channel(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Gets currently active selected YouTube channel for user."""
        return get_selected_youtube_channel(user_id)

    def get_channels(self, user_id: str) -> List[Dict[str, Any]]:
        """Gets all linked YouTube channels for user."""
        return get_user_youtube_channels(user_id)


export_service = ExportService()

__all__ = [
    "ExportService",
    "export_service",
]
