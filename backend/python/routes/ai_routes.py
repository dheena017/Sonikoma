"""
backend/python/routes/ai_routes.py
─────────────────────────────────────────────────────────────────────────────
AI Image Analysis and Smart Cropping routes.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
import asyncio
import io
import json
import os
import tempfile
from urllib.parse import urlparse, parse_qs
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from PIL import Image

import utils.image_utils as img_utils
from utils.cache import stitched_cache, edit_history
from config.clients import ai_initialized, call_gemini_with_retry, genai_client
from services.detect_panels import run_cv_detection

logger = logging.getLogger("anivox.routes.ai_routes")
router = APIRouter()

# ─── Constants ───────────────────────────────────────────────────────────────
VALID_MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']
MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
DEFAULT_ANALYSIS = {
    "speech_text":         "Narrative caption for this storyboard panel scene.",
    "sfx":                 "[Dramatic Beat]",
    "duration":            4.5,
    "motion_type":         "zoom_in",
    "visual_description":  "A cropped illustration frame ready for cinematic playback.",
}

# ─── Pydantic Schemas for Structured Output ────────────────────────────────────

class GeminiAnalysisModel(BaseModel):
    speech_text: str
    sfx: str
    duration: float
    motion_type: str
    visual_description: str

class AnalyzeImageRequest(BaseModel):
    url: str
    model: Optional[str] = "gemini-2.5-flash"

class AnalyzeBatchRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"

class SmartCropRequest(BaseModel):
    url: str
    model: Optional[str] = "gemini-2.5-flash"
    strategy: Optional[str] = "ai"
    sensitivity: Optional[float] = 30.0
    backgroundColorMode: Optional[str] = "auto"
    aspectRatio: Optional[str] = "free"
    minAreaPct: Optional[float] = 0.15
    mergeThreshold: Optional[int] = 20
    cannyLow: Optional[int] = 20
    cannyHigh: Optional[int] = 100
    closeKernelSize: Optional[int] = 15
    minHeightPx: Optional[int] = 60


# ─── Helpers ─────────────────────────────────────────────────────────────────

def clamp_duration(d: Any) -> float:
    try:
        val = float(d)
        if val < 2.0: return 2.0
        if val > 8.0: return 8.0
        return val
    except (ValueError, TypeError):
        return 4.5


def validate_analysis(raw: Dict[str, Any]) -> Dict[str, Any]:
    speech = raw.get("speech_text", "")
    sfx = raw.get("sfx", "")
    vis = raw.get("visual_description", "")
    motion = raw.get("motion_type", "")
    
    return {
        "speech_text": speech.strip()[:200] if isinstance(speech, str) and speech.strip() else DEFAULT_ANALYSIS["speech_text"],
        "sfx": sfx.strip()[:50] if isinstance(sfx, str) and sfx.strip() else DEFAULT_ANALYSIS["sfx"],
        "duration": clamp_duration(raw.get("duration")),
        "motion_type": motion if motion in VALID_MOTIONS else DEFAULT_ANALYSIS["motion_type"],
        "visual_description": vis.strip()[:400] if isinstance(vis, str) and vis.strip() else DEFAULT_ANALYSIS["visual_description"],
    }


def build_analysis_prompt(brightness: Optional[int] = None) -> str:
    tone_hint = ""
    if brightness is not None:
        if brightness < 80:
            tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
        elif brightness > 200:
            tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."
            
    return f"""Analyze this comic/manhwa illustration panel in detail and generate cinematic metadata.{tone_hint}
