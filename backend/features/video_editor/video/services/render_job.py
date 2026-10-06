"""
backend/features/video_editor/video/services/render_job.py
─────────────────────────────────────────────────────────────────────────────
Asynchronous video rendering job workflow and background task execution.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional

from features.video_editor.video.services.frame_builder import _VIDEO_OUTPUT_DIR
from features.video_editor.video.services.video_compiler import compile_video_from_panels

logger = logging.getLogger("sonikoma.video_editor.video.services.render_job")


async def process_render_job(
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
    """Coordinates and executes an asynchronous video render background task."""
    logger.info(
        f"[VideoService] Starting render job_id='{job_id}' for project_id='{project_id or 'N/A'}' ({len(panels)} panels)"
    )
    report_progress(5.0)

    os.makedirs(_VIDEO_OUTPUT_DIR, exist_ok=True)

    output_filename = await compile_video_from_panels(
        project_id=project_id or job_id,
        panels=panels,
        output_dir=_VIDEO_OUTPUT_DIR,
        voice=voice,
        enable_dialogue_audio=enable_dialogue_audio,
        enable_narrative_audio=enable_narrative_audio,
        report_progress=report_progress,
    )

    video_url = f"/videos/{output_filename}"

    logger.info(
        f"[VideoService] Completed render job_id='{job_id}' -> {video_url} "
        f"(project_id='{project_id or 'N/A'}')"
    )
    return {"video_url": video_url}


__all__ = ["process_render_job"]
