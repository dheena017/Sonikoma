"""
backend/python/routes/ai_routes.py
─────────────────────────────────────────────────────────────────────────────
AI Image Analysis and Smart Cropping routes refactored to use AI Markdown Skills.
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

# AI Skills registry and models imports
from skills.registry import registry
from skills.base import GeminiAnalysisModel, CropBox, CropList

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

# ─── Pydantic Schemas for Requests ───────────────────────────────────────────

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

# ─── Dynamic Endpoints Requests ──────────────────────────────────────────────

class DramatizeRequest(BaseModel):
    raw_ocr_text: List[str]
    genre: str
    scene_context: str
    model: Optional[str] = "gemini-2.5-flash"

class SFXAudioRequest(BaseModel):
    visual_description: str
    sfx_tag: str
    model: Optional[str] = "gemini-2.5-flash"

class ThumbnailRequest(BaseModel):
    title: str
    genre: str
    plot_point: str
    model: Optional[str] = "gemini-2.5-flash"

class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    model: Optional[str] = "gemini-2.5-flash"

class SEORequest(BaseModel):
    title: str
    genre: str
    storyboard_summary: str
    model: Optional[str] = "gemini-2.5-flash"

class VoiceCastingRequest(BaseModel):
    character_name: str
    dialogue_sample: str
    visual_description: str
    model: Optional[str] = "gemini-2.5-flash"

class ThumbnailLayoutRequest(BaseModel):
    thumbnail_concept: str
    main_character: str
    model: Optional[str] = "gemini-2.5-flash"

class SeriesIntroHookRequest(BaseModel):
    title: str
    premise_summary: str
    genre: str
    model: Optional[str] = "gemini-2.5-flash"

class CharacterBioRequest(BaseModel):
    dialogue: str
    model: Optional[str] = "gemini-2.5-flash"

class NarrativePacingRequest(BaseModel):
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"

class CommentReplyRequest(BaseModel):
    user_comment: str
    video_title: str
    model: Optional[str] = "gemini-2.5-flash"

class BGMVibeRequest(BaseModel):
    narrative_mood: str
    action_scale: str
    model: Optional[str] = "gemini-2.5-flash"

class ShortsScriptRequest(BaseModel):
    storyboard_summary: str
    model: Optional[str] = "gemini-2.5-flash"

class CliffhangerRequest(BaseModel):
    story_outline: str
    model: Optional[str] = "gemini-2.5-flash"

class TitleABRequest(BaseModel):
    title: str
    key_climax_event: str
    model: Optional[str] = "gemini-2.5-flash"

class SFXOverlayRequest(BaseModel):
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"

class CameraShakeRequest(BaseModel):
    visual_description: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"

class SceneCompositionRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"

class SubtitleStylerRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"

class YouTubeChapterRequest(BaseModel):
    compiled_script: str
    model: Optional[str] = "gemini-2.5-flash"

class MidrollPlacementRequest(BaseModel):
    compiled_script: str
    max_ads: Optional[int] = 3
    model: Optional[str] = "gemini-2.5-flash"

class ShortsHookRequest(BaseModel):
    title: str
    key_event: str
    model: Optional[str] = "gemini-2.5-flash"

class CharacterEmotionRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"

class TransitionSpeedRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"

class ThumbnailVisualRequest(BaseModel):
    thumbnail_concept: str
    model: Optional[str] = "gemini-2.5-flash"

class OutroCTARequest(BaseModel):
    title: str
    ending_cliffhanger: str
    model: Optional[str] = "gemini-2.5-flash"

class CopyrightScrubRequest(BaseModel):
    text: str
    model: Optional[str] = "gemini-2.5-flash"


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
        return {"success": False, "error": f"Image fetch failed: {e}", "analysis": DEFAULT_ANALYSIS, "source": "fallback:fetch_error"}

    # 2. Get brightness hint
    brightness = None
    try:
        brightness = img_utils.compute_brightness(img_buffer)
    except Exception:
        pass

    # 3. Model mapping
    target_model = body.model or MODEL_FALLBACKS[0]
    if not target_model.lower().startswith("gemini"):
        target_model = MODEL_FALLBACKS[0]
    elif "gemini-3.5" in target_model.lower():
        target_model = "gemini-2.5-flash"
    
    try:
        tone_hint = ""
        if brightness is not None:
            if brightness < 80:
                tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
            elif brightness > 200:
                tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."

        # Execute using panel_analysis skill
        skill = registry.get("panel_analysis")
        raw_text = await skill.execute(model=target_model, image_bytes=img_buffer, tone_hint=tone_hint)
        
        analysis = validate_analysis(json.loads(raw_text))
        elapsed = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "analysis": analysis,
            "source": "gemini",
            "model": target_model,
            "latencyMs": elapsed
        }

    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"[Analyze] AI generate failed: {e} ({elapsed}ms). Using fallback.")
        return {"success": False, "error": f"AI generation failed: {e}", "analysis": DEFAULT_ANALYSIS, "source": "fallback:ai_error"}


@router.post("/analyze-batch", summary="Batch analysis of multiple storyboard panels (max 20)")
async def analyze_batch(body: AnalyzeBatchRequest):
    start_time = time.time()
    
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    if len(body.urls) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 panels per batch request.")

    logger.info(f"[Batch Analyze] Starting {len(body.urls)} panels. Concurrency=4")
    
    target_model = body.model or MODEL_FALLBACKS[0]
    if not target_model.lower().startswith("gemini"):
        target_model = MODEL_FALLBACKS[0]
    elif "gemini-3.5" in target_model.lower():
        target_model = "gemini-2.5-flash"

    semaphore = asyncio.Semaphore(4)
    results = []
    
    async def process_one(url: str, index: int):
        async with semaphore:
            try:
                resolved = await img_utils.resolve_image_to_buffer(url)
                img_buffer = resolved["data"]
                
                brightness = None
                try:
                    brightness = img_utils.compute_brightness(img_buffer)
                except Exception:
                    pass
                
                tone_hint = ""
                if brightness is not None:
                    if brightness < 80:
                        tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
                    elif brightness > 200:
                        tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."

                skill = registry.get("panel_analysis")
                raw_text = await skill.execute(model=target_model, image_bytes=img_buffer, tone_hint=tone_hint)
                analysis = validate_analysis(json.loads(raw_text))
                
                results.append({"url": url, "analysis": analysis})
                
            except Exception as e:
                logger.warning(f"[Batch] Failed {url[:50]}: {e}")
                results.append({"url": url, "analysis": DEFAULT_ANALYSIS, "error": str(e)})

    tasks = [process_one(url, idx) for idx, url in enumerate(body.urls)]
    await asyncio.gather(*tasks)
    
    elapsed = int((time.time() - start_time) * 1000)
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
                target_model = body.model or "gemini-2.5-flash"
                if "gemini-3.5" in target_model.lower():
                    target_model = "gemini-2.5-flash"
                logger.info(f"[AI Smart Crop API] Using Gemini model: {target_model}")
                
                try:
                    skill = registry.get("smart_crop")
                    raw_text = await skill.execute(model=target_model, image_bytes=image_buffer)
                    data = json.loads(raw_text)
                    raw_panels = data.get("panels", [])
                    
                    margins_panels = []
                    for box in raw_panels:
                        y1 = max(0.0, min(100.0, float(box.get("cropTop", 0))))
                        y2 = max(0.0, min(100.0, float(box.get("cropBottom", 0))))
                        x1 = max(0.0, min(100.0, float(box.get("cropLeft", 0))))
                        x2 = max(0.0, min(100.0, float(box.get("cropRight", 0))))
                        
                        if y1 > y2: y1, y2 = y2, y1
                        if x1 > x2: x1, x2 = x2, x1
                            
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
                ai_failed = True
                ai_error_msg = "Gemini client not initialized"

        if body.strategy != "local-cv" and body.model != "local-cv" and ai_failed:
            raise HTTPException(status_code=500, detail=f"AI smart crop failed: {ai_error_msg}")

        # Strategy 2: Local CV panel detection (Pillow/OpenCV)
        if body.strategy == "local-cv" or body.model == "local-cv":
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(image_buffer)
                temp_in_path = tmp_in.name
                
            try:
                min_area_pct = body.minAreaPct if body.minAreaPct is not None else 0.15
                if min_area_pct > 1.0:
                    min_area_pct = min_area_pct / 100.0

                coord_panels = await asyncio.to_thread(
                    run_cv_detection,
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


# ─── New Dynamic AI Skills Endpoints ──────────────────────────────────────────

async def run_md_skill(skill_name: str, model: str, **kwargs) -> Dict[str, Any]:
    try:
        skill = registry.get(skill_name)
        raw_text = await skill.execute(model=model, **kwargs)
        return {"success": True, "result": json.loads(raw_text)}
    except Exception as e:
        logger.error(f"Endpoint skill execution failed for '{skill_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/dramatize")
async def dramatize_script(body: DramatizeRequest):
    return await run_md_skill("script_dramatization", body.model, raw_ocr_text=body.raw_ocr_text, genre=body.genre, scene_context=body.scene_context)

@router.post("/skills/sfx-audio")
async def get_sfx_audio(body: SFXAudioRequest):
    return await run_md_skill("sfx_audio_prompt", body.model, visual_description=body.visual_description, sfx_tag=body.sfx_tag)

@router.post("/skills/thumbnail")
async def get_thumbnail_concept(body: ThumbnailRequest):
    return await run_md_skill("thumbnail_concept", body.model, title=body.title, genre=body.genre, plot_point=body.plot_point)

@router.post("/skills/translate")
async def translate_script(body: TranslationRequest):
    return await run_md_skill("translation", body.model, text=body.text, target_lang=body.target_lang)

@router.post("/skills/seo")
async def get_seo_metadata(body: SEORequest):
    return await run_md_skill("video_seo_metadata", body.model, title=body.title, genre=body.genre, storyboard_summary=body.storyboard_summary)

@router.post("/skills/voice-cast")
async def get_voice_cast(body: VoiceCastingRequest):
    return await run_md_skill("voice_casting", body.model, character_name=body.character_name, dialogue_sample=body.dialogue_sample, visual_description=body.visual_description)

@router.post("/skills/thumbnail-layout")
async def get_thumbnail_layout(body: ThumbnailLayoutRequest):
    return await run_md_skill("thumbnail_layout", body.model, thumbnail_concept=body.thumbnail_concept, main_character=body.main_character)

@router.post("/skills/intro-hook")
async def get_intro_hook(body: SeriesIntroHookRequest):
    return await run_md_skill("series_intro_hook", body.model, title=body.title, premise_summary=body.premise_summary, genre=body.genre)

@router.post("/skills/character-bio")
async def get_character_bio(body: CharacterBioRequest):
    return await run_md_skill("character_bio_profiler", body.model, dialogue=body.dialogue)

@router.post("/skills/pacing")
async def get_pacing(body: NarrativePacingRequest):
    return await run_md_skill("narrative_pace_controller", body.model, visual_description=body.visual_description, speech_text=body.speech_text, sfx=body.sfx)

@router.post("/skills/comment-reply")
async def get_comment_reply(body: CommentReplyRequest):
    return await run_md_skill("youtube_comment_coach", body.model, user_comment=body.user_comment, video_title=body.video_title)

@router.post("/skills/bgm-vibe")
async def get_bgm_vibe(body: BGMVibeRequest):
    return await run_md_skill("bgm_vibe_selector", body.model, narrative_mood=body.narrative_mood, action_scale=body.action_scale)

@router.post("/skills/shorts-script")
async def get_shorts_script(body: ShortsScriptRequest):
    return await run_md_skill("shorts_script_adapter", body.model, storyboard_summary=body.storyboard_summary)

@router.post("/skills/cliffhanger")
async def get_cliffhanger(body: CliffhangerRequest):
    return await run_md_skill("cliffhanger_generator", body.model, story_outline=body.story_outline)

@router.post("/skills/title-ab")
async def get_title_ab(body: TitleABRequest):
    return await run_md_skill("title_ab_tester", body.model, title=body.title, key_climax_event=body.key_climax_event)

@router.post("/skills/sfx-mix")
async def get_sfx_mix(body: SFXOverlayRequest):
    return await run_md_skill("sfx_overlay_scheduler", body.model, visual_description=body.visual_description, speech_text=body.speech_text, sfx=body.sfx)

@router.post("/skills/camera-shake")
async def get_camera_shake(body: CameraShakeRequest):
    return await run_md_skill("camera_shake_dynamics", body.model, visual_description=body.visual_description, sfx=body.sfx)

@router.post("/skills/scene-composition")
async def get_scene_composition(body: SceneCompositionRequest):
    return await run_md_skill("scene_composition_desc", body.model, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/subtitle-styler")
async def get_subtitle_styler(body: SubtitleStylerRequest):
    return await run_md_skill("subtitle_styler", body.model, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/chapters")
async def get_chapters(body: YouTubeChapterRequest):
    return await run_md_skill("youtube_chapter_gen", body.model, compiled_script=body.compiled_script)

@router.post("/skills/midrolls")
async def get_midrolls(body: MidrollPlacementRequest):
    return await run_md_skill("midroll_placement_ref", body.model, compiled_script=body.compiled_script, max_ads=body.max_ads)

@router.post("/skills/shorts-hook")
async def get_shorts_hook(body: ShortsHookRequest):
    return await run_md_skill("shorts_retention_hook", body.model, title=body.title, key_event=body.key_event)

@router.post("/skills/emotion")
async def get_emotion(body: CharacterEmotionRequest):
    return await run_md_skill("character_emotion_class", body.model, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/transition-speed")
async def get_transition_speed(body: TransitionSpeedRequest):
    return await run_md_skill("transition_speed_tuner", body.model, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/thumbnail-visual")
async def get_thumbnail_visual(body: ThumbnailVisualRequest):
    return await run_md_skill("thumbnail_visual_comp", body.model, thumbnail_concept=body.thumbnail_concept)

@router.post("/skills/outro-cta")
async def get_outro_cta(body: OutroCTARequest):
    return await run_md_skill("outro_cta_generator", body.model, title=body.title, ending_cliffhanger=body.ending_cliffhanger)

@router.post("/skills/copyright-scrub")
async def get_copyright_scrub(body: CopyrightScrubRequest):
    return await run_md_skill("copyright_scrubber", body.model, text=body.text)
