"""
backend/features/audio/router/sync.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble and dialogue synchronization endpoints:
POST /synchronize-dialogue/{panel_id} – Align OCR text to Whisper timestamps & peaks
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.audio.schemas import AlignDialogueRequest
from features.audio.sync.text_audio_sync_service import sync_text_to_speech

logger = logging.getLogger("sonikoma.api.audio.sync")
router = APIRouter()


@router.post("/synchronize-dialogue/{panel_id}", summary="Synchronize comic bubbles with audio timestamps and peaks")
async def sync_dialogue_endpoint(panel_id: str, body: AlignDialogueRequest):
    """
    Aligns comic speech bubble OCR text with spoken audio timestamps and extracts
    volume peaks for pulsating and highlighting speech bubble animations.
    """
    try:
        result = await sync_text_to_speech(
            panel_id=panel_id,
            audio_url=body.audio_url,
            ocr_texts=body.ocr_texts,
        )
        return result
    except Exception as exc:
        logger.error(f"[Sync API] Dialogue alignment failed for panel '{panel_id}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
