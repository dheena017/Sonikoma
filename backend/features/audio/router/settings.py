"""
backend/features/audio/router/settings.py
─────────────────────────────────────────────────────────────────────────────
Audio configuration settings and curated voice presets:
GET  /audio-settings     – Retrieve active audio settings
POST /audio-settings     – Update and persist audio settings
GET  /list-audio-presets – List curated voice actor and atmosphere presets
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.audio.schemas import AudioSettingsModel
from features.audio.settings import (
    load_audio_settings,
    save_audio_settings,
    get_preset_voices,
)

logger = logging.getLogger("sonikoma.api.audio.settings")
router = APIRouter()


@router.get("/audio-settings", response_model=AudioSettingsModel, summary="Get active audio settings")
async def get_audio_settings_endpoint(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Retrieves current audio configuration, reading user preferences if authenticated."""
    return load_audio_settings(current_user=current_user)


@router.post("/audio-settings", response_model=AudioSettingsModel, summary="Update active audio settings")
async def update_audio_settings_endpoint(
    body: AudioSettingsModel,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Updates active audio configuration settings and persists to user preferences if authenticated."""
    return save_audio_settings(settings_data=body, current_user=current_user)


@router.get("/list-audio-presets", summary="List pre-configured voice and atmosphere presets")
async def list_audio_presets_endpoint(category: Optional[str] = None):
    """Returns curated cinematic character and atmosphere voice presets."""
    presets = get_preset_voices(category=category)
    return {"success": True, "presets": presets, "total": len(presets)}


__all__ = ["router"]
