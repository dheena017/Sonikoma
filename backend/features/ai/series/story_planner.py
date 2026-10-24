"""
Story arc planner for AI comic and webtoon series.

Plans multi-episode story progression, rising action, turning points,
and climax chapters while maintaining character consistency.
"""

from typing import Dict, Any, List, Optional
import uuid
import logging

logger = logging.getLogger("sonikoma.features.ai.series.story_planner")


def _read_genre_rules(genre: str) -> Dict[str, str]:
    """Provides pacing and conflict conventions for the requested genre."""
    gen = (genre or "action").lower()
    if "romance" in gen:
        return {
            "hook": "Unforgettable first encounter or awkward misunderstanding",
            "rising": "Growing emotional bond interrupted by rival or social tension",
            "climax": "Grand romantic confession or dramatic rescue",
            "resolution": "Heartfelt reconciliation and emotional promise"
        }
    elif "fantasy" in gen or "action" in gen:
        return {
            "hook": "Sudden awakening of power or catastrophic disaster",
            "rising": "Rigorous training and confronting lieutenant villains",
            "climax": "High-stakes showdown unleashing maximum abilities",
            "resolution": "Victorious aftermath and tease of wider world"
        }
    return {
        "hook": "Intriguing inciting event that disrupts ordinary life",
        "rising": "Escalating stakes and unforeseen obstacles",
        "climax": "Decisive confrontation where everything is on the line",
        "resolution": "Resolution of immediate conflict with lasting change"
    }


async def plan_story_arc(
    title: str,
    genre: str,
    summary: str,
    chapter_count: int = 5,
    characters: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Plans a dramatic story arc across multiple comic episodes."""
    rules = _read_genre_rules(genre)
    total_chapters = max(1, min(chapter_count, 20))

    chapters = []
    for i in range(1, total_chapters + 1):
        if i == 1:
            stage = "Introduction / Inciting Incident"
            focus = rules["hook"]
        elif i == total_chapters:
            stage = "Climax & Resolution"
            focus = f"{rules['climax']}. {rules['resolution']}."
        elif i == total_chapters - 1:
            stage = "The Darkest Moment"
            focus = "All hope seems lost; protagonist pushed to the absolute edge."
        else:
            stage = f"Rising Action Part {i - 1}"
            focus = rules["rising"]

        chapters.append({
            "chapter_number": i,
            "title": f"{title} - Chapter {i}",
            "stage": stage,
            "synopsis": f"{stage}: {focus}",
            "estimated_panels": 10,
        })

    return {
        "series_id": str(uuid.uuid4()),
        "title": title,
        "genre": genre,
        "summary": summary,
        "chapter_count": total_chapters,
        "chapters": chapters,
        "characters": characters or [
            {"name": "Protagonist", "role": "lead", "description": f"Determined hero in {title}"},
            {"name": "Rival", "role": "rival", "description": f"Powerful rival challenging the protagonist"}
        ]
    }


__all__ = ["plan_story_arc"]
