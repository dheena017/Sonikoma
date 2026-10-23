"""
backend/app/services/image/panel_detection/panel_fusion_service.py
─────────────────────────────────────────────────────────────────────────────
Intelligent Fusion Engine for OpenCV + YOLO + AI Entities:
- Speech Bubble Placement & Binding (5 Canonical Manga Conventions):
    1. Inside the panel (Default safe containment)
    2. Crossing the panel border (Accusation, reveal, dramatic line)
    3. Outside the panel / gutter (Off-screen voice, narration, distant speaker)
    4. One bubble across two panels (Transitional bridge across panels)
    5. Overlapping dialogue bubbles (Interruptions, rapid dialogue chains)
- Strict Non-Overlap Enforcement: Midpoint boundary clipping & sliver merging
- Safe Boundary Expansion: Capped by neighbouring-panel borders (Rule 6)
- Inset Panel Detection: Picture-in-picture sub-panels (depth = 1)
- Margin Calculation: Produces directional margins (crop_top/bottom/left/right)
─────────────────────────────────────────────────────────────────────────────
"""

import math
import logging
from typing import List, Dict, Any, Tuple, Optional, Set

from features.platform.projects.schemas_project import (
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
    PanelCinematography,
    EntityLabel,
    EntityCategory,
    BubblePlacementRelation,
)

logger = logging.getLogger("sonikoma.services.panel_detection.fusion")


# ── Geometry Helpers ──────────────────────────────────────────────────────────

def _box_distance(px: int, py: int, pw: int, ph: int, bx: int, by: int, bw: int, bh: int) -> float:
    """Minimum Euclidean distance between two axis-aligned rectangles (0 if overlapping)."""
    dx = max(0, px - (bx + bw), bx - (px + pw))
    dy = max(0, py - (by + bh), by - (py + ph))
    return math.sqrt(dx * dx + dy * dy)


def _box_intersection_area(
    x1: int, y1: int, w1: int, h1: int,
    x2: int, y2: int, w2: int, h2: int
) -> int:
    """Calculates the intersection area between two axis-aligned bounding boxes."""
    ix1 = max(x1, x2)
    iy1 = max(y1, y2)
    ix2 = min(x1 + w1, x2 + w2)
    iy2 = min(y1 + h1, y2 + h2)
    if ix2 > ix1 and iy2 > iy1:
        return (ix2 - ix1) * (iy2 - iy1)
    return 0


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


# ── Speech Bubble Placement Functions (5 Canonical Manga Conventions) ─────────

