"""
backend/app/api/v1/providers/openai.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
OpenAI Provider API Routes:
- GET  /status â€“ Availability & API key configuration state
- POST /chat   â€“ Chat completions (GPT-4o, GPT-4o-mini, o1, o3-mini)
- POST /vision â€“ Multimodal image analysis using GPT-4o
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import OPENAI_API_KEY
from ai_engine.providers.openai import OpenAIClient, OPENAI_AVAILABLE, OpenAIModel

logger = logging.getLogger("sonikoma.api.providers.openai")
router = APIRouter()


class OpenAIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = "gpt-4o"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    api_key: Optional[str] = None


class OpenAIVisionRequest(BaseModel):
    image_url: str
    prompt: Optional[str] = "Describe this comic panel, characters, action, dialogue balloons, and mood in detail."
    model: Optional[str] = "gpt-4o"
    api_key: Optional[str] = None


@router.get("/status", summary="Check OpenAI provider status and configuration")
async def get_openai_status(user_keys: dict = Depends(get_all_user_keys)):
    user_key = clean_api_key(user_keys.get("openai"))
    configured = bool(user_key or OPENAI_API_KEY)
    return {
        "success": True,
        "provider": "openai",
        "available": OPENAI_AVAILABLE,
        "configured": configured,
        "primary_model": "gpt-4o",
        "supported_models": [
            "gpt-4o",
            "gpt-4o-mini",
            "o1",
            "o1-mini",
            "o3-mini",
        ],
    }


@router.post("/chat", summary="Execute chat completion with OpenAI")
async def openai_chat_completion(
    body: OpenAIChatRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("openai") or OPENAI_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="OpenAI API key is required.")

    if not OPENAI_AVAILABLE:
        raise HTTPException(status_code=503, detail="openai Python package is not installed.")

    try:
        content = await OpenAIClient.chat_completion(
            messages=body.messages,
            model=body.model or "gpt-4o",
            temperature=body.temperature or 0.7,
            max_tokens=body.max_tokens,
            api_key=key,
        )
        if content is None:
            raise HTTPException(status_code=502, detail="OpenAI API returned an empty response.")

        return {
            "success": True,
            "provider": "openai",
            "model": body.model,
            "content": content,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[OpenAI API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/vision", summary="Analyze an image with GPT-4o Vision")
async def openai_vision_analysis(
    body: OpenAIVisionRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("openai") or OPENAI_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="OpenAI API key is required.")

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": body.prompt},
                {"type": "image_url", "image_url": {"url": body.image_url}},
            ]
        }
    ]

    try:
        client = OpenAIClient.get_client(key)
        if not client:
            raise HTTPException(status_code=503, detail="Unable to initialize OpenAI client.")

        response = await client.chat.completions.create(
            model=body.model or "gpt-4o",
            messages=messages,
            max_tokens=2048,
        )
        output = response.choices[0].message.content if response.choices else ""
        return {
            "success": True,
            "provider": "openai",
            "model": body.model,
            "analysis": output,
        }
    except Exception as exc:
        logger.error(f"[OpenAI Vision API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

