"""
AI Narrative & Script Writing API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from features.ai.narrative import remember_story, check_pacing, write_story_script

router = APIRouter(prefix="/narrative", tags=["AI Story & Narrative"])


class NarrativeSequenceRequest(BaseModel):
    panels: List[Dict[str, Any]]
    current_panel_index: int = 0
    story_notes: Optional[str] = None


class DramatizeScriptRequest(BaseModel):
    dialogue_lines: List[Dict[str, Any]]
    genre: str = "Action"
    target_duration_seconds: Optional[float] = None


class PacingRequest(BaseModel):
    panels: List[Dict[str, Any]]


@router.post("/sequence")
async def endpoint_narrative_sequence(req: NarrativeSequenceRequest) -> Dict[str, Any]:
    """Tracks story events across a sequence of panels to maintain continuity."""
    try:
        memory = remember_story(
            current_panel=req.panels[req.current_panel_index] if req.panels else {},
            previous_events=req.panels[:req.current_panel_index] if req.panels else [],
            series_bible=req.story_notes
        )
        return {"status": "success", "story_memory": memory}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dramatize")
async def endpoint_dramatize_script(req: DramatizeScriptRequest) -> Dict[str, Any]:
    """Turns dialogue lines and scene actions into a spoken narrator and character script."""
    try:
        script = write_story_script(
            panels=req.dialogue_lines,
            genre=req.genre,
            max_duration=req.target_duration_seconds
        )
        return {"status": "success", "script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pacing")
def endpoint_check_pacing(req: PacingRequest) -> Dict[str, Any]:
    """Calculates story tempo, tension peaks, and pauses across comic panels."""
    try:
        metrics = check_pacing(panels=req.panels)
        return {"status": "success", "pacing": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
