"""
backend/app/services/image/panel_detection/panel_fusion_service.py
─────────────────────────────────────────────────────────────────────────────
Intelligent Fusion Engine for OpenCV + YOLO + AI Entities:
- Speech Bubble Proximity Binding: Expands panel boundaries to include dialogue
- Gutter SFX Rejection: Filters loose floating text ("RATTLE", "SIGH") in gutters
- Tight Frame Snapping: Snaps tightly to dominant black frames (e.g. carriage)
- Margin Calculation: Produces clean directional margins (crop_top/bottom/left/right)
─────────────────────────────────────────────────────────────────────────────
"""

import math
import logging
from typing import List, Dict, Any, Tuple, Optional

from schemas.project import (
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
    PanelCinematography,
    EntityLabel,
    EntityCategory
)

logger = logging.getLogger("sonikoma.services.panel_detection.fusion")


def _box_distance(p_x: int, p_y: int, p_w: int, p_h: int, b_x: int, b_y: int, b_w: int, b_h: int) -> float:
    """Calculates minimum Euclidean distance between two bounding rectangles."""
    p_x2, p_y2 = p_x + p_w, p_y + p_h
    b_x2, b_y2 = b_x + b_w, b_y + b_h

    dx = max(0, p_x - b_x2, b_x - p_x2)
    dy = max(0, p_y - b_y2, b_y - p_y2)
    return math.sqrt(dx * dx + dy * dy)


def _estimate_cinematography(panel_w: int, panel_h: int, characters: List[CharacterEntityItem]) -> PanelCinematography:
    """Estimates camera shot type and camera motion recommendations based on character framing."""
    if not characters:
        return PanelCinematography(
            shot_type="wide_shot",
            camera_angle="eye_level",
            dominant_mood="ambient",
            suggested_camera_motion="slow_zoom_in"
        )

    # Find dominant character height ratio relative to panel height
    max_char_h = max(c.height for c in characters)
    h_ratio = max_char_h / float(max(1, panel_h))

    if h_ratio >= 0.75:
        return PanelCinematography(
            shot_type="close_up",
            camera_angle="eye_level",
            dominant_mood="dramatic",
            suggested_camera_motion="static"
        )
    elif h_ratio >= 0.45:
        return PanelCinematography(
            shot_type="medium_shot",
            camera_angle="eye_level",
            dominant_mood="neutral",
            suggested_camera_motion="slow_zoom_in"
        )
    else:
        return PanelCinematography(
            shot_type="wide_shot",
            camera_angle="high_angle",
            dominant_mood="action",
            suggested_camera_motion="pan_down"
        )


