"""
backend/app/services/export/youtube/workflow.py
─────────────────────────────────────────────────────────────────────────────
Orchestrates the OAuth authentication, metadata formatting, and upload logic.
─────────────────────────────────────────────────────────────────────────────
"""
import asyncio
import os
import logging
from typing import Optional, List, Any

from app.core.exceptions import ResourceNotFoundException, ProcessingException
from .oauth import get_authenticated_service
from .metadata import format_video_metadata
from .upload import upload_video_and_thumbnail

logger = logging.getLogger("sonikoma.services.export.youtube.workflow")

async def execute_youtube_upload_workflow(
    video_path: str,
    title: Optional[str] = "Untitled Video",
    description: Optional[str] = "",
    tags: Optional[List[str]] = None,
    category_id: Optional[str] = "1",
    privacy_status: Optional[str] = "unlisted",
    is_short: Optional[bool] = False,
    thumbnail_path: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """Core workflow for authenticating and uploading a video file to YouTube."""
    if not os.path.exists(video_path):
        raise ResourceNotFoundException("Video file not found.")

    try:
        # Step 1: Authenticate
        youtube: Any = await get_authenticated_service(user_id=user_id)

        # Step 1.5: Log targeted channel
        if user_id:
            try:
                from repositories.youtube import get_selected_youtube_channel
                selected_ch = get_selected_youtube_channel(user_id)
                active_token_req = youtube.channels().list(part="snippet", mine=True)
                active_token_resp = await asyncio.to_thread(active_token_req.execute)
                if active_token_resp.get("items"):
                    token_cid = active_token_resp["items"][0]["id"]
                    token_title = active_token_resp["items"][0]["snippet"]["title"]
                    selected_title = (selected_ch.get("title") if selected_ch else None) or token_title
                    logger.info(f"[YouTube Upload] Publishing to channel '{token_title}' ({token_cid}) | Selected: '{selected_title}'")
            except Exception as guard_err:
                pass

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
        logger.info(f"[YouTube Export] Uploading video '{video_path}' (title='{title}', is_short={is_short})")
        result = upload_video_and_thumbnail(
            youtube=youtube,
            video_path=video_path,
            request_body=request_body,
            thumbnail_path=thumbnail_path
        )
        logger.info(f"[YouTube Export] Video published successfully: ID={result.get('video_id')}")
        return result
    except (ResourceNotFoundException, ProcessingException):
        raise
    except Exception as e:
        logger.error(f"YouTube export failed: {e}", exc_info=True)
        raise ProcessingException(str(e))
