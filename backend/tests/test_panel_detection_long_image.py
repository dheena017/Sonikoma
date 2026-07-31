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


def test_grid_panel_detection_morphological_closing_and_area_filtering():
    """
    Tests grid layout panel detection with OpenCV morphological closing and min_panel_area filtering:
    - Verifies morphological closing bridges panel border line gaps so panel is detected as a unified block.
    - Verifies min_panel_area = 5000 and thin strip filtering discards small artifacts.
    """
    from services.image.panel_grid_detect import _detect_panels_grid_cv

    # Create synthetic page with 2 panels (150x150 each, area=22500) and small/thin noise artifacts
    grid = np.ones((500, 500), dtype=np.uint8) * 255

    # Panel 1: top-left (50, 50) to (200, 200) with a 6px gap in the border line
    grid[50:200, 50] = 0     # left border
    grid[50:200, 200] = 0    # right border
    grid[50, 50:120] = 0     # top border part 1
    # gap from 120 to 126 in top border (simulating broken line)
    grid[50, 126:200] = 0    # top border part 2
    grid[200, 50:200] = 0    # bottom border
    grid[60:190, 60:190] = 180  # interior fill

    # Panel 2: bottom-right (250, 250) to (400, 400)
    grid[250:400, 250:400] = 160

    # Small noise box (10x10, area 100 < 5000 min_panel_area)
    grid[20:30, 20:30] = 0

    # Thin horizontal strip artifact (200x5, aspect 40 > 10)
    grid[450:455, 50:250] = 0

    detected_boxes = _detect_panels_grid_cv(
        gray=grid,
        is_white_bg=True,
        threshold_val=200,
        canny_low=20,
        canny_high=100,
        close_kernel_size=15,
        high_sensitivity=False,
        min_panel_area=5000.0
    )

    # Should detect exactly 2 main panels, bridging the broken top border and ignoring small/thin noise
    assert len(detected_boxes) == 2, f"Expected 2 panels after morphological closing and filtering, got {len(detected_boxes)}: {detected_boxes}"

    areas = [b["w"] * b["h"] for b in detected_boxes]
    for a in areas:
        assert a >= 5000.0, f"Detected panel area {a} is below min_panel_area threshold of 5000!"


def test_yolo_class_filtering_speech_bubble_vs_panel():
    """
    Tests that YOLO detections representing speech bubbles (e.g. class 'speech bubble')
    are NOT treated as panel candidates, whereas detections representing panels/frames are.
    """
    from unittest.mock import patch
    import torch

    class MockTensor:
        def __init__(self, val):
            self.val = val
        def cpu(self):
            return self
        def numpy(self):
            return np.array(self.val)
        def item(self):
            return self.val

    class MockBox:
        def __init__(self, xyxy, conf, cls_val):
            self.xyxy = [MockTensor(xyxy)]
            self.conf = [MockTensor(conf)]
            self.cls = [MockTensor(cls_val)]

    class MockBoxes:
        def __init__(self, boxes):
            self.boxes_list = boxes
        def __iter__(self):
            return iter(self.boxes_list)

    class MockResult:
        def __init__(self, boxes):
            self.boxes = MockBoxes(boxes)

    class MockYOLO:
        task = "segment"
        names = {0: "speech bubble", 1: "frame"}
        def predict(self, *args, **kwargs):
            # Return one result with:
            # - Box 1: speech bubble (cls 0), large size
            # - Box 2: frame (cls 1), large size
            return [MockResult([
                MockBox([10, 10, 110, 110], 0.9, 0),  # speech bubble
                MockBox([200, 200, 350, 350], 0.9, 1), # frame
            ])]

    with patch("providers.vision.yolo.get_yolo_model") as mock_get_yolo, \
         patch("services.image.detect_panels._detect_panels_grid_cv") as mock_grid_cv:
        mock_get_yolo.return_value = MockYOLO()
        mock_grid_cv.return_value = []

        # Create dummy image for run_cv_detection to read
        img = Image.new("RGB", (500, 500), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        # Draw some contents (non-solid noise) in the boxes
        draw.rectangle([10, 10, 110, 110], outline=(0, 0, 0), fill=(150, 150, 150), width=2)
        draw.rectangle([200, 200, 350, 350], outline=(0, 0, 0), fill=(120, 120, 120), width=2)
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name

        try:
            # Run detection with use_yolo=True
            panels = run_cv_detection(
                image_path=tmp_path,
                sensitivity=30.0,
                bg_mode="white",
                min_width_pct=0.1,
                min_height_px=20,
                merge_threshold=10,
                aspect_ratio_str="free",
                auto_split=False,
                padding_px=0,
                use_yolo=True
            )

            # The speech bubble box at [10, 10, 110, 110] (x=10, y=10) should NOT be added as a separate panel,
            # but the frame box at [200, 200, 350, 350] (x=200, y=200) should be detected.
            # Let's check that no panel overlaps exactly the speech bubble bounds
            print("DETECTED PANELS:", panels)
            bubble_panel_detected = any(abs(p["x"] - 10) < 15 and abs(p["y"] - 10) < 15 for p in panels)
            frame_panel_detected = any(abs(p["x"] - 200) < 15 and abs(p["y"] - 200) < 15 for p in panels)
            
            assert not bubble_panel_detected, f"Speech bubble was incorrectly detected as a panel candidate! Panels: {panels}"
            assert frame_panel_detected, f"Frame/panel from YOLO was not detected as a panel candidate! Panels: {panels}"

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)



