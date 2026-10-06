"""
backend/features/video_editor/video/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video sub-domain package.
Exposes router, service, schemas, and compiler pipeline for video operations.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video_editor.video.router import video_router, ffmpeg_router
from features.video_editor.video.service import VideoService, video_service
from features.video_editor.video.services import (
    compile_video_from_panels,
    process_render_job,
    build_panel_frame_image,
    create_subtitle_overlay,
    build_cinematic_motion_clip,
)
from features.video_editor.video import schemas
types = schemas

router = video_router

__all__ = [
    "video_router",
    "ffmpeg_router",
    "router",
    "VideoService",
    "video_service",
    "compile_video_from_panels",
    "process_render_job",
    "build_panel_frame_image",
    "create_subtitle_overlay",
    "build_cinematic_motion_clip",
    "schemas",
    "types",
]
