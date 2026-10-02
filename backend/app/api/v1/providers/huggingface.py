"""
backend/app/api/v1/providers/huggingface.py
─────────────────────────────────────────────────────────────────────────────
Hugging Face Inference API Provider Routes:
- GET  /status        – Availability & API key configuration state
- POST /text-to-image – Generative image diffusion (FLUX.1-schnell, SDXL, etc.)
─────────────────────────────────────────────────────────────────────────────
"""

import base64
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.config import HUGGINGFACE_API_KEY
from app.core.cache import stitched_cache
from app.providers.huggingface import HuggingFaceClient, HUGGINGFACE_AVAILABLE, HuggingFaceModel

logger = logging.getLogger("sonikoma.api.providers.huggingface")
router = APIRouter()


class HuggingFaceImageRequest(BaseModel):
    prompt: str
    model: Optional[str] = "black-forest-labs/FLUX.1-schnell"
    width: Optional[int] = Field(768, ge=256, le=1536)
    height: Optional[int] = Field(1024, ge=256, le=1536)
    quality: Optional[int] = Field(90, ge=50, le=100)
    api_key: Optional[str] = None


@router.get("/status", summary="Check Hugging Face provider status and configuration")
async def get_huggingface_status(user_keys: dict = Depends(get_all_user_keys)):
    user_key = clean_api_key(user_keys.get("huggingface"))
    configured = bool(user_key or HUGGINGFACE_API_KEY)
    return {
        "success": True,
        "provider": "huggingface",
        "available": HUGGINGFACE_AVAILABLE,
        "configured": configured,
        "primary_model": "black-forest-labs/FLUX.1-schnell",
        "supported_models": [
            "black-forest-labs/FLUX.1-schnell",
            "black-forest-labs/FLUX.1-dev",
            "stabilityai/stable-diffusion-xl-base-1.0",
        ],
    }


@router.post("/text-to-image", summary="Generate image via Hugging Face Inference API")
async def huggingface_text_to_image(
    body: HuggingFaceImageRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("huggingface") or HUGGINGFACE_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="Hugging Face API key is required.")

    if not HUGGINGFACE_AVAILABLE:
        raise HTTPException(status_code=503, detail="huggingface_hub Python package is not installed.")

    try:
        img_bytes = await HuggingFaceClient.generate_image(
            prompt=body.prompt,
            model=body.model or "black-forest-labs/FLUX.1-schnell",
            width=body.width or 768,
            height=body.height or 1024,
            quality=body.quality or 90,
            api_key=key,
        )

        if not img_bytes:
            raise HTTPException(status_code=502, detail="Hugging Face image synthesis failed or returned empty data.")

        # Cache image to stitched cache for direct URL preview
        cache_id = f"hf_{uuid.uuid4().hex[:12]}.jpg"
        stitched_cache.set(cache_id, {"data": img_bytes, "content_type": "image/jpeg"})
        image_url = f"/api/v1/images/cached/{cache_id}"

        b64_data = base64.b64encode(img_bytes).decode("ascii")

        return {
            "success": True,
            "provider": "huggingface",
            "model": body.model,
            "url": image_url,
            "image_url": image_url,
            "image_base64": f"data:image/jpeg;base64,{b64_data}",
            "bytes_length": len(img_bytes),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[HuggingFace API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
