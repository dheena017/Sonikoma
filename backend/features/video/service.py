"""
backend/features/video/service.py
─────────────────────────────────────────────────────────────────────────────
High-level VideoService facade class and singleton instance for video domain.
Encapsulates timeline compilation, asynchronous render jobs, motion, and effects.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from features.video.compiler.video_compiler import (
    compile_video,
    compile_video_from_panels,
    compile_panels_to_video_file,
)
from features.video.compiler.render_job import (
    run_render_job,
    process_render_job,
)
from features.video.composition.frame_builder import (
    build_frame,
    build_panel_frame_image,
)
from features.video.composition.subtitle_overlay import (
    create_subtitles,
    create_subtitle_overlay,
)
from features.video.motion.motion_engine import (
    apply_motion,
    build_cinematic_motion_clip,
)
from features.video.motion.camera_shake_engine import (
    apply_shake,
    build_camera_shake_clip,
)
from features.video.motion.parallax_engine import (
    apply_parallax,
    build_parallax_motion_clip,
)

logger = logging.getLogger("sonikoma.features.video.service")


class VideoService:
    """Canonical service facade encapsulating video compilation and rendering pipelines."""

    def __init__(self):
        self.logger = logger

    async def compile_video(
        self,
        panels: List[Dict[str, Any]],
        output_filename: Optional[str] = None,
        voice: str = "en-US-GuyNeural",
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
        enable_dialogue_audio: bool = True,
        enable_narrative_audio: bool = True,
        report_progress=None,
        project_id: Optional[str] = None,
    ) -> str:
        """Compiles comic panels into an output video file."""
        return await compile_video(
            project_id=project_id or "default_project",
            panels=panels,
            voice=voice,
            enable_dialogue_audio=enable_dialogue_audio,
            enable_narrative_audio=enable_narrative_audio,
            enable_subtitles=(subtitles_style != "none"),
            report_progress=report_progress,
        )

    async def render_job(
        self,
        report_progress,
        job_id: str,
        panels: List[Dict[str, Any]],
        **kwargs,
    ) -> Dict[str, Any]:
        """Processes an asynchronous background video rendering job."""
        return await run_render_job(
            report_progress=report_progress,
            job_id=job_id,
            panels=panels,
            **kwargs,
        )


# Canonical singleton instance
video_service = VideoService()

__all__ = [
    "VideoService",
    "video_service",
    "compile_video",
    "compile_video_from_panels",
    "compile_panels_to_video_file",
    "run_render_job",
    "process_render_job",
    "build_frame",
    "build_panel_frame_image",
    "create_subtitles",
    "create_subtitle_overlay",
    "apply_motion",
    "build_cinematic_motion_clip",
    "apply_shake",
    "build_camera_shake_clip",
    "apply_parallax",
    "build_parallax_motion_clip",
]
