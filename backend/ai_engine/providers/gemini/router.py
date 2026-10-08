"""
backend/app/api/v1/providers/gemini.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Google Gemini Foundation & Multimodal Vision Provider API Routes:
- GET  /status          â€“ Health check & API key configuration state
- POST /generate        â€“ Direct text generation with exponential backoff
- POST /vision/analyze  â€“ Multimodal vision panel & sequence analysis
- POST /smart-crop      â€“ AI-assisted panel boundary detection
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_PRIMARY, call_gemini_with_retry
from ai_engine.providers.gemini import GeminiClient, GEMINI_AVAILABLE
from features.intelligence.ai.schemas import (
    AnalyzeImageRequest,
    AnalyzeSequenceRequest,
    SmartCropRequest,
)
from features.intelligence.ai.services.facade import (
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
    from ai_engine.core.registry import ModelRegistry
    user_key = clean_api_key(user_keys.get("gemini"))
    configured = bool(user_key or GEMINI_API_KEY)
    models = ModelRegistry.get_catalog_by_provider("gemini")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else GEMINI_MODEL_PRIMARY
    return {
        "success": True,
        "provider": "gemini",
        "available": GEMINI_AVAILABLE,
        "configured": configured,
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
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
        config_dict: Dict[str, Any] = {
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
    keys_dict = {"gemini": key} if key else None
    result = await facade_analyze_image(
        url=body.url,
        model=body.model,
        voice=getattr(body, "voice", None),
        narration_style=getattr(body, "narration_style", None),
        user_keys=keys_dict,
        story_context=getattr(body, "story_context", None),
        story_memory=getattr(body, "story_memory", None),
        panel_index=getattr(body, "panel_index", 0),
        generate_audio=getattr(body, "generate_audio", True),
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Analysis failed"))
    return result


@router.post("/smart-crop", summary="Detect panel boundaries using Gemini Vision")
async def smart_crop_panels(
    body: SmartCropRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = user_keys.get("gemini") or GEMINI_API_KEY
    keys_dict = {"gemini": key} if key else None
    return await facade_smart_crop(
        url=body.url,
        aspect_ratio=getattr(body, "aspect_ratio", "free"),
        model=getattr(body, "model", None),
        user_keys=keys_dict,
        strategy=getattr(body, "strategy", "local-cv"),
    )

