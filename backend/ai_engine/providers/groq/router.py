"""
backend/app/api/v1/providers/groq.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Groq LPU Fast Inference Provider API Routes:
- GET  /status â€“ Availability & API key configuration state
- POST /chat   â€“ Ultra-fast LPU inference (Llama 3.3 70B, Llama 3.1 8B)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from ai_engine.providers.groq import GroqClient, GroqModel

logger = logging.getLogger("sonikoma.api.providers.groq")
router = APIRouter()


class GroqChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = "llama-3.3-70b-versatile"
    temperature: Optional[float] = 0.6
    max_tokens: Optional[int] = 2048
    api_key: Optional[str] = None


@router.get("/status", summary="Check Groq LPU provider status and configuration")
async def get_groq_status(user_keys: dict = Depends(get_all_user_keys)):
    from ai_engine.core.registry import ModelRegistry
    user_key = clean_api_key(user_keys.get("groq")) or GroqClient.get_api_key()
    models = ModelRegistry.get_catalog_by_provider("groq")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else "llama-3.3-70b-versatile"
    return {
        "success": True,
        "provider": "groq",
        "available": True,
        "configured": bool(user_key),
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
    }


@router.post("/chat", summary="Execute ultra-fast chat completion with Groq LPU")
async def groq_chat_completion(
    body: GroqChatRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("groq") or GroqClient.get_api_key()
    if not key:
        raise HTTPException(status_code=400, detail="Groq API key is required.")

    try:
        content = await GroqClient.chat_completion(
            messages=body.messages,
            model=body.model or "llama-3.3-70b-versatile",
            temperature=body.temperature or 0.6,
            max_tokens=body.max_tokens,
            api_key=key,
        )
        if content is None:
            raise HTTPException(status_code=502, detail="Groq API returned an empty or failed response.")

        return {
            "success": True,
            "provider": "groq",
            "model": body.model,
            "content": content,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Groq API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

