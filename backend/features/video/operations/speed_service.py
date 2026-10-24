"""
backend/features/video/operations/speed_service.py
─────────────────────────────────────────────────────────────────────────────
Video playback speed scaling with acoustic pitch preservation via FFmpeg.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.operations.speed")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _build_speed_filter_args(speed_factor: float, preserve_pitch: bool = True) -> tuple[str, str]:
    """Computes setpts video filter and atempo audio filter for target speed multiplier."""
    pts_factor = 1.0 / max(0.1, speed_factor)
    vf_filter = f"setpts={pts_factor}*PTS"

    if preserve_pitch:
        if speed_factor > 2.0:
            af_filter = f"atempo=2.0,atempo={speed_factor / 2.0}"
        elif speed_factor < 0.5:
            af_filter = f"atempo=0.5,atempo={speed_factor / 0.5}"
        else:
            af_filter = f"atempo={speed_factor}"
    else:
        af_filter = f"asetrate=44100*{speed_factor},aresample=44100"

    return vf_filter, af_filter


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def change_speed(
    video_path: str,
    speed_factor: float,
    preserve_pitch: bool = True,
    output_path: Optional[str] = None,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Changes video playback speed while keeping audio pitch."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_speed_{speed_factor}x{ext}"

    vf, af = _build_speed_filter_args(speed_factor, preserve_pitch)
    cmd = [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", vf,
        "-af", af,
        "-c:v", "libx264",
        "-c:a", "aac",
        output_path
    ]

    logger.info(f"[SpeedService] Adjusting speed of {video_path} to {speed_factor}x -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg speed adjustment failed: {result.stderr}")

    return output_path


# Backward compatibility alias
adjust_video_speed = change_speed

__all__ = [
    "change_speed",
    "adjust_video_speed",
]
