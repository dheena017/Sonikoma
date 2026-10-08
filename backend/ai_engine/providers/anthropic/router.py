"""
backend/app/api/v1/providers/anthropic.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Anthropic Claude Provider API Routes:
- GET  /status   â€“ Availability & API key configuration state
- POST /messages â€“ Claude 3.5 Sonnet / Haiku chat and reasoning
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import ANTHROPIC_API_KEY
from ai_engine.providers.anthropic import AnthropicClient, ANTHROPIC_AVAILABLE, AnthropicModel

logger = logging.getLogger("sonikoma.api.providers.anthropic")
router = APIRouter()


class AnthropicMessageRequest(BaseModel):
    messages: List[Dict[str, str]]
    system: Optional[str] = None
    model: Optional[str] = "claude-3-5-sonnet-20241022"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    api_key: Optional[str] = None


@router.get("/status", summary="Check Anthropic Claude provider status")
async def get_anthropic_status(user_keys: dict = Depends(get_all_user_keys)):
    from ai_engine.core.registry import ModelRegistry
    user_key = clean_api_key(user_keys.get("anthropic"))
    configured = bool(user_key or ANTHROPIC_API_KEY)
    models = ModelRegistry.get_catalog_by_provider("anthropic")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else "claude-3-5-sonnet-20241022"
    return {
        "success": True,
        "provider": "anthropic",
        "available": ANTHROPIC_AVAILABLE,
        "configured": configured,
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
    }


@router.post("/messages", summary="Create message completion with Anthropic Claude")
async def anthropic_create_message(
    body: AnthropicMessageRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("anthropic") or ANTHROPIC_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="Anthropic API key is required.")

    if not ANTHROPIC_AVAILABLE:
        raise HTTPException(status_code=503, detail="anthropic Python package is not installed.")

    try:
        content = await AnthropicClient.create_message(
            messages=body.messages,
            system=body.system,
            model=body.model or "claude-3-5-sonnet-20241022",
            max_tokens=body.max_tokens or 2048,
            temperature=body.temperature,
            api_key=key,
        )
        if content is None:
            raise HTTPException(status_code=502, detail="Anthropic Claude returned an empty response.")

        return {
            "success": True,
            "provider": "anthropic",
            "model": body.model,
            "content": content,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Anthropic API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

