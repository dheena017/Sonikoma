"""
backend/python/routes/stable_diffusion_routes.py
─────────────────────────────────────────────────────────────────────────────
Stable Diffusion image generation routes.
"""

import os
import sys
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.stable_diffusion_engine import get_stable_diffusion_engine

logger = logging.getLogger("sonikoma.routes.stable_diffusion_routes")
router = APIRouter()
stable_diffusion = get_stable_diffusion_engine()


class GenerateAIRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    num_images: Optional[int] = Field(1, ge=1, le=10)
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    seed: Optional[int] = None
    output_dir: Optional[str] = None


class InpaintRequest(BaseModel):
    image_path: str
    mask_path: str
    prompt: str
    negative_prompt: Optional[str] = ""
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    strength: Optional[float] = Field(0.8, ge=0.1, le=1.0)


class UpscaleRequest(BaseModel):
    image_path: str
    scale_factor: Optional[int] = Field(2, ge=2, le=4)
    output_path: Optional[str] = None


class StyleTransferRequest(BaseModel):
    image_path: str
    style_prompt: str
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)


class BatchGenerateRequest(BaseModel):
    prompts: List[str]
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    output_dir: Optional[str] = None


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"stable_diffusion_{os.urandom(4).hex()}{suffix}")


@router.post("/generate-ai", summary="Generate image(s) from text prompt")
async def generate_ai(body: GenerateAIRequest):
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        results = await stable_diffusion.generate_images(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt,
            num_images=body.num_images,
            height=body.height,
            width=body.width,
            guidance_scale=body.guidance_scale,
            num_inference_steps=body.num_inference_steps,
            seed=body.seed,
            output_dir=output_dir,
        )
        return {"success": True, "images": [img.image_path for img in results]}
    except Exception as exc:
        logger.error(f"Generate AI failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/inpaint", summary="Inpaint an image based on a mask")
async def inpaint(body: InpaintRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await stable_diffusion.inpaint(
            body.image_path,
            body.mask_path,
            body.prompt,
            negative_prompt=body.negative_prompt,
            output_path=output_path,
            guidance_scale=body.guidance_scale,
            num_inference_steps=body.num_inference_steps,
            strength=body.strength,
        )
        return {"success": True, "output_path": result.image_path}
    except Exception as exc:
        logger.error(f"Inpaint failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upscale", summary="Upscale an image")
async def upscale(body: UpscaleRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await stable_diffusion.upscale(body.image_path, output_path=output_path, scale_factor=body.scale_factor)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Upscale failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/style-transfer", summary="Apply style transfer to an image")
async def style_transfer(body: StyleTransferRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await stable_diffusion.style_transfer(
            body.image_path,
            style_prompt=body.style_prompt,
            output_path=output_path,
            guidance_scale=body.guidance_scale,
            num_inference_steps=body.num_inference_steps,
        )
        return {"success": True, "output_path": result.image_path}
    except Exception as exc:
        logger.error(f"Style transfer failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-generate", summary="Generate a batch of images from multiple prompts")
async def batch_generate(body: BatchGenerateRequest):
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        images = []
        for prompt in body.prompts:
            results = await stable_diffusion.generate_images(
                prompt=prompt,
                num_images=1,
                height=body.height,
                width=body.width,
                guidance_scale=body.guidance_scale,
                num_inference_steps=body.num_inference_steps,
                output_dir=output_dir,
            )
            images.extend([img.image_path for img in results])
        return {"success": True, "images": images}
    except Exception as exc:
        logger.error(f"Batch generate failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
