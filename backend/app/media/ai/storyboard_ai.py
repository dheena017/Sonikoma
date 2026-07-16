"""
backend/python/services/storyboard_ai.py
─────────────────────────────────────────────────────────────────────────────
Storyboard narrative generation service using AI Markdown Skills.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
import pydantic

from config.clients import ai_initialized, hf_client, call_gemini_with_retry, genai_client
from skills.registry import registry
from skills.base import StoryboardModel

logger = logging.getLogger("sonikoma.services.storyboard_ai")

def get_programmatic_panels(title: str, genre: str, episode: str, img_urls: List[str], count: int) -> List[Dict[str, Any]]:
    """Programmatic fallback generator when AI calls fail."""
    panels_list = []
    for i in range(count):
        text = ""
        sfx = ""
        motion = "zoom_in"

        if i == 0:
            text = f"Welcome to the legendary path of {title}! The grand chronicle of the {episode} of this {genre} saga starts here."
            sfx = "[Chime Echo]"
            motion = "zoom_in"
        elif i == count - 1:
            text = f"And thus is the peak climax of {episode} of {title} completed! What epic struggles lie ahead?"
            sfx = "[Impact Strike]"
            motion = "zoom_out"
        else:
            dynamic_texts = [
                f"Tensions escalate rapidly across the {genre} zone, forcing characters to adapt immediately.",
                "A mysterious shadows crawls quietly, casting an unexpected veil of magic over the path.",
                f"Crucial keys and ancient memories are laid bare, revealing a hidden side of {title}.",
                "An absolute burst of brilliant energy sweeps the frame! Destiny is set in motion.",
                "Silence fills the space as allies stand tall together, ready to confront the ultimate mystery."
            ]
            text = dynamic_texts[(i - 1) % len(dynamic_texts)]

            sfxs = ["[Soft Whoosh]", "[Drums Rumble]", "[Sparkling Shimmer]", "[Energy Flare]", "[Low Resonance]"]
            sfx = sfxs[(i - 1) % len(sfxs)]

            motions = ["pan_right", "pan_left", "pan_up", "zoom_out", "pan_down"]
            motion = motions[(i - 1) % len(motions)]

        panels_list.append({
            "id": i + 1,
            "image_url": img_urls[i],
            "original_image_url": img_urls[i],
            "speech_text": text,
            "sfx": sfx,
            "duration": 4.5,
            "motion_type": motion,
            "visual_description": f"Recap scene for {title} showing {genre} themed illustration panel."
        })
    return panels_list


async def generate_dynamic_panels(
    title: str,
    genre: str,
    episode: str,
    img_urls: List[str],
    model: str,
    narration_style: str = "long",
    user_keys: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Generates narration script and storyboard camera moves via AI Markdown Skills.
    """
    import os
    active_slices_count = min(len(img_urls), 8)
    if active_slices_count == 0:
        logger.warning("[Storyboard AI] No image URLs provided for storyboard generation.")
        return []

    # Map narration style to a length hint for the AI skill
    if narration_style == "short":
        narrative_length_hint = "An engaging, atmospheric description (under 20 words)."
    else:
        narrative_length_hint = "An engaging, atmospheric description, dialogue, or narrative storytelling (35 to 70 words, detailed for YouTube story narrations)."

    # Construct the prompt arguments
    prompt_args = {
        "title": title,
        "genre": genre,
        "episode": episode,
        "active_slices_count": active_slices_count,
        "narrative_length_hint": narrative_length_hint
    }

    # Resolve keys prioritizing user keys over environment variables
    user_keys = user_keys or {}
    gemini_key = user_keys.get("gemini") or os.getenv("GEMINI_API_KEY")
    hf_key = user_keys.get("huggingface") or os.getenv("HUGGINGFACE_API_KEY")

    # 1. HuggingFace Fallback check
    if model.startswith('huggingface') and hf_key:
        try:
            logger.info(f"[HuggingFace] Creating storyboard using Mistral 7B for \"{title}\" (using resolved HF key)")
            from huggingface_hub import InferenceClient
            client_to_use = InferenceClient(token=hf_key)
            skill = registry.get("storyboard_narrative")
            prompt = skill.build_prompt(**prompt_args)

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client_to_use.chat_completion(
                    model='mistralai/Mistral-7B-Instruct-v0.3',
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=1000
                )
            )
            response_text = response.choices[0].message.content or ""
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_json)
            if parsed and isinstance(parsed.get('panels'), list):
                result = []
                for idx, p in enumerate(parsed['panels'][:active_slices_count]):
                    duration_val = p.get("duration", 5.0)
                    try:
                        duration_val = float(duration_val)
                    except (ValueError, TypeError):
                        duration_val = 5.0

                    result.append({
                        "id": idx + 1,
                        "image_url": img_urls[idx],
                        "original_image_url": img_urls[idx],
                        "speech_text": p.get("speech_text") or f"Scene {idx + 1}",
                        "sfx": p.get("sfx") or "[Action]",
                        "duration": duration_val,
                        "motion_type": p.get("motion_type") or "zoom_in",
                        "visual_description": p.get("visual_description") or f"Recap storyboard illustration panel {idx + 1}."
                    })
                return result
        except Exception as e:
            logger.warning(f"[HuggingFace] Storyboard generation failed: {e}. Falling back to Gemini.")

    # 2. Gemini generation using storyboard_narrative skill
    if gemini_key or ai_initialized:
        try:
            target_model_name = model if model and model.lower().startswith('gemini') else "gemini-2.5-flash"
            if target_model_name and "gemini-3.5" in target_model_name.lower():
                if "pro" in target_model_name.lower():
                    target_model_name = "gemini-2.5-pro"
                else:
                    target_model_name = "gemini-2.5-flash"
                logger.info(f"[storyboard_ai] Translated gemini-3.5 model selection in storyboard generation to: {target_model_name}")

            logger.info(f"[Gemini] Storyboard narrative generation using: {target_model_name}")

            skill = registry.get("storyboard_narrative")
            response_text = await skill.execute(model=target_model_name, api_key=gemini_key, **prompt_args)

            if response_text.strip():
                parsed = json.loads(response_text)
                if parsed and isinstance(parsed.get('panels'), list) and len(parsed['panels']) > 0:
                    result = []
                    for idx, p in enumerate(parsed['panels'][:active_slices_count]):
                        duration_val = p.get("duration", 4.5)
                        try:
                            duration_val = float(duration_val)
                        except (ValueError, TypeError):
                            duration_val = 4.5

                        result.append({
                            "id": idx + 1,
                            "image_url": img_urls[idx],
                            "original_image_url": img_urls[idx],
                            "speech_text": p.get("speech_text") or f"Scene {idx + 1} of {title}",
                            "sfx": p.get("sfx") or "[Action Sounds]",
                            "duration": duration_val,
                            "motion_type": p.get("motion_type") or "zoom_in",
                            "visual_description": p.get("visual_description") or f"Recap scene for {title} showing {genre} themed illustration panel."
                        })
                    logger.info(f"[Gemini] Storyboard narration generated successfully for {len(result)} slices.")
                    return result
        except Exception as e:
            logger.warning(f"[Gemini] Storyboard generation failed: {e}")
            raise e

    raise RuntimeError("AI Storyboard generation failed: No active providers resolved the storyboard narrative script.")
