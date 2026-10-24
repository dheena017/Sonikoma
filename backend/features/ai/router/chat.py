"""
AI Creative Chat Assistant API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from features.ai.schemas import AskAssistantRequest, AskAssistantResponse
from features.ai.chat import ask_assistant

router = APIRouter(prefix="/chat", tags=["AI Creative Assistant"])


@router.post("/ask", response_model=Dict[str, Any])
async def endpoint_ask_assistant(req: AskAssistantRequest) -> Dict[str, Any]:
    """Answers creator questions and brainstorms ideas for comic panels."""
    try:
        return await ask_assistant(
            user_message=req.user_message,
            chat_history=req.chat_history,
            story_context=req.story_context,
            ai_provider=req.ai_provider,
            model_name=req.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
