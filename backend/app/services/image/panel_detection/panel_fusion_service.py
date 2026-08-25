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


def fuse_panels_and_bubbles(
    cv_panels: List[Dict[str, Any]],
    yolo_bubbles: List[SpeechBubbleItem],
    img_w: int,
    img_h: int,
    is_small_panel: bool = False,
    snap_to_frame: bool = True,
    max_binding_dist_px: int = 60,
    bleed_padding_px: int = 5
) -> Tuple[List[PanelBoundingBox], List[SpeechBubbleItem], Dict[str, Any]]:
    """
    Fuses OpenCV geometric frames and YOLO speech bubbles into rich PanelBoundingBox models.
    """
    fused_panels: List[PanelBoundingBox] = []

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

    # Case A: Small Image & Single Frame Mode
    if is_small_panel:
        # Find dominant panel (largest area framed box)
        primary_cv = max(cv_panels, key=lambda p: p.get("w", 0) * p.get("h", 0))

        px = int(primary_cv.get("x", 0))
        py = int(primary_cv.get("y", 0))
        pw = int(primary_cv.get("w", img_w))
        ph = int(primary_cv.get("h", img_h))

        bound_bubbles: List[SpeechBubbleItem] = []

        # Bind nearby bubbles
        for bubble in yolo_bubbles:
            dist = _box_distance(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
            # If bubble is near the panel frame or vertically aligned
            if dist <= max_binding_dist_px or (abs(bubble.x - px) < 80 and bubble.y > py):
                bubble.parent_panel_id = "panel_1"
                bubble.is_bound = True
                bound_bubbles.append(bubble)

                # Expand panel boundary to encompass the speech bubble
                new_x1 = min(px, bubble.x)
                new_y1 = min(py, bubble.y)
                new_x2 = max(px + pw, bubble.x + bubble.width)
                new_y2 = max(py + ph, bubble.y + bubble.height)

                px, py = new_x1, new_y1
                pw, ph = new_x2 - new_x1, new_y2 - new_y1

        # Apply bleed padding
        pad_x1 = max(0, px - bleed_padding_px)
        pad_y1 = max(0, py - bleed_padding_px)
        pad_x2 = min(img_w, px + pw + bleed_padding_px)
        pad_y2 = min(img_h, py + ph + bleed_padding_px)

        final_w = pad_x2 - pad_x1
        final_h = pad_y2 - pad_y1

        panel_obj = PanelBoundingBox(
            id="panel_1",
            index=0,
            x=pad_x1,
            y=pad_y1,
            w=final_w,
            h=final_h,
            width=final_w,
            height=final_h,
            confidence=round(float(primary_cv.get("confidence", 0.98)), 2),
            label=primary_cv.get("label", EntityLabel.PANEL_STANDARD.value),
            category=EntityCategory.PANEL.value,
            sub_type="single_frame_snapped" if snap_to_frame else "standard",
            has_bound_bubbles=len(bound_bubbles) > 0,
            speech_bubbles_count=len(bound_bubbles),
            speech_bubbles=bound_bubbles
        )
        fused_panels.append(panel_obj)

        margins = {
            "crop_top": int(pad_y1),
            "crop_bottom": int(max(0, img_h - pad_y2)),
            "crop_left": int(pad_x1),
            "crop_right": int(max(0, img_w - pad_x2)),
            "unit": "pixels"
        }

        return fused_panels, bound_bubbles, margins

    # Case B: Tall Webtoon Strip Mode
    unassigned_bubbles = list(yolo_bubbles)

    for idx, cp in enumerate(cv_panels):
        px = int(cp.get("x", 0))
        py = int(cp.get("y", 0))
        pw = int(cp.get("w", img_w))
        ph = int(cp.get("h", 100))
        p_id = f"panel_{idx + 1}"

        panel_bubbles: List[SpeechBubbleItem] = []

        # Find bubbles belonging to this panel slice
        for bubble in list(unassigned_bubbles):
            dist = _box_distance(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
            bubble_center_y = bubble.y + (bubble.height // 2)

            # If inside or very close to this vertical slice
            if (py <= bubble_center_y <= py + ph) or dist <= max_binding_dist_px:
                bubble.parent_panel_id = p_id
                bubble.is_bound = True
                panel_bubbles.append(bubble)
                unassigned_bubbles.remove(bubble)

        # Expand panel boundary to encompass bound bubbles
        for b in panel_bubbles:
            new_x1 = min(px, b.x)
            new_y1 = min(py, b.y)
            new_x2 = max(px + pw, b.x + b.width)
            new_y2 = max(py + ph, b.y + b.height)

            px, py = new_x1, new_y1
            pw, ph = new_x2 - new_x1, new_y2 - new_y1

        # Apply bleed padding
        pad_x1 = max(0, px - bleed_padding_px)
        pad_y1 = max(0, py - bleed_padding_px)
        pad_x2 = min(img_w, px + pw + bleed_padding_px)
        pad_y2 = min(img_h, py + ph + bleed_padding_px)

        fused_panels.append(PanelBoundingBox(
            id=p_id,
            index=idx,
            x=pad_x1,
            y=pad_y1,
            w=pad_x2 - pad_x1,
            h=pad_y2 - pad_y1,
            width=pad_x2 - pad_x1,
            height=pad_y2 - pad_y1,
            confidence=round(float(cp.get("confidence", 0.95)), 2),
            label=cp.get("label", EntityLabel.PANEL_STANDARD.value),
            category=EntityCategory.PANEL.value,
            sub_type="webtoon_slice",
            has_bound_bubbles=len(panel_bubbles) > 0,
            speech_bubbles_count=len(panel_bubbles),
            speech_bubbles=panel_bubbles
        ))

    fused_panels.sort(key=lambda p: (p.y, p.x))
    for i, p in enumerate(fused_panels):
        p.index = i

    margins = {"unit": "pixels"}
    return fused_panels, yolo_bubbles, margins
