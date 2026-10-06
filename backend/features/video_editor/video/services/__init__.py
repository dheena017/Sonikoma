"""
backend/features/video_editor/video/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video sub-domain services package.
Assembles frame composition, motion engine, compilation pipeline, and render job handlers.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video_editor.video.services.frame_builder import (
    MoviePyCompileLogger,
    build_panel_frame_image,
    create_subtitle_overlay,
    _PROJECT_ROOT,
    _VIDEO_OUTPUT_DIR,
)
from features.video_editor.video.services.motion_engine import (
    build_cinematic_motion_clip,
)
from features.video_editor.video.services.video_compiler import (
    compile_video_from_panels,
    compile_panels_to_video_file,
)
from features.video_editor.video.services.render_job import (
    process_render_job,
)

__all__ = [
    "MoviePyCompileLogger",
    "build_panel_frame_image",
    "create_subtitle_overlay",
    "build_cinematic_motion_clip",
    "compile_video_from_panels",
    "compile_panels_to_video_file",
    "process_render_job",
    "_PROJECT_ROOT",
    "_VIDEO_OUTPUT_DIR",
]
