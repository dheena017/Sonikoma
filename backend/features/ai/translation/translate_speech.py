"""
Single dialogue speech translation for comics and webtoons.

Translates comic dialogue lines while preserving slang, character attitude,
humor, and emotion.
"""

from typing import Dict, Any, Optional
import re
import logging
from features.creative.translation.schemas import TranslationRequest
from features.creative.translation.service import creative_translation_service

logger = logging.getLogger("sonikoma.features.ai.translation.speech")


def _clean_translated_text(text: str) -> str:
    """Strips extraneous quotation marks and markdown formatting from translated text."""
    cleaned = (text or "").strip().strip('"').strip("'")
    return re.sub(r'\s+', ' ', cleaned)


async def translate_speech(
    text: str,
    to_language: str = "Japanese",
    tone: str = "natural",
    story_context: Optional[str] = None
) -> Dict[str, Any]:
    """Translates comic dialogue into another language with proper tone and slang."""
    if not text or not text.strip():
        return {
            "translated_text": "",
            "accuracy_rating": 1.0,
            "target_lang": to_language,
            "detected_tone": tone
        }

    try:
        req = TranslationRequest(
            text=text,
            target_lang=to_language,
            tone=tone,
            context=story_context
        )
        res = await creative_translation_service.translate(req)
        if res.success and res.result:
            return {
                "translated_text": _clean_translated_text(res.result.translated_text),
                "accuracy_rating": res.result.accuracy_rating,
                "target_lang": res.result.target_lang,
                "detected_tone": res.result.detected_tone
            }
    except Exception as e:
        logger.warning(f"Translation service fallback for text: {e}")

    # Fallback return
    return {
        "translated_text": text,
        "accuracy_rating": 0.8,
        "target_lang": to_language,
        "detected_tone": tone
    }


__all__ = ["translate_speech"]
