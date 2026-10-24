"""
backend/features/ai/analysis/match_bubbles.py
─────────────────────────────────────────────────────────────────────────────
Matches speech bubbles to the nearest character face.
─────────────────────────────────────────────────────────────────────────────
"""

import math
from typing import List, Dict, Any, Tuple


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _get_center(box: Dict[str, Any]) -> Tuple[float, float]:
    """Calculates x, y center of a bounding box."""
    x1 = float(box.get("x1", box.get("left", 0)))
    y1 = float(box.get("y1", box.get("top", 0)))
    x2 = float(box.get("x2", box.get("right", x1 + box.get("width", 0))))
    y2 = float(box.get("y2", box.get("bottom", y1 + box.get("height", 0))))
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def _find_nearest_face(bubble_center: Tuple[float, float], faces: List[Dict[str, Any]]) -> str:
    """Finds the closest character face name or ID to the bubble center."""
    if not faces:
        return "Narrator"

    bx, by = bubble_center
    closest_dist = float("inf")
    closest_name = "Character"

    for face in faces:
        fx, fy = _get_center(face)
        dist = math.hypot(bx - fx, by - fy)
        if dist < closest_dist:
            closest_dist = dist
            closest_name = face.get("name", face.get("character_name", face.get("id", "Character")))

    return closest_name


# ── Public API ───────────────────────────────────────────────────────────────

def match_bubbles_to_faces(
    bubbles: List[Dict[str, Any]],
    faces: List[Dict[str, Any]],
    picture_size: Tuple[int, int]
) -> List[Dict[str, Any]]:
    """Connects speech text bubbles with character faces so we know who said each line."""
    matched_results = []
    for b in bubbles:
        center = _get_center(b)
        speaker = _find_nearest_face(center, faces)
        item = dict(b)
        item["speaker_name"] = speaker
        item["assigned_speaker"] = speaker
        matched_results.append(item)
    return matched_results


__all__ = ["match_bubbles_to_faces"]
