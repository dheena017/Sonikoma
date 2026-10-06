"""
backend/app/api/v1/providers/stable_diffusion.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Local Stable Diffusion / Diffusers Generative Engine Provider API Routes:
- GET  /status         â€“ Engine, CUDA, and PyTorch environment status
- POST /generate       â€“ Text-to-image synthesis
- POST /inpaint        â€“ Mask-based inpainting
- POST /upscale        â€“ Image super-resolution upscaling
- POST /style-transfer â€“ Neural style transfer
- POST /batch-generate â€“ Batch multi-prompt synthesis
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import tempfile
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies.auth import get_optional_current_user
from ai_engine.providers.stable_diffusion import (
    StableDiffusionEngine,
    StableDiffusionClient,
    get_stable_diffusion_engine,
    DIFFUSERS_AVAILABLE,
)
from features.intelligence.ai.schemas import (
    GenerateAIRequest,
    InpaintRequest,
    UpscaleRequest,
    StyleTransferRequest,
    BatchGenerateRequest,
)

logger = logging.getLogger("sonikoma.api.providers.stable_diffusion")
router = APIRouter()

_engine_instance = None


def _get_engine():
    global _engine_instance
    if _engine_instance is None:
        try:
            _engine_instance = get_stable_diffusion_engine()
        except Exception as exc:
            logger.warning(f"[Stable Diffusion API] Failed to initialize engine: {exc}")
            raise HTTPException(
                status_code=503,
                detail=f"Stable Diffusion engine is not available: {exc}. Ensure torch and diffusers are installed."
            )
    return _engine_instance


@router.get("/status", summary="Check Stable Diffusion local engine and CUDA status")
async def get_stable_diffusion_status():
    cuda_available = False
    device_name = "cpu"
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
    except Exception:
        pass

    return {
        "success": True,
        "provider": "stable_diffusion",
        "available": DIFFUSERS_AVAILABLE,
        "cuda_available": cuda_available,
        "device": device_name,
        "default_model": "runwayml/stable-diffusion-v1-5",
        "supported_operations": [
            "text_to_image",
            "inpaint",
            "upscale",
            "style_transfer",
            "batch_generate",
        ],
    }


@router.post("/generate", summary="Generate image using local Stable Diffusion")
async def generate_images(
    body: GenerateAIRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        engine = _get_engine()
        results = await engine.generate_images(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt or "",
            num_images=body.num_images or 1,
            height=body.height or 512,
            width=body.width or 512,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
            seed=body.seed,
            output_dir=output_dir,
        )
        return {
            "success": True,
            "provider": "stable_diffusion",
            "images": [img.image_path for img in results],
            "total_generated": len(results),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SD API Generate] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/inpaint", summary="Inpaint an image region using mask")
async def inpaint_image(
    body: InpaintRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    output_path = body.output_path or tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    try:
        engine = _get_engine()
        result = await engine.inpaint(
            image_path=body.image_path,
            mask_path=body.mask_path,
            prompt=body.prompt,
            negative_prompt=body.negative_prompt or "",
            output_path=output_path,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
            strength=body.strength if body.strength is not None else 0.8,
        )
        return {
            "success": True,
            "provider": "stable_diffusion",
            "output_path": result.image_path,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SD API Inpaint] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upscale", summary="Upscale an image resolution")
async def upscale_image(
    body: UpscaleRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    output_path = body.output_path or tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    try:
        engine = _get_engine()
        result = await engine.upscale(
            image_path=body.image_path,
            output_path=output_path,
            scale_factor=body.scale_factor or 2,
        )
        return {
            "success": True,
            "provider": "stable_diffusion",
            "output_path": result,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SD API Upscale] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/style-transfer", summary="Apply neural style transfer")
async def style_transfer_image(
    body: StyleTransferRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    output_path = body.output_path or tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    try:
        engine = _get_engine()
        result = await engine.style_transfer(
            image_path=body.image_path,
            style_prompt=body.style_prompt,
            output_path=output_path,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
        )
        return {
            "success": True,
            "provider": "stable_diffusion",
            "output_path": result.image_path,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SD API StyleTransfer] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-generate", summary="Batch generate multiple prompts")
async def batch_generate_images(
    body: BatchGenerateRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        engine = _get_engine()
        images = []
        for prompt in body.prompts:
            results = await engine.generate_images(
                prompt=prompt,
                num_images=1,
                height=body.height or 512,
                width=body.width or 512,
                guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
                num_inference_steps=body.num_inference_steps or 50,
                output_dir=output_dir,
            )
            images.extend([img.image_path for img in results])
        return {
            "success": True,
            "provider": "stable_diffusion",
            "images": images,
            "total_generated": len(images),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SD API BatchGenerate] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

