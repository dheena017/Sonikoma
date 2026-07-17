"""
backend/app/services/export/youtube/workflow.py
─────────────────────────────────────────────────────────────────────────────
Orchestrates the OAuth authentication, metadata formatting, and upload logic.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import logging
from typing import Optional, List
from core.exceptions import VideoFileNotFoundException, YouTubeExportException

from .oauth import get_authenticated_service
from .metadata import format_video_metadata
from .upload import upload_video_and_thumbnail

logger = logging.getLogger("sonikoma.services.export.youtube.workflow")

async def execute_youtube_upload_workflow(
    video_path: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    category_id: Optional[str] = "1",
    privacy_status: Optional[str] = "unlisted",
    is_short: Optional[bool] = False,
    thumbnail_path: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """Core workflow for authenticating and uploading a video file to YouTube."""
    if not os.path.exists(video_path):
        raise VideoFileNotFoundException("Video file not found.")

    try:
        # Step 1: Authenticate
        youtube = await get_authenticated_service(user_id=user_id)

        # Step 2: Format Metadata
        request_body = format_video_metadata(
            title=title,
            description=description,
            tags=tags,
            category_id=category_id,
            privacy_status=privacy_status,
            is_short=is_short
        )

        # Step 3: Upload Video and Thumbnail
        result = upload_video_and_thumbnail(
            youtube=youtube,
            video_path=video_path,
            request_body=request_body,
            thumbnail_path=thumbnail_path
        )
        return result
    except Exception as e:
        logger.error(f"YouTube export failed: {e}", exc_info=True)
        raise YouTubeExportException(str(e))
