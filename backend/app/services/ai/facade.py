"""
backend/app/services/ai/facade.py
─────────────────────────────────────────────────────────────────────────────
AI Subsystem Facade coordinating image analysis, batch processing, narratives,
smart cropping, skill executions, and multi-provider model registrations.
─────────────────────────────────────────────────────────────────────────────
"""


import uuid
import os
import io
import time
import logging
import asyncio
import tempfile
import json
from typing import List, Optional, Dict, Any
from PIL import Image

from core.config import call_gemini_with_retry
from core.settings import GEMINI_MODEL_PRIMARY, GEMINI_FALLBACK_MODELS
from services.ai.skills.registry import registry
from services.ai.skills.base import get_provider_and_model, resolve_api_key
import services.image.utils.image_utils as img_utils
from services.image.utils.panel_box_utils import PanelBounds
from core.cache import stitched_cache, edit_history
from media.audio.audio import generate_panel_audio

logger = logging.getLogger("sonikoma.services.ai.facade")

VALID_MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']


def estimate_duration_from_speech(speech: str) -> float:
    if not speech or not speech.strip():
        return 0.0
    words = len(speech.strip().split())
    estimated = (words / 2.2) + 0.8
    return round(estimated, 1)


def validate_analysis(raw: Dict[str, Any]) -> Dict[str, Any]:
    speech = raw.get("speech_text", "")
    sfx = raw.get("sfx", "")
    vis = raw.get("visual_description", "")
    motion = raw.get("motion_type", "")

    raw_duration = raw.get("duration")
    try:
        suggested_duration = float(raw_duration) if raw_duration is not None else 0.0
    except (ValueError, TypeError):
        suggested_duration = 0.0

    if suggested_duration > 0:
        suggested_duration = max(2.0, min(45.0, suggested_duration))

    speech_val = speech.strip()[:800] if isinstance(speech, str) and speech.strip() else ""
    speech_duration = estimate_duration_from_speech(speech_val)
    if suggested_duration > 0 or speech_duration > 0:
        final_duration = max(suggested_duration, speech_duration)
        final_duration = max(2.0, min(45.0, round(final_duration, 1)))
    else:
        final_duration = 0.0

    return {
        "speech_text": speech_val,
        "sfx": sfx.strip()[:50] if isinstance(sfx, str) and sfx.strip() else "",
        "duration": final_duration,
        "motion_type": motion if motion in VALID_MOTIONS else "zoom_in",
        "visual_description": vis.strip()[:400] if isinstance(vis, str) and vis.strip() else "",
    }


