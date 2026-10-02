"""
backend/app/api/v1/providers/groq.py
─────────────────────────────────────────────────────────────────────────────
Groq LPU Fast Inference Provider API Routes:
- GET  /status – Availability & API key configuration state
- POST /chat   – Ultra-fast LPU inference (Llama 3.3 70B, Llama 3.1 8B)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.dependencies.auth import get_all_user_keys, clean_api_key
from app.providers.groq import GroqClient, GroqModel

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
    user_key = clean_api_key(user_keys.get("groq")) or GroqClient.get_api_key()
    return {
        "success": True,
        "provider": "groq",
        "available": True,
        "configured": bool(user_key),
        "primary_model": "llama-3.3-70b-versatile",
        "supported_models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
        ],
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
