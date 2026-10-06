"""
backend/features/video_editor/video/service.py
─────────────────────────────────────────────────────────────────────────────
High-level service class and helper entry points for video timeline rendering,
clip composition, transition effects, and panel sequence compiling.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from features.video_editor.video.services import (
    compile_video_from_panels,
    process_render_job,
    build_panel_frame_image,
    create_subtitle_overlay,
    build_cinematic_motion_clip,
)
from features.video_editor.video.schemas import RenderRequest, RenderResponse

logger = logging.getLogger("sonikoma.video_editor.video.service")


class VideoService:
    """Service encapsulating video compilation and rendering pipelines."""

    def __init__(self):
        self.logger = logger

    async def compile_video(
        self,
        panels: List[Dict[str, Any]],
        output_filename: str,
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
        return await compile_video_from_panels(
            panels=panels,
            output_filename=output_filename,
            voice=voice,
            music_theme=music_theme,
            aspect_ratio=aspect_ratio,
            frame_rate=frame_rate,
            video_format=video_format,
            background_style=background_style,
            subtitles_style=subtitles_style,
            audio_reactive_shake=audio_reactive_shake,
            shake_intensity=shake_intensity,
            master_volume=master_volume,
            narration_volume=narration_volume,
            bgm_volume=bgm_volume,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            enable_dialogue_audio=enable_dialogue_audio,
            enable_narrative_audio=enable_narrative_audio,
            report_progress=report_progress,
            project_id=project_id,
        )

    async def render_job(
        self,
        report_progress,
        job_id: str,
        panels: List[Dict[str, Any]],
        **kwargs,
    ) -> Dict[str, Any]:
        """Processes an asynchronous background video rendering job."""
        return await process_render_job(
            report_progress=report_progress,
            job_id=job_id,
            panels=panels,
            **kwargs,
        )


# Singleton instance
video_service = VideoService()

__all__ = [
    "VideoService",
    "video_service",
    "compile_video_from_panels",
    "process_render_job",
    "build_panel_frame_image",
    "create_subtitle_overlay",
    "build_cinematic_motion_clip",
]
