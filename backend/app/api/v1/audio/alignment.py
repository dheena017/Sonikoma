"""
backend/app/api/v1/audio/alignment.py
─────────────────────────────────────────────────────────────────────────────
Dialogue-to-audio alignment — syncs OCR panel text with Whisper timestamps.
POST /align/{panel_id}   – Align OCR text to Whisper transcript & extract peaks
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException

from schemas.audio import AlignDialogueRequest
from services.audio import align_dialogue_service

logger = logging.getLogger("sonikoma.api.audio.alignment")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/align/{panel_id}", summary="Align OCR text to Whisper transcript and extract audio peaks")
async def align_dialogue_endpoint(panel_id: str, body: AlignDialogueRequest):
    """
    Aligns speech bubble OCR text strings against a Whisper speech-recognition
    transcript for a given panel, returning per-word timestamps and audio peaks
    useful for building animated caption overlays.
    """
    try:
        result = await align_dialogue_service(
            panel_id=panel_id,
            audio_url=body.audio_url,
            ocr_texts=body.ocr_texts
        )
        return result
    except Exception as exc:
        logger.error(f"[Alignment] Dialogue alignment failed for panel '{panel_id}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
