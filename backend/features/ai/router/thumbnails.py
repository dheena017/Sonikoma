"""
AI Thumbnail & Cover Generator API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from features.ai.schemas import MakeCoverIdeasRequest
from features.ai.thumbnails import make_cover_ideas, make_cover_prompts

router = APIRouter(prefix="/thumbnails", tags=["AI Thumbnails"])


@router.post("/ideas", response_model=List[Dict[str, Any]])
async def endpoint_make_ideas(req: MakeCoverIdeasRequest) -> List[Dict[str, Any]]:
    """Brainstorms high-CTR thumbnail ideas with text badges and dramatic character poses."""
    try:
        return await make_cover_ideas(
            title=req.title,
            genre=req.genre,
            synopsis=req.synopsis,
            count=req.count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
