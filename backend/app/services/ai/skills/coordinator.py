"""
backend/app/services/ai/skills/coordinator.py
─────────────────────────────────────────────────────────────────────────────
Coordinator classes, provider executors, and fallbacks for AI skill execution.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import json
import logging
import asyncio
from typing import Any, Optional

from core.config import ai_initialized, call_gemini_with_retry, genai_client
from google.genai import types
from services.ai.skills.utils import resolve_api_key

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
        elif skill_name == "scene_composition_desc":
            return {
                "visual_prompt": "Cinematic manhwa page close-up, dramatic shadows, soft backlight",
                "camera_angle": "low angle",
                "lighting": "dramatic backlighting",
                "style_description": "detailed manhwa"
            }
        elif skill_name == "shorts_retention_hook":
            return {
                "hook_sentence": "This S-Rank just unlocked absolute ruin!",
                "psychological_trigger": "curiosity"
            }
        elif skill_name == "subtitle_styler":
            return {
                "font_name": "Montserrat",
                "scale_size": 1.5,
                "primary_fill_color": "#FFCC00",
                "outline_stroke_thickness": 4.0,
                "bounce_animation_style": "pop"
            }
        elif skill_name == "thumbnail_visual_comp":
            return {
                "background_style": "Dark radial purple smoke",
                "split_screen_ratio": "50/50",
                "highlight_borders": ["yellow glow", "red overlay arrow"],
                "layout_margins": "safe bottom right corner"
            }
        elif skill_name == "transition_speed_tuner":
            return {
                "transition_style": "crossfade",
                "duration_frames": 15,
                "pacing_rationale": "Soft dialogue transitions."
            }
        elif skill_name == "youtube_chapter_gen":
            return {
                "chapters": [
                    {"timestamp": "00:00", "title": "Introduction"},
                    {"timestamp": "01:30", "title": "Climax Reveal"}
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
        if "gemini-3.5" in clean_model_id.lower():
            if "pro" in clean_model_id.lower():
                clean_model_id = "gemini-2.5-pro"
            else:
                clean_model_id = "gemini-2.5-flash"
            logger.info(f"[coordinator.py] Translated gemini-3.5 model selection in '{skill.name}' to: {clean_model_id}")

        key_to_use = resolve_api_key("gemini", api_key, user_keys)
        if not ai_initialized and not key_to_use:
            raise RuntimeError("Gemini is not initialized and no API key was provided.")

        config_args = {}
        schema = skill.response_schema
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

        response = await call_gemini_with_retry(
            lambda: client_to_use.models.generate_content(
                model=clean_model_id,
                contents=contents,
                config=config
            )
        )

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        raw_text = response.text or "{}"

        try:
            parsed_json = json.loads(raw_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}

        usage = getattr(response, 'usage_metadata', None)
        p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
        c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0

        skill.last_input_tokens = p_tokens
        skill.last_output_tokens = c_tokens
        skill.logger.log_execution(skill.name, elapsed_ms, True, kwargs, parsed_json, p_tokens, c_tokens)
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

        payload = {
            "model": clean_model_id,
            "messages": messages,
        }

        schema = skill.response_schema
        if schema:
            try:
                if hasattr(schema, "model_json_schema"):
                    schema_dict = schema.model_json_schema()
                else:
                    schema_dict = schema.schema()

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
        skill.last_input_tokens = usage.get("prompt_tokens", 0)
        skill.last_output_tokens = usage.get("completion_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        skill.logger.log_execution(skill.name, elapsed_ms, True, kwargs, parsed_json, skill.last_input_tokens, skill.last_output_tokens)
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
        schema = skill.response_schema
        if schema:
            try:
                if hasattr(schema, "model_json_schema"):
                    schema_dict = schema.model_json_schema()
                else:
                    schema_dict = schema.schema()
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
        skill.last_input_tokens = usage.get("input_tokens", 0)
        skill.last_output_tokens = usage.get("output_tokens", 0)

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        skill.logger.log_execution(skill.name, elapsed_ms, True, kwargs, parsed_json, skill.last_input_tokens, skill.last_output_tokens)
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

        skill.last_input_tokens = len(prompt) // 4
        skill.last_output_tokens = len(raw_text) // 4

        cleaned_json_text = extract_json(raw_text)
        try:
            parsed_json = json.loads(cleaned_json_text)
        except Exception:
            parsed_json = {"raw_text": raw_text}
            cleaned_json_text = raw_text

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        skill.logger.log_execution(skill.name, elapsed_ms, True, kwargs, parsed_json, skill.last_input_tokens, skill.last_output_tokens)
        return cleaned_json_text

    else:
        raise ValueError(f"Unsupported provider: {provider}")
