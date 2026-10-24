"""
backend/features/video/compiler/render_job.py
─────────────────────────────────────────────────────────────────────────────
Asynchronous video rendering job workflow and background task execution.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional

from features.video.utils.media_resolver import MEDIA_VIDEOS_DIR
from features.video.compiler.video_compiler import compile_video

logger = logging.getLogger("sonikoma.features.video.compiler.render_job")

_VIDEO_OUTPUT_DIR = MEDIA_VIDEOS_DIR


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _format_render_response(filename: str) -> Dict[str, str]:
    """Formats standardized render response payload with static streaming URL."""
    video_url = f"/videos/{filename}"
    return {"video_url": video_url}


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def run_render_job(
    report_progress: Any,
    job_id: str,
    panels: List[Dict[str, Any]],
    voice: Optional[str] = None,
    music_theme: str = "none",
    aspect_ratio: str = "auto",
    frame_rate: int = 24,
    video_format: str = "mp4",
    background_style: str = "black",
    subtitles_style: str = "none",
    audio_reactive_shake: bool = False,
    shake_intensity: str = "medium",
    master_volume: float = 1.0,
    narration_volume: float = 1.0,
    bgm_volume: float = 1.0,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    enable_dialogue_audio: Optional[bool] = None,
    enable_narrative_audio: Optional[bool] = None,
    project_id: Optional[str] = None,
) -> Dict[str, str]:
    """Runs a background video render job and returns output video URL."""
    logger.info(
        f"[VideoService] Starting render job_id='{job_id}' for project_id='{project_id or 'N/A'}' ({len(panels)} panels)"
    )
    if report_progress:
        report_progress(5.0)

    os.makedirs(_VIDEO_OUTPUT_DIR, exist_ok=True)

    output_filename = await compile_video(
        project_id=project_id or job_id,
        panels=panels,
        output_dir=_VIDEO_OUTPUT_DIR,
        voice=voice,
        enable_dialogue_audio=enable_dialogue_audio,
        enable_narrative_audio=enable_narrative_audio,
        report_progress=report_progress,
    )

    result = _format_render_response(output_filename)
    logger.info(
        f"[VideoService] Completed render job_id='{job_id}' -> {result['video_url']} (project_id='{project_id or 'N/A'}')"
    )
    return result


# Backward compatibility alias
process_render_job = run_render_job

__all__ = [
    "run_render_job",
    "process_render_job",
]
