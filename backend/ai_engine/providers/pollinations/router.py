"""
backend/app/api/v1/providers/pollinations.py
─────────────────────────────────────────────────────────────────────────────
Pollinations.ai Free Generative Diffusion Provider API Routes:
- GET  /status         – Availability state
- GET  /models         – Available Pollinations models and fallback chains
- POST /generate-image – Direct image synthesis with automatic model failover
─────────────────────────────────────────────────────────────────────────────
"""

import base64
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.cache import stitched_cache
from ai_engine.providers.pollinations import PollinationsClient, PollinationsModel

logger = logging.getLogger("sonikoma.api.providers.pollinations")
router = APIRouter()


class PollinationsGenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = "flux-anime"
    width: Optional[int] = Field(768, ge=256, le=1536)
    height: Optional[int] = Field(1024, ge=256, le=1536)
    seed: Optional[int] = None
    enhance: Optional[bool] = False
    nologo: Optional[bool] = True


@router.get("/status", summary="Check Pollinations.ai provider status")
async def get_pollinations_status():
    from ai_engine.core.registry import ModelRegistry
    models = ModelRegistry.get_catalog_by_provider("pollinations")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else "flux-anime"
    return {
        "success": True,
        "provider": "pollinations",
        "available": True,
        "configured": True,  # Free public API
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
    }


@router.get("/models", summary="List Pollinations.ai diffusion models")
async def list_pollinations_models():
    from ai_engine.core.registry import ModelRegistry
    from ai_engine.core.orchestrator import AIOrchestrator
    models = ModelRegistry.get_catalog_by_provider("pollinations")
    default_model = AIOrchestrator.resolve_model_for_task("image_diffusion", "primary") or (models[0]["id"] if models else "flux-anime")
    return {
        "success": True,
        "models": models,
        "default_model": default_model,
    }


@router.post("/generate-image", summary="Generate image using Pollinations.ai with fallback")
async def pollinations_generate_image(body: PollinationsGenerateRequest):
    from ai_engine.core.orchestrator import AIOrchestrator
    default_model = AIOrchestrator.resolve_model_for_task("image_diffusion", "primary") or "flux-anime"
    img_bytes, used_model, err = await PollinationsClient.generate_image(
        prompt=body.prompt,
        model=body.model or default_model,
        width=body.width or 768,
        height=body.height or 1024,
        seed=body.seed,
    )

    if not img_bytes:
        raise HTTPException(
            status_code=502,
            detail=f"Pollinations image generation failed across candidate chain: {err or 'Unknown error'}"
        )

    # Store in stitched cache for immediate browser preview
    cache_id = f"pol_{uuid.uuid4().hex[:12]}.jpg"
    stitched_cache.set(cache_id, {"data": img_bytes, "content_type": "image/jpeg"})
    image_url = f"/api/v1/images/cached/{cache_id}"

    b64_data = base64.b64encode(img_bytes).decode("ascii")

    return {
        "success": True,
        "provider": "pollinations",
        "requested_model": body.model,
        "used_model": used_model,
        "url": image_url,
        "image_url": image_url,
        "image_base64": f"data:image/jpeg;base64,{b64_data}",
        "bytes_length": len(img_bytes),
    }
