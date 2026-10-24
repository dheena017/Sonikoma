"""
backend/features/video/operations/subtitle_burn_service.py
─────────────────────────────────────────────────────────────────────────────
Hardcoded subtitle burning (.srt, .vtt, .ass) into video frames via FFmpeg.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.operations.subtitle_burn")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _sanitize_path_for_ffmpeg_filter(path: str) -> str:
    """Escapes backslashes and colons required for FFmpeg filter arguments on Windows."""
    escaped = os.path.abspath(path).replace("\\", "/")
    if len(escaped) > 1 and escaped[1] == ":":
        escaped = escaped[0] + "\\:" + escaped[2:]
    return escaped


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: Optional[str] = None,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Burns subtitles permanently into video frames."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")
    if not os.path.exists(subtitle_path):
        raise FileNotFoundError(f"Subtitle file not found: {subtitle_path}")

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_subtitled{ext}"

    escaped_sub_path = _sanitize_path_for_ffmpeg_filter(subtitle_path)
    vf_arg = f"subtitles='{escaped_sub_path}'"

    cmd = [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", vf_arg,
        "-c:v", "libx264",
        "-c:a", "copy",
        output_path
    ]

    logger.info(f"[SubtitleBurnService] Burning {subtitle_path} into {video_path} -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=400)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg subtitle burn failed: {result.stderr}")

    return output_path


# Backward compatibility alias
burn_subtitles_into_video = burn_subtitles

__all__ = [
    "burn_subtitles",
    "burn_subtitles_into_video",
]
