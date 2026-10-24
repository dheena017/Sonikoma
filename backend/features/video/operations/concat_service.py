"""
backend/features/video/operations/concat_service.py
─────────────────────────────────────────────────────────────────────────────
Video concatenation and sequence stitching with transition blending.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import tempfile
import logging
from typing import List, Optional, Dict, Any

from features.video.utils.media_resolver import TEMP_DIR

logger = logging.getLogger("sonikoma.features.video.operations.concat")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _generate_concat_demuxer_manifest(video_paths: List[str]) -> str:
    """Writes a temporary FFmpeg concat demuxer manifest file."""
    os.makedirs(TEMP_DIR, exist_ok=True)
    concat_file = os.path.join(TEMP_DIR, f"concat_{os.urandom(4).hex()}.txt")
    with open(concat_file, "w", encoding="utf-8") as f:
        for vp in video_paths:
            escaped_path = os.path.abspath(vp).replace("\\", "/")
            f.write(f"file '{escaped_path}'\n")
    return concat_file


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def concat_videos(
    video_paths: List[str],
    output_path: Optional[str] = None,
    transitions: Optional[List[Dict[str, Any]]] = None,
    fps: int = 24,
    width: int = 1920,
    height: int = 1080,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Joins multiple video files into one video."""
    if not video_paths:
        raise ValueError("No video paths provided for concatenation.")

    for vp in video_paths:
        if not os.path.exists(vp):
            raise FileNotFoundError(f"Video clip not found: {vp}")

    if output_path is None:
        first_dir = os.path.dirname(os.path.abspath(video_paths[0]))
        output_path = os.path.join(first_dir, f"concat_{os.urandom(4).hex()}.mp4")

    concat_file = _generate_concat_demuxer_manifest(video_paths)
    cmd = [
        ffmpeg_path, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-c:v", "libx264",
        "-r", str(fps),
        "-vf", f"scale={width}:{height}",
        "-c:a", "aac",
        output_path
    ]

    logger.info(f"[ConcatService] Concatenating {len(video_paths)} clips -> {output_path}")
    try:
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg video concatenation failed: {result.stderr}")
        return output_path
    finally:
        if os.path.exists(concat_file):
            try:
                os.remove(concat_file)
            except Exception:
                pass


# Backward compatibility alias
concatenate_video_clips = concat_videos

__all__ = [
    "concat_videos",
    "concatenate_video_clips",
]
