"""
backend/features/creative/service.py
─────────────────────────────────────────────────────────────────────────────
Master Creative Domain Service Facade:
Orchestrates high-level workflows across:
- export (ExportService): Video packaging & YouTube publishing
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any

from features.creative.schemas import (
    YouTubeExportRequest,
    YouTubeProfileRequest,
    YouTubeCredentialsRequest,
)

logger = logging.getLogger("sonikoma.creative.service")


class CreativeService:
    """Master consolidated business facade for the Creative feature domain."""

    @property
    def export(self):
        """Lazy access to Export sub-domain service."""
        from features.creative.export.service import export_service
        return export_service

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube History & Publishing Delegation
    # ─────────────────────────────────────────────────────────────────────────

    def get_publishing_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves user's YouTube publication history."""
        return self.export.get_publishing_history(user_id)

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
        return await self.export.publish_video(
            user_id=user_id,
            video_url=video_url,
            title=title,
            synopsis=synopsis,
            tags=tags,
            privacy_status=privacy_status,
            category_id=category_id,
            is_short=is_short,
            thumbnail_url=thumbnail_url,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube Profiles Delegation
    # ─────────────────────────────────────────────────────────────────────────

    def list_profiles(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves stored channel publishing profiles for user."""
        return self.export.list_profiles(user_id)

    def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or updates a publishing profile."""
        return self.export.save_profile(user_id, profile_data)

    def delete_profile(self, user_id: str, profile_id: str) -> Dict[str, Any]:
        """Deletes a publishing profile."""
        return self.export.delete_profile(user_id, profile_id)

    # ─────────────────────────────────────────────────────────────────────────
    # YouTube Credentials Delegation
    # ─────────────────────────────────────────────────────────────────────────

    def get_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves stored client credentials for user."""
        return self.export.get_credentials(user_id)

    def save_credentials(self, user_id: str, credentials_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves custom Google/YouTube client credentials."""
        return self.export.save_credentials(user_id, credentials_data)

    def delete_credentials(self, user_id: str) -> Dict[str, Any]:
        """Removes custom client credentials."""
        return self.export.delete_credentials(user_id)


creative_service = CreativeService()

__all__ = [
    "CreativeService",
    "creative_service",
]
