"""
backend/features/audio/speech/voice_list_service.py
─────────────────────────────────────────────────────────────────────────────
Voice catalog, language mappings, and supported neural voice definitions.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, List, Any, Optional

VOICE_MAP: Dict[str, str] = {
    "Standard Comic Narrator (Male)": "en-US-GuyNeural",
    "Sultry Narrative Tone (Female)": "en-US-JennyNeural",
    "Shonen Protagonist (Energetic Male)": "en-US-JasonNeural",
    "Dark Anti-Hero voice (Raspy Deep)": "en-US-TonyNeural",

    "English (US) — Guy (Male)": "en-US-GuyNeural",
    "English (US) — Jenny (Female)": "en-US-JennyNeural",
    "English (US) — Aria (Female)": "en-US-AriaNeural",
    "English (UK) — Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) — Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) — Natasha (Female)": "en-AU-NatashaNeural",
    "Korean — SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean — InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese — Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese (Mandarin) — Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) — Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) — Valluvar (Male)": "ta-IN-ValluvarNeural",
    "Tamil (Sri Lanka) — Saranya (Female)": "ta-LK-SaranyaNeural",
    "Tamil (Sri Lanka) — Kumar (Male)": "ta-LK-KumarNeural",
    "Tamil (Singapore) — Venba (Female)": "ta-SG-VenbaNeural",
    "Tamil (Singapore) — Anbu (Male)": "ta-SG-AnbuNeural",
    "Tamil (Malaysia) — Kani (Female)": "ta-MY-KaniNeural",
    "Tamil (Malaysia) — Surya (Male)": "ta-MY-SuryaNeural",

    # ASCII dash fallbacks
    "English (US) - Guy (Male)": "en-US-GuyNeural",
    "English (US) - Jenny (Female)": "en-US-JennyNeural",
    "English (US) - Aria (Female)": "en-US-AriaNeural",
    "English (UK) - Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) - Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) - Natasha (Female)": "en-AU-NatashaNeural",
    "Korean - SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean - InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese - Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese - Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) - Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) - Valluvar (Male)": "ta-IN-ValluvarNeural",
    "Tamil (Sri Lanka) - Saranya (Female)": "ta-LK-SaranyaNeural",
    "Tamil (Sri Lanka) - Kumar (Male)": "ta-LK-KumarNeural",
    "Tamil (Singapore) - Venba (Female)": "ta-SG-VenbaNeural",
    "Tamil (Singapore) - Anbu (Male)": "ta-SG-AnbuNeural",
    "Tamil (Malaysia) - Kani (Female)": "ta-MY-KaniNeural",
    "Tamil (Malaysia) - Surya (Male)": "ta-MY-SuryaNeural",
}

VOICE_CATALOG: List[Dict[str, Any]] = [
    # English
    {"code": "en-US-GuyNeural",         "label": "English (US) — Guy (Male)",             "gender": "Male",   "lang": "English"},
    {"code": "en-US-JennyNeural",       "label": "English (US) — Jenny (Female)",         "gender": "Female", "lang": "English"},
    {"code": "en-US-AriaNeural",        "label": "English (US) — Aria (Female)",          "gender": "Female", "lang": "English"},
    {"code": "en-US-JasonNeural",       "label": "English (US) — Jason (Energetic Male)", "gender": "Male",   "lang": "English"},
    {"code": "en-US-TonyNeural",        "label": "English (US) — Tony (Raspy Male)",      "gender": "Male",   "lang": "English"},
    {"code": "en-GB-SoniaNeural",       "label": "English (UK) — Sonia (Female)",         "gender": "Female", "lang": "English"},
    {"code": "en-GB-RyanNeural",        "label": "English (UK) — Ryan (Male)",            "gender": "Male",   "lang": "English"},
    {"code": "en-AU-NatashaNeural",     "label": "English (AU) — Natasha (Female)",       "gender": "Female", "lang": "English"},

    # Asian & Multilingual
    {"code": "ko-KR-SunHiNeural",       "label": "Korean — SunHi (Female)",               "gender": "Female", "lang": "Korean"},
    {"code": "ko-KR-InJoonNeural",      "label": "Korean — InJoon (Male)",                "gender": "Male",   "lang": "Korean"},
    {"code": "ja-JP-NanamiNeural",      "label": "Japanese — Nanami (Female)",            "gender": "Female", "lang": "Japanese"},
    {"code": "zh-CN-XiaoxiaoNeural",    "label": "Chinese (Mandarin) — Xiaoxiao (Female)","gender": "Female", "lang": "Chinese"},

    # Tamil Regional
    {"code": "ta-IN-PallaviNeural",     "label": "Tamil (India) — Pallavi (Female)",      "gender": "Female", "lang": "Tamil"},
    {"code": "ta-IN-ValluvarNeural",    "label": "Tamil (India) — Valluvar (Male)",       "gender": "Male",   "lang": "Tamil"},
    {"code": "ta-LK-SaranyaNeural",     "label": "Tamil (Sri Lanka) — Saranya (Female)",  "gender": "Female", "lang": "Tamil"},
    {"code": "ta-LK-KumarNeural",       "label": "Tamil (Sri Lanka) — Kumar (Male)",      "gender": "Male",   "lang": "Tamil"},
    {"code": "ta-SG-VenbaNeural",       "label": "Tamil (Singapore) — Venba (Female)",    "gender": "Female", "lang": "Tamil"},
    {"code": "ta-SG-AnbuNeural",        "label": "Tamil (Singapore) — Anbu (Male)",       "gender": "Male",   "lang": "Tamil"},
    {"code": "ta-MY-KaniNeural",        "label": "Tamil (Malaysia) — Kani (Female)",      "gender": "Female", "lang": "Tamil"},
    {"code": "ta-MY-SuryaNeural",       "label": "Tamil (Malaysia) — Surya (Male)",       "gender": "Male",   "lang": "Tamil"},
]


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _pick_voice_for_character(gender: str, role: str) -> str:
    """Selects an appropriate default voice model based on character gender and story role."""
    gen = (gender or "male").lower().strip()
    rol = (role or "protagonist").lower().strip()
    if gen == "female":
        if rol == "protagonist":
            return "en-US-JennyNeural"
        elif rol == "heroine":
            return "en-US-AriaNeural"
        return "en-GB-SoniaNeural"
    else:
        if rol in ("protagonist", "hero"):
            return "en-US-JasonNeural"
        elif rol in ("antagonist", "villain"):
            return "en-US-TonyNeural"
        return "en-US-GuyNeural"


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def list_all_voices(
    language: Optional[str] = None,
    gender: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns all supported neural voices, optionally filtered by language and gender.
    """
    results = VOICE_CATALOG
    if language:
        lang_lower = language.strip().lower()
        results = [v for v in results if lang_lower in v["lang"].lower() or lang_lower in v["code"].lower()]
    if gender:
        gen_lower = gender.strip().lower()
        results = [v for v in results if v["gender"].lower() == gen_lower]
    return list(results)


__all__ = [
    "VOICE_MAP",
    "VOICE_CATALOG",
    "list_all_voices",
]
