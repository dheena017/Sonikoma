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
        """Executes full automated YouTube upload workflow with path resolution."""
        import os
        import tempfile
        import httpx
        from app.core.config import PROJECT_ROOT
        from app.core.exceptions import ResourceNotFoundException

        tmp_video_path = None
        tmp_thumb_path = None
        video_path = None

        try:
            # 1. Resolve video_path from url or disk
            if video_url and os.path.isabs(video_url) and os.path.exists(video_url):
                video_path = video_url
            else:
                filename = video_url.split("/")[-1].split("?")[0] if video_url else ""
                candidate_paths = [
                    os.path.join(PROJECT_ROOT, "data", "media", filename),
                    os.path.join(PROJECT_ROOT, "data", "local_media", filename),
                ]
                for cp in candidate_paths:
                    if os.path.exists(cp) and os.path.isfile(cp):
                        video_path = cp
                        break

                if not video_path and video_url and (video_url.startswith("http://") or video_url.startswith("https://")):
                    if "localhost" not in video_url and "127.0.0.1" not in video_url:
                        fd, tmp_video_path = tempfile.mkstemp(suffix=".mp4")
                        os.close(fd)
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            resp = await client.get(video_url)
                            if resp.status_code == 200:
                                with open(tmp_video_path, "wb") as f:
                                    f.write(resp.content)
                                video_path = tmp_video_path

            if not video_path or not os.path.exists(video_path):
                raise ResourceNotFoundException(f"Video file not found on disk for '{video_url}'")

            # 2. Resolve thumbnail_path
            thumbnail_path = None
            if thumbnail_url:
                if os.path.isabs(thumbnail_url) and os.path.exists(thumbnail_url):
                    thumbnail_path = thumbnail_url
                else:
                    t_filename = thumbnail_url.split("/")[-1].split("?")[0]
                    t_candidates = [
                        os.path.join(PROJECT_ROOT, "data", "local_media", t_filename),
                        os.path.join(PROJECT_ROOT, "data", "cache", t_filename),
                    ]
                    for tp in t_candidates:
                        if os.path.exists(tp) and os.path.isfile(tp):
                            thumbnail_path = tp
                            break

                    if not thumbnail_path and (thumbnail_url.startswith("http://") or thumbnail_url.startswith("https://")):
                        if "localhost" not in thumbnail_url and "127.0.0.1" not in thumbnail_url:
                            fd_t, tmp_thumb_path = tempfile.mkstemp(suffix=".jpg")
                            os.close(fd_t)
                            async with httpx.AsyncClient(timeout=30.0) as client:
                                resp = await client.get(thumbnail_url)
                                if resp.status_code == 200:
                                    with open(tmp_thumb_path, "wb") as f:
                                        f.write(resp.content)
                                    thumbnail_path = tmp_thumb_path

            # 3. Execute YouTube upload workflow with exact expected signature
            res = await execute_youtube_upload_workflow(
                video_path=video_path,
                title=title or "Untitled Video",
                description=synopsis or "",
                tags=tags or [],
                category_id=category_id or "1",
                privacy_status=privacy_status or "unlisted",
                is_short=is_short,
                thumbnail_path=thumbnail_path,
                user_id=user_id,
            )

            # 4. Log publication to DB
            if res and isinstance(res, dict) and res.get("youtube_url"):
                try:
                    log_youtube_publication(
                        user_id=user_id,
                        chapter_id=None,
                        youtube_url=res["youtube_url"],
                        title=title or "Untitled Video",
                        privacy_status=privacy_status or "unlisted",
                    )
                except Exception as log_err:
                    logger.debug(f"[YouTube Upload] DB logging notice: {log_err}")

            return res
        finally:
            if tmp_video_path and os.path.exists(tmp_video_path):
                try:
                    os.remove(tmp_video_path)
                except Exception:
                    pass
            if tmp_thumb_path and os.path.exists(tmp_thumb_path):
                try:
                    os.remove(tmp_thumb_path)
                except Exception:
                    pass

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
