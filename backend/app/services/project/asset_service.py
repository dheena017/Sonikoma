import logging
import os
from typing import Optional

logger = logging.getLogger("sonikoma.services.project.asset_service")

_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_PROJECT_ROOT = os.path.abspath(os.path.join(_BACKEND_ROOT, ".."))


def cleanup_cached_url(url: Optional[str]) -> None:
    if not url:
        return
    if "data/media/" in url:
        try:
            filename = url.split("/")[-1]
            local_path = os.path.abspath(os.path.join(_PROJECT_ROOT, "data", "media", filename))
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"[Storage] Deleted cached file: {local_path}")
        except Exception as exc:
            logger.error(f"[Storage] Failed to delete file {url}: {exc}")


def delete_video_file(video_url: Optional[str]) -> None:
    if not video_url:
        return
    try:
        filename = video_url.split("/")[-1]
        local_path = os.path.abspath(os.path.join(_PROJECT_ROOT, "data", "media", filename))
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"[Storage] Deleted compiled video file: {local_path}")
    except Exception as exc:
        logger.error(f"[Storage] Failed to delete video file {video_url}: {exc}")
