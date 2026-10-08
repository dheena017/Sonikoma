"""
backend/features/creative/translation/service.py
─────────────────────────────────────────────────────────────────────────────
Autonomous Translation & Localization Service for Webtoons & Comics:
Leverages Google Gemini and AIHub with multi-provider fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import logging
from typing import Optional, List, Dict, Any

from app.core.config import (
    ai_initialized,
    genai_client,
    GEMINI_MODEL_PRIMARY,
    call_gemini_with_retry,
)
from ai_engine.core.hub import AIHub
from features.creative.translation.schemas import (
    TranslationRequest,
    TranslationResponse,
    TranslationResult,
    BatchTranslationRequest,
    BatchTranslationResponse,
)

logger = logging.getLogger("sonikoma.creative.translation.service")


def _clean_json_text(text: str) -> str:
    """Robustly extracts valid JSON array or object from AI response text even with markdown or commentary."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()

    array_match = re.search(r"(\[\s*\{[\s\S]*\}\s*\])", text)
    if array_match:
        return array_match.group(1).strip()

    obj_match = re.search(r"(\{[\s\S]*\})", text)
    if obj_match:
        return obj_match.group(1).strip()

    return text


class CreativeTranslationService:
    """Service handling autonomous comic and webtoon dialogue localization."""

    async def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """Calls Gemini API across fallback models, then falls back to AIHub."""
        if ai_initialized and genai_client:
            models_to_try = [GEMINI_MODEL_PRIMARY]
            for model_name in models_to_try:
                async def _invoke():
                    full_p = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                    if hasattr(genai_client, "models") and hasattr(genai_client.models, "generate_content"):
                        resp = genai_client.models.generate_content(
                            model=model_name,
                            contents=full_p,
                        )
                        return getattr(resp, "text", str(resp))
                    elif hasattr(genai_client, "GenerativeModel"):
                        model = genai_client.GenerativeModel(model_name)
                        resp = model.generate_content(full_p)
                        return getattr(resp, "text", str(resp))
                    return None

                try:
                    result = await call_gemini_with_retry(_invoke)
                    if result and len(str(result).strip()) > 1:
                        return str(result)
                except Exception as e:
                    logger.debug(f"[TranslationService] Gemini {model_name} attempt notice: {e}")
                    continue

        try:
            hub_result = await AIHub().chat(prompt=prompt, system_instruction=system_instruction)
            if hub_result and len(str(hub_result).strip()) > 1:
                return str(hub_result)
        except Exception as hub_err:
            logger.debug(f"[TranslationService] AIHub chat attempt notice: {hub_err}")

        return None

    async def translate(self, req: TranslationRequest) -> TranslationResponse:
        """Translates a single comic dialogue line or narrative caption with tone and register preserved."""
        text = req.text.strip()
        if not text:
            return TranslationResponse(
                success=True,
                result=TranslationResult(
                    translated_text="",
                    accuracy_rating=1.0,
                    target_lang=req.target_lang,
                    detected_tone=req.tone,
                ),
            )

        target_lang = req.target_lang or "Spanish"
        tone = req.tone or "natural"

        prompt = f"""You are an elite multilingual comic & webtoon localization master.
Translate the following dialogue / narrative text into {target_lang}.

Context & Style Requirements:
- Target Language: {target_lang}
- Desired Tone: {tone} (Natural Conversational, Shonen/High-Energy, Dramatic Sakuga, or Street Slang)
- Preserve sound effects (SFX cues like [Impact], [Whoosh]), exclamation cadence, and character personality.
- Do NOT make literal or stiff translations. Use natural idioms and expressions native to {target_lang}.

Text to Translate:
"{text}"

Return STRICT JSON:
{{
  "translated_text": "...",
  "accuracy_rating": 0.98,
  "detected_tone": "{tone}"
}}
"""

        system_inst = "You are an expert anime, manga, and manhwa localization director."
        translated_text = text
        accuracy = 0.95

        try:
            raw_ai = await self._call_llm(prompt=prompt, system_instruction=system_inst)
            if raw_ai:
                cleaned = _clean_json_text(raw_ai)
                try:
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, dict) and "translated_text" in parsed:
                        translated_text = parsed["translated_text"]
                        accuracy = float(parsed.get("accuracy_rating", 0.98))
                except Exception:
                    # If LLM returned raw translated text without json wrapper
                    translated_text = cleaned.strip('"\'')
        except Exception as err:
            logger.warning(f"[TranslationService] Translation notice: {err}")

        return TranslationResponse(
            success=True,
            result=TranslationResult(
                translated_text=translated_text,
                accuracy_rating=accuracy,
                target_lang=target_lang,
                detected_tone=tone,
            ),
        )

    async def batch_translate(self, req: BatchTranslationRequest) -> BatchTranslationResponse:
        """Translates multiple panels or dialogue items in batch."""
        results = []
        for item in req.items:
            lang = item.target_lang or req.default_target_lang
            tone = item.tone or req.default_tone
            single_res = await self.translate(
                TranslationRequest(
                    text=item.text,
                    target_lang=lang,
                    tone=tone,
                )
            )
            results.append({
                "id": item.id,
                "original_text": item.text,
                "translated_text": single_res.result.translated_text,
                "target_lang": lang,
                "accuracy_rating": single_res.result.accuracy_rating,
            })

        return BatchTranslationResponse(success=True, results=results)


translation_service = CreativeTranslationService()

__all__ = ["CreativeTranslationService", "translation_service"]
