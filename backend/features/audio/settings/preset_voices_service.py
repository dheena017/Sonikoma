"""
backend/features/audio/settings/preset_voices_service.py
─────────────────────────────────────────────────────────────────────────────
Curated cinematic voice presets: Narrator, Hero, Villain, Romance, Cyberpunk AI.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional
from features.audio.schemas import AudioPresetItem

# ── Preset Registry ─────────────────────────────────────────────────────────

PRESET_VOICE_LIST: List[AudioPresetItem] = [
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
        description="Intimate, warm, and melodic delivery ideal for dramatic confessions and inner thoughts.",
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


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def get_preset_voices(
    category: Optional[str] = None
) -> List[AudioPresetItem]:
    """
    Returns curated character voice presets, optionally filtered by genre or role category.
    """
    if category:
        cat_lower = category.strip().lower()
        return [p for p in PRESET_VOICE_LIST if p.category.lower() == cat_lower]
    return list(PRESET_VOICE_LIST)


__all__ = [
    "PRESET_VOICE_LIST",
    "get_preset_voices",
]
