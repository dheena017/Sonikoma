"""
Chapter script writer for AI comic episodes.

Takes an episode synopsis and plans out panel-by-panel visual descriptions,
dialogue lines, speaker identities, and camera cues.
"""

from typing import List, Dict, Any
import logging

logger = logging.getLogger("sonikoma.features.ai.series.chapter_writer")


def _make_scene_prompt(synopsis: str, panel_idx: int, total_panels: int) -> str:
    """Creates a distinct visual scene prompt for a specific panel index."""
    if panel_idx == 0:
        return f"Establishing shot: {synopsis[:80]} - scene opens with striking atmosphere."
    elif panel_idx == total_panels - 1:
        return f"Cliffhanger shot: intense expression and dramatic tension closing the chapter."
    return f"Dynamic scene action: characters interact as events unfold. Detail from: {synopsis[:60]}."


async def write_chapter(
    series_title: str,
    chapter_number: int,
    synopsis: str,
    panel_count: int = 10
) -> List[Dict[str, Any]]:
    """Writes out the dialogue, character actions, and scene details for all panels in an episode."""
    panels = []
    total = max(1, min(panel_count, 30))

    for idx in range(total):
        visual_desc = _make_scene_prompt(synopsis, idx, total)
        speaker = "Protagonist" if idx % 2 == 0 else "Rival"
        speech = f"Line {idx + 1}: The battle for our destiny will not end here!" if idx % 2 == 0 else "You underestimate my strength!"

        panels.append({
            "panel_number": idx + 1,
            "scene_description": visual_desc,
            "speaker": speaker,
            "dialogue": speech,
            "motion": "zoom_in" if idx % 3 == 0 else "pan_right",
            "emotion": "determined" if idx % 2 == 0 else "confident",
            "camera_angle": "low_angle_dynamic" if idx % 2 == 0 else "close_up_dramatic"
        })

    return panels


__all__ = ["write_chapter"]
