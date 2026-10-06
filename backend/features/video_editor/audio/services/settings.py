"""
backend/features/video_editor/audio/services/settings.py
─────────────────────────────────────────────────────────────────────────────
Audio settings and preset management service.
Handles default audio configuration and curated voice presets.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional
from features.video_editor.audio.schemas import AudioSettingsModel, AudioPresetItem

logger = logging.getLogger("sonikoma.video_editor.audio.services.settings")

# Shared in-memory settings state
_global_audio_settings = AudioSettingsModel()

DEFAULT_AUDIO_PRESETS: List[AudioPresetItem] = [
    AudioPresetItem(
        id="epic_narrator",
        name="Epic Comic Narrator",
        category="Narration",
        voice="en-US-GuyNeural",
        speech_rate=0.95,
        speech_pitch=0.95,
        description="Deep, resonant, and authoritative delivery ideal for chapter recaps and dramatic scene intros.",
        sample_text="In a realm forgotten by time, an ancient power stirs once more."
    ),
    AudioPresetItem(
        id="shonen_protagonist",
        name="Shonen Protagonist (Energetic)",
        category="Character",
        voice="en-US-JasonNeural",
        speech_rate=1.1,
        speech_pitch=1.05,
        description="High-energy, passionate, and fast-paced hero voice for battle actions and intense shouts.",
        sample_text="I won't back down! No matter what stands in my way!"
    ),
    AudioPresetItem(
        id="dark_antihero",
        name="Dark Anti-Hero (Raspy)",
        category="Character",
        voice="en-US-TonyNeural",
        speech_rate=0.9,
        speech_pitch=0.85,
        description="Low, gravelly, and calculating tone suited for dark fantasy and villain monologues.",
        sample_text="You thought you were the hunter... but you're merely prey."
    ),
    AudioPresetItem(
        id="sultry_female",
        name="Sultry Romance (Female)",
        category="Romance",
        voice="en-US-JennyNeural",
        speech_rate=1.0,
        speech_pitch=1.0,
        description="Intimate, warm, and melodic delivery ideal for dramatic character confessions and inner thoughts.",
        sample_text="Perhaps some secrets were never meant to be hidden in the dark."
    ),
    AudioPresetItem(
        id="anime_heroine",
        name="Anime Heroine (Gentle)",
        category="Character",
        voice="en-US-AriaNeural",
        speech_rate=1.05,
        speech_pitch=1.1,
        description="Bright, melodious, and gentle voice for fantasy heroines and supportive side characters.",
        sample_text="Let's protect this world together, whatever it takes!"
    ),
    AudioPresetItem(
        id="cyberpunk_ai",
        name="Cyberpunk System AI",
        category="Sci-Fi",
        voice="en-US-AriaNeural",
        speech_rate=1.05,
        speech_pitch=1.1,
        description="Crisp, synthetic, and analytical tone for futuristic UI alerts and robotic characters.",
        sample_text="Warning: Hostile entities detected within the perimeter. Engaging counter-measures."
    ),
    AudioPresetItem(
        id="british_gentleman",
        name="British Lore Master",
        category="Narration",
        voice="en-GB-RyanNeural",
        speech_rate=0.95,
        speech_pitch=1.0,
        description="Refined British English narration suitable for historical, mystery, or Victorian settings.",
        sample_text="It was said that whoever wielded the stone would command the very tides of fate."
    ),
    AudioPresetItem(
        id="korean_manhwa_lead",
        name="Korean Webtoon Lead",
        category="Multilingual",
        voice="ko-KR-InJoonNeural",
        speech_rate=1.0,
        speech_pitch=1.0,
        description="Native Korean male voice for authentic manhwa dialogue and dubbing.",
        sample_text="이번에는 내가 직접 끝내겠다."
    ),
    AudioPresetItem(
        id="japanese_anime_lead",
        name="Japanese Manga Lead",
        category="Multilingual",
        voice="ja-JP-NanamiNeural",
        speech_rate=1.0,
        speech_pitch=1.0,
        description="Native Japanese female voice for manga anime audio adaptation.",
        sample_text="諦めないで、私たちの冒険はここから始まるの！"
    ),
]


def get_audio_settings_service(current_user: Optional[Dict[str, Any]] = None) -> AudioSettingsModel:
    """Returns the current active audio settings, reading user preferences if authenticated."""
    if current_user and current_user.get("preferences"):
        try:
            import json
            prefs = json.loads(current_user["preferences"]) if isinstance(current_user["preferences"], str) else current_user["preferences"]
            user_audio = prefs.get("audio_settings", {})
            if user_audio:
                return AudioSettingsModel(**{**_global_audio_settings.model_dump(), **user_audio})
        except Exception:
            pass
    return _global_audio_settings


def update_audio_settings_service(
    settings_data: AudioSettingsModel,
    current_user: Optional[Dict[str, Any]] = None
) -> AudioSettingsModel:
    """Updates and persists audio settings to memory and user profile if authenticated."""
    global _global_audio_settings
    _global_audio_settings = settings_data

    if current_user and current_user.get("user_id"):
        try:
            import json
            from features.auth.repositories import update_user
            raw_prefs = current_user.get("preferences") or "{}"
            prefs = json.loads(raw_prefs) if isinstance(raw_prefs, str) else dict(raw_prefs)
            prefs["audio_settings"] = settings_data.model_dump()
            update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})
        except Exception:
            pass

    logger.info("[AudioSettingsService] Updated global audio settings.")
    return _global_audio_settings


def get_audio_presets_service(category: Optional[str] = None) -> List[AudioPresetItem]:
    """Returns curated presets, optionally filtered by category."""
    if category:
        cat_lower = category.strip().lower()
        return [p for p in DEFAULT_AUDIO_PRESETS if p.category.lower() == cat_lower]
    return list(DEFAULT_AUDIO_PRESETS)


__all__ = [
    "_global_audio_settings",
    "DEFAULT_AUDIO_PRESETS",
    "get_audio_settings_service",
    "update_audio_settings_service",
    "get_audio_presets_service",
]
