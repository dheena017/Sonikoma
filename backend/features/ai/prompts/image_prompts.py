"""
Image prompt builder for AI comic image generation.

Builds ready-to-run positive and negative prompts formatted for image generators
like Flux, Stable Diffusion, and Midjourney.
"""

from typing import List, Dict, Optional
from .style_presets import get_art_style

_DEFAULT_NEGATIVE_TAGS = (
    "low quality, worst quality, deformed, bad anatomy, bad hands, missing fingers, "
    "extra fingers, blurry, watermark, signature, distorted face, oversaturated"
)


def _make_negative_prompt(preset_negative: Optional[str] = None) -> str:
    if preset_negative:
        return f"{_DEFAULT_NEGATIVE_TAGS}, {preset_negative}"
    return _DEFAULT_NEGATIVE_TAGS


def _format_character_tokens(character_looks: List[str]) -> str:
    if not character_looks:
        return ""
    cleaned = [c.strip() for c in character_looks if c and c.strip()]
    return ", ".join(cleaned)


def make_image_prompts(
    scene_idea: str,
    character_looks: Optional[List[str]] = None,
    art_style: str = "anime",
    picture_shape: str = "9:16"
) -> Dict[str, str]:
    """Builds ready-to-run positive and negative prompts formatted for image generators."""
    style_info = get_art_style(art_style)
    characters_part = _format_character_tokens(character_looks or [])

    parts = []
    if characters_part:
        parts.append(characters_part)
    if scene_idea and scene_idea.strip():
        parts.append(scene_idea.strip())
    parts.append(style_info["keywords"])
    parts.append(style_info["lighting"])
    parts.append(style_info["camera"])

    positive = ", ".join([p for p in parts if p])
    negative = _make_negative_prompt(style_info.get("negative_keywords"))

    return {
        "prompt": positive,
        "negative_prompt": negative,
        "art_style": style_info["style_key"],
        "aspect_ratio": picture_shape or style_info["aspect_ratio"],
    }


__all__ = ["make_image_prompts"]
