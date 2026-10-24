"""
Prompt enhancer for AI creative tasks.

Takes a simple creator prompt like "hero fighting monster" and expands it
with rich lighting, camera angles, textures, and art details.
"""

from typing import Dict, Any, Optional, Literal
import re
import logging
from .style_presets import get_art_style

logger = logging.getLogger("sonikoma.features.ai.prompts.improve_prompt")


def _clean_raw_words(raw_words: str) -> str:
    """Cleans excess whitespace and symbols from the input prompt."""
    cleaned = re.sub(r'\s+', ' ', (raw_words or "")).strip()
    return cleaned.strip('"\',.')


def _add_style_details(raw_words: str, art_style: str, genre: str) -> str:
    """Adds lighting, camera angle, and atmosphere details based on genre and art style."""
    style_info = get_art_style(art_style)
    genre_clean = (genre or "action").lower()

    atmosphere = "dramatic tension, cinematic particles, high stakes"
    if "romance" in genre_clean:
        atmosphere = "soft warm glow, delicate petals floating, emotional depth"
    elif "horror" in genre_clean:
        atmosphere = "ominous dark fog, eerie rim lighting, heavy shadows"
    elif "fantasy" in genre_clean:
        atmosphere = "magical glowing particles, mystical atmosphere, vibrant energy"

    components = [
        raw_words,
        style_info["keywords"],
        style_info["lighting"],
        style_info["camera"],
        atmosphere,
    ]
    return ", ".join([c for c in components if c])


async def make_better_prompt(
    simple_idea: str,
    output_type: Literal["image", "script", "video"] = "image",
    art_style: str = "manhwa",
    genre: str = "action",
    ai_provider: str = "gemini",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Turns a basic idea into a rich, high-quality prompt for picture generators or AI writers."""
    cleaned = _clean_raw_words(simple_idea)
    if not cleaned:
        cleaned = "dynamic comic scene with dramatic character action"

    enhanced = _add_style_details(cleaned, art_style, genre)
    style_info = get_art_style(art_style)

    return {
        "original_idea": simple_idea,
        "enhanced_prompt": enhanced,
        "output_type": output_type,
        "art_style": style_info["style_key"],
        "genre": genre,
        "negative_prompt": style_info.get("negative_keywords", ""),
    }


__all__ = ["make_better_prompt"]
