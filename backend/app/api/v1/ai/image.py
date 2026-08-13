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
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.ai._deps import get_user_gemini_key, default_output_path
from app.api.dependencies.auth import get_current_user

from app.services.user.credit_service import get_available_credits, record_credit_transaction
from app.database.config import LOW_BALANCE_THRESHOLD
from app.schemas.ai import (
    AnalyzeImageRequest,
    AnalyzeBatchRequest,
    AnalyzeSequenceRequest,
    AnalyzePanelSequenceRequest,
    SmartCropRequest,
    SmartCropBatchRequest,
    GenerateAIRequest,
    InpaintRequest,
    UpscaleRequest,
    StyleTransferRequest,
    BatchGenerateRequest,
)
from app.services.ai.facade import (
    facade_analyze_image,
    facade_analyze_narrative_sequence,
    facade_smart_crop,
)

logger = logging.getLogger("sonikoma.api.ai.image")

router = APIRouter()
stable_diffusion = None


def _get_sd_engine():
    global stable_diffusion
    if stable_diffusion is None:
        try:
            from providers.stable_diffusion import get_stable_diffusion_engine
            stable_diffusion = get_stable_diffusion_engine()
        except Exception as e:
            logger.warning(f"Stable Diffusion engine could not be initialized: {e}")
            raise HTTPException(
                status_code=503,
                detail="Stable Diffusion engine is not available. Please ensure diffusers, torch, and Pillow are installed."
            )
    return stable_diffusion


async def _attach_narratives_to_results(
    results: list,
    model: Optional[str],
    voice: Optional[str],
    user_keys: dict,
):
    if not results:
        return results

    visual_descriptions = [
        (item.get("analysis", {}) or {}).get("visual_description") or "An illustration panel."
        for item in results
    ]

    try:
        narrative_result = await facade_analyze_narrative_sequence(
            visual_descriptions=visual_descriptions,
            model=model,
            voice=voice,
            user_keys=user_keys,
        )
        if narrative_result.get("success") and narrative_result.get("results"):
            for idx, narrative_item in enumerate(narrative_result["results"]):
                if idx >= len(results):
                    break
                narrative_text = narrative_item.get("narrative")
                results[idx]["narrative"] = narrative_text
                results[idx]["narrativeText"] = narrative_text
                results[idx]["narrative_audio_url"] = narrative_item.get("narrative_audio_url")
                if results[idx].get("analysis") is not None:
                    results[idx]["analysis"]["narrativeText"] = narrative_text
    except Exception as e:
        logger.exception("[AI Analysis] Narrative generation failed. Returning panel analysis without narrative.")

    return results



