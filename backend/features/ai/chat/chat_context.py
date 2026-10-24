"""
Chat context builder for the AI creative assistant.

Compiles active comic storyline details, character sheets, and current panel
elements into clear background context for the LLM.
"""

from typing import Dict, Any, List, Optional


def _summarize_panels(panels: List[Dict[str, Any]]) -> str:
    """Creates a brief bullet list of recent panel actions."""
    if not panels:
        return "No panels yet."
    lines = []
    for p in panels[-5:]:
        idx = p.get("panel_number") or p.get("panel_index", 0)
        desc = p.get("scene_description") or p.get("narrative") or "Action scene"
        lines.append(f"- Panel {idx}: {desc[:70]}")
    return "\n".join(lines)


def get_comic_context(
    series_details: Dict[str, Any],
    current_panel: Optional[Dict[str, Any]] = None,
    characters: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Builds background context for the AI assistant so it knows your story."""
    title = series_details.get("title", "Untitled Series")
    genre = series_details.get("genre", "Fantasy Action")
    logline = series_details.get("logline") or series_details.get("synopsis", "")

    char_names = [c.get("name", "Unknown") for c in (characters or [])]
    chars_str = ", ".join(char_names) if char_names else "Main characters"

    curr_panel_str = ""
    if current_panel:
        speech = current_panel.get("speech_text") or current_panel.get("dialogue", "")
        speaker = current_panel.get("speaker", "Character")
        curr_panel_str = f"Current Panel: Speaker={speaker}, Speech='{speech}'"

    return (
        f"Comic Title: {title} ({genre})\n"
        f"Synopsis: {logline}\n"
        f"Cast: {chars_str}\n"
        f"{curr_panel_str}"
    ).strip()


__all__ = ["get_comic_context"]
