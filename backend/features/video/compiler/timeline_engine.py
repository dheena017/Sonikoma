"""
backend/features/video/compiler/timeline_engine.py
─────────────────────────────────────────────────────────────────────────────
Multi-track timeline layout model mapping video, audio, SFX, and BGM tracks.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _calculate_total_timeline_span(panels: List[Dict[str, Any]]) -> float:
    """Computes total expected timeline runtime from panel suggested durations."""
    total = 0.0
    for p in panels:
        dur = float(p.get("duration") or 0.0)
        total += dur if dur > 0 else 4.0
    return total


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def build_timeline(
    panels: List[Dict[str, Any]],
    bgm_track: Optional[str] = None,
    master_duration: Optional[float] = None
) -> Dict[str, Any]:
    """Builds a timeline of video and audio tracks from panels."""
    span = master_duration or _calculate_total_timeline_span(panels)
    current_time = 0.0
    video_track = []
    dialogue_track = []

    for idx, p in enumerate(panels):
        dur = float(p.get("duration") or 4.0)
        start = current_time
        end = start + dur

        video_track.append({
            "panel_id": p.get("id") or (idx + 1),
            "start_time": start,
            "end_time": end,
            "duration": dur,
            "image_url": p.get("image_url") or p.get("url"),
            "motion_type": p.get("motion_type", "auto"),
        })

        if p.get("audio_url") or p.get("narrative_audio_url") or p.get("dialogue_audio_url"):
            dialogue_track.append({
                "panel_id": p.get("id") or (idx + 1),
                "start_time": start,
                "end_time": end,
                "audio_url": p.get("narrative_audio_url") or p.get("audio_url") or p.get("dialogue_audio_url"),
            })

        current_time = end

    return {
        "master_duration": span,
        "tracks": {
            "video": video_track,
            "dialogue": dialogue_track,
            "bgm": {"url": bgm_track, "duration": span} if bgm_track else None,
        }
    }


# Backward compatibility alias
build_multi_track_timeline = build_timeline

__all__ = [
    "build_timeline",
    "build_multi_track_timeline",
]
