"""
backend/app/api/v1/providers/gemini.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini Foundation & Multimodal Vision Provider API Routes:
- GET  /status          – Health check & API key configuration state
- POST /generate        – Direct text generation with exponential backoff
- POST /vision/analyze  – Multimodal vision panel & sequence analysis
- POST /smart-crop      – AI-assisted panel boundary detection
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_PRIMARY, call_gemini_with_retry
from app.providers.gemini import GeminiClient, GEMINI_AVAILABLE
from app.schemas.ai import (
    AnalyzeImageRequest,
    AnalyzeSequenceRequest,
    SmartCropRequest,
)
from app.services.ai.facade import (
    facade_analyze_image,
    facade_analyze_narrative_sequence,
    facade_smart_crop,
)

logger = logging.getLogger("sonikoma.api.providers.gemini")
router = APIRouter()


class GeminiGenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_output_tokens: Optional[int] = 4096
    system_instruction: Optional[str] = None
    api_key: Optional[str] = None


@router.get("/status", summary="Check Gemini provider status and configuration")
async def get_gemini_status(user_keys: dict = Depends(get_all_user_keys)):
    user_key = clean_api_key(user_keys.get("gemini"))
    configured = bool(user_key or GEMINI_API_KEY)
    return {
        "success": True,
        "provider": "gemini",
        "available": GEMINI_AVAILABLE,
        "configured": configured,
        "primary_model": GEMINI_MODEL_PRIMARY,
        "supported_models": [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
    }


@router.post("/generate", summary="Generate content with Google Gemini")
async def generate_gemini_text(
    body: GeminiGenerateRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("gemini") or GEMINI_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="Gemini API key is required.")

    if not GeminiClient.is_available():
        raise HTTPException(status_code=503, detail="Google GenAI SDK is not available.")

    model_name = body.model or GEMINI_MODEL_PRIMARY
    try:
        client = GeminiClient.get_client(api_key=key)
        
        # Build generation configuration
        config_dict = {
            "temperature": body.temperature,
            "max_output_tokens": body.max_output_tokens,
        }
        if body.system_instruction:
            config_dict["system_instruction"] = body.system_instruction

        response = await GeminiClient.generate_content_with_retry(
            client=client,
            model=model_name,
            contents=body.prompt,
            config=config_dict
        )
        output_text = getattr(response, "text", str(response)) if response else ""
        return {
            "success": True,
            "provider": "gemini",
            "model": model_name,
            "content": output_text
        }
    except Exception as exc:
        logger.error(f"[Gemini API] Generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/vision/analyze", summary="Analyze comic panel image using Gemini Vision")
async def analyze_panel_image(
    body: AnalyzeImageRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = user_keys.get("gemini") or GEMINI_API_KEY
    result = await facade_analyze_image(body, api_key=key)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Analysis failed"))
    return result


@router.post("/smart-crop", summary="Detect panel boundaries using Gemini Vision")
async def smart_crop_panels(
    body: SmartCropRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = user_keys.get("gemini") or GEMINI_API_KEY
    return await facade_smart_crop(body, api_key=key)
