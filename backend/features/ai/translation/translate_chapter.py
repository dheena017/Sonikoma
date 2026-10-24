"""
Batch chapter translation engine for comic dialogue.

Translates all dialogue bubbles across an entire chapter together so character
names, attack moves, and honorifics stay consistent throughout.
"""

from typing import List, Dict, Any, Optional
import logging
from features.creative.translation.schemas import BatchTranslationRequest
from features.creative.translation.service import creative_translation_service
from .translate_speech import translate_speech

logger = logging.getLogger("sonikoma.features.ai.translation.chapter")


def _combine_lines(dialogue_list: List[Dict[str, Any]]) -> List[str]:
    """Extracts raw text strings from panel dialogue dictionaries."""
    return [
        str(d.get("text") or d.get("speech_text") or d.get("dialogue") or "")
        for d in dialogue_list
    ]


async def translate_chapter(
    dialogue_lines: List[Dict[str, Any]],
    to_language: str,
    name_rules: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """Batch translates every dialogue bubble in a comic chapter."""
    raw_texts = _combine_lines(dialogue_lines)
    if not raw_texts:
        return []

    try:
        req = BatchTranslationRequest(
            texts=raw_texts,
            target_lang=to_language,
        )
        res = await creative_translation_service.batch_translate(req)
        if res.success and res.results:
            translated_lines = []
            for orig, r in zip(dialogue_lines, res.results):
                copy = dict(orig)
                copy["translated_text"] = r.translated_text
                copy["target_lang"] = to_language
                translated_lines.append(copy)
            return translated_lines
    except Exception as e:
        logger.warning(f"Batch translation fallback: {e}")

    # Fallback to translating line by line
    results = []
    for line in dialogue_lines:
        text = str(line.get("text") or line.get("speech_text") or line.get("dialogue") or "")
        res = await translate_speech(text, to_language=to_language)
        copy = dict(line)
        copy["translated_text"] = res["translated_text"]
        copy["target_lang"] = to_language
        results.append(copy)
    return results


__all__ = ["translate_chapter"]
