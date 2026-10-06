"""
backend/features/video_editor/audio/services/voice_catalog.py
─────────────────────────────────────────────────────────────────────────────
Voice catalog, language mappings, and supported voice definitions for Edge-TTS.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, List, Any

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
    "Tamil (Malaysia) - Surya (Male)": "ta-MY-SuryaNeural"
}


def get_available_voices() -> List[Dict[str, Any]]:
    """Returns all supported Edge-TTS neural voices across languages and styles."""
    return [
        # English
        {"code": "en-US-GuyNeural",         "label": "English (US) — Guy (Male)",             "gender": "Male",   "lang": "English"},
        {"code": "en-US-JennyNeural",       "label": "English (US) — Jenny (Female)",         "gender": "Female", "lang": "English"},
        {"code": "en-US-AriaNeural",        "label": "English (US) — Aria (Female)",          "gender": "Female", "lang": "English"},
        {"code": "en-US-ChristopherNeural", "label": "English (US) — Christopher (Male)",     "gender": "Male",   "lang": "English"},
        {"code": "en-US-EricNeural",        "label": "English (US) — Eric (Male)",            "gender": "Male",   "lang": "English"},
        {"code": "en-GB-SoniaNeural",       "label": "English (UK) — Sonia (Female)",         "gender": "Female", "lang": "English"},
        {"code": "en-GB-RyanNeural",        "label": "English (UK) — Ryan (Male)",            "gender": "Male",   "lang": "English"},
        {"code": "en-AU-NatashaNeural",     "label": "English (AU) — Natasha (Female)",       "gender": "Female", "lang": "English"},
        {"code": "en-IN-PrabhatNeural",     "label": "English (India) — Prabhat (Male)",      "gender": "Male",   "lang": "English"},
        {"code": "en-IN-NeerjaNeural",      "label": "English (India) — Neerja (Female)",     "gender": "Female", "lang": "English"},

        # Japanese
        {"code": "ja-JP-NanamiNeural",      "label": "Japanese — Nanami (Female)",            "gender": "Female", "lang": "Japanese"},
        {"code": "ja-JP-KeitaNeural",       "label": "Japanese — Keita (Male)",               "gender": "Male",   "lang": "Japanese"},
        {"code": "ja-JP-AoiNeural",         "label": "Japanese — Aoi (Female)",               "gender": "Female", "lang": "Japanese"},
        {"code": "ja-JP-DaichiNeural",      "label": "Japanese — Daichi (Male)",             "gender": "Male",   "lang": "Japanese"},

        # Korean
        {"code": "ko-KR-SunHiNeural",       "label": "Korean — SunHi (Female)",               "gender": "Female", "lang": "Korean"},
        {"code": "ko-KR-InJoonNeural",      "label": "Korean — InJoon (Male)",                "gender": "Male",   "lang": "Korean"},
        {"code": "ko-KR-BongJinNeural",     "label": "Korean — BongJin (Male)",               "gender": "Male",   "lang": "Korean"},
        {"code": "ko-KR-YuJinNeural",       "label": "Korean — YuJin (Female)",               "gender": "Female", "lang": "Korean"},

        # Spanish
        {"code": "es-ES-AlvaroNeural",      "label": "Spanish (Spain) — Alvaro (Male)",       "gender": "Male",   "lang": "Spanish"},
        {"code": "es-ES-ElviraNeural",      "label": "Spanish (Spain) — Elvira (Female)",     "gender": "Female", "lang": "Spanish"},
        {"code": "es-MX-DaliaNeural",       "label": "Spanish (Mexico) — Dalia (Female)",     "gender": "Female", "lang": "Spanish"},
        {"code": "es-MX-JorgeNeural",       "label": "Spanish (Mexico) — Jorge (Male)",       "gender": "Male",   "lang": "Spanish"},

        # French
        {"code": "fr-FR-HenriNeural",        "label": "French (France) — Henri (Male)",        "gender": "Male",   "lang": "French"},
        {"code": "fr-FR-DeniseNeural",      "label": "French (France) — Denise (Female)",     "gender": "Female", "lang": "French"},
        {"code": "fr-CA-SylvieNeural",      "label": "French (Canada) — Sylvie (Female)",     "gender": "Female", "lang": "French"},

        # German
        {"code": "de-DE-ConradNeural",      "label": "German — Conrad (Male)",                "gender": "Male",   "lang": "German"},
        {"code": "de-DE-KatjaNeural",       "label": "German — Katja (Female)",               "gender": "Female", "lang": "German"},
        {"code": "de-DE-AmalaNeural",       "label": "German — Amala (Female)",               "gender": "Female", "lang": "German"},

        # Chinese
        {"code": "zh-CN-XiaoxiaoNeural",    "label": "Chinese (Mandarin) — Xiaoxiao (Female)","gender": "Female", "lang": "Chinese"},
        {"code": "zh-CN-YunxiNeural",       "label": "Chinese (Mandarin) — Yunxi (Male)",     "gender": "Male",   "lang": "Chinese"},
        {"code": "zh-CN-YunjianNeural",     "label": "Chinese (Mandarin) — Yunjian (Male)",   "gender": "Male",   "lang": "Chinese"},
        {"code": "zh-HK-HiuMaanNeural",     "label": "Chinese (Cantonese) — HiuMaan (Female)","gender": "Female", "lang": "Chinese"},

        # Tamil
        {"code": "ta-IN-PallaviNeural",     "label": "Tamil (India) — Pallavi (Female)",      "gender": "Female", "lang": "Tamil"},
        {"code": "ta-IN-ValluvarNeural",    "label": "Tamil (India) — Valluvar (Male)",       "gender": "Male",   "lang": "Tamil"},
        {"code": "ta-LK-SaranyaNeural",     "label": "Tamil (Sri Lanka) — Saranya (Female)",  "gender": "Female", "lang": "Tamil"},
        {"code": "ta-LK-KumarNeural",       "label": "Tamil (Sri Lanka) — Kumar (Male)",      "gender": "Male",   "lang": "Tamil"},
        {"code": "ta-SG-VenbaNeural",       "label": "Tamil (Singapore) — Venba (Female)",    "gender": "Female", "lang": "Tamil"},
        {"code": "ta-SG-AnbuNeural",        "label": "Tamil (Singapore) — Anbu (Male)",       "gender": "Male",   "lang": "Tamil"},
        {"code": "ta-MY-KaniNeural",        "label": "Tamil (Malaysia) — Kani (Female)",      "gender": "Female", "lang": "Tamil"},
        {"code": "ta-MY-SuryaNeural",       "label": "Tamil (Malaysia) — Surya (Male)",       "gender": "Male",   "lang": "Tamil"},

        # Hindi & Indian Languages
        {"code": "hi-IN-MadhurNeural",      "label": "Hindi (India) — Madhur (Male)",         "gender": "Male",   "lang": "Hindi"},
        {"code": "hi-IN-SwaraNeural",       "label": "Hindi (India) — Swara (Female)",        "gender": "Female", "lang": "Hindi"},
        {"code": "te-IN-MohanNeural",       "label": "Telugu (India) — Mohan (Male)",         "gender": "Male",   "lang": "Telugu"},
        {"code": "kn-IN-GaganNeural",       "label": "Kannada (India) — Gagan (Male)",        "gender": "Male",   "lang": "Kannada"},
        {"code": "ml-IN-MidhunNeural",      "label": "Malayalam (India) — Midhun (Male)",     "gender": "Male",   "lang": "Malayalam"},

        # Portuguese
        {"code": "pt-BR-AntonioNeural",     "label": "Portuguese (Brazil) — Antonio (Male)",  "gender": "Male",   "lang": "Portuguese"},
        {"code": "pt-BR-FranciscaNeural",   "label": "Portuguese (Brazil) — Francisca (Female)","gender": "Female","lang": "Portuguese"},
        {"code": "pt-PT-DuarteNeural",      "label": "Portuguese (Portugal) — Duarte (Male)", "gender": "Male",   "lang": "Portuguese"},

        # Italian
        {"code": "it-IT-DiegoNeural",       "label": "Italian — Diego (Male)",                "gender": "Male",   "lang": "Italian"},
        {"code": "it-IT-ElsaNeural",        "label": "Italian — Elsa (Female)",               "gender": "Female", "lang": "Italian"},

        # Indonesian & Southeast Asian
        {"code": "id-ID-ArdiNeural",        "label": "Indonesian — Ardi (Male)",              "gender": "Male",   "lang": "Indonesian"},
        {"code": "id-ID-GadisNeural",       "label": "Indonesian — Gadis (Female)",           "gender": "Female", "lang": "Indonesian"},
        {"code": "vi-VN-NamMinhNeural",     "label": "Vietnamese — NamMinh (Male)",           "gender": "Male",   "lang": "Vietnamese"},
        {"code": "vi-VN-HoaiMyNeural",      "label": "Vietnamese — HoaiMy (Female)",          "gender": "Female", "lang": "Vietnamese"},
        {"code": "th-TH-NiwatNeural",       "label": "Thai — Niwat (Male)",                   "gender": "Male",   "lang": "Thai"},
        {"code": "fil-PH-AngeloNeural",     "label": "Filipino — Angelo (Male)",              "gender": "Male",   "lang": "Filipino"},

        # Arabic & Russian
        {"code": "ar-SA-HamedNeural",       "label": "Arabic (Saudi) — Hamed (Male)",         "gender": "Male",   "lang": "Arabic"},
        {"code": "ar-SA-ZariyahNeural",     "label": "Arabic (Saudi) — Zariyah (Female)",     "gender": "Female", "lang": "Arabic"},
        {"code": "ru-RU-DmitryNeural",      "label": "Russian — Dmitry (Male)",               "gender": "Male",   "lang": "Russian"},
        {"code": "ru-RU-SvetlanaNeural",    "label": "Russian — Svetlana (Female)",           "gender": "Female", "lang": "Russian"},
    ]


DEFAULT_VOICE = "en-US-GuyNeural"


def get_supported_voice_list() -> List[str]:
    """Returns list of voice IDs."""
    return [v["code"] for v in get_available_voices()]


def normalize_voice_name(voice_identifier: str) -> str:
    """Resolves a voice display label or alias into a canonical Edge-TTS voice code."""
    if not voice_identifier:
        return DEFAULT_VOICE
    return VOICE_MAP.get(voice_identifier, voice_identifier)


__all__ = [
    "VOICE_MAP",
    "DEFAULT_VOICE",
    "get_available_voices",
    "get_supported_voice_list",
    "normalize_voice_name",
]
