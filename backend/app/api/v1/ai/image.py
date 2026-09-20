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

from api.v1.ai._deps import get_user_gemini_key, default_output_path
from api.dependencies.auth import get_current_user

from services.user.credit_service import get_available_credits, record_credit_transaction
from database.config import LOW_BALANCE_THRESHOLD
from schemas.ai import (
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
from services.ai.facade import (
    facade_analyze_image,
    facade_analyze_narrative_sequence,
    facade_smart_crop,
)
from services.ai.orchestrator import AIOrchestrator


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


def _attach_narratives_to_results(results: list) -> list:
    if not results:
        return results
    for item in results:
        if not isinstance(item, dict):
            continue
        analysis = item.get("analysis") or {}
        narrative = (
            item.get("narrative")
            or item.get("narrativeText")
            or analysis.get("narrative")
            or analysis.get("narrativeText")
            or analysis.get("visual_description")
            or analysis.get("speech_text")
            or ""
        )
        item["narrative"] = narrative
        item["narrativeText"] = narrative
        if isinstance(item.get("analysis"), dict):
            item["analysis"]["narrative"] = narrative
            item["analysis"]["narrativeText"] = narrative
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
        result = _attach_narratives_to_results([result])[0]
        record_credit_transaction(current_user["user_id"], -COST, "analyze_image")
        return result
    except HTTPException:
        raise
    except Exception as e:
        from services.ai.orchestrator import AIExecutionError, AIErrorCode
        if isinstance(e, AIExecutionError):
            status_map = {
                AIErrorCode.AUTH_FAILURE: 401,
                AIErrorCode.INSUFFICIENT_CREDITS: 402,
                AIErrorCode.MODEL_NOT_FOUND: 404,
                AIErrorCode.RATE_LIMITED: 429,
                AIErrorCode.PROVIDER_UNAVAILABLE: 503,
                AIErrorCode.TIMEOUT: 504,
                AIErrorCode.INVALID_REQUEST: 400,
            }
            status_code = status_map.get(e.error_code, 500)
            raise HTTPException(status_code=status_code, detail=e.message)
        logger.error(f"[AI Analysis Error] analyze_image failed: {e}")
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
    results = _attach_narratives_to_results(results)
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
                from services.ai.orchestrator import AIExecutionError
                clean_msg = e.message if isinstance(e, AIExecutionError) else str(e)
                logger.warning(f"[AI Analysis] Panel {panel.id} analysis failed: {clean_msg}")
                return {
                    "id": panel.id,
                    "url": panel.url,
                    "success": False,
                    "error": clean_msg,
                }

    results = await asyncio.gather(*(analyze_panel(panel) for panel in body.panels))
    results = _attach_narratives_to_results(results)
    if any(item.get("success") for item in results):
        record_credit_transaction(current_user["user_id"], -COST, "analyze_panels")

    def _is_item_success(it: dict) -> bool:
        return bool(it.get("success") or it.get("analysis"))

    success_count = sum(1 for item in results if _is_item_success(item))
    first_success = next((item for item in results if _is_item_success(item)), {})
    default_routed_model = AIOrchestrator.get_default_model_for_capability("panel_analysis")
    used_model = first_success.get("model") or body.model or default_routed_model

    logger.info(
        f"[AI Analysis] Model: {used_model} <<< Completed /api/analyze-panels with {success_count}/{len(results)} success results"
    )
    return {
        "success": success_count > 0,
        "results": results,
        "model": used_model,
        "success_count": success_count,
        "total_count": len(results),
    }


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