async def facade_list_models(provider: str, api_key: Optional[str]) -> Dict[str, Any]:
    """Exposes available models for the given provider."""
    if not api_key:
        return {"success": False, "error": f"No API key was provided for {provider}."}

    if provider == "gemini":
        from google import genai
        result_list = []
        try:
            client = genai.Client(api_key=api_key)
            models = list(client.models.list())
            for m in models:
                raw_name = m.name or ""
                clean_name = raw_name.replace("models/", "")
                lower_name = clean_name.lower()

                # Determine category
                if "imagen" in lower_name or "banana" in lower_name or "veo" in lower_name:
                    category = "Multi-modal generative models"
                elif "tts" in lower_name or "audio" in lower_name or "omni" in lower_name:
                    category = "Multi-modal generative models"
                elif "embedding" in lower_name:
                    category = "Other models"
                elif "robotics" in lower_name or "gemma" in lower_name or "grounding" in lower_name:
                    category = "Other models"
                elif "live" in lower_name:
                    category = "Live API"
                else:
                    category = "Text-out models"

                # Define default RPM / TPM / RPD quotas matching Google AI Studio tier specifications
                if "3.6-flash" in lower_name or "3.6" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "3.5-flash" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "2.5-flash" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "1.5-pro" in lower_name or "2.5-pro" in lower_name or "3.1-pro" in lower_name:
                    rpm, tpm, rpd = "2 / 5", "1M", "50 / 50"
                elif "imagen" in lower_name:
                    rpm, tpm, rpd = "0 / 25", "-", "25 / 25"
                elif "embedding" in lower_name:
                    rpm, tpm, rpd = "100 / 100", "30K", "1K / 1K"
                else:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"

                result_list.append({
                    "name": clean_name,
                    "fullName": raw_name,
                    "displayName": m.display_name or clean_name,
                    "description": m.description or "",
                    "category": category,
                    "rpm": rpm,
                    "tpm": tpm,
                    "rpd": rpd,
                    "inputTokenLimit": getattr(m, "input_token_limit", None),
                    "outputTokenLimit": getattr(m, "output_token_limit", None),
                    "supportedActions": getattr(m, "supported_actions", [])
                })
        except Exception as exc:
            logger.error(f"Failed to fetch dynamic Gemini models: {exc}")
            return {"success": False, "error": f"Failed to fetch Gemini models: {str(exc)}"}

        return {"success": True, "provider": "gemini", "total": len(result_list), "models": result_list}


    elif provider == "openai":
        import requests
        from requests.exceptions import RequestException

        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            models_res = requests.get("https://api.openai.com/v1/models", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch OpenAI models: {exc}")
            return {"success": False, "error": f"Failed to connect to OpenAI: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"OpenAI Authorization Failed: {models_res.text}", "status_code": 400}
        models = models_res.json().get("data", [])
        result_list = []
        for m in models:
            model_id = m.get("id", "")
            result_list.append({
                "name": model_id,
                "fullName": model_id,
                "displayName": model_id,
                "description": f"OpenAI model owned by {m.get('owned_by', 'N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": ["chat"] if "gpt" in model_id or "o1" in model_id else []
            })
        return {"success": True, "provider": "openai", "total": len(result_list), "models": result_list}

    elif provider == "anthropic":
        import requests
        from requests.exceptions import RequestException

        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        try:
            models_res = requests.get("https://api.anthropic.com/v1/models", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch Anthropic models: {exc}")
            return {"success": False, "error": f"Failed to connect to Anthropic: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"Anthropic Authorization Failed: {models_res.text}", "status_code": 400}
        models = models_res.json().get("data", [])
        result_list = []
        for m in models:
            model_id = m.get("id", "")
            result_list.append({
                "name": model_id,
                "fullName": model_id,
                "displayName": m.get("display_name") or model_id,
                "description": f"Anthropic model created at {m.get('created_at', 'N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": ["chat"]
            })
        return {"success": True, "provider": "anthropic", "total": len(result_list), "models": result_list}

    elif provider == "huggingface":
        import requests
        from requests.exceptions import RequestException

        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            auth_res = requests.get("https://huggingface.co/api/whoami-v2", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to authenticate with Hugging Face Hub: {exc}")
            return {"success": False, "error": f"Failed to connect to Hugging Face: {exc}", "status_code": 503}

        if auth_res.status_code != 200:
            return {"success": False, "error": f"Hugging Face Authorization Failed: {auth_res.text}", "status_code": 400}

        params = {"limit": 150, "sort": "downloads", "direction": -1}
        try:
            models_res = requests.get("https://huggingface.co/api/models", params=params, headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch Hugging Face models: {exc}")
            return {"success": False, "error": f"Failed to connect to Hugging Face: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"Failed to fetch models from Hugging Face Hub: {models_res.text}", "status_code": 400}

        models = models_res.json()
        result_list = []
        for m in models:
            pipeline_tag = m.get("pipeline_tag")
            if pipeline_tag not in ("text-generation", "text2text-generation", "conversational"):
                continue
            result_list.append({
                "name": m.get("id", ""),
                "fullName": m.get("id", ""),
                "displayName": m.get("id", ""),
                "description": f"Hugging Face repository model. Library: {m.get('library_name','N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": [pipeline_tag] if pipeline_tag else []
            })
        return {"success": True, "provider": "huggingface", "total": len(result_list), "models": result_list}

    return {"success": False, "error": f"Unsupported provider {provider}."}


async def facade_analyze_image(
    url: str,
    model: Optional[str],
    voice: Optional[str],
    narration_style: Optional[str],
    user_keys: Dict[str, str]
) -> Dict[str, Any]:
    """Generates narration script and SFX for a single panel."""
    start_time = time.time()
    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]

    brightness = None
    try:
        brightness = img_utils.compute_brightness(img_buffer)
    except Exception:
        pass

    target_model = model or GEMINI_MODEL_PRIMARY
    tone_hint = ""
    if brightness is not None:
        if brightness < 80:
            tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
        elif brightness > 200:
            tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."

    style_val = (narration_style or "long").lower()
    narrative_length_hint = (
        "max 25 words, impactful and dramatic for quick subtitles."
        if style_val == "short"
        else "30-65 words, highly engaging and detailed for YouTube story narration."
    )

    has_dialogue = True
    try:
        from services.image.ocr import extract_dialogue_from_panel
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_ocr:
            tmp_ocr.write(img_buffer)
            tmp_ocr_path = tmp_ocr.name
        ocr_dialogue = await extract_dialogue_from_panel(tmp_ocr_path, langs=['en'])
        if os.path.exists(tmp_ocr_path):
            os.remove(tmp_ocr_path)
        if not "".join(ocr_dialogue).strip():
            has_dialogue = False
    except Exception:
        pass

    skill = registry.get("panel_analysis")
    raw_text = await skill.execute(
        model=target_model,
        image_bytes=img_buffer,
        user_keys=user_keys,
        tone_hint=tone_hint,
        narrative_length_hint=narrative_length_hint
    )

    analysis = validate_analysis(json.loads(raw_text))

    if not has_dialogue:
        try:
            storyteller_skill = registry.get("panel_storyteller")
            narration = await storyteller_skill.execute(
                model=target_model,
                image_bytes=img_buffer,
                user_keys=user_keys,
                visual_scene_description=analysis.get("visual_description", ""),
                sound_effect=analysis.get("sfx", "")
            )
            analysis["speech_text"] = narration.strip().strip('"').strip("'")
        except Exception:
            pass

    audio_url = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
            temp_audio_path = tmp_audio.name

        voice_code = voice or "en-US-GuyNeural"
        _, actual_dur = await generate_panel_audio(
            dialogue_list=[analysis["speech_text"]],
            target_duration=analysis["duration"],
            output_path=temp_audio_path,
            voice=voice_code,
            force_duration=False
        )
        analysis["duration"] = actual_dur

        if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
            with open(temp_audio_path, "rb") as f:
                audio_bytes = f.read()
            unique_audio_id = f"audio_{uuid.uuid4().hex[:8]}" if 'uuid' in globals() else f"audio_{os.urandom(4).hex()}"
            stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
            audio_url = f"/api/image/cached/{unique_audio_id}"

        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
    except Exception:
        pass

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
def _crop_panels_server_side(img_buffer: bytes, panels: List[Dict[str, Any]], source_url: Optional[str] = None) -> None:
    """
    Crop each detected panel from the image buffer directly in memory (server-side).

    All panel coordinates are parsed into canonical immutable PanelBounds objects before crop execution.
    Bounds are validated against image dimensions with detailed diagnostic logging for any clamped bounds.
    """
    try:
        full_img = Image.open(io.BytesIO(img_buffer))
        if full_img.mode not in ("RGB", "RGBA"):
            full_img = full_img.convert("RGB")
        img_w, img_h = full_img.size
    except Exception as exc:
        logger.warning(f"[_crop_panels_server_side] Failed to open image buffer: {exc}")
        return

    ts = int(time.time() * 1000)
    for idx, panel in enumerate(panels):
        try:
            bounds: Optional[PanelBounds] = None

            if "x" in panel and "y" in panel and "width" in panel and "height" in panel:
                bounds = PanelBounds.from_pixels(
                    x=panel["x"], y=panel["y"], width=panel["width"], height=panel["height"], space="panel_dict"
                )
            elif "cropTop" in panel and "cropBottom" in panel and "cropLeft" in panel and "cropRight" in panel:
                c_top = float(panel.get("cropTop", 0.0))
                c_bot = float(panel.get("cropBottom", 0.0))
                c_left = float(panel.get("cropLeft", 0.0))
                c_right = float(panel.get("cropRight", 0.0))

                # Normalize whether cropBottom / cropRight are absolute Y2/X2 percentages vs bottom/right insets
                if c_bot > c_top and c_bot > 50.0:
                    bounds = PanelBounds.from_absolute_percent(c_top, c_bot, c_left, c_right, img_w, img_h, space="ai_absolute")
                else:
                    bounds = PanelBounds.from_inset_percent(c_top, c_bot, c_left, c_right, img_w, img_h, space="frontend_css")

            if bounds is None:
                continue

            # Non-silent validation & diagnostic clamping
            if not bounds.is_valid(img_w, img_h):
                clamped_bounds = bounds.clamp(img_w, img_h)
                logger.warning(
                    f"[_crop_panels_server_side] Panel #{idx+1} requested bounds "
                    f"(x={bounds.x}, y={bounds.y}, w={bounds.width}, h={bounds.height}) "
                    f"in space '{bounds.coordinate_space}' exceed canvas ({img_w}x{img_h}). "
                    f"Clamped to -> (x={clamped_bounds.x}, y={clamped_bounds.y}, w={clamped_bounds.width}, h={clamped_bounds.height})"
                )
                bounds = clamped_bounds

            if bounds.width < 5 or bounds.height < 5:
                logger.debug(f"[_crop_panels_server_side] Skipping panel #{idx+1}: bounds too small ({bounds.width}x{bounds.height})")
                continue

            cropped = full_img.crop((bounds.x, bounds.y, bounds.x2, bounds.y2))

            # Ensure RGB (no alpha) for JPEG output
            if cropped.mode == "RGBA":
                bg = Image.new("RGB", cropped.size, (255, 255, 255))
                bg.paste(cropped, mask=cropped.split()[3])
                cropped = bg
            elif cropped.mode != "RGB":
                cropped = cropped.convert("RGB")

            out = io.BytesIO()
            cropped.save(out, format="JPEG", quality=90)
            cropped_bytes = out.getvalue()

            import hashlib
            img_hash = hashlib.md5(source_url.encode()).hexdigest()[:8] if source_url else "img"
            panel_num = f"{idx + 1:02d}" if len(panels) >= 10 else f"{idx + 1}"
            geom_hash = hashlib.md5(f"{bounds.x}_{bounds.y}_{bounds.width}_{bounds.height}".encode()).hexdigest()[:8]
            cache_key = f"panel_crop_{img_hash}_{geom_hash}_{panel_num}"
            cached_url = f"/api/image/cached/{cache_key}"
            stitched_cache.set(cache_key, {"data": cropped_bytes, "content_type": "image/jpeg"})
            if source_url:
                edit_history.set(cached_url, source_url)
            panel["croppedUrl"] = cached_url

        except Exception as exc:
            logger.warning(f"[_crop_panels_server_side] Error cropping panel {idx+1}: {exc}")
            # Leave croppedUrl unset; frontend will fall back to a separate edit call

    try:
        full_img.close()
    except Exception:
        pass


async def facade_smart_crop(
    url: str,
    aspect_ratio: Optional[str] = "free",
    model: Optional[str] = None,
    user_keys: Optional[Dict[str, str]] = None,
    strategy: Optional[str] = "local-cv",
    sensitivity: float = 30.0,
    background_color_mode: str = "auto",
    min_area_pct: float = 0.15,
    merge_threshold: int = 20,
    canny_low: int = 20,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    min_height_px: int = 60,
    padding_px: int = 10,
    auto_split: bool = True,
    use_yolo: bool = True,
    guidance_instructions: Optional[str] = None,
    focus_mode: Optional[str] = None,
    job_id: Optional[str] = None
) -> Dict[str, Any]:
    """Uses LLM or local OpenCV panel detection based on strategy & configuration."""
    job_id = job_id or f"job_{uuid.uuid4().hex[:8]}"
    logger.info(f"[{job_id}] Starting facade_smart_crop for URL: {url[:60]}... (strategy={strategy})")

    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]

    with Image.open(io.BytesIO(img_buffer)) as img:
        w_img, h_img = img.size

    aspect_ratio = aspect_ratio or "free"
    user_keys = user_keys or {}
    is_tall_strip = (h_img / max(1, w_img) > 1.7)

    # 1. Directly execute local OpenCV detection if user explicitly chose local-cv strategy
    if strategy == "local-cv":
        tmp_in_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(img_buffer)
                tmp_in_path = tmp_in.name

            from services.image.detect_panels import run_cv_detection
            cv_panels = run_cv_detection(
                image_path=tmp_in_path,
                sensitivity=sensitivity,
                bg_mode=background_color_mode,
                min_width_pct=min_area_pct,
                min_height_px=min_height_px,
                merge_threshold=merge_threshold,
                aspect_ratio_str=aspect_ratio,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                auto_split=auto_split,
                padding_px=padding_px,
                use_yolo=use_yolo,
                job_id=job_id
            )
            if len(cv_panels) > 0:
                # Crop all panels server-side in one pass (image[y:y+h, x:x+w])
                # so the frontend gets croppedUrl on each panel and skips extra API calls
                await asyncio.to_thread(_crop_panels_server_side, img_buffer, cv_panels, url)
                logger.info(f"[{job_id}] Successfully returned {len(cv_panels)} detected panels.")
                return {
                    "success": True,
                    "total_panels": len(cv_panels),
                    "imageWidth": w_img,
                    "imageHeight": h_img,
                    "panels": cv_panels,
                    "provider": "opencv_webtoon" if is_tall_strip else "opencv",
                    "isTallStrip": is_tall_strip,
                    "job_id": job_id,
                }
        finally:
            if tmp_in_path and os.path.exists(tmp_in_path):
                try:
                    os.remove(tmp_in_path)
                except Exception:
                    pass

    # 2. Otherwise execute AI detection with skill (with automatic free model fallback on quota limit)
    requested_model = model or GEMINI_MODEL_PRIMARY
    fallback_models = [requested_model] + GEMINI_FALLBACK_MODELS
    models_to_try = []
    for m in fallback_models:
        if m not in models_to_try:
            models_to_try.append(m)

    panels_raw = []
    last_exc = None
    successful_model = None

    for m in models_to_try:
        try:
            skill = registry.get("smart_crop")
            raw_text = await skill.execute(
                model=m,
                image_bytes=img_buffer,
                user_keys=user_keys,
                guidance_instructions=guidance_instructions or ""
            )
            data = json.loads(raw_text)
            panels = data.get("panels", [])
            if panels:
                panels_raw = panels
                successful_model = m
                logger.info(f"[facade_smart_crop] Successfully detected panels using model: {m}")
                break
        except Exception as exc:
            last_exc = exc
            logger.warning(f"[facade_smart_crop] Gemini model '{m}' failed: {exc}. Trying next free model fallback...")
            continue

    if not panels_raw:
        logger.warning(f"[facade_smart_crop] Gemini AI detection failed/returned 0 panels ({last_exc}). Falling back to local OpenCV panel detection...")
        tmp_in_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(img_buffer)
                tmp_in_path = tmp_in.name

            from services.image.detect_panels import run_cv_detection
            cv_panels = run_cv_detection(
                image_path=tmp_in_path,
                sensitivity=sensitivity,
                bg_mode=background_color_mode,
                min_width_pct=min_area_pct,
                min_height_px=min_height_px,
                merge_threshold=merge_threshold,
                aspect_ratio_str=aspect_ratio,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                auto_split=auto_split,
                padding_px=padding_px
            )
            # Crop all panels server-side before returning
            await asyncio.to_thread(_crop_panels_server_side, img_buffer, cv_panels, url)
            return {
                "success": True,
                "total_panels": len(cv_panels),
                "imageWidth": w_img,
                "imageHeight": h_img,
                "panels": cv_panels,
                "provider": "opencv_fallback",
                "isTallStrip": is_tall_strip,
            }
        except Exception as cv_exc:
            logger.error(f"[facade_smart_crop] Local OpenCV fallback also failed: {cv_exc}")
            raise RuntimeError(
                f"AI Smart Engine (Gemini) failed ({last_exc}). OpenCV fallback failed: {cv_exc}"
            ) from last_exc
        finally:
            if tmp_in_path and os.path.exists(tmp_in_path):
                try:
                    os.remove(tmp_in_path)
                except Exception:
                    pass


    final_panels = []
    safe_h = max(1, h_img)
    safe_w = max(1, w_img)

    for p in panels_raw:
        top_val = float(p.get("cropTop", 0.0))
        bot_val = float(p.get("cropBottom", 100.0))
        left_val = float(p.get("cropLeft", 0.0))
        right_val = float(p.get("cropRight", 100.0))

        if bot_val > top_val and bot_val > 50.0:
            pb = PanelBounds.from_absolute_percent(top_val, bot_val, left_val, right_val, safe_w, safe_h, space="ai_absolute")
        else:
            pb = PanelBounds.from_inset_percent(top_val, bot_val, left_val, right_val, safe_w, safe_h, space="ai_inset")

        pb = pb.clamp(safe_w, safe_h)

        from services.image.utils.panel_box_utils import adjust_to_aspect_ratio
        x, y, w_box, h_box = adjust_to_aspect_ratio(pb.x, pb.y, pb.width, pb.height, safe_w, safe_h, aspect_ratio)

        final_pb = PanelBounds.from_pixels(x, y, w_box, h_box, space="smart_crop_final").clamp(safe_w, safe_h)
        insets = final_pb.to_inset_percentages(safe_w, safe_h)

        final_panels.append({
            "x": int(final_pb.x),
            "y": int(final_pb.y),
            "width": int(final_pb.width),
            "height": int(final_pb.height),
            "cropTop": float(insets["cropTop"]),
            "cropBottom": float(insets["cropBottom"]),
            "cropLeft": float(insets["cropLeft"]),
            "cropRight": float(insets["cropRight"]),
            "area": int(final_pb.area)
        })

    # Sort strictly top-to-bottom (by pixel y), then left-to-right (by pixel x).
    # The old row-band approach (cropTop / 4.0) caused wrong ordering on tall webtoon strips.
    sorted_final_panels = sorted(
        final_panels,
        key=lambda b: (b.get("y", 0), b.get("x", 0))
    )
    # Crop all AI-detected panels server-side before returning
    await asyncio.to_thread(_crop_panels_server_side, img_buffer, sorted_final_panels, url)
    return {
        "success": True,
        "total_panels": len(sorted_final_panels),
        "imageWidth": w_img,
        "imageHeight": h_img,
        "panels": sorted_final_panels,
        "isTallStrip": is_tall_strip,
    }


async def facade_analyze_narrative_sequence(
    visual_descriptions: List[str],
    model: Optional[str],
    voice: Optional[str],
    user_keys: Dict[str, str]
) -> Dict[str, Any]:
    """Generates chronological narrative voiceover texts via Gemini, then synthesizes TTS audio for each."""
    from google import genai
    from google.genai import types
    from services.ai.skills.base import extract_json

    target_model = model or GEMINI_MODEL_PRIMARY
    gemini_key = resolve_api_key("gemini", user_keys=user_keys)
    client = genai.Client(api_key=gemini_key)

    scenes_prompt = "\n".join([f"Scene {i+1}: {desc}" for i, desc in enumerate(visual_descriptions)])
    system_instruction = (
        f"Generate a JSON array of strings containing exactly "
        f"{len(visual_descriptions)} narrative voiceover sentences for these visual scenes:\n{scenes_prompt}"
    )

    fallback_candidates = [target_model] + GEMINI_FALLBACK_MODELS
    models_to_try = []
    for m in fallback_candidates:
        _, clean_m = get_provider_and_model(m)
        if clean_m not in models_to_try:
            models_to_try.append(clean_m)

    response = None
    last_exc = None
    for m_name in models_to_try:
        try:
            response = await call_gemini_with_retry(
                lambda target=m_name: client.models.generate_content(
                    model=target,
                    contents=system_instruction,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
            )
            if response:
                logger.info(f"[facade_analyze_narrative_sequence] Successfully generated narratives using model: {m_name}")
                break
        except Exception as exc:
            last_exc = exc
            logger.warning(f"[facade_analyze_narrative_sequence] Gemini model '{m_name}' failed: {exc}. Trying next fallback model...")
            continue

    if not response:
        raise last_exc or RuntimeError("All Gemini fallback models failed for narrative sequence analysis.")

    raw_text = getattr(response, "text", None)
    if not raw_text:
        raise RuntimeError("Gemini model returned empty response.")

    narrative_texts = json.loads(extract_json(raw_text))

    semaphore = asyncio.Semaphore(5)

    async def process_narrative_audio(idx: int, text: str):
        async with semaphore:
            audio_url = None
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                    temp_audio_path = tmp_audio.name

                voice_code = voice or "en-US-GuyNeural"
                _, actual_dur = await generate_panel_audio(
                    dialogue_list=[text],
                    target_duration=0.0,
                    output_path=temp_audio_path,
                    voice=voice_code,
                    force_duration=False
                )

                if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
                    with open(temp_audio_path, "rb") as f:
                        audio_bytes = f.read()
                    unique_audio_id = f"narrative_{uuid.uuid4().hex[:8]}"
                    stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
                    audio_url = f"/api/image/cached/{unique_audio_id}"

                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
            except Exception as audio_err:
                logger.error(f"[Narrative Sequence] Audio gen failed for idx {idx}: {audio_err}")

            return {"narrative": text, "narrative_audio_url": audio_url}

    results = await asyncio.gather(*[process_narrative_audio(i, t) for i, t in enumerate(narrative_texts)])
    return {"success": True, "results": list(results)}


async def facade_enhance_prompt(
    prompt: str,
    model: Optional[str],
    api_key: str
) -> Dict[str, Any]:
    """Uses Gemini to enhance/optimize a user's text prompt."""
    from google import genai

    client = genai.Client(api_key=api_key)
    target_model = model or GEMINI_MODEL_PRIMARY
    fallback_candidates = [target_model] + GEMINI_FALLBACK_MODELS
    models_to_try = []
    for m in fallback_candidates:
        _, clean_m = get_provider_and_model(m)
        if clean_m not in models_to_try:
            models_to_try.append(clean_m)

    response = None
    last_exc = None
    for m_name in models_to_try:
        try:
            response = await call_gemini_with_retry(
                lambda target=m_name: client.models.generate_content(model=target, contents=prompt)
            )
            if response:
                break
        except Exception as exc:
            last_exc = exc
            continue

    if not response:
        raise last_exc or RuntimeError("All Gemini fallback models failed to enhance prompt.")

    return {"success": True, "enhanced_prompt": response.text}
