"""
backend/app/api/v1/audio/settings.py
─────────────────────────────────────────────────────────────────────────────
Audio configuration settings and pre-built cinematic voice/atmosphere presets.
GET  /settings          – Retrieve active audio settings (reads user prefs)
POST /settings          – Update and persist audio settings
GET  /presets           – List curated voice presets
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends

from api.dependencies.auth import get_optional_current_user
from schemas.audio import AudioSettingsModel, AudioPresetItem

logger = logging.getLogger("sonikoma.api.audio.settings")
router = APIRouter()

# ── Shared in-memory default (imported and mutated by other modules) ──────────
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
        description="Warm, emotive, and expressive female voice for romance and character dialogues.",
        sample_text="Could it be that you truly cared about me all along?"
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
        id="british_gentleman",
        name="British Lore Master",
        category="Narration",
        voice="en-GB-RyanNeural",
        speech_rate=0.95,
        speech_pitch=0.95,
        description="Refined British male accent for historical, lore, and world-building explanations.",
        sample_text="Legend speaks of a sword forged in the heart of a fallen star."
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
    )
]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=AudioSettingsModel, summary="Get active audio synthesis & mixing settings")
async def get_audio_settings_endpoint(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Retrieves current audio configuration, reading user preferences if authenticated."""
    if current_user and current_user.get("preferences"):
        try:
            prefs = json.loads(current_user["preferences"]) if isinstance(current_user["preferences"], str) else current_user["preferences"]
            user_audio = prefs.get("audio_settings", {})
            if user_audio:
                return AudioSettingsModel(**{**_global_audio_settings.model_dump(), **user_audio})
        except Exception:
            pass
    return _global_audio_settings


@router.post("/settings", response_model=AudioSettingsModel, summary="Update active audio synthesis & mixing settings")
async def update_audio_settings_endpoint(
    body: AudioSettingsModel,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Updates active audio configuration settings and persists to user preferences if authenticated."""
    global _global_audio_settings
    _global_audio_settings = body

    if current_user and current_user.get("user_id"):
        try:
            from repositories.user import update_user
            raw_prefs = current_user.get("preferences") or "{}"
            prefs = json.loads(raw_prefs) if isinstance(raw_prefs, str) else dict(raw_prefs)
            prefs["audio_settings"] = body.model_dump()
            update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})
        except Exception as err:
            logger.debug(f"[AudioSettings] Could not persist to user profile: {err}")

    return _global_audio_settings


@router.get("/presets", summary="List pre-configured voice and atmosphere audio presets")
async def list_audio_presets_endpoint():
    """Returns curated cinematic voice actor presets and atmospheric configurations."""
    return {"success": True, "presets": DEFAULT_AUDIO_PRESETS, "total": len(DEFAULT_AUDIO_PRESETS)}