def is_bubble_inside_panel(
    bubble: SpeechBubbleItem,
    px: int,
    py: int,
    pw: int,
    ph: int,
    tol_x: int,
    tol_y: int,
) -> bool:
    """
    Convention 1: Inside the panel.
    Safest default. Bubble center or majority area is fully contained within the frame.
    Keeps the bubble and scene visually connected.
    """
    bc_x = bubble.x + bubble.width // 2
    bc_y = bubble.y + bubble.height // 2
    in_x = (px - tol_x) <= bc_x <= (px + pw + tol_x)
    in_y = (py - tol_y) <= bc_y <= (py + ph + tol_y)
    if not (in_x and in_y):
        return False

    bubble_area = max(1, bubble.width * bubble.height)
    inter_area = _box_intersection_area(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
    # If center is inside and intersection is high (>= 75%), it's squarely inside
    return (inter_area / bubble_area) >= 0.75 or (
        px <= bubble.x and (bubble.x + bubble.width) <= (px + pw) and
        py <= bubble.y and (bubble.y + bubble.height) <= (py + ph)
    )


def is_bubble_crossing_panel_border(
    bubble: SpeechBubbleItem,
    px: int,
    py: int,
    pw: int,
    ph: int,
) -> bool:
    """
    Convention 2: Crossing the panel border.
    Emphasizes an accusation, reveal, or dramatic line.
    Bubble intersects the panel border (partially inside, partially outside).
    """
    bubble_area = max(1, bubble.width * bubble.height)
    inter_area = _box_intersection_area(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
    if inter_area == 0:
        return False

    ratio = inter_area / bubble_area
    # Intersects border if between 15% and 85% is enclosed inside
    return 0.15 <= ratio < 0.85


def is_bubble_outside_panel_gutter(
    bubble: SpeechBubbleItem,
    px: int,
    py: int,
    pw: int,
    ph: int,
    tol_x: int,
    max_gutter_reach: int,
    dyn_max_dist: int,
) -> bool:
    """
    Convention 3: Outside the panel (gutter/margin).
    Useful for off-screen voices, narration, and distant speakers.
    Sits in the gutter margin near the panel frame.
    """
    bc_x = bubble.x + bubble.width // 2
    inside_x = (px - tol_x) <= bc_x <= (px + pw + tol_x)
    is_above_gutter = 0 <= (py - (bubble.y + bubble.height)) <= max_gutter_reach
    is_below_gutter = 0 <= (bubble.y - (py + ph)) <= max_gutter_reach
    is_near = _box_distance(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height) <= dyn_max_dist
    return inside_x and (is_above_gutter or is_below_gutter or is_near)


def find_bubble_spanning_panels(
    bubble: SpeechBubbleItem,
    ordered_panels: List[Dict[str, Any]],
) -> List[int]:
    """
    Convention 4: One bubble across two panels.
    Links separate moments and lets dialogue carry through a transition.
    Returns list of panel indices spanned by this bubble.
    """
    bubble_area = max(1, bubble.width * bubble.height)
    spanned_indices: List[int] = []

    for idx, cp in enumerate(ordered_panels):
        px = int(cp.get("x") or 0)
        py = int(cp.get("y") or 0)
        pw = int(cp.get("w") or cp.get("width") or 1)
        ph = int(cp.get("h") or cp.get("height") or 1)

        inter = _box_intersection_area(px, py, pw, ph, bubble.x, bubble.y, bubble.width, bubble.height)
        if (inter / bubble_area) >= 0.12:
            spanned_indices.append(idx)

    return spanned_indices


def find_overlapping_dialogue_bubbles(
    bubble: SpeechBubbleItem,
    all_bubbles: List[SpeechBubbleItem],
) -> List[str]:
    """
    Convention 5: Overlapping dialogue bubbles.
    Shows interruptions and rapid dialogue chains.
    Returns list of bubble_ids that geometrically overlap with this bubble.
    """
    overlapping_ids: List[str] = []
    for other in all_bubbles:
        if other.bubble_id == bubble.bubble_id:
            continue
        inter = _box_intersection_area(
            bubble.x, bubble.y, bubble.width, bubble.height,
            other.x, other.y, other.width, other.height
        )
        if inter > 0:
            overlapping_ids.append(other.bubble_id)
    return overlapping_ids


def classify_speech_bubble_placement(
    bubble: SpeechBubbleItem,
    assigned_panel_idx: Optional[int],
    ordered_panels: List[Dict[str, Any]],
    all_bubbles: List[SpeechBubbleItem],
    tol_x: int,
    tol_y: int,
    max_gutter_reach: int,
    dyn_max_dist: int,
) -> str:
    """
    Determines and attaches the canonical placement convention (1-5) to a speech bubble.
    """
    # 5. Check overlapping dialogue bubbles
    overlaps = find_overlapping_dialogue_bubbles(bubble, all_bubbles)
    if overlaps:
        bubble.overlapping_bubble_ids = overlaps

    # 4. Check spanning multiple panels
    spanned = find_bubble_spanning_panels(bubble, ordered_panels)
    if len(spanned) >= 2:
        bubble.spanning_panel_ids = [f"panel_{i + 1}" for i in spanned]
        if overlaps:
            bubble.placement_relation = BubblePlacementRelation.OVERLAPPING_CHAIN.value
        else:
            bubble.placement_relation = BubblePlacementRelation.SPANNING_PANELS.value
        return bubble.placement_relation

    if assigned_panel_idx is not None and 0 <= assigned_panel_idx < len(ordered_panels):
        cp = ordered_panels[assigned_panel_idx]
        px = int(cp.get("x") or 0)
        py = int(cp.get("y") or 0)
        pw = int(cp.get("w") or cp.get("width") or 1)
        ph = int(cp.get("h") or cp.get("height") or 1)

        # 1. Inside the panel
        if is_bubble_inside_panel(bubble, px, py, pw, ph, tol_x, tol_y):
            bubble.placement_relation = BubblePlacementRelation.INSIDE.value
        # 2. Crossing the panel border
        elif is_bubble_crossing_panel_border(bubble, px, py, pw, ph):
            bubble.placement_relation = BubblePlacementRelation.CROSSING_BORDER.value
        # 3. Outside in gutter
        elif is_bubble_outside_panel_gutter(bubble, px, py, pw, ph, tol_x, max_gutter_reach, dyn_max_dist):
            bubble.placement_relation = BubblePlacementRelation.OUTSIDE_GUTTER.value
        else:
            bubble.placement_relation = BubblePlacementRelation.INSIDE.value
    else:
        bubble.placement_relation = BubblePlacementRelation.OUTSIDE_GUTTER.value

    if overlaps and bubble.placement_relation == BubblePlacementRelation.INSIDE.value:
        bubble.placement_relation = BubblePlacementRelation.OVERLAPPING_CHAIN.value

    return bubble.placement_relation


# ── Modular Fusion Step Functions ─────────────────────────────────────────────

def synthesize_baseline_panels(
    cv_panels: List[Dict[str, Any]],
    img_w: int,
    img_h: int
) -> List[Dict[str, Any]]:
    """Synthesises a full-image baseline panel when no frames were detected."""
    if cv_panels:
        return cv_panels
    return [{
        "id": "panel_1",
        "x": 0, "y": 0,
        "w": img_w, "h": img_h,
        "width": img_w, "height": img_h,
        "confidence": 1.0,
        "label": EntityLabel.PANEL_STANDARD.value,
        "category": EntityCategory.PANEL.value,
    }]


def assign_characters_to_panels(
    char_list: List[CharacterEntityItem],
    ordered_panels: List[Dict[str, Any]],
    img_w: int,
) -> Dict[int, List[CharacterEntityItem]]:
    """Assigns character silhouettes to their host panels based on center of mass."""
    panel_char_map: Dict[int, List[CharacterEntityItem]] = {idx: [] for idx in range(len(ordered_panels))}
    for char in char_list:
        cx = char.x + char.width // 2
        cy = char.y + char.height // 2

        for idx, cp in enumerate(ordered_panels):
            px = int(cp.get("x") or 0)
            py = int(cp.get("y") or 0)
            pw = int(cp.get("w") or cp.get("width") or img_w)
            ph = int(cp.get("h") or cp.get("height") or 100)
            tol_x = max(4, int(pw * 0.03))
            tol_y = max(4, int(ph * 0.03))

            if (px - tol_x) <= cx <= (px + pw + tol_x) and (py - tol_y) <= cy <= (py + ph + tol_y):
                char.panel_id = f"panel_{idx + 1}"
                panel_char_map[idx].append(char)
                break

    return panel_char_map


def bind_bubbles_to_characters(
    panel_characters: List[CharacterEntityItem],
    bound_bubbles: List[SpeechBubbleItem],
) -> None:
    """Binds nearest dialogue bubble IDs to character entities inside the panel."""
    if not panel_characters:
        return

    for bubble in bound_bubbles:
        bc_x = bubble.x + bubble.width // 2
        bc_y = bubble.y + bubble.height // 2

        closest = min(
            panel_characters,
            key=lambda c: math.hypot(
                (c.x + c.width // 2) - bc_x,
                (c.y + c.height // 2) - bc_y,
            ),
        )
        if bubble.bubble_id not in closest.associated_bubble_ids:
            closest.associated_bubble_ids.append(bubble.bubble_id)


def expand_panel_boundary_for_bubble(
    px: int,
    py: int,
    pw: int,
    ph: int,
    bubble: SpeechBubbleItem,
    prev_y2: int,
    next_y1: int,
    img_w: int,
) -> Tuple[int, int, int, int]:
    """
    Safely expands a panel's boundary to fully enclose an adjacent/crossing speech bubble.
    Guaranteed: Capped by neighbouring-panel edges so panels never grow into each other (Rule 6).
    """
    bubble_pad_y = max(4, int(bubble.height * 0.05))
    bubble_pad_x = max(4, int(bubble.width * 0.05))

    new_x1 = max(0,       min(px, bubble.x - bubble_pad_x))
    new_y1 = max(prev_y2, min(py, bubble.y - bubble_pad_y))           # Capped by prev panel
    new_x2 = min(img_w,   max(px + pw, bubble.x + bubble.width + bubble_pad_x))
    new_y2 = min(next_y1, max(py + ph, bubble.y + bubble.height + bubble_pad_y))  # Capped by next panel

    return new_x1, new_y1, max(1, new_x2 - new_x1), max(1, new_y2 - new_y1)


def apply_bleed_padding(
    px: int,
    py: int,
    pw: int,
    ph: int,
    bleed_padding_px: int,
    img_w: int,
    img_h: int,
) -> Tuple[int, int, int, int]:
    """Applies bleed padding clamped safely within image boundaries."""
    pad_x1 = max(0,     px - bleed_padding_px)
    pad_y1 = max(0,     py - bleed_padding_px)
    pad_x2 = min(img_w, px + pw + bleed_padding_px)
    pad_y2 = min(img_h, py + ph + bleed_padding_px)
    return pad_x1, pad_y1, max(10, pad_x2 - pad_x1), max(10, pad_y2 - pad_y1)


def detect_and_mark_inset_panels(panels: List[PanelBoundingBox]) -> None:
    """Marks picture-in-picture panels (depth = 1, parent_panel_id, PANEL_INSET)."""
    for p in panels:
        for other in panels:
            if (p.id != other.id
                    and other.x >= p.x and other.y >= p.y
                    and (other.x + other.w) <= (p.x + p.w)
                    and (other.y + other.h) <= (p.y + p.h)
                    and (other.w * other.h) < (p.w * p.h * 0.60)):
                other.depth = 1
                other.parent_panel_id = p.id
                other.label = EntityLabel.PANEL_INSET.value


def enforce_strict_non_overlap(
    fused_panels: List[PanelBoundingBox],
    img_w: int,
) -> List[PanelBoundingBox]:
    """
    Safety sweep: Clips residual vertical overlaps at the midpoint boundary.
    Merges tiny fragments (< 100px) cleanly instead of leaving broken slivers.
    """
    fused_panels.sort(key=lambda p: (p.y, p.x))

    for i in range(len(fused_panels) - 1):
        cur = fused_panels[i]
        nxt = fused_panels[i + 1]
        cur_y2 = cur.y + cur.h
        if cur_y2 <= nxt.y:
            continue

        # Verify panels actually share horizontal column space before vertical clipping
        cur_x2 = cur.x + cur.w
        nxt_x2 = nxt.x + nxt.w
        x_overlap = min(cur_x2, nxt_x2) - max(cur.x, nxt.x)
        if x_overlap <= max(15, int(img_w * 0.05)):
            continue

        overlap_px = cur_y2 - nxt.y
        boundary = (cur_y2 + nxt.y) // 2
        new_h_cur = boundary - cur.y
        nxt_orig_y2 = nxt.y + nxt.h
        new_h_nxt = nxt_orig_y2 - boundary

        # Merge tiny fragments (< 100px) rather than leaving an unnatural ribbon
        if new_h_cur < 100 or new_h_nxt < 100:
            merged_y1 = min(cur.y, nxt.y)
            merged_y2 = max(cur_y2, nxt_orig_y2)
            merged_x1 = min(cur.x, nxt.x)
            merged_x2 = max(cur_x2, nxt_x2)
            nxt.x = merged_x1
            nxt.y = merged_y1
            nxt.w = nxt.width = merged_x2 - merged_x1

            seen_bubble_keys: Set[Any] = set()
            merged_bubbles: List[SpeechBubbleItem] = []
            for b in (cur.speech_bubbles or []) + (nxt.speech_bubbles or []):
                b_key = getattr(b, "bubble_id", None) or (b.x, b.y, b.width, b.height)
                if b_key not in seen_bubble_keys:
                    seen_bubble_keys.add(b_key)
                    merged_bubbles.append(b)
            nxt.speech_bubbles = merged_bubbles
            nxt.speech_bubbles_count = len(nxt.speech_bubbles)
            cur.h = cur.height = 0  # Mark to drop
            continue

        logger.debug(
            "[Panel Fusion] Non-overlap clip: panel %d y2 %d→%d, panel %d y1 %d→%d (overlap=%dpx)",
            i, cur_y2, boundary, i + 1, nxt.y, boundary, overlap_px,
        )
        cur.h = cur.height = max(10, new_h_cur)
        nxt.y = boundary
        nxt.h = nxt.height = max(10, new_h_nxt)

    valid_panels = [p for p in fused_panels if p.h >= 60]

    # Re-index reading order
    for i, p in enumerate(valid_panels):
        p.index = i
        p.id = f"panel_{i + 1}"

    return valid_panels


def compute_crop_margins(
    panels: List[PanelBoundingBox],
    img_w: int,
    img_h: int,
) -> Dict[str, Any]:
    """Calculates clean outer directional crop margins."""
    if not panels:
        return {"unit": "pixels"}
    return {
        "crop_top": int(min(p.y for p in panels)),
        "crop_bottom": int(max(0, img_h - max(p.y + p.h for p in panels))),
        "crop_left": int(min(p.x for p in panels)),
        "crop_right": int(max(0, img_w - max(p.x + p.w for p in panels))),
        "unit": "pixels",
    }


# ── Main Orchestrator ─────────────────────────────────────────────────────────

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
    rich PanelBoundingBox objects with 5 canonical bubble placement conventions.

    Key guarantees:
    - Bubble-driven boundary expansion is capped at neighbouring-panel edges (Rule 6).
    - Strict non-overlap enforcement clips residual vertical overlaps at midpoint boundaries.
    - Full classification of all 5 speech bubble placement conventions.
    """
    char_list = list(characters or [])
    logger.info(
        "[Panel Fusion] Fusing %d CV frame(s), %d bubble(s), %d character(s) on %dx%d image",
        len(cv_panels), len(yolo_bubbles), len(char_list), img_w, img_h,
    )

    # 1. Synthesise full-image baseline if no frames detected
    ordered = synthesize_baseline_panels(cv_panels, img_w, img_h)
    ordered = sorted(ordered, key=lambda p: (_raw_y1(p), int(p.get("x") or 0)))
    n = len(ordered)

    # 2. Assign characters to panels
    panel_char_map = assign_characters_to_panels(char_list, ordered, img_w)

    # 3. Pre-pass: Assign speech bubbles by strict containment (Convention 1 & 2)
    unassigned_bubbles: List[SpeechBubbleItem] = list(yolo_bubbles)
    panel_bubble_map: Dict[int, List[SpeechBubbleItem]] = {idx: [] for idx in range(n)}
    bound_bubble_ids: Set[str] = set()

    max_gutter_reach = max(20, int(img_w * 0.25))

    for bubble in list(unassigned_bubbles):
        bc_x = bubble.x + bubble.width // 2
        bc_y = bubble.y + bubble.height // 2

        for idx, cp in enumerate(ordered):
            px = int(cp.get("x") or 0)
            py = int(cp.get("y") or 0)
            pw = int(cp.get("w") or cp.get("width") or img_w)
            ph = int(cp.get("h") or cp.get("height") or 100)
            tol_x = max(4, int(pw * 0.03))
            tol_y = max(4, int(ph * 0.03))

            # Convention 1: Inside or Convention 2: Crossing
            if is_bubble_inside_panel(bubble, px, py, pw, ph, tol_x, tol_y) or (
                (px - tol_x) <= bc_x <= (px + pw + tol_x) and (py - tol_y) <= bc_y <= (py + ph + tol_y)
            ):
                bubble.parent_panel_id = f"panel_{idx + 1}"
                bubble.is_bound = True
                classify_speech_bubble_placement(
                    bubble=bubble,
                    assigned_panel_idx=idx,
                    ordered_panels=ordered,
                    all_bubbles=yolo_bubbles,
                    tol_x=tol_x,
                    tol_y=tol_y,
                    max_gutter_reach=max_gutter_reach,
                    dyn_max_dist=max_binding_dist_px,
                )
                panel_bubble_map[idx].append(bubble)
                bound_bubble_ids.add(bubble.bubble_id)
                unassigned_bubbles.remove(bubble)
                break

    # 4. Panel Iteration: Bind gutter/orphan bubbles and expand panel boundaries
    fused_panels: List[PanelBoundingBox] = []

    for idx, cp in enumerate(ordered):
        px = int(cp.get("x") or 0)
        py = int(cp.get("y") or 0)
        pw = int(cp.get("w") or cp.get("width") or img_w)
        ph = int(cp.get("h") or cp.get("height") or 100)
        p_id = f"panel_{idx + 1}"
        polygon = cp.get("polygon")

        prev_y2 = _raw_y2(ordered[idx - 1]) if idx > 0 else 0
        next_y1 = _raw_y1(ordered[idx + 1]) if idx < n - 1 else img_h

        tol_x = max(4, int(pw * 0.03))
        tol_y = max(4, int(ph * 0.03))
        dyn_max_dist = max(10, int(pw * 0.08)) if max_binding_dist_px == 60 else max_binding_dist_px

        panel_bubbles = list(panel_bubble_map.get(idx, []))
        panel_characters = list(panel_char_map.get(idx, []))

        # Bind unassigned gutter/orphan bubbles (Convention 3)
        for bubble in list(unassigned_bubbles):
            if not is_bubble_outside_panel_gutter(bubble, px, py, pw, ph, tol_x, max_gutter_reach, dyn_max_dist):
                continue

            bubble.parent_panel_id = p_id
            bubble.is_bound = True
            classify_speech_bubble_placement(
                bubble=bubble,
                assigned_panel_idx=idx,
                ordered_panels=ordered,
                all_bubbles=yolo_bubbles,
                tol_x=tol_x,
                tol_y=tol_y,
                max_gutter_reach=max_gutter_reach,
                dyn_max_dist=dyn_max_dist,
            )
            panel_bubbles.append(bubble)
            bound_bubble_ids.add(bubble.bubble_id)
            unassigned_bubbles.remove(bubble)

            # Expand panel boundary to enclose the bubble (Rule 6 safe clamp)
            px, py, pw, ph = expand_panel_boundary_for_bubble(
                px, py, pw, ph, bubble, prev_y2, next_y1, img_w
            )

        # Bind bubbles to character entities
        bind_bubbles_to_characters(panel_characters, panel_bubbles)

        # Apply bleed padding
        pad_x1, pad_y1, pad_w, pad_h = apply_bleed_padding(
            px, py, pw, ph, bleed_padding_px, img_w, img_h
        )

        fused_panels.append(PanelBoundingBox(
            id=p_id,
            index=idx,
            x=pad_x1,
            y=pad_y1,
            w=pad_w,
            h=pad_h,
            width=pad_w,
            height=pad_h,
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

    # Classify any remaining unassigned bubbles (distant narration, multi-panel spanning)
    for bubble in unassigned_bubbles:
        bubble.is_bound = False
        classify_speech_bubble_placement(
            bubble=bubble,
            assigned_panel_idx=None,
            ordered_panels=ordered,
            all_bubbles=yolo_bubbles,
            tol_x=10,
            tol_y=10,
            max_gutter_reach=max_gutter_reach,
            dyn_max_dist=max_binding_dist_px,
        )

    # 5. Detect inset / picture-in-picture panels
    detect_and_mark_inset_panels(fused_panels)

    # 6. Enforce strict non-overlap & sliver resolution
    fused_panels = enforce_strict_non_overlap(fused_panels, img_w)

    # 7. Compute outer crop margins
    margins = compute_crop_margins(fused_panels, img_w, img_h)

    logger.info("[Panel Fusion] Done: %d panel(s) produced.", len(fused_panels))
    return fused_panels, yolo_bubbles, margins
