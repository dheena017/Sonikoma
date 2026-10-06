"""
backend/common/audio/helpers.py
─────────────────────────────────────────────────────────────────────────────
Speech duration estimation, script sanitation for TTS, and audio time math.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import Union
from .constants import DEFAULT_WPM


def estimate_speech_duration(
    text: str,
    wpm: int = DEFAULT_WPM,
    min_duration: float = 1.5,
) -> float:
    """
    Estimates spoken audio duration in seconds from script text based on WPM.
    Useful for timeline sizing before TTS synthesis runs.
    """
    if not text or not text.strip():
        return min_duration

    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    if word_count == 0:
        return min_duration

    # Words per minute to seconds + slight breathing pause padding
    duration = (word_count / float(wpm)) * 60.0
    return max(min_duration, round(duration + 0.4, 2))


def clean_speech_script(text: str) -> str:
    """
    Strips SFX cues (e.g. '[Impact]', '(whispers)'), markup, and extra whitespace
    to prepare clean dialogue text for text-to-speech engines.
    """
    if not text:
        return ""

    # Remove [Square Bracket] SFX cues
    cleaned = re.sub(r'\[[^\]]*\]', '', text)
    # Remove (Parenthetical) stage directions
    cleaned = re.sub(r'\([^\)]*\)', '', cleaned)
    # Normalize multiple whitespaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def format_audio_duration(seconds: Union[int, float]) -> str:
    """Formats audio duration into 'MM:SS.ms'."""
    if seconds is None or seconds < 0:
        return "00:00.0"
    secs = float(seconds)
    mins = int(secs // 60)
    rem_secs = secs % 60
    return f"{mins:02d}:{rem_secs:04.1f}"


def to_natural_sentence_case(text: str) -> str:
    """
    Converts shouty manga/comic ALL-CAPS text into natural conversational sentence case
    while preserving standard acronyms (AI, RPG, NPC, OK, USA, etc.).
    """
    if not text or not text.isupper():
        return text

    acronyms = {"AI", "OK", "NPC", "RPG", "VIP", "USA", "UK", "DNA", "CEO", "CFO", "CTO", "ID", "XP", "HP", "MP"}
    sentences = re.split(r'([.!?]+\s*)', text)
    processed = []

    for part in sentences:
        if not part.strip():
            processed.append(part)
            continue
        words = part.split(' ')
        new_words = []
        for i, w in enumerate(words):
            clean_w = re.sub(r'[^\w]', '', w).upper()
            if clean_w in acronyms:
                new_words.append(w.upper())
            elif i == 0:
                new_words.append(w.capitalize())
            elif w.upper() in ("I", "I'LL", "I'M", "I'VE", "I'D"):
                new_words.append(w[0].upper() + w[1:].lower() if len(w) > 1 else "I")
            else:
                new_words.append(w.lower())
        processed.append(" ".join(new_words))

    return "".join(processed)


def normalize_comic_text_for_human_speech(text: str) -> str:
    """
    Cleans comic dialogue and OCR artifacts to produce realistic, human-like voice synthesis:
    - Fixes broken OCR contractions (e.g. don ' t -> don't, I ' m -> I'm)
    - Calms excessive letter repetition (e.g. NOOOO! -> No!, WHAAAT?! -> What?!)
    - Removes visual SFX glyphs (~, ♪, ♥, ★) that confuse neural speech models
    - Formats punctuation and ellipses for natural human breathing pauses
    """
    if not text:
        return ""

    # Remove non-printable control characters
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Strip bracketed stage directions like [Boom], [Slash], (Laughs), *gasp*
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\*[^*]*\*", "", text)
    text = re.sub(
        r"\((?:whispering|whispers|sighs|sigh|gasp|gasps|laughs|laughter|screams|cries|panting|shouting|narrator|sfx)[^)]*\)",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # Strip decorative manga glyphs that cause TTS engines to read symbol names aloud
    text = re.sub(r"[~∼～♪♫♬♥♡★☆⚡✨@#^|\\/«»<>]", " ", text)
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'").replace("`", "'")

    # Repair broken OCR contraction spacing: "don ' t" -> "don't", "I ' m" -> "I'm", "can ' t" -> "can't"
    text = re.sub(r"\b([a-zA-Z]+)\s*[']\s*([a-zA-Z]+)\b", r"\1'\2", text)

    # Fix spaced punctuation: "hello , world ." -> "hello, world."
    text = re.sub(r"\s+([,.:;!?])", r"\1", text)

    # Normalize shouty manga all-caps to conversational sentence case
    if text.isupper() and len(text) > 3:
        text = to_natural_sentence_case(text)

    # Compress exaggerated repeated characters (e.g. "Nooooo!" -> "No!", "Whaaaat" -> "What")
    def _reduce_repetition(m: re.Match) -> str:
        char = m.group(1)
        if char.lower() in ('o', 'e') and len(m.group(0)) >= 3:
            return char * 2
        return char

    text = re.sub(r'([a-zA-Z])\1{2,}', _reduce_repetition, text)

    # Punctuation cadence optimization for natural human breathing
    text = re.sub(r"\?{2,}", "?", text)
    text = re.sub(r"!{2,}", "!", text)
    text = re.sub(r"\?!|\!\?", "?", text)
    text = re.sub(r",,+", ",", text)

    # Ellipses formatting for dramatic pauses
    text = re.sub(r"\.{2,}", "...", text)
    text = re.sub(r"\.\.\.\s*", "... ", text)

    # Em dashes for conversational hesitation
    text = re.sub(r"—+|--+", " — ", text)

    # Clean up whitespace
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text


def sanitize_text_for_tts(text: str) -> str:
    """Convenience alias for text normalization before TTS rendering."""
    return normalize_comic_text_for_human_speech(text)


__all__ = [
    "estimate_speech_duration",
    "clean_speech_script",
    "format_audio_duration",
    "to_natural_sentence_case",
    "normalize_comic_text_for_human_speech",
    "sanitize_text_for_tts",
]
