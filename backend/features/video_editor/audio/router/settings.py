"""
backend/features/video_editor/audio/router/settings.py
─────────────────────────────────────────────────────────────────────────────
Audio configuration settings and pre-built cinematic voice/atmosphere presets.
GET  /audio-settings       – Retrieve active audio settings (reads user prefs)
POST /audio-settings       – Update and persist audio settings
GET  /list-audio-presets   – List curated voice presets
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.video_editor.audio.schemas import AudioSettingsModel
from features.video_editor.audio.services.settings import (
    _global_audio_settings,
    DEFAULT_AUDIO_PRESETS,
    get_audio_settings_service,
    update_audio_settings_service,
    get_audio_presets_service,
)

logger = logging.getLogger("sonikoma.api.audio.settings")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/audio-settings", response_model=AudioSettingsModel, summary="Get active audio synthesis & mixing settings")
async def get_audio_settings_endpoint(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Retrieves current audio configuration, reading user preferences if authenticated."""
    return get_audio_settings_service(current_user=current_user)


@router.post("/audio-settings", response_model=AudioSettingsModel, summary="Update active audio synthesis & mixing settings")
async def update_audio_settings_endpoint(
    body: AudioSettingsModel,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Updates active audio configuration settings and persists to user preferences if authenticated."""
    return update_audio_settings_service(settings_data=body, current_user=current_user)


@router.get("/list-audio-presets", summary="List pre-configured voice and atmosphere audio presets")
async def list_audio_presets_endpoint(category: Optional[str] = None):
    """Returns curated cinematic voice actor presets and atmospheric configurations."""
    presets = get_audio_presets_service(category=category)
    return {"success": True, "presets": presets, "total": len(presets)}


__all__ = [
    "router",
    "_global_audio_settings",
    "DEFAULT_AUDIO_PRESETS",
    "get_audio_settings_endpoint",
    "update_audio_settings_endpoint",
    "list_audio_presets_endpoint",
]
