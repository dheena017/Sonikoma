"""
AI Prompts & Art Styles API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from features.ai.schemas import ImprovePromptRequest, ImprovePromptResponse
from features.ai.prompts import make_better_prompt, get_art_style, STYLE_PRESETS

router = APIRouter(prefix="/prompts", tags=["AI Prompts & Styles"])


@router.post("/improve", response_model=Dict[str, Any])
async def endpoint_improve_prompt(req: ImprovePromptRequest) -> Dict[str, Any]:
    """Expands a creator's simple prompt with lighting, camera angles, and art details."""
    try:
        return await make_better_prompt(
            simple_idea=req.simple_idea,
            output_type=req.output_type,
            art_style=req.art_style,
            genre=req.genre,
            ai_provider=req.ai_provider
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/styles/{style_name}")
def endpoint_get_style(style_name: str) -> Dict[str, Any]:
    """Returns keywords and settings for an art style preset."""
    return get_art_style(style_name)


@router.get("/styles")
def endpoint_list_styles() -> Dict[str, Any]:
    """Returns all available style presets."""
    return {"styles": list(STYLE_PRESETS.keys())}


__all__ = ["router"]
