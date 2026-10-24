"""
AI Translation & Localization API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from features.ai.schemas import TranslateSpeechRequest
from features.ai.translation import translate_speech, translate_chapter, get_names, save_names

router = APIRouter(prefix="/translation", tags=["AI Translation"])


@router.post("/speech", response_model=Dict[str, Any])
async def endpoint_translate_speech(req: TranslateSpeechRequest) -> Dict[str, Any]:
    """Translates a single comic dialogue line preserving slang and tone."""
    try:
        return await translate_speech(
            text=req.text,
            to_language=req.to_language,
            tone=req.tone,
            story_context=req.story_context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dictionary/{series_id}/{language}")
def endpoint_get_names(series_id: str, language: str) -> Dict[str, str]:
    """Returns persistent translation dictionary for character names and terms."""
    return get_names(series_id, language)


@router.post("/dictionary/{series_id}/{language}")
def endpoint_save_names(series_id: str, language: str, terms: Dict[str, str]) -> Dict[str, str]:
    """Saves translation pairs to the terminology dictionary."""
    return save_names(series_id, language, terms)


__all__ = ["router"]
