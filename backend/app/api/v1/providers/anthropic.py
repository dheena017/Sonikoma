"""
backend/app/api/v1/providers/anthropic.py
─────────────────────────────────────────────────────────────────────────────
Anthropic Claude Provider API Routes:
- GET  /status   – Availability & API key configuration state
- POST /messages – Claude 3.5 Sonnet / Haiku chat and reasoning
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import ANTHROPIC_API_KEY
from app.providers.anthropic import AnthropicClient, ANTHROPIC_AVAILABLE, AnthropicModel

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
    user_key = clean_api_key(user_keys.get("anthropic"))
    configured = bool(user_key or ANTHROPIC_API_KEY)
    return {
        "success": True,
        "provider": "anthropic",
        "available": ANTHROPIC_AVAILABLE,
        "configured": configured,
        "primary_model": "claude-3-5-sonnet-20241022",
        "supported_models": [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
        ],
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