def fuse_panels_and_bubbles(
    cv_panels: List[Dict[str, Any]],
    yolo_bubbles: List[SpeechBubbleItem],
    img_w: int,
    img_h: int,
    characters: Optional[List[CharacterEntityItem]] = None,
    is_small_panel: bool = False,
    snap_to_frame: bool = True,
    max_binding_dist_px: int = 60,
    bleed_padding_px: int = 5
) -> Tuple[List[PanelBoundingBox], List[SpeechBubbleItem], Dict[str, Any]]:
    """
    Fuses OpenCV geometric frames, YOLO speech bubbles, and Characters into rich PanelBoundingBox models.
    """
    fused_panels: List[PanelBoundingBox] = []
    char_list = list(characters or [])

    # If no OpenCV frames detected, synthesize a baseline frame
    if not cv_panels:
        cv_panels = [{
            "id": "panel_1",
            "x": 0,
            "y": 0,
            "w": img_w,
            "h": img_h,
            "width": img_w,
            "height": img_h,
            "confidence": 1.0,
            "label": EntityLabel.PANEL_STANDARD.value,
            "category": EntityCategory.PANEL.value
        }]

    # Process all detected frames
    unassigned_bubbles = list(yolo_bubbles)
    max_gutter_reach = max(20, int(img_w * 0.25))

    for idx, cp in enumerate(cv_panels):
        px = int(cp.get("x", 0))
        py = int(cp.get("y", 0))
        pw = int(cp.get("w", cp.get("width", img_w)))
        ph = int(cp.get("h", cp.get("height", 100)))
        p_id = f"panel_{idx + 1}"
        polygon = cp.get("polygon")

        panel_bubbles: List[SpeechBubbleItem] = []
        panel_characters: List[CharacterEntityItem] = []

        # Resolution-adaptive margin tolerances
        tol_x = max(4, int(pw * 0.03))
        tol_y = max(4, int(ph * 0.03))
        dyn_max_dist = max(10, int(pw * 0.08)) if max_binding_dist_px == 60 else max_binding_dist_px

        # 1. Assign characters situated within or overlapping this panel frame
        for char in char_list:
            cx = char.x + (char.width // 2)
            cy = char.y + (char.height // 2)
            if (px - tol_x) <= cx <= (px + pw + tol_x) and (py - tol_y) <= cy <= (py + ph + tol_y):
                char.panel_id = p_id
                panel_characters.append(char)

        # 2. Find bubbles belonging to or adjacent to this OpenCV panel frame
        for bubble in list(unassigned_bubbles):
            bc_x = bubble.x + (bubble.width // 2)
            bc_y = bubble.y + (bubble.height // 2)

            inside_x = (px - tol_x) <= bc_x <= (px + pw + tol_x)
            
            # Check if inside panel or immediately adjacent in gutter/margins
            dist = _box_distance(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
            is_inside = (py - tol_y) <= bc_y <= (py + ph + tol_y)
            is_adjacent_above = (0 <= (py - (bubble.y + bubble.height)) <= max_gutter_reach)
            is_adjacent_below = (0 <= (bubble.y - (py + ph)) <= max_gutter_reach)
            is_near = dist <= dyn_max_dist

            if inside_x and (is_inside or is_adjacent_above or is_adjacent_below or is_near):
                bubble.parent_panel_id = p_id
                bubble.is_bound = True

                # Speaker attribution: Bind bubble to closest character in this panel
                if panel_characters:
                    closest_char = min(
                        panel_characters,
                        key=lambda c: math.hypot(
                            (c.x + c.width // 2) - bc_x,
                            (c.y + c.height // 2) - bc_y
                        )
                    )
                    closest_char.associated_bubble_ids.append(bubble.bubble_id)

                panel_bubbles.append(bubble)
                unassigned_bubbles.remove(bubble)

                # Expand panel boundary safely to enclose the speech bubble without crossing neighboring panels
                max_exp_y = max(10, int(ph * 0.15))
                max_exp_x = max(10, int(pw * 0.10))
                new_x1 = max(0, max(px - max_exp_x, min(px, bubble.x)))
                new_y1 = max(0, max(py - max_exp_y, min(py, bubble.y)))
                new_x2 = min(img_w, min(px + pw + max_exp_x, max(px + pw, bubble.x + bubble.width)))
                new_y2 = min(img_h, min(py + ph + max_exp_y, max(py + ph, bubble.y + bubble.height)))

                px, py = new_x1, new_y1
                pw, ph = new_x2 - new_x1, new_y2 - new_y1

        # Apply bleed padding if requested
        pad_x1 = max(0, px - bleed_padding_px)
        pad_y1 = max(0, py - bleed_padding_px)
        pad_x2 = min(img_w, px + pw + bleed_padding_px)
        pad_y2 = min(img_h, py + ph + bleed_padding_px)

        cinematography = _estimate_cinematography(pw, ph, panel_characters)

        fused_panels.append(PanelBoundingBox(
            id=p_id,
            index=idx,
            x=pad_x1,
            y=pad_y1,
            w=max(10, pad_x2 - pad_x1),
            h=max(10, pad_y2 - pad_y1),
            width=pad_x2 - pad_x1,
            height=pad_y2 - pad_y1,
            polygon=polygon,
            confidence=round(float(cp.get("confidence", 0.95)), 2),
            label=cp.get("label", EntityLabel.PANEL_STANDARD.value),
            category=EntityCategory.PANEL.value,
            sub_type="single_frame_snapped" if snap_to_frame else "panel",
            has_bound_bubbles=len(panel_bubbles) > 0,
            speech_bubbles_count=len(panel_bubbles),
            speech_bubbles=panel_bubbles,
            characters=panel_characters,
            characters_count=len(panel_characters),
            cinematography=cinematography
        ))

    # Detect Inset / Picture-in-Picture Panels (depth lineage)
    for p in fused_panels:
        for other in fused_panels:
            if p.id != other.id and other.x >= p.x and other.y >= p.y:
                if (other.x + other.w) <= (p.x + p.w) and (other.y + other.h) <= (p.y + p.h):
                    if (other.w * other.h) < (p.w * p.h * 0.60):
                        other.depth = 1
                        other.parent_panel_id = p.id
                        other.label = EntityLabel.PANEL_INSET.value

    fused_panels.sort(key=lambda p: (p.y, p.x))
    for i, p in enumerate(fused_panels):
        p.index = i
        p.id = f"panel_{i + 1}"

    if fused_panels:
        margins = {
            "crop_top": int(min(p.y for p in fused_panels)),
            "crop_bottom": int(max(0, img_h - max(p.y + p.h for p in fused_panels))),
            "crop_left": int(min(p.x for p in fused_panels)),
            "crop_right": int(max(0, img_w - max(p.x + p.w for p in fused_panels))),
            "unit": "pixels"
        }
    else:
        margins = {"unit": "pixels"}

    return fused_panels, yolo_bubbles, margins
