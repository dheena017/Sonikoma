"""
backend/features/video_editor/service.py
─────────────────────────────────────────────────────────────────────────────
Unified service entry point for the Video Editor domain.
Combines VideoService and AudioService into a cohesive interface.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video_editor.video.service import VideoService, video_service
from features.video_editor.audio.service import AudioService, audio_service


class VideoEditorService:
    """Unified service facade for Video and Audio editing pipelines."""

    def __init__(self):
        self.video = video_service
        self.audio = audio_service


# Singleton instance
video_editor_service = VideoEditorService()

__all__ = [
    "VideoEditorService",
    "video_editor_service",
    "VideoService",
    "video_service",
    "AudioService",
    "audio_service",
]
