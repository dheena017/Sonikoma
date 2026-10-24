"""
backend/features/video/operations/filter_service.py
─────────────────────────────────────────────────────────────────────────────
Visual color filters, image enhancements, and grading shaders via FFmpeg.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.operations.filter")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _resolve_filter_string(filter_type: str, intensity: float = 1.0) -> str:
    """Returns the FFmpeg -vf filter string for a designated visual shader."""
    ft = filter_type.lower().strip()
    filters = {
        "blur": f"boxblur={max(1.0, intensity * 2.0)}",
        "brighten": f"eq=brightness={min(0.8, intensity * 0.2)}",
        "darken": f"eq=brightness=-{min(0.8, intensity * 0.2)}",
        "saturate": f"eq=saturation={1.0 + intensity}",
        "desaturate": f"eq=saturation={max(0.0, 1.0 - intensity)}",
        "grayscale": "format=gray",
        "sepia": "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
        "invert": "negate",
        "sharpen": f"unsharp=5:5:{intensity}",
        "denoise": "nlmeans=s=10:p=4:r=16",
        "vignette": "vignette=PI/4",
    }
    return filters.get(ft, f"eq=contrast={intensity}")


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def apply_filter(
    video_path: str,
    filter_type: str,
    intensity: float = 1.0,
    output_path: Optional[str] = None,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Applies a visual filter or color effect to a video."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_filter_{filter_type}{ext}"

    vf_str = _resolve_filter_string(filter_type, intensity)
    cmd = [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", vf_str,
        "-c:v", "libx264",
        "-c:a", "copy",
        output_path
    ]

    logger.info(f"[FilterService] Applying filter '{filter_type}' to {video_path} -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg filter execution failed: {result.stderr}")

    return output_path


# Backward compatibility alias
apply_video_filter = apply_filter

__all__ = [
    "apply_filter",
    "apply_video_filter",
]
