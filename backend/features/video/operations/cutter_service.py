"""
backend/features/video/operations/cutter_service.py
─────────────────────────────────────────────────────────────────────────────
Video trimming, segment extraction, and audio/video fade transitions.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.operations.cutter")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _build_cut_command(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    fade_in: float = 0.0,
    fade_out: float = 0.0
) -> list[str]:
    """Constructs FFmpeg CLI arguments for segment trimming and optional fade curves."""
    duration = max(0.1, end_time - start_time)
    cmd = [ffmpeg_path, "-y", "-ss", str(start_time), "-i", video_path, "-t", str(duration)]

    vf_filters = []
    af_filters = []

    if fade_in > 0:
        vf_filters.append(f"fade=t=in:st=0:d={fade_in}")
        af_filters.append(f"afade=t=in:st=0:d={fade_in}")

    if fade_out > 0:
        out_start = max(0.0, duration - fade_out)
        vf_filters.append(f"fade=t=out:st={out_start}:d={fade_out}")
        af_filters.append(f"afade=t=out:st={out_start}:d={fade_out}")

    if vf_filters:
        cmd.extend(["-vf", ",".join(vf_filters)])
    if af_filters:
        cmd.extend(["-af", ",".join(af_filters)])

    cmd.extend(["-c:v", "libx264", "-c:a", "aac", output_path])
    return cmd


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def cut_video(
    video_path: str,
    start_time: float,
    end_time: float,
    output_path: Optional[str] = None,
    fade_in: float = 0.0,
    fade_out: float = 0.0,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Cuts a video clip between start and end times with optional fades."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_cut_{int(start_time)}_{int(end_time)}{ext}"

    cmd = _build_cut_command(ffmpeg_path, video_path, output_path, start_time, end_time, fade_in, fade_out)
    logger.info(f"[CutterService] Cutting {video_path} [{start_time}s -> {end_time}s] -> {output_path}")

    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg video trim failed: {result.stderr}")

    return output_path


# Backward compatibility alias
cut_video_clip = cut_video

__all__ = [
    "cut_video",
    "cut_video_clip",
]
