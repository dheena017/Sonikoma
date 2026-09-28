"""Interactive Speech Bubbles sub-router for AI Generated Series.

Enables instant in-place vector bubble editing, font styling, repositioning,
and live canvas translation without full image re-generation.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.schemas.series import InteractiveSpeechBubble
from app.schemas.memory import GenerationFeedbackEvent
from app.repositories.series import ai_series_repo
from app.services.series.series_memory_engine import series_memory_engine

router = APIRouter(tags=["AI Series - Interactive Speech Bubbles"])


class UpdateBubbleRequest(BaseModel):
    bubble: InteractiveSpeechBubble


class TranslateBubblesRequest(BaseModel):
    target_language: str  # e.g., "ja", "ko", "es", "fr", "de"
    bubbles: List[InteractiveSpeechBubble]


# Fast offline translations for instant responsive demo
SAMPLE_TRANSLATIONS: dict[str, dict[str, str]] = {
    "ja": {
        "Another night in Neo-Veridia... and the tremors are growing stronger.": "ネオ・ヴェリディアの新たな夜…揺れはますます強くなっている。",
        "The war is finally over. We've earned tomorrow.": "戦争はついに終わった。俺たちは明日を勝ち取ったんだ。",
        "Out of my way!": "邪魔だ、どけ！",
        "You knew about the gate all along, didn't you?": "最初から門のことを知っていたんだろう？",
    },
    "ko": {
        "Another night in Neo-Veridia... and the tremors are growing stronger.": "네오 베리디아의 또 다른 밤... 진동이 점점 강해지고 있어.",
        "The war is finally over. We've earned tomorrow.": "전쟁은 마침내 끝났다. 우리는 내일을 쟁취했어.",
        "Out of my way!": "비켜라!",
        "You knew about the gate all along, didn't you?": "처음부터 관문에 대해 알고 있었지?",
    },
}


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
        raise HTTPException(
            status_code=404,
            detail=f"Failed to find panel '{panel_id}' in chapter '{chapter_id}' of series '{series_id}'.",
        )

    # Record RLHF feedback event
    feedback = GenerationFeedbackEvent(
        feedback_id=f"fb_{uuid4().hex[:8]}",
        series_id=series_id,
        chapter_id=chapter_id,
        panel_id=panel_id,
        event_type="bubble_edit",
        adjusted_value={
            "font_family": req.bubble.font_family,
            "bg_color": req.bubble.bg_color,
            "text_color": req.bubble.text_color,
            "border_color": req.bubble.border_color,
        },
    )
    series_memory_engine.record_feedback(feedback)

    return {"status": "success", "bubble": req.bubble}


@router.post("/{series_id}/chapters/{chapter_id}/panels/{panel_id}/bubbles/translate")
async def translate_speech_bubbles(
    series_id: str,
    chapter_id: str,
    panel_id: str,
    req: TranslateBubblesRequest,
):
    """Translate all speech bubbles on a panel without touching the underlying background artwork."""
    translated_bubbles: List[InteractiveSpeechBubble] = []
    lang_dict = SAMPLE_TRANSLATIONS.get(req.target_language.lower(), {})

    for b in req.bubbles:
        translated_text = lang_dict.get(b.text.strip(), f"[{req.target_language.upper()}] {b.text}")
        new_b = b.model_copy()
        new_b.text = translated_text
        translated_bubbles.append(new_b)
        # Update repo
        ai_series_repo.update_panel_speech_bubble(series_id, chapter_id, panel_id, new_b)

    return {
        "target_language": req.target_language,
        "translated_bubbles": translated_bubbles,
    }
