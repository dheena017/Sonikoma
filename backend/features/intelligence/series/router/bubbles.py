"""Interactive Speech Bubbles sub-router for AI Generated Series.

Enables instant in-place vector bubble editing, font styling, repositioning,
and live canvas translation without full image re-generation.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from features.intelligence.series.schemas import InteractiveSpeechBubble
from features.intelligence.series.schemas import GenerationFeedbackEvent
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger("sonikoma.series.router.bubbles")

router = APIRouter(tags=["AI Series - Interactive Speech Bubbles"])


class UpdateBubbleRequest(BaseModel):
    bubble: InteractiveSpeechBubble


class TranslateBubblesRequest(BaseModel):
    target_language: str = Field(..., description="Target language ISO code: ja, ko, es, fr, de, zh, etc.")
    bubbles: List[InteractiveSpeechBubble]


@router.put("/{series_id}/chapters/{chapter_id}/panels/{panel_id}/bubbles")
async def update_speech_bubble(
    series_id: str,
    chapter_id: str,
    panel_id: str,
    req: UpdateBubbleRequest,
):
    """Save user edits to a speech bubble in real-time, logging preferences to the memory engine."""
    updated_project = ai_series_repo.update_panel_speech_bubble(
        series_id=series_id,
        chapter_id=chapter_id,
        panel_id=panel_id,
        bubble=req.bubble,
    )
    if not updated_project:
        logger.error(f"[Bubbles] Failed to update bubble: Panel '{panel_id}' not found in chapter '{chapter_id}' (Series '{series_id}').")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to find panel '{panel_id}' in chapter '{chapter_id}' of series '{series_id}'.",
        )

    # Record RLHF feedback event for style learning
    feedback = GenerationFeedbackEvent(
        feedback_id=f"fb_{uuid4().hex[:8]}",
        series_id=series_id,
        chapter_id=chapter_id,
        panel_id=panel_id,
        event_type="bubble_edit",
        adjusted_value={
            "font_family": req.bubble.font_family,
            "font_size": req.bubble.font_size,
            "bg_color": req.bubble.bg_color,
            "text_color": req.bubble.text_color,
            "border_color": req.bubble.border_color,
        },
    )
    series_memory_engine.record_feedback(feedback)
    logger.info(f"[Bubbles] Saved edit for bubble '{req.bubble.bubble_id}' in panel '{panel_id}'.")

    return {"status": "success", "bubble": req.bubble}


@router.post("/{series_id}/chapters/{chapter_id}/panels/{panel_id}/bubbles/translate")
async def translate_speech_bubbles(
    series_id: str,
    chapter_id: str,
    panel_id: str,
    req: TranslateBubblesRequest,
):
    """Translate all speech bubbles on a panel dynamically using AI Core without touching background art."""
    translated_bubbles: List[InteractiveSpeechBubble] = []

    for b in req.bubbles:
        original_text = b.text.strip()
        if not original_text:
            translated_bubbles.append(b)
            continue

        # Check if already cached in bubble's translated_texts
        if req.target_language in b.translated_texts and b.translated_texts[req.target_language]:
            new_b = b.model_copy()
            new_b.text = b.translated_texts[req.target_language]
            translated_bubbles.append(new_b)
            ai_series_repo.update_panel_speech_bubble(series_id, chapter_id, panel_id, new_b)
            continue

        translated_text = original_text
        try:
            prompt = (
                f"You are a professional comic localization specialist. "
                f"Translate the following speech dialogue accurately and naturally into {req.target_language}. "
                f"Preserve comic emotional intensity, slang, and exclamation marks. "
                f"Output strictly the translated line ONLY without quotation marks or notes:\n\n{original_text}"
            )
            res = await AIOrchestrator.execute_capability(
                capability="translate",
                prompt=prompt,
            )
            parsed_res = res.get("result")
            if isinstance(parsed_res, dict) and "raw_output" in parsed_res:
                translated_text = str(parsed_res["raw_output"]).strip().strip('"').strip("'")
            elif isinstance(parsed_res, str):
                translated_text = parsed_res.strip().strip('"').strip("'")
            elif res.get("content"):
                translated_text = str(res["content"]).strip().strip('"').strip("'")
            elif res.get("text"):
                translated_text = str(res["text"]).strip().strip('"').strip("'")
            elif res.get("raw_text"):
                translated_text = str(res["raw_text"]).strip().strip('"').strip("'")
        except Exception as e:
            logger.error(f"[Bubbles] Translation API call failed for '{original_text[:30]}': {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Translation AI service error: {str(e)}",
            )

        new_b = b.model_copy()
        new_b.text = translated_text
        new_b.translated_texts[req.target_language] = translated_text
        translated_bubbles.append(new_b)
        ai_series_repo.update_panel_speech_bubble(series_id, chapter_id, panel_id, new_b)

    logger.info(
        f"[Bubbles] Successfully translated {len(translated_bubbles)} bubbles on panel '{panel_id}' into {req.target_language}."
    )

    return {
        "status": "success",
        "target_language": req.target_language,
        "translated_bubbles": translated_bubbles,
        "tier_used": res.get("tier_used") if 'res' in locals() else "Tier 1",
        "tier_display": res.get("tier_display") if 'res' in locals() else "Tier 1 (Primary)",
        "cascade": res.get("cascade") if 'res' in locals() else {},
    }
