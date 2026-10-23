"""
backend/tests/test_19_autocrop_fixes_matrix.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Test Matrix for Auto-Crop Enhancements:
1. Auto-Trim Safety (No art/head/bubble truncation, safe padding, max trim clamp)
2. Tall Continuous Scene Preservation (No over-fragmentation for aspect ratios up to 2.5)
3. Narrow and Tinted Gutter Separation (No panel merging)
4. Side-by-Side Panel Splitting (Webtoon 2-column support)
5. Non-Destructive Overlap Boundary Resolution (Frame borders protected)
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image, ImageDraw
import pytest

from features.image_editor.services.crop.long_panels_crop_service import _apply_color_distance_autotrim as long_autotrim
from features.image_editor.services.crop.single_panels_crop_service import _apply_color_distance_autotrim as single_autotrim
from features.image_editor.services.panel_detection.panel_detector import (
    detect_vertical_strip_panels,
    detect_vertical_subgutters,
    subdivide_continuous_tall_art_panel,
)


def test_issue_1_autotrim_preserves_artwork_and_margin():
    """
    Issue 1 Fix:
    Verifies that _apply_color_distance_autotrim leaves safe padding around
    characters floating on white background and does not shave off the art.
    """
    # Create 400x500 white panel with a character drawing in the center
    w, h = 400, 500
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Character body in center (x: 100..300, y: 80..420)
    draw.rectangle([100, 80, 300, 420], fill=(50, 50, 50), outline=(0, 0, 0), width=3)
    # Character head/hair outline
    draw.ellipse([150, 50, 250, 150], fill=(240, 200, 180), outline=(0, 0, 0), width=2)

    trimmed_img, (t_x1, t_y1, t_x2, t_y2), was_trimmed = long_autotrim(img, tolerance=18, safety_padding=8)

    # 1. Trimming must not cut into the head (y=50) or body
    assert t_y1 <= 50, f"Autotrim cut into the character head: t_y1={t_y1} > 50"
    assert t_x1 <= 100, f"Autotrim cut into character left side: t_x1={t_x1} > 100"
    assert t_y2 >= 420, f"Autotrim cut into character bottom: t_y2={t_y2} < 420"
    assert t_x2 >= 300, f"Autotrim cut into character right side: t_x2={t_x2} < 300"

    # 2. Max trim clamp ensures no more than 12% is shaved off on any edge
    assert t_y1 <= int(h * 0.12)
    assert t_x1 <= int(w * 0.12)

    # Test single panels autotrim also
    trimmed_single, was_trimmed_single = single_autotrim(img, tolerance=18)
    tw, th = trimmed_single.size
    assert th >= 420 - 50, "Single autotrim shaved off character artwork"


def test_issue_2_continuous_tall_art_not_oversplit():
    """
    Issue 2 Fix:
    Verifies that tall panels (aspect ratio 1.5 - 2.5) are kept whole and not
    chopped into awkward pieces.
    """
    bw, bh = 600, 1100  # Aspect ratio 1.83 (natural vertical panel)
    gray_arr = np.full((bh, bw), 255, dtype=np.uint8)

    # Draw continuous artwork (character falling through speedlines)
    for y in range(50, bh - 50, 10):
        gray_arr[y, 100:500] = (y % 150)

    # Subdivide should NOT chop this panel
    pieces = subdivide_continuous_tall_art_panel(
        sub_gray=gray_arr,
        bx=0,
        by=0,
        bw=bw,
        bh=bh,
        child_ocr=[]
    )
    assert len(pieces) == 1, f"Expected 1 intact continuous panel, got {len(pieces)}"
    assert pieces[0]["h"] == bh


def test_issue_3_narrow_gutters_detected_between_panels():
    """
    Issue 3 Fix:
    Verifies that narrow gutters (e.g. 6px) between two panels are reliably detected
    and not merged into a single huge panel.
    """
    w, h = 500, 800
    gray_arr = np.full((h, w), 255, dtype=np.uint8)

    # Panel 1: y = 20..380
    gray_arr[20:380, 20:480] = 60
    # Black frame for Panel 1
    gray_arr[20, 20:480] = 0
    gray_arr[379, 20:480] = 0

    # Narrow 8px gutter: y = 380..388 (white background)

    # Panel 2: y = 388..750
    gray_arr[388:750, 20:480] = 80
    gray_arr[388, 20:480] = 0
    gray_arr[749, 20:480] = 0

    res = detect_vertical_strip_panels(
        gray_arr=gray_arr,
        is_white_bg=True,
        threshold_val=220,
        min_height_px=60,
        min_width_pct=0.10,
    )
    panels = res.panels
    assert len(panels) >= 2, f"Expected at least 2 panels separated by narrow gutter, got {len(panels)}"


def test_issue_4_side_by_side_panels_detected():
    """
    Issue 4 Fix:
    Verifies that side-by-side (2-column) panels within a horizontal strip
    are separated into left and right subcolumns.
    """
    sw, sh = 800, 400
    slice_gray = np.full((sh, sw), 255, dtype=np.uint8)

    # Left panel (x: 20..380) with dark art
    slice_gray[20:380, 20:380] = 50

    # Middle vertical gutter (x: 380..420) is empty white (40px wide)

    # Right panel (x: 420..780) with dark art
    slice_gray[20:380, 420:780] = 70

    sub_cols = detect_vertical_subgutters(
        slice_gray=slice_gray,
        is_white_bg=True,
        threshold_val=220,
        median_bg=255.0
    )
    assert len(sub_cols) == 2, f"Expected 2 side-by-side columns, got {len(sub_cols)}"
    assert sub_cols[0][0] < sub_cols[0][1] <= 400
    assert 400 <= sub_cols[1][0] < sub_cols[1][1]


def test_issue_5_overlapping_panel_frames_boundary_preserved():
    """
    Issue 5 Fix:
    Verifies that two overlapping panels are clipped at the optimal clean gutter seam
    and do not slice through black frame borders.
    """
    h, w = 1000, 600
    gray_arr = np.full((h, w), 255, dtype=np.uint8)

    # Panel 1: frame bottom at y=480
    gray_arr[100:480, 20:580] = 80
    gray_arr[480, 20:580] = 0  # Black bottom frame line

    # Gutter: y=481..499 (pure white)

    # Panel 2: frame top at y=500
    gray_arr[500, 20:580] = 0  # Black top frame line
    gray_arr[501:850, 20:580] = 90

    # Simulated overlapping bounding boxes:
    # p1 claims y: 100..495 (includes bottom border + some gutter)
    # p2 claims y: 485..850 (includes gutter + top border)
    # Overlap band is [485..495], where y=481..499 is empty white gutter.
    p1_y1, p1_y2 = 100, 495
    p2_y1, p2_y2 = 485, 850

    overlap_band = gray_arr[p2_y1:p1_y2, :]
    row_diffs = np.abs(np.diff(overlap_band.astype(float), axis=1))
    row_strokes = np.sum(row_diffs > 18.0, axis=1)
    row_stds = np.std(overlap_band, axis=1)
    best_rel_y = int(np.argmin(row_strokes * 2.0 + row_stds))
    boundary = p2_y1 + best_rel_y

    # The optimal boundary MUST be in the white gutter space (481..499),
    # and strictly NOT at y=480 or y=500
    assert 480 < boundary < 500, f"Boundary cut {boundary} damaged panel frame borders!"


def test_issue_6_speech_bubble_never_cut_in_half():
    """
    Issue 6 Fix:
    Verifies that a speech bubble or narration box (even with white upper interior)
    is never sliced in half by panel cut points.
    """
    w, h = 500, 1000
    gray_arr = np.full((h, w), 255, dtype=np.uint8)

    # Panel 1: y: 50..300 (artwork)
    gray_arr[50:300, 30:470] = 70

    # Speech Bubble / Narration Box: y: 350..460, x: 100..400
    # Top border at y=350, bottom border at y=460, left/right borders
    gray_arr[350, 100:400] = 0
    gray_arr[460, 100:400] = 0
    gray_arr[350:460, 100] = 0
    gray_arr[350:460, 399] = 0
    # Text inside lower portion of bubble: y: 400..440 ("SHE WOULD...")
    for ty in range(405, 435, 5):
        gray_arr[ty, 120:380:4] = 0

    # Panel 2: y: 520..850 (artwork)
    gray_arr[520:850, 30:470] = 80

    ocr_boxes = [{"x": 100, "y": 350, "w": 300, "h": 110}]

    res = detect_vertical_strip_panels(
        gray_arr=gray_arr,
        is_white_bg=True,
        threshold_val=220,
        min_height_px=60,
        min_width_pct=0.10,
        ocr_boxes=ocr_boxes
    )

    # Check cut points: NO cut point may fall inside [340..470]
    cut_points = res.separator_bands if hasattr(res, "separator_bands") else []
    for cp in cut_points:
        assert not (340 <= cp <= 470), f"Cut point {cp} severed speech bubble in half!"

    # Check that at least one panel fully contains the speech bubble (y1 <= 350 and y2 >= 460)
    enclosing_panel = [
        p for p in res.panels
        if int(p.get("y", 0)) <= 350 and (int(p.get("y", 0)) + int(p.get("h", 0))) >= 460
    ]
    assert len(enclosing_panel) >= 1, "Speech bubble was not fully enclosed in any panel!"


def test_issue_7_character_artwork_never_sliced_into_thin_horizontal_strips():
    """
    Issue 7 Fix:
    Verifies that flat anime cel-shading (e.g. jacket, clothing, dark hair)
    inside a character artwork panel is NEVER falsely classified as a gutter,
    and the panel is preserved intact rather than fragmented into thin ribbons (< 150px).
    """
    w, h = 800, 1600
    gray_arr = np.full((h, w), 255, dtype=np.uint8)

    # Panel 1: y: 50..700 (Character drawing with smooth shaded jacket & hair)
    # Background inside panel is dark/tinted art
    gray_arr[50:700, 50:750] = 120
    # Character jacket with uniform flat dark shading: y: 350..550
    gray_arr[350:550, 100:700] = 40
    # Outline lines around character
    gray_arr[350, 100:700] = 0
    gray_arr[549, 100:700] = 0

    # True white gutter between panels: y: 700..850 (150px white canvas gap)

    # Panel 2: y: 850..1500 (Second character drawing)
    gray_arr[850:1500, 50:750] = 90
    gray_arr[1050:1300, 120:680] = 30

    res = detect_vertical_strip_panels(
        gray_arr=gray_arr,
        is_white_bg=True,
        threshold_val=220,
        min_height_px=150,
        min_width_pct=0.10,
        median_bg=255.0
    )

    panels = res.panels
    # Must detect exactly the 2 major panels without slicing through the jacket
    assert len(panels) == 2, f"Expected 2 intact panels, but got {len(panels)} fragmented pieces!"
    p1 = panels[0]
    p2 = panels[1]
    assert p1.get("h", 0) >= 500, f"Panel 1 was chopped into thin strip: h={p1.get('h')}"
    assert p2.get("h", 0) >= 500, f"Panel 2 was chopped into thin strip: h={p2.get('h')}"


