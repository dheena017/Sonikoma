"""
backend/features/video/export/gif_exporter.py
─────────────────────────────────────────────────────────────────────────────
Optimized animated GIF and WebP teaser clips generation via two-pass FFmpeg.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.features.video.export.gif_exporter")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _build_palette_filter_complex(fps: int = 15, width: int = 480) -> str:
    """Builds two-pass palettegen and paletteuse filter graph for high-fidelity color reproduction."""
    return f"fps={fps},scale={width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def export_gif(
    video_path: str,
    start_time: float,
    duration: float,
    format_type: str = "webp",
    output_path: Optional[str] = None,
    fps: int = 15,
    width: int = 480,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Exports a short video clip as an animated GIF or WebP."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    ext = "webp" if format_type.lower() == "webp" else "gif"
    if output_path is None:
        base = os.path.splitext(video_path)[0]
        output_path = f"{base}_teaser.{ext}"

    filter_complex = _build_palette_filter_complex(fps=fps, width=width)
    cmd = [
        ffmpeg_path, "-y",
        "-ss", str(start_time),
        "-t", str(duration),
        "-i", video_path,
        "-vf", filter_complex,
        output_path
    ]

    logger.info(f"[GifExporter] Exporting {ext.upper()} teaser from {video_path} -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg {ext} export failed: {result.stderr}")

    return output_path


# Backward compatibility alias
export_animated_teaser = export_gif

__all__ = [
    "export_gif",
    "export_animated_teaser",
]
