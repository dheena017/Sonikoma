"""
Thumbnail prompt builder for YouTube and webtoon covers.

Converts cover concepts into high-contrast 16:9 diffusion prompts optimized
for clickability and visual hierarchy.
"""

from typing import Dict, Any
from features.ai.prompts.style_presets import get_art_style


def _add_cover_quality_tags(prompt: str) -> str:
    """Appends cinematic lighting, volumetric smoke, and high detail cues."""
    return f"{prompt}, 16:9 youtube thumbnail, vivid high-contrast colors, dramatic rim light, 8k resolution, masterpiece"


def make_cover_prompts(
    idea: Dict[str, Any],
    art_style: str = "anime"
) -> Dict[str, str]:
    """Builds diffusion prompts for 16:9 YouTube cover generation."""
    style_info = get_art_style(art_style)

    focal = idea.get("focal_character", "character")
    comp = idea.get("composition", "dramatic action")
    base = f"{focal}, {comp}, {style_info['keywords']}"

    positive = _add_cover_quality_tags(base)
    negative = f"{style_info.get('negative_keywords', '')}, text, words, watermark, blurry, dull colors"

    return {
        "prompt": positive,
        "negative_prompt": negative,
        "aspect_ratio": "16:9",
        "badge_text": idea.get("badge_text", "MUST WATCH")
    }


__all__ = ["make_cover_prompts"]
