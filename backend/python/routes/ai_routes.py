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
from fastapi import APIRouter, Header, HTTPException, HTTPException, Body, Depends, Request
from pydantic import BaseModel, Field
from PIL import Image
from routes.auth_routes import get_current_user
from database.db import write_audit_log

import utils.image_utils as img_utils
from utils.cache import stitched_cache, edit_history
from config.clients import ai_initialized, call_gemini_with_retry, genai_client
from services.detect_panels import run_cv_detection, adjust_to_aspect_ratio
from services.audio import generate_panel_audio


# AI Skills registry and models imports
from skills.registry import registry
from skills.base import GeminiAnalysisModel, CropBox, CropList

logger = logging.getLogger("sonikoma.routes.ai_routes")
def get_all_user_keys(
    x_user_gemini_key: str = Header(None),
    x_user_openai_key: str = Header(None),
    x_user_anthropic_key: str = Header(None),
    x_user_huggingface_key: str = Header(None),
):
    return {
        "gemini": x_user_gemini_key,
        "openai": x_user_openai_key,
        "anthropic": x_user_anthropic_key,
        "huggingface": x_user_huggingface_key,
    }

def get_user_gemini_key(x_user_gemini_key: str = Header(None)):
    if not x_user_gemini_key:
        raise HTTPException(
            status_code=401, 
            detail="MISSING_API_KEY"
        )
    return x_user_gemini_key

router = APIRouter()

# ─── Constants ───────────────────────────────────────────────────────────────
VALID_MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']
MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
DEFAULT_ANALYSIS = {
    "speech_text":         "Narrative caption for this storyboard panel scene.",
    "sfx":                 "[Dramatic Beat]",
    "duration":            0.0,
    "motion_type":         "zoom_in",
    "visual_description":  "A cropped illustration frame ready for cinematic playback.",
}



# ─── Pydantic Schemas for Requests ───────────────────────────────────────────

class AnalyzeImageRequest(BaseModel):
    url: str
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube recap, 'short' = quick subtitles
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeBatchRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube recap, 'short' = quick subtitles
    voice: Optional[str] = "en-US-GuyNeural"

class AnalyzeSequenceRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"


class ListModelsRequest(BaseModel):
    apiKey: Optional[str] = None
    provider: Optional[str] = "gemini"

class TestModelLatencyRequest(BaseModel):
    provider: str
    model: str
    apiKey: Optional[str] = None
    prompt: Optional[str] = "Say: Connection Successful!"

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
    autoSplit: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None

class SmartCropBatchRequest(BaseModel):
    urls: List[str]
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
    autoSplit: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None

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

class CopyrightScrubBatchRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = "gemini-2.5-flash"


# ─── Helpers ─────────────────────────────────────────────────────────────────

def estimate_duration_from_speech(speech: str) -> float:
    if not speech or not speech.strip():
        return 0.0
    words = len(speech.strip().split())
    # Estimate speaking rate: 2.2 words per second plus 0.8 seconds safety padding
    estimated = (words / 2.2) + 0.8
    return round(estimated, 1)


