"""
Panel prompt generator with character consistency anchors.

Generates diffusion prompts for each panel that maintain character hair,
eyes, costumes, and art style across the entire chapter.
"""

from typing import List, Dict, Any
from features.ai.prompts.style_presets import get_art_style
from features.ai.prompts.image_prompts import make_image_prompts


def _add_character_tags(character: Dict[str, Any]) -> str:
    """Formats character consistency tags including hair, clothing, and distinctive features."""
    name = character.get("name", "Character")
    hair = character.get("hair_color") or character.get("hair") or "black spiky hair"
    eyes = character.get("eye_color") or character.get("eyes") or "piercing dark eyes"
    outfit = character.get("clothing") or character.get("outfit") or "dark sleek combat jacket"
    return f"character {name}, {hair}, {eyes}, wearing {outfit}"


async def make_panel_prompts(
    chapter_script: str,
    character_sheets: List[Dict[str, Any]],
    art_style: str = "manhwa"
) -> List[Dict[str, Any]]:
    """Creates image prompts for each panel with character consistency tags."""
    char_tags = [_add_character_tags(c) for c in character_sheets]
    lines = [line.strip() for line in chapter_script.split("\n") if line.strip()]
    if not lines:
        lines = ["Dramatic confrontation scene between characters."]

    panel_prompts = []
    for idx, scene in enumerate(lines):
        prompt_data = make_image_prompts(
            scene_idea=scene,
            character_looks=char_tags,
            art_style=art_style
        )
        panel_prompts.append({
            "panel_number": idx + 1,
            "prompt": prompt_data["prompt"],
            "negative_prompt": prompt_data["negative_prompt"],
            "art_style": prompt_data["art_style"],
            "aspect_ratio": prompt_data["aspect_ratio"]
        })

    return panel_prompts


__all__ = ["make_panel_prompts"]
