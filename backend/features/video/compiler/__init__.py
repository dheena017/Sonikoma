"""
backend/features/video/compiler/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video timeline compilation, rendering jobs, and audio-visual synchronization.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.compiler.video_compiler import (
    MoviePyCompileLogger,
    compile_video,
    compile_video_from_panels,
    compile_panels_to_video_file,
    _PROJECT_ROOT,
    _VIDEO_OUTPUT_DIR,
)
from features.video.compiler.render_job import (
    run_render_job,
    process_render_job,
)
from features.video.compiler.timeline_engine import (
    build_timeline,
    build_multi_track_timeline,
)
from features.video.compiler.audio_sync_engine import (
    sync_dialogue,
    align_dialogue_with_audio,
)

__all__ = [
    "MoviePyCompileLogger",
    "compile_video",
    "compile_video_from_panels",
    "compile_panels_to_video_file",
    "run_render_job",
    "process_render_job",
    "build_timeline",
    "build_multi_track_timeline",
    "sync_dialogue",
    "align_dialogue_with_audio",
    "_PROJECT_ROOT",
    "_VIDEO_OUTPUT_DIR",
]
