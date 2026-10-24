"""
Agent script generator for comic panels.

Reads dialogue from pictures and generates a spoken narrator and character
voiceover script for each panel in the chapter.
"""

from typing import List, Dict, Any, Optional
import re
from features.ai.analysis.analyze_panel import read_panel
from features.ai.narrative.write_script import write_story_script


def _clean_dialogue_text(raw_panel: Dict[str, Any]) -> str:
    """Extracts and cleans dialogue text from panel analysis output."""
    speech = raw_panel.get("speech_text") or raw_panel.get("dialogue") or ""
    cleaned = re.sub(r'[\r\n]+', ' ', str(speech)).strip()
    return cleaned


async def write_agent_script(
    panel_pictures: List[str],
    series_title: str,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """Reads dialogue from pictures and writes a narrator voiceover script for every panel."""
    analyzed_panels = []

    for idx, pic in enumerate(panel_pictures):
        try:
            analysis = await read_panel(
                picture=pic,
                story_notes=f"Series: {series_title}",
                past_events=None
            )
            dialogue = _clean_dialogue_text(analysis)
            speaker = analysis.get("speaker") or "Narrator"
            emotion = analysis.get("emotion") or "neutral"
            narrative = analysis.get("narrative") or dialogue or f"Scene {idx + 1}"

            analyzed_panels.append({
                "panel_index": idx,
                "image_path": pic,
                "speaker": speaker,
                "speech_text": dialogue,
                "narrative": narrative,
                "emotion": emotion,
                "motion": analysis.get("motion", "zoom_in")
            })
        except Exception:
            analyzed_panels.append({
                "panel_index": idx,
                "image_path": pic,
                "speaker": "Narrator",
                "speech_text": "",
                "narrative": f"Dramatic moment in {series_title}.",
                "emotion": "neutral",
                "motion": "zoom_in"
            })

    script = await write_story_script(analyzed_panels)
    for p, s in zip(analyzed_panels, script):
        p["spoken_line"] = s.get("spoken_line", p["narrative"])

    return analyzed_panels


__all__ = ["write_agent_script"]
