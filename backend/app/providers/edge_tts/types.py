"""
backend/app/providers/edge_tts/types.py
─────────────────────────────────────────────────────────────────────────────
Voice definitions, character archetypes, and constants for Edge TTS synthesis.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict

DEFAULT_VOICES: Dict[str, str] = {
    "protagonist_male": "en-US-ChristopherNeural",
    "protagonist_female": "en-US-JennyNeural",
    "antagonist_male": "en-US-TonyNeural",
    "antagonist_female": "en-US-AriaNeural",
    "mentor": "en-US-GuyNeural",
    "anime_male": "ja-JP-KeitaNeural",
    "anime_female": "ja-JP-NanamiNeural",
    "manhwa_male": "ko-KR-InJoonNeural",
    "manhwa_female": "ko-KR-SunHiNeural",
}

VOICE_LIST: List[Dict[str, str]] = [
    {"id": "en-US-ChristopherNeural", "name": "Christopher (Heroic / Protagonist)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-JennyNeural", "name": "Jenny (Expressive / Heroine)", "gender": "female", "lang": "English (US)"},
    {"id": "en-US-GuyNeural", "name": "Guy (Calm / Mentor)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-AriaNeural", "name": "Aria (Intense / Antagonist)", "gender": "female", "lang": "English (US)"},
    {"id": "en-US-TonyNeural", "name": "Tony (Deep / Anti-Hero)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-EricNeural", "name": "Eric (Youthful / Companion)", "gender": "male", "lang": "English (US)"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (Refined / Royalty)", "gender": "female", "lang": "English (UK)"},
    {"id": "en-GB-RyanNeural", "name": "Ryan (Noble / Knight)", "gender": "male", "lang": "English (UK)"},
    {"id": "ja-JP-KeitaNeural", "name": "Keita (Authentic Japanese Anime Male)", "gender": "male", "lang": "Japanese"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Authentic Japanese Anime Female)", "gender": "female", "lang": "Japanese"},
    {"id": "ko-KR-InJoonNeural", "name": "InJoon (Korean Manhwa Male)", "gender": "male", "lang": "Korean"},
    {"id": "ko-KR-SunHiNeural", "name": "SunHi (Korean Manhwa Female)", "gender": "female", "lang": "Korean"},
]
