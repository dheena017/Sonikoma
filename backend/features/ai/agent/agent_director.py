"""
Agent video director.

Coordinates camera motion cues (zoom, pan), voice synthesis, and video rendering
into a finished cinematic MP4 video.
"""

from typing import List, Dict, Any, Optional
import os
import logging
from features.video import compile_video_from_panels

logger = logging.getLogger("sonikoma.features.ai.agent.director")


def _choose_camera_move(panel: Dict[str, Any]) -> str:
    """Selects an appropriate camera movement for the panel based on motion and emotion."""
    preset = panel.get("motion")
    if preset in ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down"]:
        return preset
    emotion = str(panel.get("emotion") or "").lower()
    if emotion in ["shocked", "screaming", "angry"]:
        return "zoom_in"
    elif emotion in ["panicked", "running"]:
        return "pan_right"
    return "zoom_in"


async def make_agent_video(
    panels: List[Dict[str, Any]],
    voice_cast: List[Dict[str, Any]],
    video_shape: str = "shorts",
    save_folder: Optional[str] = None
) -> str:
    """Generates AI speech, adds pan/zoom camera moves, and creates the final MP4 video file."""
    for p in panels:
        p["motion"] = _choose_camera_move(p)

    target_aspect = "9:16" if video_shape == "shorts" else "16:9"

    try:
        video_path = await compile_video_from_panels(
            panels=panels,
            aspect_ratio=target_aspect,
            output_dir=save_folder or "outputs"
        )
        return video_path
    except Exception as e:
        logger.error(f"Error compiling agent video: {e}")
        return ""


__all__ = ["make_agent_video"]
