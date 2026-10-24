"""
backend/features/video/operations/thumbnail_service.py
─────────────────────────────────────────────────────────────────────────────
Keyframe still extraction and poster thumbnail generation via FFmpeg.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.operations.thumbnail")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _resolve_thumbnail_timestamp(timestamp_seconds: Optional[float]) -> float:
    """Returns a non-negative timestamp for thumbnail capture."""
    if timestamp_seconds is None or timestamp_seconds < 0:
        return 1.0
    return float(timestamp_seconds)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def get_thumbnail(
    video_path: str,
    timestamp_seconds: Optional[float] = None,
    output_path: Optional[str] = None,
    width: int = 1280,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Gets a poster thumbnail image from a video at a given timestamp."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    if output_path is None:
        base = os.path.splitext(video_path)[0]
        output_path = f"{base}_thumb.jpg"

    ts = _resolve_thumbnail_timestamp(timestamp_seconds)
    cmd = [
        ffmpeg_path, "-y",
        "-ss", str(ts),
        "-i", video_path,
        "-vframes", "1",
        "-vf", f"scale={width}:-1",
        "-q:v", "2",
        output_path
    ]

    logger.info(f"[ThumbnailService] Extracting thumbnail from {video_path} at {ts}s -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg thumbnail extraction failed: {result.stderr}")

    return output_path


# Backward compatibility alias
extract_video_thumbnail = get_thumbnail

__all__ = [
    "get_thumbnail",
    "extract_video_thumbnail",
]
