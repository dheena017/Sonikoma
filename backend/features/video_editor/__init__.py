"""
backend/features/video_editor/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video Editor feature domain.
Combines video rendering & motion effects and audio & TTS speech synthesis.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video_editor.router import router
from features.video_editor.video.router import video_router
from features.video_editor.audio.router import audio_router
from features.video_editor.service import (
    VideoEditorService,
    video_editor_service,
    VideoService,
    video_service,
    AudioService,
    audio_service,
)
__all__ = [
    "router",
    "video_router",
    "audio_router",
    "VideoEditorService",
    "video_editor_service",
    "VideoService",
    "video_service",
    "AudioService",
    "audio_service",
]
