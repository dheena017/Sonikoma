"""
Cover and thumbnail idea generator.

Brainstorms high-CTR YouTube and Webtoon cover concepts with dramatic character
poses, emotional tension, and catchy badge text.
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("sonikoma.features.ai.thumbnails.ideas")


def _make_hook_prompt(title: str, genre: str, variant_idx: int) -> Dict[str, Any]:
    """Generates a high-CTR visual concept variant."""
    hooks = [
        {"hook": "SHOCKING SECRET REVEALED", "emotion": "eyes glowing in shock, broken weapon"},
        {"hook": "THE TRUE POWER AWAKENS", "emotion": "neon lightning aura, devastating smile"},
        {"hook": "BETRAYAL OF THE CENTURY", "emotion": "blade at the throat, dark tears"},
        {"hook": "HE CANNOT BE STOPPED", "emotion": "smoke rising from crater, menacing silhouette"},
        {"hook": "FINAL STAND", "emotion": "bloody determination, shattered shield"}
    ]
    picked = hooks[variant_idx % len(hooks)]
    return {
        "idea_index": variant_idx + 1,
        "title": title,
        "badge_text": picked["hook"],
        "focal_character": f"Lead character of {title} with {picked['emotion']}",
        "composition": "dynamic foreground character cutout with glowing background battle",
        "genre": genre
    }


async def make_cover_ideas(
    title: str,
    genre: str,
    synopsis: str,
    count: int = 3
) -> List[Dict[str, Any]]:
    """Creates high-CTR thumbnail ideas with catchy text badges and focal character poses."""
    total = max(1, min(count, 10))
    ideas = []
    for i in range(total):
        ideas.append(_make_hook_prompt(title, genre, i))
    return ideas


__all__ = ["make_cover_ideas"]
