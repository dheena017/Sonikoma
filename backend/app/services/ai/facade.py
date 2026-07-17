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

from config.clients import call_gemini_with_retry
from services.ai.skills.registry import registry
from services.ai.skills.base import get_provider_and_model, resolve_api_key
import utils.image_utils as img_utils
from utils.cache import stitched_cache
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

                supported_actions = getattr(m, "supported_actions", [])
                if "generateContent" not in supported_actions:
                    continue

                junk_keywords = [
                    "embedding", "aqa", "learnlm", "bison", "gecko",
                    "-001", "-002", "latest", "preview", "-exp", "tts",
                    "vision", "a4b", "nano", "8b", "test"
                ]
                if any(junk in lower_name for junk in junk_keywords):
                    continue

                result_list.append({
                    "name": clean_name,
                    "fullName": raw_name,
                    "displayName": m.display_name or "",
                    "description": m.description or "",
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
        headers = {"Authorization": f"Bearer {api_key}"}
        models_res = requests.get("https://api.openai.com/v1/models", headers=headers)
        if models_res.status_code != 200:
            return {"success": False, "error": f"OpenAI Authorization Failed: {models_res.text}"}
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
        return {"success": True, "provider": "openai", "total": len(result_list), "models": result_list}

    elif provider == "anthropic":
        import requests
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        models_res = requests.get("https://api.anthropic.com/v1/models", headers=headers)
        if models_res.status_code != 200:
            return {"success": False, "error": f"Anthropic Authorization Failed: {models_res.text}"}
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
        return {"success": True, "provider": "anthropic", "total": len(result_list), "models": result_list}

    elif provider == "huggingface":
        import requests
        headers = {"Authorization": f"Bearer {api_key}"}
        auth_res = requests.get("https://huggingface.co/api/whoami-v2", headers=headers)
        if auth_res.status_code != 200:
            return {"success": False, "error": f"Hugging Face Authorization Failed: {auth_res.text}"}

        params = {"limit": 150, "sort": "downloads", "direction": -1}
        models_res = requests.get("https://huggingface.co/api/models", params=params, headers=headers)
        if models_res.status_code != 200:
            return {"success": False, "error": f"Failed to fetch models from Hugging Face Hub: {models_res.text}"}

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
                "description": f"Hugging Face repository model. Library: {m.get('library_name','N/A')}.",
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

    target_model = model or "gemini-2.5-flash"
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
        from media.image.ocr import extract_dialogue_from_panel
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


async def facade_smart_crop(
    url: str,
    aspect_ratio: str,
    model: Optional[str],
    user_keys: Dict[str, str]
) -> Dict[str, Any]:
    """Uses LLM panel detection to identify the most salient bounding boxes."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]

    with Image.open(io.BytesIO(img_buffer)) as img:
        w_img, h_img = img.size

    target_model = model or "gemini-2.5-flash"
    skill = registry.get("smart_crop")
    raw_text = await skill.execute(
        model=target_model,
        image_bytes=img_buffer,
        user_keys=user_keys
    )

    try:
        data = json.loads(raw_text)
        panels_raw = data.get("panels", [])
    except Exception:
        panels_raw = []

    final_panels = []
    for p in panels_raw:
        ymin = int(round((p.get("cropTop", 0) / 100.0) * h_img))
        ymax = int(round((p.get("cropBottom", 100) / 100.0) * h_img))
        xmin = int(round((p.get("cropLeft", 0) / 100.0) * w_img))
        xmax = int(round((p.get("cropRight", 100) / 100.0) * w_img))

        xmin = max(0, min(w_img, xmin))
        xmax = max(0, min(w_img, xmax))
        ymin = max(0, min(h_img, ymin))
        ymax = max(0, min(h_img, ymax))

        w_box = max(1, xmax - xmin)
        h_box = max(1, ymax - ymin)

        from services.image.panel_box_utils import adjust_to_aspect_ratio
        coords = adjust_to_aspect_ratio(xmin, ymin, w_box, h_box, w_img, h_img, aspect_ratio)
        final_panels.append(coords)

    return {
        "success": True,
        "total_panels": len(final_panels),
        "panels": final_panels
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

    target_model = model or "gemini-2.5-flash"
    _, clean_model = get_provider_and_model(target_model)
    gemini_key = resolve_api_key("gemini", user_keys=user_keys)
    client = genai.Client(api_key=gemini_key)

    system_instruction = (
        f"Generate a JSON array of strings containing exactly "
        f"{len(visual_descriptions)} narrative voiceover sentences."
    )
    response = await call_gemini_with_retry(
        lambda: client.models.generate_content(
            model=clean_model,
            contents=system_instruction,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
    )
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
    response = await call_gemini_with_retry(
        lambda: client.models.generate_content(model=model or "gemini-2.5-flash", contents=prompt)
    )
    return {"success": True, "enhanced_prompt": response.text}
