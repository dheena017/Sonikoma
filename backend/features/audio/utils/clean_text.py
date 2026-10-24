"""
backend/features/audio/utils/clean_text.py
─────────────────────────────────────────────────────────────────────────────
Cleans comic dialogue and OCR artifacts to produce realistic, human-like voice synthesis:
- Strips bracketed stage directions ([Boom], [Slash], (Laughs), *gasp*)
- Removes decorative manga symbols (~, ♪, ♥, ★) that confuse neural speech models
- Repairs broken OCR contractions (don ' t -> don't, I ' m -> I'm)
- Converts shouty all-caps text to conversational sentence case
- Formats punctuation and ellipses for natural human breathing pauses
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import Match


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _shorten_repeated_letters(match: Match) -> str:
    """Compresses exaggerated character repeats (e.g. 'Nooooo!' -> 'No!', 'Whaaaat' -> 'What')."""
    char = match.group(1)
    if char.lower() in ('o', 'e') and len(match.group(0)) >= 3:
        return char * 2
    return char


def _fix_spelling_and_slang(text: str) -> str:
    """Repairs spaced contractions and commas from raw OCR output."""
    # Repair broken contraction spacing: "don ' t" -> "don't", "can ' t" -> "can't"
    text = re.sub(r"\b([a-zA-Z]+)\s*[']\s*([a-zA-Z]+)\b", r"\1'\2", text)
    # Fix spaced punctuation: "hello , world ." -> "hello, world."
    text = re.sub(r"\s+([,.:;!?])", r"\1", text)
    return text


def _to_natural_case(text: str) -> str:
    """Converts shouty manga ALL-CAPS text into conversational sentence case while preserving common acronyms."""
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


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def clean_comic_text(text: str) -> str:
    """
    Cleans comic text, removes bracketed sound effects, fixes typos, and adds breathing pauses for natural speech.
    """
    if not text:
        return ""

    # 1. Remove non-printable control characters
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # 2. Strip bracketed stage directions and SFX cues
    cleaned = re.sub(r"\[[^\]]*\]", "", cleaned)
    cleaned = re.sub(r"\*[^*]*\*", "", cleaned)
    cleaned = re.sub(
        r"\((?:whispering|whispers|sighs|sigh|gasp|gasps|laughs|laughter|screams|cries|panting|shouting|narrator|sfx)[^)]*\)",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    # 3. Strip decorative manga glyphs that cause TTS engines to read symbol names aloud
    cleaned = re.sub(r"[~∼～♪♫♬♥♡★☆⚡✨@#^|\\/«»<>]", " ", cleaned)
    cleaned = cleaned.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'").replace("`", "'")

    # 4. Repair broken OCR contraction spacing
    cleaned = _fix_spelling_and_slang(cleaned)

    # 5. Normalize shouty manga all-caps to conversational sentence case
    if cleaned.isupper() and len(cleaned) > 3:
        cleaned = _to_natural_case(cleaned)

    # 6. Compress exaggerated character repeats
    cleaned = re.sub(r'([a-zA-Z])\1{2,}', _shorten_repeated_letters, cleaned)

    # 7. Punctuation cadence optimization for natural breathing
    cleaned = re.sub(r"\?{2,}", "?", cleaned)
    cleaned = re.sub(r"!{2,}", "!", cleaned)
    cleaned = re.sub(r"\?!|\!\?", "?", cleaned)
    cleaned = re.sub(r",,+", ",", cleaned)
    cleaned = re.sub(r"\.{2,}", "...", cleaned)
    cleaned = re.sub(r"\.\.\.\s*", "... ", cleaned)
    cleaned = re.sub(r"—+|--+", " — ", cleaned)

    # 8. Clean up whitespace
    return re.sub(r"[ \t]+", " ", cleaned).strip()


__all__ = ["clean_comic_text"]
