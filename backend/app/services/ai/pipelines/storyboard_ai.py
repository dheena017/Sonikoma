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

from app.core.config import ai_initialized
from services.ai.skills.registry import registry
from services.ai.orchestrator import AIOrchestrator

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
    title: str = "",
    genre: str = "",
    episode: str = "Episode 1",
    img_urls: Optional[List[str]] = None,
    model: Optional[str] = None,
    narration_style: str = "long",
    user_keys: Optional[Dict[str, str]] = None,
    images: Optional[List[str]] = None,
    synopsis: Optional[str] = None,
    **kwargs
) -> List[Dict[str, Any]]:
    """
    Generates narration script and storyboard camera moves via AI Markdown Skills.
    """
    import os
    resolved_urls = img_urls if img_urls is not None else (images or [])
    active_slices_count = min(len(resolved_urls), 8)
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
        "title": title or "Comic Story",
        "genre": genre or "Action",
        "episode": episode or "Episode 1",
        "active_slices_count": active_slices_count,
        "narrative_length_hint": narrative_length_hint
    }

    provider, target_model, models_to_try = AIOrchestrator.resolve_execution_plan(
        "storyboard_narrative",
        mode="manual" if model else "system",
        requested_model=model
    )
    logger.info(f"[Storyboard AI] Executing storyboard narrative capability with provider={provider}, model={target_model}")

    skill = registry.get("storyboard_narrative")
    response_text = await skill.execute(model=target_model, user_keys=user_keys, **prompt_args)

    if response_text and response_text.strip():
        try:
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
                        "image_url": resolved_urls[idx],
                        "original_image_url": resolved_urls[idx],
                        "speech_text": p.get("speech_text") or f"Scene {idx + 1} of {title}",
                        "sfx": p.get("sfx") or "[Action Sounds]",
                        "duration": duration_val,
                        "motion_type": p.get("motion_type") or "zoom_in",
                        "visual_description": p.get("visual_description") or f"Recap scene for {title} showing {genre} themed illustration panel."
                    })
                logger.info(f"[Storyboard AI] Storyboard narrative successfully generated for {len(result)} slices using {target_model}.")
                return result
        except Exception as parse_err:
            logger.warning(f"[Storyboard AI] Failed to parse skill output: {parse_err}. Using programmatic fallback.")

    logger.info(f"[Storyboard AI] Generating programmatic panels for {active_slices_count} slices.")
    return get_programmatic_panels(title, genre, episode, resolved_urls, active_slices_count)


# Alias for backward compatibility
generate_storyboard_ai = generate_dynamic_panels