@router.post("/analyze-image", summary="Analyze a single storyboard panel and generate dialogue, SFX, scene description, motion, timing, and narrative")
@router.post("/analyze-single-image", summary="Analyze a single storyboard panel and generate dialogue, SFX, scene description, motion, timing, and narrative")
async def analyze_image(
    body: AnalyzeImageRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    COST = 8
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    try:
        result = await facade_analyze_image(
            url=body.url,
            model=body.model,
            voice=body.voice,
            narration_style=body.narrationStyle,
            user_keys=user_api_key,
        )
        result = (await _attach_narratives_to_results([result], body.model, body.voice, user_api_key))[0]
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


@router.post("/analyze-sequence", summary="Analyze multiple panels together for context-aware narrative and audio")
async def analyze_sequence(
    body: AnalyzeSequenceRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if body.visual_descriptions:
        if not body.visual_descriptions:
            raise HTTPException(status_code=400, detail="visual_descriptions list cannot be empty")
        COST = min(50, len(body.visual_descriptions) * 5)
        if get_available_credits(current_user["user_id"]) < COST:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
        try:
            results = await facade_analyze_narrative_sequence(
                visual_descriptions=body.visual_descriptions,
                model=body.model,
                voice=body.voice,
                user_keys=user_api_key,
            )
            if results.get("success") and results.get("results"):
                record_credit_transaction(current_user["user_id"], -COST, "analyze_sequence")
            return results
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty")
    COST = min(50, len(body.urls) * 8)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    semaphore = asyncio.Semaphore(4)
    results = []

    async def analyze_url(url: str) -> dict:
        async with semaphore:
            try:
                res = await facade_analyze_image(
                    url=url,
                    model=body.model,
                    voice=body.voice,
                    narration_style=body.narrationStyle,
                    user_keys=user_api_key,
                )
                return {"url": url, **res}
            except Exception as e:
                return {"url": url, "success": False, "error": str(e)}

    results = await asyncio.gather(*(analyze_url(url) for url in body.urls))
    results = await _attach_narratives_to_results(results, body.model, body.voice, user_api_key)
    if any(item.get("success") for item in results):
        record_credit_transaction(current_user["user_id"], -COST, "analyze_sequence")
    return {"success": True, "results": results}


@router.post("/analyze-panels", summary="Analyze multiple storyboard panels in a single batch request")
@router.post("/analyze-selected-panels", summary="Analyze selected storyboard panels and generate dialogue, SFX, scene description, motion, timing, and narrative")
@router.post("/analyze-all-panels", summary="Analyze all storyboard panels and generate dialogue, SFX, scene description, motion, timing, and narrative")
async def analyze_panels(
    body: AnalyzePanelSequenceRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if not body.panels:
        raise HTTPException(status_code=400, detail="Panels list cannot be empty")

    COST = min(50, len(body.panels) * 8)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")

    semaphore = asyncio.Semaphore(4)

    async def analyze_panel(panel):
        async with semaphore:
            try:
                res = await facade_analyze_image(
                    url=panel.url,
                    model=body.model,
                    voice=body.voice,
                    narration_style=body.narrationStyle,
                    user_keys=user_api_key,
                )
                return {"id": panel.id, "url": panel.url, **res}
            except Exception as e:
                return {
                    "id": panel.id,
                    "url": panel.url,
                    "success": False,
                    "error": str(e),
                }

    results = await asyncio.gather(*(analyze_panel(panel) for panel in body.panels))
    results = await _attach_narratives_to_results(results, body.model, body.voice, user_api_key)
    if any(item.get("success") for item in results):
        record_credit_transaction(current_user["user_id"], -COST, "analyze_panels")
    return {"success": True, "results": results}


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
            url=body.url,
            aspect_ratio=body.aspectRatio or "free",
            model=body.model,
            user_keys=user_api_key,
            strategy=body.strategy or "ai",
            sensitivity=body.sensitivity if body.sensitivity is not None else 30.0,
            background_color_mode=body.backgroundColorMode or "auto",
            min_area_pct=body.minAreaPct if body.minAreaPct is not None else 0.15,
            merge_threshold=body.mergeThreshold if body.mergeThreshold is not None else 20,
            canny_low=body.cannyLow if body.cannyLow is not None else 20,
            canny_high=body.cannyHigh if body.cannyHigh is not None else 100,
            close_kernel_size=body.closeKernelSize if body.closeKernelSize is not None else 15,
            min_height_px=body.minHeightPx if body.minHeightPx is not None else 60,
            padding_px=body.paddingPx if body.paddingPx is not None else 10,
            auto_split=body.autoSplit if body.autoSplit is not None else True,
            use_yolo=body.useYolo if body.useYolo is not None else True,
            guidance_instructions=body.guidanceInstructions,
            focus_mode=body.focusMode
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
            res = await facade_smart_crop(
                url=url,
                aspect_ratio=body.aspectRatio or "free",
                model=body.model,
                user_keys=user_api_key,
                strategy=body.strategy or "ai",
                sensitivity=body.sensitivity if body.sensitivity is not None else 30.0,
                background_color_mode=body.backgroundColorMode or "auto",
                min_area_pct=body.minAreaPct if body.minAreaPct is not None else 0.15,
                merge_threshold=body.mergeThreshold if body.mergeThreshold is not None else 20,
                canny_low=body.cannyLow if body.cannyLow is not None else 20,
                canny_high=body.cannyHigh if body.cannyHigh is not None else 100,
                close_kernel_size=body.closeKernelSize if body.closeKernelSize is not None else 15,
                min_height_px=body.minHeightPx if body.minHeightPx is not None else 60,
                padding_px=body.paddingPx if body.paddingPx is not None else 10,
                auto_split=body.autoSplit if body.autoSplit is not None else True,
                guidance_instructions=getattr(body, "guidanceInstructions", None),
                focus_mode=getattr(body, "focusMode", None)
            )
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
        sd = _get_sd_engine()
        results = await sd.generate_images(
            prompt=body.prompt, negative_prompt=body.negative_prompt or "",
            num_images=body.num_images or 1, height=body.height or 512, width=body.width or 512,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
            seed=body.seed, output_dir=output_dir,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_generate")
        return {"success": True, "images": [img.image_path for img in results], "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/inpaint", summary="Inpaint an image based on a mask")
async def inpaint(body: InpaintRequest, current_user: dict = Depends(get_current_user)):
    COST = 10
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        sd = _get_sd_engine()
        result = await sd.inpaint(
            body.image_path, body.mask_path, body.prompt,
            negative_prompt=body.negative_prompt or "", output_path=output_path,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
            strength=body.strength if body.strength is not None else 0.8,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_inpaint")
        return {"success": True, "output_path": result.image_path, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upscale", summary="Upscale an image")
async def upscale(body: UpscaleRequest, current_user: dict = Depends(get_current_user)):
    COST = 5
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        sd = _get_sd_engine()
        result = await sd.upscale(
            body.image_path, output_path=output_path,
            scale_factor=body.scale_factor or 2
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_upscale")
        return {"success": True, "output_path": result, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/style-transfer", summary="Apply style transfer to an image")
async def style_transfer(body: StyleTransferRequest, current_user: dict = Depends(get_current_user)):
    COST = 15
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_path = body.output_path or default_output_path(".png")
    try:
        sd = _get_sd_engine()
        result = await sd.style_transfer(
            body.image_path, style_prompt=body.style_prompt, output_path=output_path,
            guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
            num_inference_steps=body.num_inference_steps or 50,
        )
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_style_transfer")
        return {"success": True, "output_path": result.image_path, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-generate", summary="Generate a batch of images from multiple prompts")
async def batch_generate(body: BatchGenerateRequest, current_user: dict = Depends(get_current_user)):
    COST = min(100, len(body.prompts) * 10)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    output_dir = body.output_dir or tempfile.gettempdir()
    try:
        sd = _get_sd_engine()
        images = []
        for prompt in body.prompts:
            results = await sd.generate_images(
                prompt=prompt, num_images=1,
                height=body.height or 512, width=body.width or 512,
                guidance_scale=body.guidance_scale if body.guidance_scale is not None else 7.5,
                num_inference_steps=body.num_inference_steps or 50,
                output_dir=output_dir,
            )
            images.extend([img.image_path for img in results])
        new_balance = record_credit_transaction(current_user["user_id"], -COST, "sd_batch_generate")
        return {"success": True, "images": images, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
