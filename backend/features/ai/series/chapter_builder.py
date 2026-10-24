"""
Chapter builder orchestrator for AI series.

Coordinates the end-to-end production of an episode:
script writing -> panel prompts -> image generation -> voice dubbing.
"""

from typing import Dict, Any, Optional
import uuid
from .chapter_writer import write_chapter
from .panel_prompts import make_panel_prompts
from .image_generator import make_panel_image
from .voice_dubber import dub_chapter_voices


def _check_everything_ready(series_id: str, chapter_name: str) -> None:
    """Validates parameters before beginning full chapter generation."""
    if not series_id:
        raise ValueError("series_id is required")
    if not chapter_name:
        raise ValueError("chapter_name is required")


async def build_full_chapter(
    series_id: str,
    chapter_name: str,
    chapter_idea: str,
    make_images: bool = True,
    make_voices: bool = True
) -> Dict[str, Any]:
    """Coordinates the complete production of an AI comic chapter from idea to final images and audio."""
    _check_everything_ready(series_id, chapter_name)

    chapter_id = str(uuid.uuid4())
    panels_script = await write_chapter(
        series_title=chapter_name,
        chapter_number=1,
        synopsis=chapter_idea,
        panel_count=5
    )

    characters = [
        {"name": "Protagonist", "gender": "male", "voice_id": "en-US-GuyNeural"},
        {"name": "Rival", "gender": "male", "voice_id": "en-US-DavisNeural"}
    ]

    images = []
    if make_images:
        for p in panels_script:
            img = await make_panel_image(
                prompt=p["scene_description"],
                series_id=series_id,
                chapter_id=chapter_id,
                panel_number=p["panel_number"]
            )
            images.append(img)

    voices = []
    if make_voices:
        voices = await dub_chapter_voices(
            series_id=series_id,
            chapter_id=chapter_id,
            dialogue_lines=panels_script,
            characters=characters
        )

    return {
        "series_id": series_id,
        "chapter_id": chapter_id,
        "chapter_name": chapter_name,
        "panels_count": len(panels_script),
        "panels": panels_script,
        "images": images,
        "voices": voices,
        "status": "completed"
    }


__all__ = ["build_full_chapter"]
