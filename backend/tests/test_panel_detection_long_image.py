import os
import sys
import tempfile
import numpy as np
from PIL import Image, ImageDraw

# Add backend and backend/app to path for tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from services.image.detect_panels import run_cv_detection
from services.image.utils.panel_box_utils import merge_overlapping_boxes


def create_webtoon_strip_image(width=800, panel_height=300, gutter_height=100, num_panels=4):
    """
    Creates a synthetic long webtoon strip (e.g. 800x1700) with `num_panels` separate boxes
    drawn on a white background with white gutters between them.
    """
    total_height = num_panels * panel_height + (num_panels + 1) * gutter_height
    img = Image.new("RGB", (width, total_height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    for i in range(num_panels):
        top_y = gutter_height + i * (panel_height + gutter_height)
        bottom_y = top_y + panel_height
        left_x = 50
        right_x = width - 50

        # Draw a dark panel rectangle with content inside
        draw.rectangle([left_x, top_y, right_x, bottom_y], outline=(0, 0, 0), fill=(180, 180, 200), width=3)
        # Add some inner drawing detail (e.g. character circle)
        draw.ellipse([left_x + 30, top_y + 30, right_x - 30, bottom_y - 30], fill=(50, 100, 150))

    return img


def test_merge_overlapping_boxes_does_not_merge_stacked_panels():
    """
    Tests that merge_overlapping_boxes does not merge vertically stacked panels.
    """
    boxes = [
        {"x": 50, "y": 100, "w": 700, "h": 300},
        {"x": 50, "y": 500, "w": 700, "h": 300},
        {"x": 50, "y": 900, "w": 700, "h": 300},
    ]
    merged = merge_overlapping_boxes(boxes, 800, 1300, merge_threshold=0)
    assert len(merged) == 3, f"Expected 3 separate boxes, got {len(merged)}"


def test_webtoon_strip_panel_detection_count_and_crop():
    """
    Tests that a long vertical webtoon strip with 4 panels detects exactly 4 panels
    and trims margins tightly without leaving excessive background whitespace.
    """
    num_panels = 4
    panel_h = 300
    gutter_h = 100
    strip_img = create_webtoon_strip_image(width=800, panel_height=panel_h, gutter_height=gutter_h, num_panels=num_panels)

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        strip_img.save(tmp.name)
        tmp_path = tmp.name

    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=60,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )

        assert len(panels) == num_panels, f"Expected {num_panels} panels detected on long image, but found {len(panels)}"

        # Check each panel's height: should be tight around artwork (not bloated to 400px+ with gutters)
        for p in panels:
            h_box = p["height"]
            assert 200 <= h_box <= 310, f"Panel height {h_box} is not tightly cropped around artwork!"
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
