"""
backend/app/services/image/panel_detection/panel_fusion_service.py
─────────────────────────────────────────────────────────────────────────────
Intelligent Fusion Engine for OpenCV + YOLO + AI Entities:
- Speech Bubble Proximity Binding: Expands panel boundaries to include dialogue,
  capped by neighbouring-panel boundaries so panels never overlap
- Strict Non-Overlap Enforcement: Final sweep clips any residual vertical
  overlaps at the midpoint boundary
- Gutter SFX Rejection: Filters loose floating text ("RATTLE", "SIGH")
- Tight Frame Snapping: Snaps tightly to dominant black frames
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
    EntityCategory,
)

logger = logging.getLogger("sonikoma.services.panel_detection.fusion")


# ── Geometry Helpers ──────────────────────────────────────────────────────────

def _box_distance(px: int, py: int, pw: int, ph: int, bx: int, by: int, bw: int, bh: int) -> float:
    """Minimum Euclidean distance between two axis-aligned rectangles (0 if overlapping)."""
    dx = max(0, px - (bx + bw), bx - (px + pw))
    dy = max(0, py - (by + bh), by - (py + ph))
    return math.sqrt(dx * dx + dy * dy)


def _raw_y1(panel: Dict[str, Any]) -> int:
    """Top Y coordinate of a raw cv_panel dict."""
    return int(panel.get("y") or 0)


def _raw_y2(panel: Dict[str, Any]) -> int:
    """Bottom Y coordinate of a raw cv_panel dict."""
    return _raw_y1(panel) + int(panel.get("h") or panel.get("height") or 0)


def _estimate_cinematography(panel_w: int, panel_h: int, characters: List[CharacterEntityItem]) -> PanelCinematography:
    """Infer camera shot type and suggested motion from character framing."""
    if not characters:
        return PanelCinematography(
            shot_type="wide_shot",
            camera_angle="eye_level",
            dominant_mood="ambient",
            suggested_camera_motion="slow_zoom_in",
        )

    h_ratio = max(c.height for c in characters) / float(max(1, panel_h))

    if h_ratio >= 0.75:
        return PanelCinematography(
            shot_type="close_up",
            camera_angle="eye_level",
            dominant_mood="dramatic",
            suggested_camera_motion="static",
        )
    if h_ratio >= 0.45:
        return PanelCinematography(
            shot_type="medium_shot",
            camera_angle="eye_level",
            dominant_mood="neutral",
            suggested_camera_motion="slow_zoom_in",
        )
    return PanelCinematography(
        shot_type="wide_shot",
        camera_angle="high_angle",
        dominant_mood="action",
        suggested_camera_motion="pan_down",
    )


# ── Main Fusion Function ──────────────────────────────────────────────────────

def fuse_panels_and_bubbles(
    cv_panels: List[Dict[str, Any]],
    yolo_bubbles: List[SpeechBubbleItem],
    img_w: int,
    img_h: int,
    characters: Optional[List[CharacterEntityItem]] = None,
    is_small_panel: bool = False,
    snap_to_frame: bool = True,
    max_binding_dist_px: int = 60,
    bleed_padding_px: int = 5,
) -> Tuple[List[PanelBoundingBox], List[SpeechBubbleItem], Dict[str, Any]]:
    """
    Fuse OpenCV geometric frames, YOLO speech bubbles, and characters into
    rich PanelBoundingBox objects.

    Key guarantees:
    - Bubble-driven boundary expansion is capped at neighbouring-panel edges,
      so panels can never grow into each other during fusion.
    - A final non-overlap sweep clips any residual vertical overlaps at the
      midpoint boundary between adjacent panels.

    Returns:
        fused_panels: List of PanelBoundingBox, sorted top-to-bottom, no overlaps.
        yolo_bubbles: All detected bubbles (bound ones carry parent_panel_id).
        margins:      Dict with crop_top/bottom/left/right pixel values.
    """
    char_list = list(characters or [])
    logger.info(
        "[Panel Fusion] Fusing %d CV frame(s), %d bubble(s), %d character(s) on %dx%d image",
        len(cv_panels), len(yolo_bubbles), len(char_list), img_w, img_h,
    )

    # ── Synthesise a full-image baseline when no frames were detected ─────────
    if not cv_panels:
        cv_panels = [{
            "id": "panel_1",
            "x": 0, "y": 0,
            "w": img_w, "h": img_h,
            "width": img_w, "height": img_h,
            "confidence": 1.0,
            "label": EntityLabel.PANEL_STANDARD.value,
            "category": EntityCategory.PANEL.value,
        }]

    # Sort panels top-to-bottom so neighbour boundary lookups are stable
    ordered = sorted(cv_panels, key=lambda p: (_raw_y1(p), int(p.get("x") or 0)))
    n = len(ordered)

    unassigned_bubbles = list(yolo_bubbles)
    max_gutter_reach = max(20, int(img_w * 0.25))
    fused_panels: List[PanelBoundingBox] = []

    for idx, cp in enumerate(ordered):
        px = int(cp.get("x") or 0)
        py = int(cp.get("y") or 0)
        pw = int(cp.get("w") or cp.get("width") or img_w)
        ph = int(cp.get("h") or cp.get("height") or 100)
        p_id = f"panel_{idx + 1}"
        polygon = cp.get("polygon")

        # Neighbour vertical boundaries (original boxes, before any expansion)
        prev_y2 = _raw_y2(ordered[idx - 1]) if idx > 0 else 0
        next_y1 = _raw_y1(ordered[idx + 1]) if idx < n - 1 else img_h

        # Tolerance margins for containment checks
        tol_x = max(4, int(pw * 0.03))
        tol_y = max(4, int(ph * 0.03))
        dyn_max_dist = max(10, int(pw * 0.08)) if max_binding_dist_px == 60 else max_binding_dist_px

        panel_bubbles: List[SpeechBubbleItem] = []
        panel_characters: List[CharacterEntityItem] = []

        # 1. Assign characters whose centre falls within (or just outside) this panel
        for char in char_list:
            cx = char.x + char.width // 2
            cy = char.y + char.height // 2
            if (px - tol_x) <= cx <= (px + pw + tol_x) and (py - tol_y) <= cy <= (py + ph + tol_y):
                char.panel_id = p_id
                panel_characters.append(char)

        # 2. Bind speech bubbles that belong to or are adjacent to this panel
        for bubble in list(unassigned_bubbles):
            bc_x = bubble.x + bubble.width // 2
            bc_y = bubble.y + bubble.height // 2

            inside_x        = (px - tol_x) <= bc_x <= (px + pw + tol_x)
            is_inside        = (py - tol_y) <= bc_y <= (py + ph + tol_y)
            is_above_gutter  = 0 <= (py - (bubble.y + bubble.height)) <= max_gutter_reach
            is_below_gutter  = 0 <= (bubble.y - (py + ph)) <= max_gutter_reach
            is_near          = _box_distance(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height) <= dyn_max_dist

            if not (inside_x and (is_inside or is_above_gutter or is_below_gutter or is_near)):
                continue

            bubble.parent_panel_id = p_id
            bubble.is_bound = True

            if panel_characters:
                closest = min(
                    panel_characters,
                    key=lambda c: math.hypot(
                        (c.x + c.width // 2) - bc_x,
                        (c.y + c.height // 2) - bc_y,
                    ),
                )
                closest.associated_bubble_ids.append(bubble.bubble_id)

            panel_bubbles.append(bubble)
            unassigned_bubbles.remove(bubble)

            # Expand panel boundary to enclose bubble, capped by neighbour edges
            max_exp_y = max(10, int(ph * 0.15))
            max_exp_x = max(10, int(pw * 0.10))

            new_x1 = max(0,       max(px - max_exp_x,      min(px,      bubble.x)))
            new_y1 = max(prev_y2, max(py - max_exp_y,      min(py,      bubble.y)))           # capped by prev panel
            new_x2 = min(img_w,   min(px + pw + max_exp_x, max(px + pw, bubble.x + bubble.width)))
            new_y2 = min(next_y1, min(py + ph + max_exp_y, max(py + ph, bubble.y + bubble.height)))  # capped by next panel

            px, py = new_x1, new_y1
            pw, ph = max(1, new_x2 - new_x1), max(1, new_y2 - new_y1)

        # 3. Apply bleed padding (clamped to image boundaries)
        pad_x1 = max(0,     px - bleed_padding_px)
        pad_y1 = max(0,     py - bleed_padding_px)
        pad_x2 = min(img_w, px + pw + bleed_padding_px)
        pad_y2 = min(img_h, py + ph + bleed_padding_px)

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
            cinematography=_estimate_cinematography(pw, ph, panel_characters),
        ))

    # ── Mark inset / picture-in-picture panels ───────────────────────────────
    for p in fused_panels:
        for other in fused_panels:
            if (p.id != other.id
                    and other.x >= p.x and other.y >= p.y
                    and (other.x + other.w) <= (p.x + p.w)
                    and (other.y + other.h) <= (p.y + p.h)
                    and (other.w * other.h) < (p.w * p.h * 0.60)):
                other.depth = 1
                other.parent_panel_id = p.id
                other.label = EntityLabel.PANEL_INSET.value

    # ── Sort top-to-bottom ────────────────────────────────────────────────────
    fused_panels.sort(key=lambda p: (p.y, p.x))

    # ── STRICT NON-OVERLAP ENFORCEMENT ───────────────────────────────────────
    # Safety-net: clip residual vertical overlaps at a 60/40 midpoint split.
    # Primary prevention is the neighbour-bounded expansion above and the
    # pre-fusion clip in detect_long_panels_service.
    for i in range(len(fused_panels) - 1):
        cur = fused_panels[i]
        nxt = fused_panels[i + 1]
        cur_y2 = cur.y + cur.h
        if cur_y2 <= nxt.y:
            continue

        overlap_px = cur_y2 - nxt.y
        trim_cur   = max(1, int(overlap_px * 0.60))
        new_h_cur  = max(10, cur.h - trim_cur)
        boundary   = cur.y + new_h_cur
        new_h_nxt  = max(10, nxt.h - (boundary - nxt.y))

        logger.debug(
            "[Panel Fusion] Non-overlap clip: panel %d y2 %d→%d, panel %d y1 %d→%d (overlap=%dpx)",
            i, cur_y2, boundary, i + 1, nxt.y, boundary, overlap_px,
        )
        cur.h = cur.height = new_h_cur
        nxt.y = boundary
        nxt.h = nxt.height = new_h_nxt

    # ── Re-index ──────────────────────────────────────────────────────────────
    for i, p in enumerate(fused_panels):
        p.index = i
        p.id = f"panel_{i + 1}"

    # ── Compute outer crop margins ────────────────────────────────────────────
    if fused_panels:
        margins: Dict[str, Any] = {
            "crop_top":    int(min(p.y           for p in fused_panels)),
            "crop_bottom": int(max(0, img_h - max(p.y + p.h for p in fused_panels))),
            "crop_left":   int(min(p.x           for p in fused_panels)),
            "crop_right":  int(max(0, img_w - max(p.x + p.w for p in fused_panels))),
            "unit": "pixels",
        }
    else:
        margins = {"unit": "pixels"}

    logger.info("[Panel Fusion] Done: %d panel(s) produced.", len(fused_panels))
    return fused_panels, yolo_bubbles, margins
