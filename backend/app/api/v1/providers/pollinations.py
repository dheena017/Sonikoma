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
from app.providers.pollinations import PollinationsClient, PollinationsModel

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
    return {
        "success": True,
        "provider": "pollinations",
        "available": True,
        "configured": True,  # Free public API
        "primary_model": "flux-anime",
        "supported_models": [
            "flux-anime",
            "turbo",
            "flux",
            "flux-realism",
            "stable-diffusion",
            "sana",
        ],
    }


@router.get("/models", summary="List Pollinations.ai diffusion models")
async def list_pollinations_models():
    return {
        "success": True,
        "models": [
            {"id": "flux-anime", "name": "Flux Anime (Stylized Manga & Webtoon)", "speed": "fast"},
            {"id": "turbo", "name": "SDXL Turbo (High-Speed Diffusion)", "speed": "ultra-fast"},
            {"id": "flux", "name": "Flux.1 General Purpose", "speed": "standard"},
            {"id": "flux-realism", "name": "Flux Realism", "speed": "standard"},
            {"id": "stable-diffusion", "name": "Stable Diffusion Classic", "speed": "fast"},
            {"id": "sana", "name": "Sana 4K Diffusion", "speed": "high-res"},
        ],
        "default_model": "flux-anime",
    }


@router.post("/generate-image", summary="Generate image using Pollinations.ai with fallback")
async def pollinations_generate_image(body: PollinationsGenerateRequest):
    img_bytes, used_model, err = await PollinationsClient.generate_image(
        prompt=body.prompt,
        model=body.model or "flux-anime",
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
