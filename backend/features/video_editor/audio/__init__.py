"""
backend/features/video_editor/audio/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio sub-domain package entry point.
Exposes router, AudioService, audio_service singleton, and schemas.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video_editor.audio.router import audio_router, router
from features.video_editor.audio.service import AudioService, audio_service
from features.video_editor.audio import schemas
from features.video_editor.audio import services

__all__ = [
    "audio_router",
    "router",
    "AudioService",
    "audio_service",
    "schemas",
    "services",
]
