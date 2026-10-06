"""
backend/app/providers/edge_tts/helpers.py
─────────────────────────────────────────────────────────────────────────────
Text sanitization and dialogue cleaning helpers for speech synthesis.
─────────────────────────────────────────────────────────────────────────────
"""

import re


def sanitize_speech_text(text: str) -> str:
    """
    Strip speech bubble quotes, markdown formatting, action tags, and
    sound effect markers (e.g. *gasp*, (whispering)) before passing to TTS.
    """
    clean = re.sub(r'[\*\"\_]', '', text)
    clean = re.sub(r'^\s*[\(\[].*?[\)\]]\s*', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean
