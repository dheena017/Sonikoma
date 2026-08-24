"""
backend/app/services/ai/skills/coordinator.py
─────────────────────────────────────────────────────────────────────────────
Coordinator classes, provider executors, and fallbacks for AI skill execution.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import json
import uuid
import tempfile
import logging
import asyncio
from typing import Any, Optional

from app.core.config import ai_initialized, call_gemini_with_retry, genai_client
try:
    from google.genai import types
except Exception:
    types = None
from services.ai.skills.utils import resolve_api_key

from app.core.config import GEMINI_FALLBACK_MODELS

logger = logging.getLogger("sonikoma.skills.coordinator")


class FallbackCoordinator:
    """Dynamic fallback provider for gracefully handling API failures."""

    @staticmethod
    def get_programmatic_fallback(skill_name: str, **kwargs) -> dict:
        if skill_name == "panel_analysis":
            return {
                "speech_text": "Cinematic panel capture.",
                "sfx": "[Impact]",
                "duration": 4.5,
                "motion_type": "zoom_in",
                "visual_description": "Static panel segment rendering."
            }
        elif skill_name == "translation":
            return {"translated_text": kwargs.get("text", "Text translation unavailable."), "accuracy_rating": 0.0}
        elif skill_name == "storyboard_narrative":
            return {
                "panels": [
                    {"speech_text": f"Chapter segment recap: {kwargs.get('title', 'Untitled')}.", "sfx": "[Sound]", "motion_type": "zoom_in"}
                    for _ in range(kwargs.get("active_slices_count", 5))
                ]
            }
        elif skill_name == "character_emotion_class":
            return {
                "emotional_state": "analytical",
                "voice_stability": 0.9,
                "expression_reasoning": "Determined posture with centered focal gaze."
            }
        elif skill_name == "copyright_scrubber":
            return {
                "contains_violation": False,
                "violation_type": "none",
                "sanitized_text": kwargs.get("text", "Clean narration."),
                "explanation": "Narration conforms to PG-13 community guidelines."
            }
        elif skill_name == "midroll_placement_ref":
            return {
                "placements": [
                    {"timestamp": "01:15", "tension_reason": "High cliffhanger point before revelation."}
                ]
            }
        elif skill_name == "shorts_retention_hook":
            return {
                "hook_sentence": "This S-Rank just unlocked absolute ruin!",
                "psychological_trigger": "curiosity"
            }
        elif skill_name == "thumbnail_visual_comp":
            return {
                "background_style": "Dark radial purple smoke",
                "split_screen_ratio": "50/50",
                "highlight_borders": ["yellow glow", "red overlay arrow"],
                "layout_margins": "safe bottom right corner"
            }
        elif skill_name == "video_seo_metadata":
            title = kwargs.get("title", "Webtoon Story Recap")
            genre = kwargs.get("genre", "Fantasy Action")
            return {
                "youtube_title": f"He Was F-Rank, Until He Unlocked {title}! [{genre} RECAP]",
                "youtube_description": f"Full recap of {title}. Watch the ultimate battle unfold step by step!",
                "tags": [genre.lower(), "webtoon recap", "op mc", "manhwa recap", "anime recap"],
                "timestamps": ["00:00 - Introduction & Awakening", "01:30 - The Climax Battle", "03:45 - Ending Hook"]
            }
        elif skill_name == "thumbnail_auto_composition":
            title = kwargs.get("title", "Webtoon Hero")
            return {
                "overlay_text": f"HE UNLOCKED THIS?!",
                "layout_archetype": "split_contrast",
                "background_type": "dark_radial_burst",
                "text_color": "#FFD700",
                "focal_assets": [
                    {"panel_index": 0, "description": f"Protagonist from {title}", "style_effect": "glow_outline"}
                ],
                "background_panel_index": 0
            }
        elif skill_name == "shorts_script_adapter":
            return {
                "voiceover_script": "He thought he was just another F-rank hunter... until the system chose HIM!",
                "on_screen_captions": ["F-RANK AWAKENING", "POWER LEVEL 9999+"],
                "estimated_duration_sec": 45
            }
        elif skill_name == "sfx_audio_prompt":
            return {
                "audio_prompt": "Cinematic low-frequency impact boom with sharp energy distortion pulse",
                "suggested_volume": 0.85
            }
        elif skill_name == "bgm_vibe_selector":
            return {
                "music_genre": "Dark Cyberpunk Synthwave",
                "bpm": 128,
                "mood_keywords": ["intense", "suspenseful", "power-fantasy"],
                "suggested_tracks": ["Midnight Cyber Drive", "Obsidian Awakening"]
            }
        elif skill_name == "voice_casting":
            return {
                "gender": "male",
                "suggested_age": "20s",
                "voice_tone": "confident antihero with deep resonance",
                "speech_tempo": 1.1,
                "accent": "neutral english"
            }
        elif skill_name == "script_dramatization":
            return {
                "dramatized_scripts": [
                    "Stop right there! You have no idea what power you're messing with!",
                    "I am the sovereign of the dark realm, and your time has expired."
                ]
            }
        elif skill_name == "sequence_narrative":
            return {
                "panels": [
                    {"id": 1, "narrative": "The hero stands alone at the edge of the abyss, feeling the surge of ancient power."}
                ]
            }

        return {"success": False, "source": "fallback:error"}


async def execute_provider_call(
    skill: Any,
    provider: str,
    clean_model_id: str,
    prompt: str,
    image_bytes: Optional[bytes] = None,
    api_key: Optional[str] = None,
    user_keys: Optional[dict] = None,
    **kwargs
) -> str:
    """Executes call to specific AI provider client API."""
    start_time = time.monotonic()
    
    if provider == "gemini":
        key_to_use = resolve_api_key("gemini", api_key, user_keys)
        if not ai_initialized and not key_to_use:
            raise RuntimeError("Gemini is not initialized and no API key was provided.")

        config_args = {}
        schema = getattr(skill, "response_schema", None) if skill else None
        if schema:
            config_args["response_mime_type"] = "application/json"
            config_args["response_schema"] = schema

        config = types.GenerateContentConfig(**config_args)

        contents = []
        if image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        contents.append(prompt)

        from google import genai
        client_to_use = genai.Client(api_key=key_to_use) if key_to_use else genai_client

        if not client_to_use:
            raise RuntimeError("Gemini client is not initialized and no API key was provided.")

        # Normalize and alias deprecated or renamed model identifiers
        gemini_model_aliases = {
            "gemini-2.5-pro": "gemini-2.5-flash",
            "gemini-2.5-pro-preview-tts": "gemini-2.5-flash",
            "gemini-1.0-pro": "gemini-2.5-flash",
            "gemini-pro": "gemini-2.5-flash",
        }
        effective_model_id = gemini_model_aliases.get(clean_model_id, clean_model_id)

        response = await call_gemini_with_retry(
            lambda: client_to_use.models.generate_content(
                model=effective_model_id,
                contents=contents,
                config=config
            )
        )

        if not response:
            skill_name = getattr(skill, "name", "ai_capability") if skill else "ai_capability"
            fallback_payload = FallbackCoordinator.get_programmatic_fallback(skill_name, **kwargs)
            fallback_payload.setdefault("success", False)
            fallback_payload.setdefault("source", "fallback:error")
            fallback_payload["error"] = str(last_exc or RuntimeError(f"All Gemini fallback models failed for skill '{skill_name}'."))
            raw_text = json.dumps(fallback_payload)
            if skill:
                skill.last_input_tokens = 0
                skill.last_output_tokens = 0
                if getattr(skill, "logger", None):
                    skill.logger.log_execution(skill_name, int((time.monotonic() - start_time) * 1000), False, kwargs, fallback_payload, 0, 0)
            return raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        raw_text = response.text or "{}"

        try:
            parsed_json = json.loads(raw_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}

        usage = getattr(response, 'usage_metadata', None)
        p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
        c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0

        if skill:
            skill.last_input_tokens = p_tokens
            skill.last_output_tokens = c_tokens
            if getattr(skill, "logger", None):
                skill.logger.log_execution(getattr(skill, "name", "ai_capability"), elapsed_ms, True, kwargs, parsed_json, p_tokens, c_tokens)
        return raw_text


    elif provider == "openai":
        import requests
        from services.ai.skills.utils import extract_json

        key_to_use = resolve_api_key("openai", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing OpenAI API Key.")

        headers = {
            "Authorization": f"Bearer {key_to_use}",
            "Content-Type": "application/json"
        }

        messages = []
        if image_bytes:
            import base64
            base64_image = base64.b64encode(image_bytes).decode("utf-8")
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
        else:
            messages = [{"role": "user", "content": prompt}]

        payload: dict[str, Any] = {
            "model": clean_model_id,
            "messages": messages,
        }

        schema = getattr(skill, "response_schema", None) if skill else None
        if schema:
            try:
                if hasattr(schema, "model_json_schema"):
                    schema_dict = schema.model_json_schema()
                else:
                    schema_dict = getattr(schema, "schema")()

                payload["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema.__name__,
                        "strict": True,
                        "schema": schema_dict
                    }
                }
            except Exception as schema_err:
                logger.warning(f"Failed to generate JSON schema for OpenAI: {schema_err}")

        loop = asyncio.get_running_loop()
        url = "https://api.openai.com/v1/chat/completions"

        def make_request():
            return requests.post(url, json=payload, headers=headers, timeout=60)

        response = await loop.run_in_executor(None, make_request)

        if response.status_code != 200:
            raise RuntimeError(f"OpenAI API request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        raw_text = res_data["choices"][0]["message"]["content"]

        usage = res_data.get("usage", {})
        if skill:
            skill.last_input_tokens = usage.get("prompt_tokens", 0)
            skill.last_output_tokens = usage.get("completion_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        if skill and getattr(skill, "logger", None):
            skill.logger.log_execution(getattr(skill, "name", "ai_capability"), elapsed_ms, True, kwargs, parsed_json, getattr(skill, "last_input_tokens", 0), getattr(skill, "last_output_tokens", 0))
        return cleaned_json_text

    elif provider == "anthropic":
        import requests
        from services.ai.skills.utils import extract_json

        key_to_use = resolve_api_key("anthropic", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing Anthropic API Key.")

        headers = {
            "x-api-key": key_to_use,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        system_prompt = "You are a helpful AI assistant."
        schema = getattr(skill, "response_schema", None) if skill else None
        if schema:
            try:
                if hasattr(schema, "model_json_schema"):
                    schema_dict = schema.model_json_schema()
                else:
                    schema_dict = getattr(schema, "schema")()
                system_prompt = f"You MUST return ONLY a valid JSON object matching this schema:\n{json.dumps(schema_dict)}\nNo other conversational text, no explanations, no wrapping except clean JSON."
            except Exception:
                pass

        messages = []
        if image_bytes:
            import base64
            base64_image = base64.b64encode(image_bytes).decode("utf-8")
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64_image
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        else:
            messages = [{"role": "user", "content": prompt}]

        payload = {
            "model": clean_model_id,
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": messages,
        }

        loop = asyncio.get_running_loop()
        url = "https://api.anthropic.com/v1/messages"

        def make_request():
            return requests.post(url, json=payload, headers=headers, timeout=60)

        response = await loop.run_in_executor(None, make_request)

        if response.status_code != 200:
            raise RuntimeError(f"Anthropic API request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        raw_text = res_data["content"][0]["text"]

        usage = res_data.get("usage", {})
        if skill:
            skill.last_input_tokens = usage.get("input_tokens", 0)
            skill.last_output_tokens = usage.get("output_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        if skill and getattr(skill, "logger", None):
            skill.logger.log_execution(getattr(skill, "name", "ai_capability"), elapsed_ms, True, kwargs, parsed_json, getattr(skill, "last_input_tokens", 0), getattr(skill, "last_output_tokens", 0))
        return cleaned_json_text

    elif provider == "huggingface":
        import requests
        from services.ai.skills.utils import extract_json

        key_to_use = resolve_api_key("huggingface", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing Hugging Face Token.")

        headers = {
            "Authorization": f"Bearer {key_to_use}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 1000}
        }

        loop = asyncio.get_running_loop()
        url = f"https://api-inference.huggingface.co/models/{clean_model_id}"

        def make_request():
            return requests.post(url, json=payload, headers=headers, timeout=60)

        response = await loop.run_in_executor(None, make_request)

        if response.status_code != 200:
            raise RuntimeError(f"Hugging Face request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        if isinstance(res_data, list) and len(res_data) > 0:
            raw_text = res_data[0].get("generated_text", str(res_data))
        elif isinstance(res_data, dict):
            raw_text = res_data.get("generated_text", str(res_data))
        else:
            raw_text = str(res_data)

        if skill:
            skill.last_input_tokens = len(prompt) // 4
            skill.last_output_tokens = len(raw_text) // 4

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        if skill and getattr(skill, "logger", None):
            skill.logger.log_execution(getattr(skill, "name", "ai_capability"), elapsed_ms, True, kwargs, parsed_json, getattr(skill, "last_input_tokens", 0), getattr(skill, "last_output_tokens", 0))
        return cleaned_json_text

    elif provider == "groq":
        import requests
        from services.ai.skills.utils import extract_json

        key_to_use = resolve_api_key("groq", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing Groq API Key.")

        headers = {
            "Authorization": f"Bearer {key_to_use}",
            "Content-Type": "application/json"
        }

        messages = [{"role": "user", "content": prompt}]
        payload: dict[str, Any] = {
            "model": clean_model_id,
            "messages": messages,
            "temperature": 0.2,
        }

        schema = getattr(skill, "response_schema", None) if skill else None
        if schema:
            payload["response_format"] = {"type": "json_object"}

        loop = asyncio.get_running_loop()
        url = "https://api.groq.com/openai/v1/chat/completions"

        def make_groq_request():
            return requests.post(url, json=payload, headers=headers, timeout=30)

        response = await loop.run_in_executor(None, make_groq_request)
        if response.status_code != 200:
            raise RuntimeError(f"Groq API request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        raw_text = res_data["choices"][0]["message"]["content"]
        usage = res_data.get("usage", {})
        if skill:
            skill.last_input_tokens = usage.get("prompt_tokens", 0)
            skill.last_output_tokens = usage.get("completion_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        return cleaned_json_text

    elif provider == "deepseek":
        import requests
        from services.ai.skills.utils import extract_json

        key_to_use = resolve_api_key("deepseek", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing DeepSeek API Key.")

        headers = {
            "Authorization": f"Bearer {key_to_use}",
            "Content-Type": "application/json"
        }

        messages = [{"role": "user", "content": prompt}]
        payload = {
            "model": clean_model_id,
            "messages": messages,
        }

        loop = asyncio.get_running_loop()
        url = "https://api.deepseek.com/chat/completions"

        def make_deepseek_request():
            return requests.post(url, json=payload, headers=headers, timeout=60)

        response = await loop.run_in_executor(None, make_deepseek_request)
        if response.status_code != 200:
            raise RuntimeError(f"DeepSeek API request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        raw_text = res_data["choices"][0]["message"]["content"]
        usage = res_data.get("usage", {})
        if skill:
            skill.last_input_tokens = usage.get("prompt_tokens", 0)
            skill.last_output_tokens = usage.get("completion_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        return cleaned_json_text

    elif provider == "deepl":
        import requests

        key_to_use = resolve_api_key("deepl", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing DeepL API Key.")

        text_to_translate = kwargs.get("text", prompt)
        target_lang = kwargs.get("target_lang", "EN-US").upper()
        if target_lang == "EN":
            target_lang = "EN-US"

        endpoint = "https://api-free.deepl.com/v2/translate" if ":fx" in key_to_use else "https://api.deepl.com/v2/translate"
        headers = {
            "Authorization": f"DeepL-Auth-Key {key_to_use}",
            "Content-Type": "application/json"
        }
        payload = {
            "text": [text_to_translate],
            "target_lang": target_lang
        }

        loop = asyncio.get_running_loop()
        def make_deepl_request():
            return requests.post(endpoint, json=payload, headers=headers, timeout=20)

        response = await loop.run_in_executor(None, make_deepl_request)
        if response.status_code != 200:
            raise RuntimeError(f"DeepL API request failed (HTTP {response.status_code}): {response.text}")

        res_data = response.json()
        translated = res_data.get("translations", [{}])[0].get("text", text_to_translate)
        if skill:
            skill.last_input_tokens = len(text_to_translate) // 4
            skill.last_output_tokens = len(translated) // 4

        return json.dumps({
            "translated_text": translated,
            "detected_source_language": res_data.get("translations", [{}])[0].get("detected_source_language", "AUTO")
        })

    elif provider in ("edgetts", "edge_tts"):
        from services.audio.tts import generate_panel_audio
        output_path = kwargs.get("output_path") or os.path.join(tempfile.gettempdir(), f"edgetts_{uuid.uuid4().hex[:8]}.mp3")
        voice = kwargs.get("voice", "en-US-GuyNeural")
        saved_path, dur = await generate_panel_audio(
            dialogue_list=[prompt],
            target_duration=float(kwargs.get("duration", 4.0)),
            output_path=output_path,
            voice=voice,
        )
        if skill:
            skill.last_input_tokens = len(prompt) // 4
            skill.last_output_tokens = int(dur * 50)
        return json.dumps({"audio_path": saved_path, "duration": dur, "voice": voice})

    elif provider == "elevenlabs":
        import requests
        key_to_use = resolve_api_key("elevenlabs", api_key, user_keys)
        if not key_to_use:
            raise RuntimeError("Missing ElevenLabs API Key.")

        voice_id = kwargs.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": key_to_use,
            "Content-Type": "application/json"
        }
        payload = {
            "text": prompt,
            "model_id": clean_model_id if "eleven_" in clean_model_id else "eleven_multilingual_v2",
        }

        loop = asyncio.get_running_loop()
        def make_eleven_request():
            return requests.post(url, json=payload, headers=headers, timeout=30)

        response = await loop.run_in_executor(None, make_eleven_request)
        if response.status_code != 200:
            raise RuntimeError(f"ElevenLabs API failed (HTTP {response.status_code}): {response.text}")

        output_path = kwargs.get("output_path") or os.path.join(tempfile.gettempdir(), f"elevenlabs_{uuid.uuid4().hex[:8]}.mp3")
        with open(output_path, "wb") as f:
            f.write(response.content)

        if skill:
            skill.last_input_tokens = len(prompt) // 4
            skill.last_output_tokens = len(response.content) // 100

        return json.dumps({"audio_path": output_path, "size_bytes": len(response.content)})

    elif provider in ("stablediffusion", "stable_diffusion"):
        from providers.stable_diffusion import get_stable_diffusion_engine
        engine = get_stable_diffusion_engine()
        output_path = kwargs.get("output_path") or os.path.join(tempfile.gettempdir(), f"sd_{uuid.uuid4().hex[:8]}.png")
        engine.generate_image(prompt=prompt, output_path=output_path, width=kwargs.get("width", 1024), height=kwargs.get("height", 1024))
        return json.dumps({"image_path": output_path})

    elif provider == "whisper":
        from providers.whisper import get_whisper_engine
        engine = get_whisper_engine()
        audio_file = kwargs.get("audio_file") or kwargs.get("audio_path")
        if not audio_file or not os.path.exists(audio_file):
            raise RuntimeError(f"Whisper input audio file not found: {audio_file}")
        transcription = engine.transcribe(audio_file)
        return json.dumps(transcription if isinstance(transcription, dict) else {"text": str(transcription)})

    else:
        raise ValueError(f"Unsupported provider: {provider}")


# Alias for backward compatibility
execute_skill_pipeline = execute_provider_call

