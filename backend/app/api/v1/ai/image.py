"""
backend/app/api/v1/ai/image.py
─────────────────────────────────────────────────────────────────────────────
AI image analysis (panel narration, smart crop) and Stable Diffusion
generation, inpainting, upscaling, and style transfer routes.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
import tempfile

from fastapi import APIRouter, Depends, HTTPException

from api.v1.ai._deps import get_user_gemini_key, default_output_path
from api.dependencies.auth import get_current_user

from services.user.credit_service import get_available_credits, record_credit_transaction
from database.config import LOW_BALANCE_THRESHOLD
from backend.schemas.ai import (
    AnalyzeImageRequest,
    AnalyzeBatchRequest,
    AnalyzeSequenceRequest,
    SmartCropRequest,
    SmartCropBatchRequest,
    GenerateAIRequest,
    InpaintRequest,
    UpscaleRequest,
    StyleTransferRequest,
    BatchGenerateRequest,
)
from services.ai.facade import facade_analyze_image, facade_smart_crop
from engines.stable_diffusion import get_stable_diffusion_engine

logger = logging.getLogger("sonikoma.api.ai.image")

router = APIRouter()
try:
    stable_diffusion = get_stable_diffusion_engine()
except ImportError:
    stable_diffusion = None
    logger.warning('Stable Diffusion engine could not be initialized.')


@router.post("/analyze-image", summary="Generate narration script and SFX for a single panel")
async def analyze_image(
    body: AnalyzeImageRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    COST = 5
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    try:
        result = await facade_analyze_image(
            url=body.url, model=body.model, voice=body.voice,
            narration_style=body.narrationStyle, user_keys=user_api_key
        )
        record_credit_transaction(current_user["user_id"], -COST, "analyze_image")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-batch", summary="Batch analysis of multiple storyboard panels (max 20)")
async def analyze_batch(
    body: AnalyzeBatchRequest,
    user_api_key: dict = Depends(get_user_gemini_key)
):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    if len(body.urls) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 panels per batch request.")

    results = []
    semaphore = asyncio.Semaphore(4)

    async def process_one(url: str):
        async with semaphore:
            try:
                res = await facade_analyze_image(
                    url=url, model=body.model, voice=body.voice,
                    narration_style=body.narrationStyle, user_keys=user_api_key
                )
                results.append({"url": url, **res})
            except Exception as e:
                results.append({"url": url, "success": False, "error": str(e)})

    await asyncio.gather(*[process_one(url) for url in body.urls])
    return {"success": True, "total": len(results), "results": results}


@router.post("/analyze-sequence", summary="Analyze multiple panels together for context-aware narrative")
async def analyze_sequence(
    body: AnalyzeSequenceRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty")
    COST = min(50, len(body.urls) * 5)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    try:
        results = []
        for url in body.urls:
            res = await facade_analyze_image(url, body.model, body.voice, body.narrationStyle, user_api_key)
            results.append({"url": url, **res})
        record_credit_transaction(current_user["user_id"], -COST, "analyze_sequence")
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-smart-crop", summary="Crop panels automatically using local CV or Gemini")
@router.post("/detect-panels")
@router.post("/ai-detect-panels")
async def ai_smart_crop(
    body: SmartCropRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    COST = 5
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    try:
        result = await facade_smart_crop(
            url=body.url, aspect_ratio=body.aspectRatio,
            model=body.model, user_keys=user_api_key
        )
        record_credit_transaction(current_user["user_id"], -COST, "ai_smart_crop")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-smart-crop-batch", summary="Batch crop panels automatically using local CV or Gemini")
@router.post("/detect-panels-batch")
async def ai_smart_crop_batch(
    body: SmartCropBatchRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    COST = min(50, len(body.urls) * 5)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    results = []
    for url in body.urls:
        try:
            res = await facade_smart_crop(url, body.aspectRatio, body.model, user_api_key)
            results.append({"url": url, "success": True, "data": res})
        except Exception as e:
            results.append({"url": url, "success": False, "error": str(e)})
    record_credit_transaction(current_user["user_id"], -COST, "ai_smart_crop_batch")
    return {"success": True, "results": results}


# ─── Stable Diffusion Routes ──────────────────────────────────────────────────

@router.post("/generate-ai", summary="Generate image(s) from text prompt")
async def generate_ai(body: GenerateAIRequest, current_user: dict = Depends(get_current_user)):
    COST = 10 * (body.num_images or 1)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        results = await stable_diffusion.generate_images(
            prompt=body.prompt, negative_prompt=body.negative_prompt,
            num_images=body.num_images, height=body.height, width=body.width,
            guidance_scale=body.guidance_scale, num_inference_steps=body.num_inference_steps,
            seed=body.seed, output_dir=output_dir,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_generate")
        return {"success": True, "images": [img.image_path for img in results], "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/inpaint", summary="Inpaint an image based on a mask")
async def inpaint(body: InpaintRequest, current_user: dict = Depends(get_current_user)):
    COST = 10
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        result = await stable_diffusion.inpaint(
            body.image_path, body.mask_path, body.prompt,
            negative_prompt=body.negative_prompt, output_path=output_path,
            guidance_scale=body.guidance_scale, num_inference_steps=body.num_inference_steps, strength=body.strength,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_inpaint")
        return {"success": True, "output_path": result.image_path, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upscale", summary="Upscale an image")
async def upscale(body: UpscaleRequest, current_user: dict = Depends(get_current_user)):
    COST = 5
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        result = await stable_diffusion.upscale(body.image_path, output_path=output_path, scale_factor=body.scale_factor)
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_upscale")
        return {"success": True, "output_path": result, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/style-transfer", summary="Apply style transfer to an image")
async def style_transfer(body: StyleTransferRequest, current_user: dict = Depends(get_current_user)):
    COST = 15
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        result = await stable_diffusion.style_transfer(
            body.image_path, style_prompt=body.style_prompt, output_path=output_path,
            guidance_scale=body.guidance_scale, num_inference_steps=body.num_inference_steps,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_style_transfer")
        return {"success": True, "output_path": result.image_path, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-generate", summary="Generate a batch of images from multiple prompts")
async def batch_generate(body: BatchGenerateRequest, current_user: dict = Depends(get_current_user)):
    COST = min(100, len(body.prompts) * 10)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        images = []
        for prompt in body.prompts:
            results = await stable_diffusion.generate_images(
                prompt=prompt, num_images=1, height=body.height, width=body.width,
                guidance_scale=body.guidance_scale, num_inference_steps=body.num_inference_steps, output_dir=output_dir,
            )
            images.extend([img.image_path for img in results])
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_batch_generate")
        return {"success": True, "images": images, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
