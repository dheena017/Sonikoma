"""
backend/app/api/v1/providers/deepseek.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DeepSeek AI Provider API Routes:
- GET  /status â€“ Availability & API key configuration state
- POST /chat   â€“ DeepSeek V3 chat & DeepSeek R1 reasoning completions
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from ai_engine.providers.deepseek import DeepSeekClient, DeepSeekModel

logger = logging.getLogger("sonikoma.api.providers.deepseek")
router = APIRouter()


class DeepSeekChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = "deepseek-chat"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    api_key: Optional[str] = None


@router.get("/status", summary="Check DeepSeek provider status and configuration")
async def get_deepseek_status(user_keys: dict = Depends(get_all_user_keys)):
    from ai_engine.core.registry import ModelRegistry
    user_key = clean_api_key(user_keys.get("deepseek")) or DeepSeekClient.get_api_key()
    models = ModelRegistry.get_catalog_by_provider("deepseek")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else "deepseek-chat"
    return {
        "success": True,
        "provider": "deepseek",
        "available": True,
        "configured": bool(user_key),
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
    }


@router.post("/chat", summary="Chat & reasoning completion with DeepSeek")
async def deepseek_chat_completion(
    body: DeepSeekChatRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("deepseek") or DeepSeekClient.get_api_key()
    if not key:
        raise HTTPException(status_code=400, detail="DeepSeek API key is required.")

    try:
        content = await DeepSeekClient.chat_completion(
            messages=body.messages,
            model=body.model or "deepseek-chat",
            temperature=body.temperature or 0.7,
            max_tokens=body.max_tokens,
            api_key=key,
        )
        if content is None:
            raise HTTPException(status_code=502, detail="DeepSeek API returned an empty or failed response.")

        return {
            "success": True,
            "provider": "deepseek",
            "model": body.model,
            "content": content,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[DeepSeek API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

