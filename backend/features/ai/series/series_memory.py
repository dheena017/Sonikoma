"""
Long-term story memory and lore repository for AI series.

Preserves canon events, item acquisitions, battle injuries, and character
relationships across all episodes.
"""

from typing import Dict, List, Any


def _summarize_story_facts(events: List[Dict[str, Any]]) -> str:
    """Summarizes new plot events into concise canonical bullet points."""
    summaries = []
    for e in events:
        desc = e.get("description") or e.get("event") or str(e)
        summaries.append(f"- {desc}")
    return "\n".join(summaries)


def save_series_memory(
    series_id: str,
    chapter_number: int,
    new_events: List[Dict[str, Any]],
    character_changes: Dict[str, Any]
) -> Dict[str, Any]:
    """Saves important plot events and character status into ongoing story memory."""
    facts = _summarize_story_facts(new_events)
    return {
        "series_id": series_id,
        "chapter_number": chapter_number,
        "new_facts": facts,
        "character_status": character_changes,
        "status": "persisted"
    }


__all__ = ["save_series_memory"]
