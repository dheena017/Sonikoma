"""
backend/features/video/export/video_packager.py
─────────────────────────────────────────────────────────────────────────────
Output packaging, disk persistence, and cloud storage distribution.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import shutil
import logging
from typing import Dict
from features.video.utils.media_resolver import MEDIA_VIDEOS_DIR

logger = logging.getLogger("sonikoma.features.video.export.video_packager")


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def save_video(
    source_video_path: str,
    project_id: str,
    upload_to_cloud: bool = False
) -> Dict[str, str]:
    """Saves a video file to the media directory or cloud storage."""
    if not os.path.exists(source_video_path):
        raise FileNotFoundError(f"Source video file does not exist: {source_video_path}")

    filename = os.path.basename(source_video_path)
    target_dest = os.path.join(MEDIA_VIDEOS_DIR, filename)

    if os.path.abspath(source_video_path) != os.path.abspath(target_dest):
        os.makedirs(MEDIA_VIDEOS_DIR, exist_ok=True)
        shutil.copy2(source_video_path, target_dest)

    public_url = f"/videos/{filename}"
    logger.info(f"[VideoPackager] Saved video for project '{project_id}': {public_url}")

    return {
        "project_id": project_id,
        "filename": filename,
        "video_url": public_url,
        "storage": "local",
    }


# Backward compatibility alias
package_and_store_video = save_video

__all__ = [
    "save_video",
    "package_and_store_video",
]
