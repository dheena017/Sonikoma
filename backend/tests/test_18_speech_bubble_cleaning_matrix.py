"""
backend/tests/test_18_speech_bubble_cleaning_matrix.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Test Suite for Speech Bubble Detection & Inpainting Matrix.
Covers all 9 checklist categories:
1. White speech balloons (Oval, rectangular, borderless, overlapping)
2. Thought clouds (Cloud-shaped contours, small trailing circles)
3. Dark and colored balloons (Black, dark gray, tinted with bright text)
4. False-positive backgrounds (White clothing, walls, windows without text)
5. Complex artwork (Speed lines, hair textures, spiky contours)
6. Text edge cases (Small lettering, vertical text, punctuation)
7. Boundary cases (Balloons clipped by panel edges, boundary clamping)
8. Image robustness (Grayscale 2D, BGR 3D, BGRA 4D, small/large dimensions)
9. Failure safety (Empty input, invalid path, runaway masks > 65%)
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
import numpy as np
import cv2
import asyncio

from features.image_editor.services.processing.panel_cleaner import (
    remove_speech_bubbles,
    remove_speech_bubbles_sync,
)


def _encode_png(img: np.ndarray) -> bytes:
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()


# ─── Category 1: White Speech Balloons ────────────────────────────────────────

def test_category_1_oval_and_rectangular_white_balloons():
    """Tests detection and inpainting of standard oval and rectangular white balloons with black text."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 128  # Midtone background
    # Oval speech balloon
    cv2.ellipse(img, (100, 100), (45, 30), 0, 0, 360, (255, 255, 255), -1)
    cv2.putText(img, "HELLO", (75, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    # Rectangular balloon
    cv2.rectangle(img, (180, 180), (280, 240), (255, 255, 255), -1)
    cv2.putText(img, "WAIT!", (195, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) >= 2, f"Expected at least 2 balloons, found {len(boxes)}"
    assert isinstance(cleaned_bytes, bytes)
    assert len(cleaned_bytes) > 0


def test_category_1_borderless_and_overlapping_balloons():
    """Tests borderless white balloons and overlapping dialogue bubbles."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 100
    # Overlapping bubbles
    cv2.circle(img, (120, 120), 40, (255, 255, 255), -1)
    cv2.circle(img, (160, 120), 40, (255, 255, 255), -1)
    cv2.putText(img, "STOP", (110, 125), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) >= 1
    assert len(cleaned_bytes) > 0


# ─── Category 2: Thought Clouds ───────────────────────────────────────────────

def test_category_2_thought_clouds_and_trailing_circles():
    """Tests cloud-shaped scalloped contours and trailing small thought circles."""
    img = np.zeros((350, 350, 3), dtype=np.uint8) + 90
    # Main thought cloud: composite of overlapping circles
    centers = [(140, 120), (170, 110), (200, 120), (210, 150), (180, 165), (145, 155)]
    for cx, cy in centers:
        cv2.circle(img, (cx, cy), 32, (255, 255, 255), -1)
    cv2.putText(img, "HMM...", (145, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    # Trailing small circles
    cv2.circle(img, (120, 210), 10, (255, 255, 255), -1)
    cv2.circle(img, (100, 240), 6, (255, 255, 255), -1)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) >= 1
    assert len(cleaned_bytes) > 0


# ─── Category 3: Dark and Colored Balloons ─────────────────────────────────────

def test_category_3_dark_balloons_with_white_text():
    """Tests black/dark speech balloons containing bright white text (e.g. monster/villain speech)."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 200  # Bright scene
    # Black speech balloon
    cv2.ellipse(img, (150, 150), (55, 35), 0, 0, 360, (15, 15, 15), -1)
    # Bright white text inside
    cv2.putText(img, "ARISE!", (115, 158), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img), detection_style="all")
    assert len(boxes) >= 1, "Failed to detect dark speech balloon with white text"


# ─── Category 4: False-Positive Backgrounds ────────────────────────────────────

def test_category_4_false_positive_backgrounds():
    """Ensures solid white clothing, blank walls, or window highlights without text are NOT erased."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 60
    # Solid white rectangle (e.g. character white t-shirt or wall) without text
    cv2.rectangle(img, (50, 50), (180, 220), (255, 255, 255), -1)
    # A single horizontal fold line (not text)
    cv2.line(img, (60, 120), (170, 120), (50, 50, 50), 1)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    # Should NOT trigger balloon detection because there is no text
    assert len(boxes) == 0, f"False positive triggered on blank white background! Boxes: {boxes}"


# ─── Category 5: Complex Artwork (Speed Lines & Hair) ─────────────────────────

def test_category_5_speed_lines_and_hair_rejection():
    """Ensures jagged speed lines, spiky hair contours, and fine texture strokes are protected."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 120
    # Draw spiky star / speed lines (very low solidity, jagged perimeter)
    pts = np.array([[150, 20], [170, 110], [260, 130], [180, 160], [210, 250],
                    [150, 190], [90, 250], [120, 160], [40, 130], [130, 110]], np.int32)
    cv2.fillPoly(img, [pts], (255, 255, 255))

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) == 0, "Speed lines or spiky artwork were falsely classified as bubbles"


# ─── Category 6: Text Edge Cases ──────────────────────────────────────────────

def test_category_6_vertical_text_and_small_lettering():
    """Tests small font sizes and vertical Japanese/Korean manga lettering."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 130
    # Vertical speech balloon
    cv2.rectangle(img, (120, 40), (170, 260), (255, 255, 255), -1)
    # Vertical lettering column
    for idx, char in enumerate(["S", "T", "O", "P"]):
        cv2.putText(img, char, (135, 90 + idx * 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) >= 1, "Failed to detect vertical text balloon"


# ─── Category 7: Boundary Cases ───────────────────────────────────────────────

def test_category_7_clipped_balloons_at_image_edge():
    """Tests speech balloons cut off by the left, top, or right frame boundaries."""
    img = np.zeros((300, 300, 3), dtype=np.uint8) + 110
    # Balloon clipped at the top-left edge (x=0, y=0)
    cv2.rectangle(img, (0, 0), (110, 90), (255, 255, 255), -1)
    cv2.putText(img, "HEY", (15, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    cleaned_bytes, boxes = remove_speech_bubbles_sync(_encode_png(img))
    assert len(boxes) >= 1
    # Verify boxes are strictly clamped within image dimensions
    for b in boxes:
        assert b["x"] >= 0 and b["y"] >= 0
        assert b["x"] + b["width"] <= 300
        assert b["y"] + b["height"] <= 300


# ─── Category 8: Image Robustness (1-Channel, 4-Channel RGBA) ─────────────────

def test_category_8_image_channels_and_micro_dimensions():
    """Tests 1-channel grayscale, 4-channel RGBA, and small dimensions."""
    # 1. Grayscale 1-channel image
    gray_img = np.zeros((200, 200), dtype=np.uint8) + 100
    cv2.circle(gray_img, (100, 100), 40, 255, -1)
    cv2.putText(gray_img, "OK", (85, 108), cv2.FONT_HERSHEY_SIMPLEX, 0.6, 0, 2)
    res_bytes, boxes = remove_speech_bubbles_sync(_encode_png(gray_img))
    assert len(boxes) >= 1

    # 2. 4-channel RGBA image
    rgba_img = np.zeros((200, 200, 4), dtype=np.uint8)
    rgba_img[:, :, :3] = 120
    rgba_img[:, :, 3] = 255  # Fully opaque alpha
    cv2.circle(rgba_img, (100, 100), 40, (255, 255, 255, 255), -1)
    cv2.putText(rgba_img, "YES", (80, 108), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0, 255), 2)
    res_bytes_rgba, boxes_rgba = remove_speech_bubbles_sync(_encode_png(rgba_img))
    assert len(boxes_rgba) >= 1

    # 3. Micro image guard
    tiny_img = np.zeros((10, 10, 3), dtype=np.uint8)
    _, tiny_boxes = remove_speech_bubbles_sync(_encode_png(tiny_img))
    assert len(tiny_boxes) == 0


# ─── Category 9: Failure Safety (Empty, Nonexistent, Runaway Mask) ─────────────

def test_category_9_failure_safety_and_runaway_mask_guard():
    """Tests failure safety against empty input, invalid paths, and runaway masks (>65%)."""
    # 1. Empty bytes
    with pytest.raises(ValueError, match="cannot be empty"):
        remove_speech_bubbles_sync(b"")

    # 2. Nonexistent path
    with pytest.raises(FileNotFoundError):
        remove_speech_bubbles_sync("non_existent_file_path_12345.png")

    # 3. Runaway mask guard (> 65% of entire frame)
    huge_white_img = np.zeros((200, 200, 3), dtype=np.uint8) + 255  # 100% white screen
    cv2.putText(huge_white_img, "FLOOD", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)
    cleaned_bytes, _ = remove_speech_bubbles_sync(_encode_png(huge_white_img))
    # Should safely return without crash or memory fault
    assert isinstance(cleaned_bytes, bytes)
    assert len(cleaned_bytes) > 0


@pytest.mark.asyncio
async def test_async_wrapper_execution():
    """Verifies that the async remove_speech_bubbles coroutine wrapper executes seamlessly."""
    img = np.zeros((200, 200, 3), dtype=np.uint8) + 128
    cv2.rectangle(img, (50, 50), (150, 150), (255, 255, 255), -1)
    cv2.putText(img, "ASYNC", (65, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    cleaned_bytes, boxes = await remove_speech_bubbles(_encode_png(img))
    assert len(boxes) >= 1
    assert isinstance(cleaned_bytes, bytes)
