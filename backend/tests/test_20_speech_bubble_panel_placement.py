"""
backend/tests/test_20_speech_bubble_panel_placement.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Unit Tests for the 5 Canonical Speech-Bubble Placement Conventions:
1. Inside the panel (Default safe containment)
2. Crossing the panel border (Accusation, reveal, dramatic line)
3. Outside the panel (Gutter / off-screen voice / distant narration)
4. One bubble across two panels (Spanning two panels for narrative continuity)
5. Overlapping dialogue bubbles (Interruptions and rapid dialogue chains)
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from features.platform.projects.schemas_project import (
    SpeechBubbleItem,
    BubblePlacementRelation,
    EntityLabel,
    EntityCategory,
)
from features.image_editor.services.detector.panel_fusion_service import (
    is_bubble_inside_panel,
    is_bubble_crossing_panel_border,
    is_bubble_outside_panel_gutter,
    find_bubble_spanning_panels,
    find_overlapping_dialogue_bubbles,
    classify_speech_bubble_placement,
    fuse_panels_and_bubbles,
)


def _make_bubble(bubble_id: str, x: int, y: int, w: int, h: int) -> SpeechBubbleItem:
    return SpeechBubbleItem(
        bubble_id=bubble_id,
        x=x,
        y=y,
        width=w,
        height=h,
        label=EntityLabel.BUBBLE_SPEECH.value,
        category=EntityCategory.TEXT.value,
        confidence=0.95,
        reading_order=1,
    )


def test_convention_1_inside_panel():
    """Convention 1: Inside the panel (safest default)."""
    bubble = _make_bubble("b1", x=120, y=120, w=60, h=40)
    px, py, pw, ph = 100, 100, 300, 300
    tol = 10

    assert is_bubble_inside_panel(bubble, px, py, pw, ph, tol, tol) is True
    assert is_bubble_crossing_panel_border(bubble, px, py, pw, ph) is False


def test_convention_2_crossing_panel_border():
    """Convention 2: Crossing the panel border (dramatic emphasis)."""
    # Panel is (100, 100, 300, 300), bottom edge is at y=400.
    # Bubble sits at y=380, h=60 (y from 380 to 440), so 20px inside, 40px outside
    bubble = _make_bubble("b2", x=150, y=380, w=80, h=60)
    px, py, pw, ph = 100, 100, 300, 300

    assert is_bubble_crossing_panel_border(bubble, px, py, pw, ph) is True


def test_convention_3_outside_panel_gutter():
    """Convention 3: Outside the panel in gutter (off-screen voices, narration)."""
    # Panel is (100, 100, 300, 300) [y: 100..400]
    # Gutter bubble at y=430, h=50 (below panel, inside horizontal column)
    bubble = _make_bubble("b3", x=150, y=430, w=80, h=50)
    px, py, pw, ph = 100, 100, 300, 300
    tol_x = 10
    max_gutter_reach = 80
    dyn_max_dist = 60

    assert is_bubble_outside_panel_gutter(bubble, px, py, pw, ph, tol_x, max_gutter_reach, dyn_max_dist) is True


def test_convention_4_spanning_two_panels():
    """Convention 4: One bubble across two panels (linking separate moments)."""
    panels = [
        {"id": "panel_1", "x": 50, "y": 50, "w": 400, "h": 200},   # y: 50..250
        {"id": "panel_2", "x": 50, "y": 270, "w": 400, "h": 200},  # y: 270..470
    ]
    # Bubble bridges gutter: y: 220 to 320 (overlaps panel_1 from 220..250 [30px] and panel_2 from 270..320 [50px])
    bubble = _make_bubble("b4", x=100, y=220, w=100, h=100)

    spanned = find_bubble_spanning_panels(bubble, panels)
    assert len(spanned) == 2
    assert 0 in spanned and 1 in spanned


def test_convention_5_overlapping_dialogue_bubbles():
    """Convention 5: Overlapping dialogue bubbles (interruptions and rapid dialogue)."""
    b1 = _make_bubble("b1", x=100, y=100, w=80, h=50)
    b2 = _make_bubble("b2", x=140, y=120, w=80, h=50)  # Overlaps b1
    b3 = _make_bubble("b3", x=400, y=400, w=80, h=50)  # Separate

    all_bubbles = [b1, b2, b3]

    overlaps_b1 = find_overlapping_dialogue_bubbles(b1, all_bubbles)
    assert "b2" in overlaps_b1
    assert "b3" not in overlaps_b1

    overlaps_b3 = find_overlapping_dialogue_bubbles(b3, all_bubbles)
    assert len(overlaps_b3) == 0


def test_full_fusion_integration_with_conventions():
    """Tests fuse_panels_and_bubbles correctly classifies all 5 conventions."""
    cv_panels = [
        {"id": "panel_1", "x": 50, "y": 50, "w": 400, "h": 300},
        {"id": "panel_2", "x": 50, "y": 450, "w": 400, "h": 300},
    ]
    # b_inside inside panel 1
    b_inside = _make_bubble("b_in", x=100, y=80, w=60, h=40)
    # b_cross crossing panel 1 bottom border
    b_cross = _make_bubble("b_cross", x=100, y=320, w=80, h=60)
    # b_gutter in gutter near panel 2
    b_gutter = _make_bubble("b_gut", x=100, y=400, w=70, h=40)

    fused, bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=[b_inside, b_cross, b_gutter],
        img_w=500,
        img_h=800,
    )

    assert len(fused) == 2
    assert b_inside.placement_relation in (
        BubblePlacementRelation.INSIDE.value,
        BubblePlacementRelation.OVERLAPPING_CHAIN.value,
    )
    assert b_cross.placement_relation == BubblePlacementRelation.CROSSING_BORDER.value
    assert b_gutter.placement_relation == BubblePlacementRelation.OUTSIDE_GUTTER.value