Return a JSON object with these exact properties:
- speech_text: A caption, subtitle, or character dialogue (max 25 words, impactful and dramatic).
- sfx: An on-screen bracket-style sound effect (e.g., "[Whoosh]", "[Slash]", "[Crash]", "[Gasp]", "[Boom]").
- duration: Suggested scene duration in seconds (between 2.0 and 8.0). Action scenes = shorter; dialogue scenes = longer.
- motion_type: Camera motion. Must be one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down".
- visual_description: A single sentence describing what is happening in the panel."""


def adjust_to_aspect_ratio(
    x: int, y: int, w_box: int, h_box: int, 
    w_img: int, h_img: int, aspect_ratio_str: str
) -> Dict[str, int]:
    if not aspect_ratio_str or aspect_ratio_str == "free":
        return {"x": x, "y": y, "w": w_box, "h": h_box}
        
    target_ratio = 1.0
    if aspect_ratio_str == "1:1": target_ratio = 1.0
    elif aspect_ratio_str == "16:9": target_ratio = 16.0 / 9.0
    elif aspect_ratio_str == "9:16": target_ratio = 9.0 / 16.0
    elif aspect_ratio_str == "4:3": target_ratio = 4.0 / 3.0
    else: return {"x": x, "y": y, "w": w_box, "h": h_box}

    curr_ratio = w_box / h_box if h_box > 0 else 1.0
    new_w = w_box
    new_h = h_box
    new_x = x
    new_y = y

    if curr_ratio < target_ratio:
        new_w = int(round(h_box * target_ratio))
        delta = new_w - w_box
        new_x = x - delta // 2
        if new_x < 0: new_x = 0
        if new_x + new_w > w_img:
            new_w = w_img - new_x
            new_h = int(round(new_w / target_ratio))
            new_y = y + (h_box - new_h) // 2
    elif curr_ratio > target_ratio:
        new_h = int(round(w_box / target_ratio))
        delta = new_h - h_box
        new_y = y - delta // 2
        if new_y < 0: new_y = 0
        if new_y + new_h > h_img:
            new_h = h_img - new_y
            new_w = int(round(new_h * target_ratio))
            new_x = x + (w_box - new_w) // 2
            
    return {"x": new_x, "y": new_y, "w": new_w, "h": new_h}


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/analyze-image", summary="Generate narration script and SFX for a single panel")
async def analyze_image(body: AnalyzeImageRequest):
    start_time = time.time()
    
    # 1. Resolve image
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img_buffer = resolved["data"]
    except Exception as e:
        logger.warning(f"[Analyze] Image fetch failed: {e}. Using default fallback.")
        return {"success": True, "analysis": DEFAULT_ANALYSIS, "source": "fallback:fetch_error"}

    # 2. Get brightness hint
    brightness = None
    try:
        brightness = img_utils.compute_brightness(img_buffer)
    except Exception:
        pass

    # 3. Invoke Gemini
    target_model = body.model or MODEL_FALLBACKS[0]
    
    if not ai_initialized:
        logger.warning("[Analyze] Gemini client not initialized. Returning fallback.")
        return {"success": True, "analysis": DEFAULT_ANALYSIS, "source": "fallback:no_client"}

    from google.genai import types
    try:
        prompt = build_analysis_prompt(brightness)
        
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiAnalysisModel
        )

        response = await call_gemini_with_retry(
            lambda: genai_client.models.generate_content(
                model=target_model,
                contents=[
                    types.Part.from_bytes(data=img_buffer, mime_type="image/jpeg"),
                    prompt
                ],
                config=config
            )
        )
        
        # Parse Response
        raw_text = response.text or "{}"
        analysis = validate_analysis(json.loads(raw_text))

        elapsed = int((time.time() - start_time) * 1000)
        logger.info(f"[Analyze] ✓ model={target_model} motion={analysis['motion_type']} dur={analysis['duration']}s brightness={brightness} ({elapsed}ms)")
        
        return {
            "success": True,
            "analysis": analysis,
            "source": "gemini",
            "model": target_model,
            "latencyMs": elapsed
        }

    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"[Analyze] AI generate failed after retries: {e} ({elapsed}ms). Using fallback.")
        return {"success": True, "analysis": DEFAULT_ANALYSIS, "source": "fallback:ai_error"}


@router.post("/analyze-batch", summary="Batch analysis of multiple storyboard panels (max 20)")
async def analyze_batch(body: AnalyzeBatchRequest):
    start_time = time.time()
    
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    if len(body.urls) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 panels per batch request.")

    logger.info(f"[Batch Analyze] Starting {len(body.urls)} panels. Concurrency=4")
    
    semaphore = asyncio.Semaphore(4)
    results = []
    
    async def process_one(url: str, index: int):
        async with semaphore:
            try:
                # Resolve image
                resolved = await img_utils.resolve_image_to_buffer(url)
                img_buffer = resolved["data"]
                
                # Brightness
                brightness = None
                try:
                    brightness = img_utils.compute_brightness(img_buffer)
                except Exception:
                    pass
                
                if ai_initialized:
                    from google.genai import types
                    prompt = build_analysis_prompt(brightness)
                    
                    config = types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeminiAnalysisModel
                    )
                    
                    response = await call_gemini_with_retry(
                        lambda: genai_client.models.generate_content(
                            model=body.model or MODEL_FALLBACKS[0],
                            contents=[
                                types.Part.from_bytes(data=img_buffer, mime_type="image/jpeg"),
                                prompt
                            ],
                            config=config
                        )
                    )
                    raw_text = response.text or "{}"
                    analysis = validate_analysis(json.loads(raw_text))
                else:
                    analysis = DEFAULT_ANALYSIS
                    
                logger.info(f"[Batch] [{index + 1}/{len(body.urls)}] ✓ {url[:50]} motion={analysis['motion_type']}")
                results.append({"url": url, "analysis": analysis})
                
            except Exception as e:
                logger.warning(f"[Batch] [{index + 1}/{len(body.urls)}] ⚠ Failed {url[:50]}: {e}")
                results.append({"url": url, "analysis": DEFAULT_ANALYSIS, "error": str(e)})

    # Dispatch tasks
    tasks = [process_one(url, idx) for idx, url in enumerate(body.urls)]
    await asyncio.gather(*tasks)
    
    elapsed = int((time.time() - start_time) * 1000)
    logger.info(f"[Batch Analyze] Complete {len(results)} panels ({elapsed}ms total)")
    
    return {
        "success": True,
        "total": len(results),
        "results": results,
        "latencyMs": elapsed,
        "avgMs": elapsed // len(results) if len(results) > 0 else 0
    }


@router.post("/ai-smart-crop", summary="Crop panels automatically using local CV or Gemini")
@router.post("/detect-panels")
@router.post("/ai-detect-panels")
async def ai_smart_crop(body: SmartCropRequest):
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        image_buffer = resolved["data"]
        content_type = resolved["contentType"]

        coord_panels = []
        ai_failed = False
        ai_error_msg = ""

        # Strategy 1: Try Gemini AI crop box model first if not local-cv
        if body.strategy != "local-cv" and body.model != "local-cv":
            if ai_initialized:
                from google.genai import types
                target_model = body.model or "gemini-2.5-flash"
                logger.info(f"[AI Smart Crop API] Using Gemini model: {target_model}")
                
                # Define structure crop schema
                class CropBox(BaseModel):
                    cropTop: float = Field(description="Top coordinate of the panel bounding box (percentage from 0 to 100, where 0 is the top edge and 100 is the bottom edge)")
                    cropBottom: float = Field(description="Bottom coordinate of the panel bounding box (percentage from 0 to 100, where 0 is the top edge and 100 is the bottom edge)")
                    cropLeft: float = Field(description="Left coordinate of the panel bounding box (percentage from 0 to 100, where 0 is the left edge and 100 is the right edge)")
                    cropRight: float = Field(description="Right coordinate of the panel bounding box (percentage from 0 to 100, where 0 is the left edge and 100 is the right edge)")
                    
                class CropList(BaseModel):
                    panels: List[CropBox]

                prompt = (
                    "Analyze this comic/webtoon image. Identify the main scene/illustration panels. "
                    "For each panel, detect its bounding box boundaries as coordinates (0 to 100) relative to the image edges:\n"
                    "- cropTop: top boundary of the panel (0 is top edge, 100 is bottom)\n"
                    "- cropBottom: bottom boundary of the panel (0 is top edge, 100 is bottom)\n"
                    "- cropLeft: left boundary of the panel (0 is left edge, 100 is right)\n"
                    "- cropRight: right boundary of the panel (0 is left edge, 100 is right)\n"
                    "Make sure these are absolute coordinates from the top/left of the image, NOT margins. "
                    "Return a JSON object containing a 'panels' array."
                )
                
                try:
                    config = types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=CropList
                    )
                    
                    response = await call_gemini_with_retry(
                        lambda: genai_client.models.generate_content(
                            model=target_model,
                            contents=[
                                types.Part.from_bytes(data=image_buffer, mime_type="image/jpeg"),
                                prompt
                            ],
                            config=config
                        )
                    )
                    
                    raw_text = response.text or "{}"
                    data = json.loads(raw_text)
                    raw_panels = data.get("panels", [])
                    logger.info(f"[AI Smart Crop] Gemini isolated {len(raw_panels)} panels.")
                    
                    # Convert absolute coordinates to margins (expected by backend and frontend)
                    margins_panels = []
                    for box in raw_panels:
                        y1 = max(0.0, min(100.0, float(box.get("cropTop", 0) if isinstance(box, dict) else getattr(box, "cropTop", 0))))
                        y2 = max(0.0, min(100.0, float(box.get("cropBottom", 0) if isinstance(box, dict) else getattr(box, "cropBottom", 0))))
                        x1 = max(0.0, min(100.0, float(box.get("cropLeft", 0) if isinstance(box, dict) else getattr(box, "cropLeft", 0))))
                        x2 = max(0.0, min(100.0, float(box.get("cropRight", 0) if isinstance(box, dict) else getattr(box, "cropRight", 0))))
                        
                        if y1 > y2:
                            y1, y2 = y2, y1
                        if x1 > x2:
                            x1, x2 = x2, x1
                            
                        margins_panels.append({
                            "cropTop": y1,
                            "cropBottom": 100.0 - y2,
                            "cropLeft": x1,
                            "cropRight": 100.0 - x2
                        })
                    coord_panels = margins_panels
                except Exception as e:
                    logger.warning(f"[AI Smart Crop API] Gemini failed: {e}. Falling back to local CV.")
                    ai_failed = True
                    ai_error_msg = str(e)
            else:
                logger.warning("[AI Smart Crop API] Gemini not initialized. Falling back to local CV.")
                ai_failed = True
                ai_error_msg = "Gemini client not initialized"

        if body.strategy != "local-cv" and body.model != "local-cv" and ai_failed:
            raise HTTPException(status_code=500, detail=f"AI smart crop failed: {ai_error_msg}")

        # Strategy 2: Local CV panel detection (Pillow/OpenCV)
        if body.strategy == "local-cv" or body.model == "local-cv":
            # Write to temp file for detection
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(image_buffer)
                temp_in_path = tmp_in.name
                
            try:
                # Robust scaling: If frontend sent percentage (e.g. 2.0%) instead of ratio (0.02), scale it down
                min_area_pct = body.minAreaPct if body.minAreaPct is not None else 0.15
                if min_area_pct > 1.0:
                    min_area_pct = min_area_pct / 100.0

                # Call detect_panels run_cv_detection directly! (No subprocess needed!)
                coord_panels = run_cv_detection(
                    image_path=temp_in_path,
                    sensitivity=body.sensitivity,
                    bg_mode=body.backgroundColorMode,
                    min_width_pct=min_area_pct,
                    min_height_px=body.minHeightPx,
                    merge_threshold=body.mergeThreshold,
                    aspect_ratio_str=body.aspectRatio,
                    canny_low=body.cannyLow,
                    canny_high=body.cannyHigh,
                    close_kernel_size=body.closeKernelSize
                )
            finally:
                if os.path.exists(temp_in_path):
                    os.remove(temp_in_path)

        # Crop each panel out
        img = Image.open(io.BytesIO(image_buffer))
        w, h = img.size

        cropped_panels = []
        for i, box in enumerate(coord_panels):
            p_top = max(0.0, min(100.0, float(box.get("cropTop", 0))))
            p_bottom = max(0.0, min(100.0, float(box.get("cropBottom", 0))))
            p_left = max(0.0, min(100.0, float(box.get("cropLeft", 0))))
            p_right = max(0.0, min(100.0, float(box.get("cropRight", 0))))

            top_px = int(round((p_top / 100.0) * h))
            bot_px = int(round((p_bottom / 100.0) * h))
            left_px = int(round((p_left / 100.0) * w))
            right_px = int(round((p_right / 100.0) * w))

            crop_w = w - left_px - right_px
            crop_h = h - top_px - bot_px

            if body.aspectRatio and body.aspectRatio != "free":
                adjusted = adjust_to_aspect_ratio(left_px, top_px, crop_w, crop_h, w, h, body.aspectRatio)
                left_px = adjusted["x"]
                top_px = adjusted["y"]
                crop_w = adjusted["w"]
                crop_h = adjusted["h"]
                p_left = (left_px / w) * 100.0
                p_top = (top_px / h) * 100.0
                p_right = ((w - (left_px + crop_w)) / w) * 100.0
                p_bottom = ((h - (top_px + crop_h)) / h) * 100.0

            # Perform Crop
            if crop_w > 10 and crop_h > 10:
                cropped_img = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                out = io.BytesIO()
                cropped_img.save(out, format=img.format or "JPEG")
                cropped_buffer = out.getvalue()
            else:
                cropped_buffer = image_buffer

            unique_id = f"merged_{int(time.time() * 1000)}_smartcrop_{i}"
            cached_url = f"/api/merge-images/cached/{unique_id}"
            
            stitched_cache.set(unique_id, {"data": cropped_buffer, "content_type": content_type})
            edit_history.set(cached_url, body.url)

            cropped_panels.append({
                "cropTop": round(p_top, 2),
                "cropBottom": round(p_bottom, 2),
                "cropLeft": round(p_left, 2),
                "cropRight": round(p_right, 2),
                "croppedUrl": cached_url
            })

        return {
            "success": True,
            "panels": cropped_panels,
            "fallback": ai_failed,
            "message": f"AI smart crop failed: {ai_error_msg}. Fell back to local CV." if ai_failed else ""
        }
    except Exception as e:
        logger.error(f"[AI Smart Crop API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Smart Crop failed: {e}")
