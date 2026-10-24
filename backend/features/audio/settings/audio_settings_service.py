"""
backend/features/audio/settings/audio_settings_service.py
─────────────────────────────────────────────────────────────────────────────
Audio settings management: loads active audio settings and persists
user volume/voice preferences in-memory and to user profiles.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Dict, Any, Optional

from features.audio.schemas import AudioSettingsModel

logger = logging.getLogger("sonikoma.audio.settings.service")

# Global in-memory default settings state
_GLOBAL_SETTINGS = AudioSettingsModel()


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _read_user_preferences(user_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Extracts custom audio configuration dictionary from user preferences JSON."""
    if not user_data:
        return {}
    raw_prefs = user_data.get("preferences")
    if not raw_prefs:
        return {}
    try:
        parsed = json.loads(raw_prefs) if isinstance(raw_prefs, str) else dict(raw_prefs)
        return parsed.get("audio_settings", {})
    except Exception as exc:
        logger.warning(f"Could not parse user preferences: {exc}")
        return {}


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def load_audio_settings(
    current_user: Optional[Dict[str, Any]] = None
) -> AudioSettingsModel:
    """
    Loads active audio settings, merging global defaults with user preferences if authenticated.
    """
    user_audio = _read_user_preferences(current_user)
    if user_audio:
        try:
            return AudioSettingsModel(**{**_GLOBAL_SETTINGS.model_dump(), **user_audio})
        except Exception:
            pass
    return _GLOBAL_SETTINGS


def save_audio_settings(
    settings_data: AudioSettingsModel,
    current_user: Optional[Dict[str, Any]] = None
) -> AudioSettingsModel:
    """
    Updates active audio settings in memory and persists them to user preferences if authenticated.
    """
    global _GLOBAL_SETTINGS
    _GLOBAL_SETTINGS = settings_data

    if current_user and current_user.get("user_id"):
        try:
            from features.auth.repositories import update_user
            raw_prefs = current_user.get("preferences") or "{}"
            prefs = json.loads(raw_prefs) if isinstance(raw_prefs, str) else dict(raw_prefs)
            prefs["audio_settings"] = settings_data.model_dump()
            update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})
        except Exception as exc:
            logger.warning(f"Failed to persist user audio settings: {exc}")

    logger.info("✓ Updated audio settings")
    return _GLOBAL_SETTINGS


__all__ = [
    "load_audio_settings",
    "save_audio_settings",
]
