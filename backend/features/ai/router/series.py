"""
AI Series Studio API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from features.ai.schemas import PlanStoryArcRequest
from features.ai.series import plan_story_arc, build_full_chapter

router = APIRouter(prefix="/series", tags=["AI Series Studio"])


@router.post("/plan-arc", response_model=Dict[str, Any])
async def endpoint_plan_arc(req: PlanStoryArcRequest) -> Dict[str, Any]:
    """Plans a multi-chapter story arc with rising action and climax resolution."""
    try:
        return await plan_story_arc(
            title=req.title,
            genre=req.genre,
            summary=req.summary,
            chapter_count=req.chapter_count,
            characters=req.characters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
