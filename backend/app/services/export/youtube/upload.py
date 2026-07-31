"""
backend/app/services/export/youtube/upload.py
─────────────────────────────────────────────────────────────────────────────
Handles uploading the physical video file and custom thumbnails to YouTube.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import logging
from typing import Optional

try:
    from googleapiclient.http import MediaFileUpload
except ImportError:
    pass

logger = logging.getLogger("sonikoma.services.export.youtube.upload")

def upload_video_and_thumbnail(
    youtube,
    video_path: str,
    request_body: dict,
    thumbnail_path: Optional[str] = None
) -> dict:
    """Executes the video upload and optionally uploads a custom thumbnail."""
    media_file = MediaFileUpload(video_path, chunksize=-1, resumable=True)

    logger.info("Starting YouTube upload...")
    insert_request = youtube.videos().insert(
        part="snippet,status",
        body=request_body,
        media_body=media_file
    )
    response = insert_request.execute()

    video_id = response.get("id")
    logger.info(f"Upload complete! Video ID: {video_id}")

    if thumbnail_path and os.path.exists(thumbnail_path):
        try:
            logger.info(f"Uploading custom thumbnail for video {video_id}...")
            media_thumb = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
            youtube.thumbnails().set(videoId=video_id, media_body=media_thumb).execute()
            logger.info("Custom thumbnail successfully applied.")
        except Exception as thumb_err:
            logger.warning(f"Failed to apply custom thumbnail: {thumb_err}")

    return {
        "success": True,
        "youtube_url": f"https://youtube.com/watch?v={video_id}",
        "message": "Successfully uploaded to YouTube!",
    }