def validate_analysis(raw: Dict[str, Any]) -> Dict[str, Any]:
    speech = raw.get("speech_text", "")
    sfx = raw.get("sfx", "")
    vis = raw.get("visual_description", "")
    motion = raw.get("motion_type", "")
    
    # 1. Get raw suggested duration from AI, defaulting to 4.5
    raw_duration = raw.get("duration")
    try:
        suggested_duration = float(raw_duration) if raw_duration is not None else 4.5
    except (ValueError, TypeError):
        suggested_duration = 4.5
        
    # Clamp suggested duration between 2.0 and 45.0 seconds
    suggested_duration = max(2.0, min(45.0, suggested_duration))
        
    # 2. Extract and sanitize speech text (limit increased to 800 characters)
    speech_val = speech.strip()[:800] if isinstance(speech, str) and speech.strip() else ""
    
    # 3. Respect AI's suggested duration or dynamically align with speech voice track length
    speech_duration = estimate_duration_from_speech(speech_val)
    final_duration = max(suggested_duration, speech_duration)
    final_duration = max(2.0, min(45.0, round(final_duration, 1)))
    
    return {
        "speech_text": speech_val if speech_val else DEFAULT_ANALYSIS["speech_text"],
        "sfx": sfx.strip()[:50] if isinstance(sfx, str) and sfx.strip() else DEFAULT_ANALYSIS["sfx"],
        "duration": final_duration,
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


def resize_and_pad_pil(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Resizes PIL image to fit within target_w x target_h preserving aspect ratio,
    padding the rest with the dominant border color.
    """
    import numpy as np
    w, h = img.size
    
    # Sample edges to detect background color
    edge_pixels = []
    # Sample top/bottom edges
    for x in range(0, w, max(1, w // 20)):
        edge_pixels.append(img.getpixel((x, 0)))
        edge_pixels.append(img.getpixel((x, h - 1)))
    # Sample left/right edges
    for y in range(0, h, max(1, h // 20)):
        edge_pixels.append(img.getpixel((0, y)))
        edge_pixels.append(img.getpixel((w - 1, y)))
        
    try:
        first_pixel = edge_pixels[0]
        if isinstance(first_pixel, (list, tuple)):
            # RGB/RGBA
            r = int(np.median([p[0] for p in edge_pixels]))
            g = int(np.median([p[1] for p in edge_pixels]))
            b = int(np.median([p[2] for p in edge_pixels]))
            if len(first_pixel) > 3:
                a = int(np.median([p[3] for p in edge_pixels]))
                pad_color = (r, g, b, a)
            else:
                pad_color = (r, g, b)
        else:
            # L / single value channel
            pad_color = int(np.median(edge_pixels))
    except Exception:
        pad_color = (255, 255, 255) if img.mode in ("RGB", "RGBA") else 255

    # Determine resampling filter based on Pillow version
    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        try:
            resample_filter = Image.LANCZOS
        except AttributeError:
            resample_filter = Image.BICUBIC

    # Calculate scale factor
    scale_w = target_w / w
    scale_h = target_h / h
    scale = min(scale_w, scale_h)
    
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    
    resized = img.resize((new_w, new_h), resample_filter)
    
    # Create target canvas filled with pad_color
    canvas = Image.new(img.mode, (target_w, target_h), pad_color)
    
    # Centered paste
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    canvas.paste(resized, (x_offset, y_offset))
    return canvas


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/list-models", summary="List available Gemini/HuggingFace models and token limits for any API key")
@router.get("/list-models", summary="List available Gemini/HuggingFace models and token limits using server config key")
async def api_list_models(body: Optional[ListModelsRequest] = None, user_keys: dict = Depends(get_all_user_keys)):
    try:
        api_key = None
        provider = "gemini"
        
        if body:
            api_key = body.apiKey
            provider = body.provider or "gemini"
            
        # Detect key format to guess provider
        if api_key:
            import re
            api_key = re.sub(r'^[\s\'"()\[\]{}]+|[\s\'"()\[\]{}]+$', '', api_key)
            if api_key.startswith("hf_") or (api_key.startswith("f_") and len(api_key) >= 30):
                provider = "huggingface"
                if api_key.startswith("f_") and len(api_key) >= 30:
                    api_key = "h" + api_key
            elif api_key.startswith("sk-ant-"):
                provider = "anthropic"
            elif api_key.startswith("sk-"):
                provider = "openai"
        else:
            # Fallback to headers
            api_key = user_keys.get(provider)
            # Fallback to server config keys
            if not api_key:
                if provider == "huggingface":
                    api_key = os.getenv("HUGGINGFACE_API_KEY")
                elif provider == "openai":
                    api_key = os.getenv("OPENAI_API_KEY")
                elif provider == "anthropic":
                    api_key = os.getenv("ANTHROPIC_API_KEY")
                else:
                    api_key = os.getenv("GEMINI_API_KEY")

                
        if not api_key:
            return {
                "success": False,
                "error": f"No API key was provided and no fallback key is configured for {provider}."
            }
            
        if provider == "gemini":
            from google import genai
            result_list = []
            try:
                client = genai.Client(api_key=api_key)
                models_iterator = client.models.list()
                models = list(models_iterator)
                
                for m in models:
                    raw_name = m.name or ""
                    clean_name = raw_name.replace("models/", "")
                    
                    result_list.append({
                        "name": clean_name,
                        "fullName": raw_name,
                        "displayName": m.display_name or "",
                        "description": m.description or "",
                        "inputTokenLimit": getattr(m, "input_token_limit", None),
                        "outputTokenLimit": getattr(m, "output_token_limit", None),
                        "supportedActions": getattr(m, "supported_actions", [])
                    })
            except Exception as gemini_err:
                logger.error(f"Failed to fetch dynamic Gemini models: {gemini_err}")
                return {
                    "success": False,
                    "error": f"Failed to fetch Gemini models: {str(gemini_err)}"
                }
                
            return {
                "success": True,
                "provider": "gemini",
                "total": len(result_list),
                "models": result_list
            }
            
        elif provider == "huggingface":
            import requests
            headers = {"Authorization": f"Bearer {api_key}"}
            auth_res = requests.get("https://huggingface.co/api/whoami-v2", headers=headers)
            if auth_res.status_code != 200:
                return {
                    "success": False,
                    "error": f"Hugging Face Authorization Failed: {auth_res.text}"
                }
                
            params = {"limit": 60, "sort": "downloads", "direction": -1}
            models_res = requests.get("https://huggingface.co/api/models", params=params, headers=headers)
            if models_res.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to fetch models from Hugging Face Hub: {models_res.text}"
                }
                
            models = models_res.json()
            result_list = []
            for m in models:
                result_list.append({
                    "name": m.get("id", ""),
                    "fullName": m.get("id", ""),
                    "displayName": m.get("id", ""),
                    "description": f"Hugging Face repository model. Library: {m.get('library_name','N/A')}. Tags: {', '.join(m.get('tags', [])[:8])}",
                    "inputTokenLimit": None,
                    "outputTokenLimit": None,
                    "supportedActions": [m.get("pipeline_tag")] if m.get("pipeline_tag") else []
                })
                
            return {
                "success": True,
                "provider": "huggingface",
                "total": len(result_list),
                "models": result_list
            }

        elif provider == "openai":
            import requests
            headers = {"Authorization": f"Bearer {api_key}"}
            models_res = requests.get("https://api.openai.com/v1/models", headers=headers)
            if models_res.status_code != 200:
                return {
                    "success": False,
                    "error": f"OpenAI Authorization Failed: {models_res.text}"
                }
            models = models_res.json().get("data", [])
            result_list = []
            for m in models:
                model_id = m.get("id", "")
                result_list.append({
                    "name": model_id,
                    "fullName": model_id,
                    "displayName": model_id,
                    "description": f"OpenAI model owned by {m.get('owned_by', 'N/A')}.",
                    "inputTokenLimit": None,
                    "outputTokenLimit": None,
                    "supportedActions": ["chat"] if "gpt" in model_id or "o1" in model_id else []
                })
            return {
                "success": True,
                "provider": "openai",
                "total": len(result_list),
                "models": result_list
            }

        elif provider == "anthropic":
            import requests
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            }
            models_res = requests.get("https://api.anthropic.com/v1/models", headers=headers)
            if models_res.status_code != 200:
                return {
                    "success": False,
                    "error": f"Anthropic Authorization Failed: {models_res.text}"
                }
            models = models_res.json().get("data", [])
            result_list = []
            for m in models:
                model_id = m.get("id", "")
                result_list.append({
                    "name": model_id,
                    "fullName": model_id,
                    "displayName": m.get("display_name") or model_id,
                    "description": f"Anthropic model created at {m.get('created_at', 'N/A')}.",
                    "inputTokenLimit": None,
                    "outputTokenLimit": None,
                    "supportedActions": ["chat"]
                })
            return {
                "success": True,
                "provider": "anthropic",
                "total": len(result_list),
                "models": result_list
            }
            
    except Exception as e:
        if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
            raise HTTPException(status_code=401, detail="Your API key is invalid.")
        logger.error(f"[ListModels] API call failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/analyze-image", summary="Generate narration script and SFX for a single panel")
async def analyze_image(body: AnalyzeImageRequest, user_api_key: str = Depends(get_user_gemini_key)):
    start_time = time.time()
    logger.info(f"[Model] Received analysis request for model: {body.model}")
    
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
        if "pro" in target_model.lower():
            target_model = "gemini-2.5-pro"
        else:
            target_model = "gemini-2.5-flash"
        logger.info(f"[analyze_image] Translated gemini-3.5 model selection to: {target_model}")
    
    try:
        tone_hint = ""
        if brightness is not None:
            if brightness < 80:
                tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
            elif brightness > 200:
                tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."

        # Map narration style to a hint for the AI skill
        narration_style = (body.narrationStyle or "long").lower()
        if narration_style == "short":
            narrative_length_hint = "max 25 words, impactful and dramatic for quick subtitles."
        else:
            narrative_length_hint = "30-65 words, highly engaging and detailed for YouTube story narration, describing what the characters do, think, or speak."

        # Execute using panel_analysis skill
        skill = registry.get("panel_analysis")
        logger.info(f"[Model] Executing 'panel_analysis' skill using {target_model} (narration_style={narration_style})...")
        raw_text = await skill.execute(model=target_model, image_bytes=img_buffer, api_key=user_api_key, tone_hint=tone_hint, narrative_length_hint=narrative_length_hint)
        
        analysis = validate_analysis(json.loads(raw_text))
        logger.info(f"[Model] Analysis completed for panel.")
        
        # Generate and cache panel TTS audio
        audio_url = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                temp_audio_path = tmp_audio.name
            
            voice_code = body.voice or "en-US-GuyNeural"
            logger.info(f"[analyze_image] Pre-generating audio: speech_text='{analysis['speech_text'][:40]}...', duration={analysis['duration']}s, voice={voice_code}")
            
            await generate_panel_audio(
                dialogue_list=[analysis["speech_text"]],
                target_duration=analysis["duration"],
                output_path=temp_audio_path,
                voice=voice_code
            )
            
            if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
                with open(temp_audio_path, "rb") as f:
                    audio_bytes = f.read()
                
                import uuid
                unique_audio_id = f"audio_{uuid.uuid4().hex[:8]}"
                stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
                audio_url = f"/api/image/cached/{unique_audio_id}"
                logger.info(f"[analyze_image] Successfully pre-generated panel audio. Cached as: {audio_url}")
            
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
        except Exception as audio_err:
            logger.error(f"[analyze_image] Failed to pre-generate panel audio: {audio_err}", exc_info=True)
            
        elapsed = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "analysis": analysis,
            "audio_url": audio_url,
            "source": "gemini",
            "model": target_model,
            "latencyMs": elapsed,
            "inputTokens": getattr(skill, "last_input_tokens", 0),
            "outputTokens": getattr(skill, "last_output_tokens", 0)
        }

    except Exception as e:
        if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
            raise HTTPException(status_code=401, detail="Your API key is invalid.")
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"[Analyze] AI generate failed: {e} ({elapsed}ms). Using fallback.")
        return {"success": False, "error": f"AI generation failed: {e}", "analysis": DEFAULT_ANALYSIS, "source": "fallback:ai_error"}


@router.post("/analyze-batch", summary="Batch analysis of multiple storyboard panels (max 20)")
async def analyze_batch(body: AnalyzeBatchRequest, user_api_key: str = Depends(get_user_gemini_key)):
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
        if "pro" in target_model.lower():
            target_model = "gemini-2.5-pro"
        else:
            target_model = "gemini-2.5-flash"
        logger.info(f"[analyze_batch] Translated gemini-3.5 model selection to: {target_model}")

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

                narration_style = (body.narrationStyle or "long").lower()
                if narration_style == "short":
                    narrative_length_hint = "max 25 words, impactful and dramatic for quick subtitles."
                else:
                    narrative_length_hint = "30-65 words, highly engaging and detailed for YouTube story narration, describing what the characters do, think, or speak."

                skill = registry.get("panel_analysis")
                raw_text = await skill.execute(model=target_model, image_bytes=img_buffer, api_key=user_api_key, tone_hint=tone_hint, narrative_length_hint=narrative_length_hint)
                analysis = validate_analysis(json.loads(raw_text))
                
                audio_url = None
                try:
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                        temp_audio_path = tmp_audio.name
                    
                    voice_code = body.voice or "en-US-GuyNeural"
                    await generate_panel_audio(
                        dialogue_list=[analysis["speech_text"]],
                        target_duration=analysis["duration"],
                        output_path=temp_audio_path,
                        voice=voice_code
                    )
                    
                    if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
                        with open(temp_audio_path, "rb") as f:
                            audio_bytes = f.read()
                        import uuid
                        unique_audio_id = f"audio_{uuid.uuid4().hex[:8]}"
                        stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
                        audio_url = f"/api/image/cached/{unique_audio_id}"
                    
                    if os.path.exists(temp_audio_path):
                        os.remove(temp_audio_path)
                except Exception as audio_err:
                    logger.error(f"[analyze_batch] Failed to pre-generate audio for {url[:50]}: {audio_err}")

                results.append({
                    "url": url,
                    "analysis": analysis,
                    "audio_url": audio_url,
                    "inputTokens": getattr(skill, "last_input_tokens", 0),
                    "outputTokens": getattr(skill, "last_output_tokens", 0)
                })
                
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

@router.post("/analyze-sequence", summary="Analyze multiple panels together for context-aware narrative")
async def analyze_sequence(body: AnalyzeSequenceRequest, user_api_key: str = Depends(get_user_gemini_key)):
    start_time = time.time()
    logger.info(f"[Sequence] Received sequence analysis for {len(body.urls)} panels.")
    
    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty")
        
    target_model = body.model or MODEL_FALLBACKS[0]
    
    # 1. Resolve all images into memory
    image_parts = []
    for url in body.urls:
        try:
            res = await img_utils.resolve_image_to_buffer(url)
            image_parts.append({
                "mime_type": res.get("contentType", "image/jpeg"),
                "data": res["data"]
            })
        except Exception as e:
            logger.warning(f"[Sequence] Failed to load image {url}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to load image: {url}")

    # 2. Ask Gemini to look at ALL images together
    try:
        from google import genai
        from google.genai import types
        
        # Use existing configured API key
        client = genai.Client(api_key=user_api_key)
        
        style_hint = "max 25 words per panel, impactful" if body.narrationStyle == "short" else "detailed YouTube story narration describing actions and dialogue"
        
        system_instruction = f"""
        You are an expert manga/comic storyboard narrator. You are receiving a sequence of {len(image_parts)} consecutive images from a single scene.
        Analyze them TOGETHER to understand the story flow, context, and character actions.
        
        Provide cohesive dialogue, SFX, and visual descriptions. The style should be: {style_hint}.
        
        You MUST return ONLY a JSON array of objects, with exactly {len(image_parts)} items (one for each image in order).
        Each object must have:
        - "speech_text" (string)
        - "sfx" (string)
        - "duration" (float, estimated reading time in seconds)
        - "motion_type" (string, one of: zoom_in, zoom_out, pan_left, pan_right, pan_up, pan_down)
        - "visual_description" (string)
        """
        
        contents = [system_instruction]
        for img in image_parts:
            contents.append(types.Part.from_bytes(data=img["data"], mime_type=img["mime_type"]))
            
        response = client.models.generate_content(
            model=target_model,
            contents=contents,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        sequence_data = json.loads(response.text)
        
        if len(sequence_data) != len(body.urls):
            logger.warning(f"[Sequence] AI returned {len(sequence_data)} items, expected {len(body.urls)}")
        
        # 3. Process the context-aware script and generate audio files
        results = []
        for i, panel_data in enumerate(sequence_data):
            if i >= len(body.urls): break
            
            analysis = validate_analysis(panel_data)
            audio_url = None
            
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                    temp_audio_path = tmp_audio.name
                
                await generate_panel_audio(
                    dialogue_list=[analysis["speech_text"]],
                    target_duration=analysis["duration"],
                    output_path=temp_audio_path,
                    voice=body.voice or "en-US-GuyNeural"
                )
                
                if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
                    with open(temp_audio_path, "rb") as f:
                        audio_bytes = f.read()
                    import uuid
                    unique_audio_id = f"audio_{uuid.uuid4().hex[:8]}"
                    stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
                    audio_url = f"/api/image/cached/{unique_audio_id}"
                
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
            except Exception as audio_err:
                logger.error(f"[Sequence] Audio gen failed for panel {i}: {audio_err}")
                
            results.append({
                "url": body.urls[i],
                "analysis": analysis,
                "audio_url": audio_url
            })
            
        elapsed = int((time.time() - start_time) * 1000)
        return {
            "success": True,
            "results": results,
            "latencyMs": elapsed
        }

    except Exception as e:
        if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
            raise HTTPException(status_code=401, detail="Your API key is invalid.")
        logger.error(f"[Sequence] Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-smart-crop", summary="Crop panels automatically using local CV or Gemini")
@router.post("/detect-panels")
@router.post("/ai-detect-panels")
async def ai_smart_crop(body: SmartCropRequest):
    logger.info(f"[AI Smart Crop] Request received. Strategy: {body.strategy}, Model: {body.model}")
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
                    if "pro" in target_model.lower():
                        target_model = "gemini-2.5-pro"
                    else:
                        target_model = "gemini-2.5-flash"
                    logger.info(f"[ai_smart_crop] Translated gemini-3.5 model selection to: {target_model}")
                logger.info(f"[AI Smart Crop API] Using Gemini model: {target_model}")
                
                try:
                    skill = registry.get("smart_crop")
                    logger.info(f"[AI Smart Crop] Executing Gemini-based detection...")

                    # Prepare focus mode instructions
                    focus_instr = ""
                    if body.focusMode == "tight":
                        focus_instr = "Focus Mode: Tight Illustration Cropping. Identify only illustration boxes, strictly excluding speech balloons/text bubbles."
                    elif body.focusMode == "cinematic":
                        focus_instr = "Focus Mode: Cinematic Widescreen. Prioritize wider horizontal crop boundaries and merge adjacent horizontal storyboard layouts when relevant."
                    elif body.focusMode == "portrait":
                        focus_instr = "Focus Mode: Close-up Portrait. Target character faces and central focal points with tighter aspect borders."
                    else:
                        focus_instr = "Focus Mode: Standard Panel Detection. Detect standard panel boundaries layout."

                    # Combine focus mode with custom user instructions
                    final_guidance = focus_instr
                    if body.guidanceInstructions:
                        final_guidance += f"\nCustom User Instructions: {body.guidanceInstructions}"

                    raw_text = await skill.execute(
                        model=target_model,
                        image_bytes=image_buffer,
                        guidance_instructions=final_guidance
                    )
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

        # Strategy 2: Local CV panel detection (Pillow/OpenCV)
        if body.strategy == "local-cv" or body.model == "local-cv" or ai_failed:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(image_buffer)
                temp_in_path = tmp_in.name
                
            try:
                min_area_pct = body.minAreaPct if body.minAreaPct is not None else 0.15
                if min_area_pct > 1.0:
                    min_area_pct = min_area_pct / 100.0

                logger.info(f"[AI Smart Crop] Executing local CV-based detection...")
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
                    close_kernel_size=body.closeKernelSize,
                    auto_split=body.autoSplit if body.autoSplit is not None else True
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
                left_px, top_px, crop_w, crop_h = adjust_to_aspect_ratio(left_px, top_px, crop_w, crop_h, w, h, body.aspectRatio)
                p_left = (left_px / w) * 100.0
                p_top = (top_px / h) * 100.0
                p_right = ((w - (left_px + crop_w)) / w) * 100.0
                p_bottom = ((h - (top_px + crop_h)) / h) * 100.0

            # Check if targetWidth and targetHeight should be resolved
            t_w = body.targetWidth
            t_h = body.targetHeight
            if not t_w or not t_h:
                if body.aspectRatio == "16:9":
                    t_w, t_h = 1920, 1080
                elif body.aspectRatio == "9:16":
                    t_w, t_h = 1080, 1920
                elif body.aspectRatio == "1:1":
                    t_w, t_h = 1080, 1080
                elif body.aspectRatio == "4:3":
                    t_w, t_h = 1440, 1080
                elif body.aspectRatio == "3:4":
                    t_w, t_h = 1080, 1440

            if crop_w > 10 and crop_h > 10:
                cropped_img = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                
                if t_w and t_h:
                    try:
                        cropped_img = resize_and_pad_pil(cropped_img, t_w, t_h)
                    except Exception as resize_err:
                        logger.error(f"[AI Smart Crop] Failed to resize/pad: {resize_err}")
                
                out = io.BytesIO()
                save_format = img.format or "JPEG"
                cropped_img.save(out, format=save_format)
                cropped_buffer = out.getvalue()
            else:
                cropped_buffer = image_buffer

            unique_id = f"merged_{int(time.time() * 1000)}_smartcrop_{i}"
            cached_url = f"/api/image/cached/{unique_id}"
            
            stitched_cache.set(unique_id, {"data": cropped_buffer, "content_type": content_type})
            edit_history.set(cached_url, body.url)

            logger.info(f"[AI Smart Crop] Cached cropped panel {i+1}/{len(coord_panels)}: {cached_url}")

            panel_res = {
                "cropTop": round(p_top, 2),
                "cropBottom": round(p_bottom, 2),
                "cropLeft": round(p_left, 2),
                "cropRight": round(p_right, 2),
                "croppedUrl": cached_url
            }
            for key in ["brightness", "contrast", "detailScore", "borderType"]:
                if key in box:
                    panel_res[key] = box[key]
            
            if t_w and t_h:
                panel_res["width"] = t_w
                panel_res["height"] = t_h
                panel_res["area"] = t_w * t_h
            else:
                panel_res["width"] = int(crop_w)
                panel_res["height"] = int(crop_h)
                panel_res["area"] = int(crop_w * crop_h)

            cropped_panels.append(panel_res)

        logger.info(f"[AI Smart Crop] Successfully processed {len(cropped_panels)} panels.")
        return {
            "success": True,
            "panels": cropped_panels,
            "fallback": ai_failed,
            "message": f"AI smart crop failed: {ai_error_msg}. Fell back to local CV." if ai_failed else ""
        }
    except Exception as e:
        if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
            raise HTTPException(status_code=401, detail="Your API key is invalid.")
        logger.error(f"[AI Smart Crop API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Smart Crop failed: {e}")

@router.post("/ai-smart-crop-batch", summary="Batch crop panels automatically using local CV or Gemini")
@router.post("/detect-panels-batch")
async def ai_smart_crop_batch(body: SmartCropBatchRequest):
    logger.info(f"[AI Smart Crop Batch] Request received for {len(body.urls)} URLs.")
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    
    results = []
    semaphore = asyncio.Semaphore(4)
    
    # We can just reuse the existing endpoint logic by calling its function manually
    async def process_one(url: str):
        async with semaphore:
            try:
                single_request = SmartCropRequest(
                    url=url,
                    model=body.model,
                    strategy=body.strategy,
                    sensitivity=body.sensitivity,
                    backgroundColorMode=body.backgroundColorMode,
                    aspectRatio=body.aspectRatio,
                    minAreaPct=body.minAreaPct,
                    mergeThreshold=body.mergeThreshold,
                    cannyLow=body.cannyLow,
                    cannyHigh=body.cannyHigh,
                    closeKernelSize=body.closeKernelSize,
                    minHeightPx=body.minHeightPx,
                    autoSplit=body.autoSplit,
                    targetWidth=body.targetWidth,
                    targetHeight=body.targetHeight,
                    guidanceInstructions=body.guidanceInstructions,
                    focusMode=body.focusMode
                )
                res = await ai_smart_crop(single_request)
                results.append({"url": url, "success": True, "data": res})
            except Exception as e:
                logger.warning(f"[Smart Crop Batch] Failed for URL {url[:50]}: {e}")
                results.append({"url": url, "success": False, "error": str(e)})

    tasks = [process_one(url) for url in body.urls]
    await asyncio.gather(*tasks)
    
    return {"success": True, "results": results}


# ─── New Dynamic AI Skills Endpoints ──────────────────────────────────────────

async def run_md_skill(skill_name: str, model: str, api_key: str = None, **kwargs) -> Dict[str, Any]:
    try:
        skill = registry.get(skill_name)
        raw_text = await skill.execute(model=model, api_key=api_key, **kwargs)
        return {
            "success": True,
            "result": json.loads(raw_text),
            "inputTokens": getattr(skill, "last_input_tokens", 0),
            "outputTokens": getattr(skill, "last_output_tokens", 0)
        }
    except Exception as e:
        if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
            raise HTTPException(status_code=401, detail="Your API key is invalid.")
        logger.error(f"Endpoint skill execution failed for '{skill_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/dramatize")
async def dramatize_script(body: DramatizeRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("script_dramatization", body.model, api_key=user_api_key, raw_ocr_text=body.raw_ocr_text, genre=body.genre, scene_context=body.scene_context)

@router.post("/skills/sfx-audio")
async def get_sfx_audio(body: SFXAudioRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("sfx_audio_prompt", body.model, api_key=user_api_key, visual_description=body.visual_description, sfx_tag=body.sfx_tag)

@router.post("/skills/thumbnail")
async def get_thumbnail_concept(body: ThumbnailRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_concept", body.model, api_key=user_api_key, title=body.title, genre=body.genre, plot_point=body.plot_point)

@router.post("/skills/translate")
async def translate_script(
    body: TranslationRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    user_api_key: str = Depends(get_user_gemini_key)
):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    write_audit_log(current_user["user_id"], "Used AI Dialogue Translation Studio", ip_addr, "Success")
    return await run_md_skill("translation", body.model, api_key=user_api_key, text=body.text, target_lang=body.target_lang)

@router.post("/skills/seo")
async def get_seo_metadata(body: SEORequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("video_seo_metadata", body.model, api_key=user_api_key, title=body.title, genre=body.genre, storyboard_summary=body.storyboard_summary)

@router.post("/skills/voice-cast")
async def get_voice_cast(body: VoiceCastingRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("voice_casting", body.model, api_key=user_api_key, character_name=body.character_name, dialogue_sample=body.dialogue_sample, visual_description=body.visual_description)

@router.post("/skills/thumbnail-layout")
async def get_thumbnail_layout(body: ThumbnailLayoutRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_layout", body.model, api_key=user_api_key, thumbnail_concept=body.thumbnail_concept, main_character=body.main_character)

@router.post("/skills/intro-hook")
async def get_intro_hook(body: SeriesIntroHookRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("series_intro_hook", body.model, api_key=user_api_key, title=body.title, premise_summary=body.premise_summary, genre=body.genre)

@router.post("/skills/character-bio")
async def get_character_bio(body: CharacterBioRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("character_bio_profiler", body.model, api_key=user_api_key, dialogue=body.dialogue)

@router.post("/skills/pacing")
async def get_pacing(body: NarrativePacingRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("narrative_pace_controller", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text, sfx=body.sfx)

@router.post("/skills/comment-reply")
async def get_comment_reply(body: CommentReplyRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("youtube_comment_coach", body.model, api_key=user_api_key, user_comment=body.user_comment, video_title=body.video_title)

@router.post("/skills/bgm-vibe")
async def get_bgm_vibe(body: BGMVibeRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("bgm_vibe_selector", body.model, api_key=user_api_key, narrative_mood=body.narrative_mood, action_scale=body.action_scale)

@router.post("/skills/shorts-script")
async def get_shorts_script(body: ShortsScriptRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("shorts_script_adapter", body.model, api_key=user_api_key, storyboard_summary=body.storyboard_summary)

@router.post("/skills/cliffhanger")
async def get_cliffhanger(body: CliffhangerRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("cliffhanger_generator", body.model, api_key=user_api_key, story_outline=body.story_outline)

@router.post("/skills/title-ab")
async def get_title_ab(body: TitleABRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("title_ab_tester", body.model, api_key=user_api_key, title=body.title, key_climax_event=body.key_climax_event)

@router.post("/skills/sfx-mix")
async def get_sfx_mix(body: SFXOverlayRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("sfx_overlay_scheduler", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text, sfx=body.sfx)

@router.post("/skills/camera-shake")
async def get_camera_shake(body: CameraShakeRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("camera_shake_dynamics", body.model, api_key=user_api_key, visual_description=body.visual_description, sfx=body.sfx)

@router.post("/skills/scene-composition")
async def get_scene_composition(body: SceneCompositionRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("scene_composition_desc", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/subtitle-styler")
async def get_subtitle_styler(body: SubtitleStylerRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("subtitle_styler", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/chapters")
async def get_chapters(body: YouTubeChapterRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("youtube_chapter_gen", body.model, api_key=user_api_key, compiled_script=body.compiled_script)

@router.post("/skills/midrolls")
async def get_midrolls(body: MidrollPlacementRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("midroll_placement_ref", body.model, api_key=user_api_key, compiled_script=body.compiled_script, max_ads=body.max_ads)

@router.post("/skills/shorts-hook")
async def get_shorts_hook(body: ShortsHookRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("shorts_retention_hook", body.model, api_key=user_api_key, title=body.title, key_event=body.key_event)

@router.post("/skills/emotion")
async def get_emotion(body: CharacterEmotionRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("character_emotion_class", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/transition-speed")
async def get_transition_speed(body: TransitionSpeedRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("transition_speed_tuner", body.model, api_key=user_api_key, visual_description=body.visual_description, speech_text=body.speech_text)

@router.post("/skills/thumbnail-visual")
async def get_thumbnail_visual(body: ThumbnailVisualRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_visual_comp", body.model, api_key=user_api_key, thumbnail_concept=body.thumbnail_concept)

@router.post("/skills/outro-cta")
async def get_outro_cta(body: OutroCTARequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("outro_cta_generator", body.model, api_key=user_api_key, title=body.title, ending_cliffhanger=body.ending_cliffhanger)

@router.post("/skills/copyright-scrub")
async def get_copyright_scrub(body: CopyrightScrubRequest, user_api_key: str = Depends(get_user_gemini_key)):
    return await run_md_skill("copyright_scrubber", body.model, api_key=user_api_key, text=body.text)

@router.post("/skills/copyright-scrub-batch")
async def get_copyright_scrub_batch(
    body: CopyrightScrubBatchRequest,
    user_api_key: str = Depends(get_user_gemini_key)
):
    logger.info(f"[Copyright Scrub Batch] Request received for {len(body.texts)} items.")
    if not body.texts:
        raise HTTPException(status_code=400, detail="Field 'texts' must be a non-empty list.")
    
    results = []
    semaphore = asyncio.Semaphore(4)
    
    async def process_one(text: str):
        async with semaphore:
            try:
                res = await run_md_skill("copyright_scrubber", body.model, api_key=user_api_key, text=text)
                results.append({"text": text, "success": True, "data": res})
            except Exception as e:
                if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():
                    raise HTTPException(status_code=401, detail="Your API key is invalid.")
                logger.warning(f"[Copyright Scrub Batch] Failed for text: {text[:50]}... Error: {e}")
                results.append({"text": text, "success": False, "error": str(e)})

    tasks = [process_one(t) for t in body.texts]
    await asyncio.gather(*tasks)
    
    return {"success": True, "results": results}

@router.post("/test-model-latency", summary="Test latency and quota for any model of any provider")
async def test_model_latency(body: TestModelLatencyRequest, user_keys: dict = Depends(get_all_user_keys)):
    import time
    import requests
    
    provider = body.provider.lower()
    model_id = body.model
    api_key = body.apiKey
    prompt = body.prompt or "Say: Connection Successful!"
    
    # Detect / clean api key override
    if api_key:
        import re
        api_key = re.sub(r'^[\s\'"()\[\]{}]+|[\s\'"()\[\]{}]+$', '', api_key)
    else:
        # Fallback to headers
        api_key = user_keys.get(provider)
        # Fallback to env
        if not api_key:
            if provider == "huggingface":
                api_key = os.getenv("HUGGINGFACE_API_KEY")
            elif provider == "openai":
                api_key = os.getenv("OPENAI_API_KEY")
            elif provider == "anthropic":
                api_key = os.getenv("ANTHROPIC_API_KEY")
            else:
                api_key = os.getenv("GEMINI_API_KEY")

            
    if not api_key:
        return {
            "success": False,
            "error": f"Missing API Key for {provider}."
        }
        
    start_time = time.monotonic()
    try:
        if provider == "gemini":
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(model=model_id, contents=prompt)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            
            usage = getattr(response, 'usage_metadata', None)
            p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
            c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0
            
            return {
                "success": True,
                "latencyMs": latency_ms,
                "inputTokens": p_tokens,
                "outputTokens": c_tokens,
                "response": response.text or ""
            }
            
        elif provider == "huggingface":
            url = f"https://api-inference.huggingface.co/models/{model_id}"
            headers = {"Authorization": f"Bearer {api_key}"}
            r = requests.post(url, json={"inputs": prompt, "parameters": {"max_new_tokens": 50}}, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            if r.status_code == 200:
                res_data = r.json()
                reply = str(res_data)
                if isinstance(res_data, list) and len(res_data) > 0:
                    reply = res_data[0].get("generated_text", reply)
                p_tokens = max(1, len(prompt) // 4)
                c_tokens = max(1, len(reply) // 4)
                return {
                    "success": True,
                    "latencyMs": latency_ms,
                    "inputTokens": p_tokens,
                    "outputTokens": c_tokens,
                    "response": reply
                }
            else:
                return {
                    "success": False,
                    "error": f"Hugging Face Inference Error (HTTP {r.status_code}): {r.text}"
                }
                
        elif provider == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model_id,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 100
            }
            r = requests.post(url, json=payload, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1005)
            if r.status_code == 200:
                res_data = r.json()
                reply = res_data["choices"][0]["message"]["content"]
                usage = res_data.get("usage", {})
                return {
                    "success": True,
                    "latencyMs": latency_ms,
                    "inputTokens": usage.get("prompt_tokens"),
                    "outputTokens": usage.get("completion_tokens"),
                    "response": reply
                }
            else:
                return {
                    "success": False,
                    "error": f"OpenAI API Error (HTTP {r.status_code}): {r.text}"
                }
                
        elif provider == "anthropic":
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "max_tokens": 100,
                "messages": [{"role": "user", "content": prompt}]
            }
            r = requests.post(url, json=payload, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            if r.status_code == 200:
                res_data = r.json()
                reply = res_data["content"][0]["text"]
                usage = res_data.get("usage", {})
                return {
                    "success": True,
                    "latencyMs": latency_ms,
                    "inputTokens": usage.get("input_tokens"),
                    "outputTokens": usage.get("output_tokens"),
                    "response": reply
                }
            else:
                return {
                    "success": False,
                    "error": f"Anthropic API Error (HTTP {r.status_code}): {r.text}"
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
