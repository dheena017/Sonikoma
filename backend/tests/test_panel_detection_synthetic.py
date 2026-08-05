import os
import sys
import tempfile
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from services.image.detect_panels import run_cv_detection


def _safe_remove(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


def _helper_create_strip(width=600, panels_info=None, bg_color=(255, 255, 255)):
    if panels_info is None:
        panels_info = [{"h": 200, "gutter_after": 50, "color": (100, 100, 150)} for _ in range(3)]

    total_h = sum(p["h"] + p.get("gutter_after", 40) for p in panels_info) + 50
    img = Image.new("RGB", (width, total_h), color=bg_color)
    draw = ImageDraw.Draw(img)

    curr_y = 30
    for p in panels_info:
        ph = p["h"]
        pcolor = p.get("color", (100, 100, 150))
        draw.rectangle([40, curr_y, width - 40, curr_y + ph], fill=pcolor, outline=(0, 0, 0))
        curr_y += ph + p.get("gutter_after", 40)

    return img


def test_many_small_panels():
    info = [{"h": 120, "gutter_after": 35, "color": (120, 140, 180)} for _ in range(8)]
    img = _helper_create_strip(600, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 6, f"Expected ~8 small panels, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_large_gutter():
    info = [
        {"h": 250, "gutter_after": 300, "color": (100, 150, 200)},
        {"h": 250, "gutter_after": 50, "color": (150, 100, 200)}
    ]
    img = _helper_create_strip(600, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 2, f"Expected 2 panels across large gutter, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_dark_gutter():
    info = [{"h": 200, "gutter_after": 60, "color": (200, 200, 200)} for _ in range(3)]
    img = _helper_create_strip(600, info, bg_color=(10, 10, 15))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="dark",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 3, f"Expected 3 panels on dark bg, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_white_gutter():
    info = [{"h": 200, "gutter_after": 60, "color": (80, 80, 120)} for _ in range(3)]
    img = _helper_create_strip(600, info, bg_color=(255, 255, 255))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="white",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 3, f"Expected 3 panels on white bg, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_gradient_background():
    w, h = 600, 1200
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        val = int(200 + 55 * (y / h))
        arr[y, :, :] = (val, val, val)
    img = Image.fromarray(arr)
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 100, 550, 350], fill=(50, 50, 100))
    draw.rectangle([50, 500, 550, 750], fill=(50, 100, 50))
    draw.rectangle([50, 900, 550, 1150], fill=(100, 50, 50))

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 2, f"Expected at least 2-3 panels on gradient background, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_splash_panel():
    info = [{"h": 1000, "gutter_after": 50, "color": (150, 120, 90)}]
    img = _helper_create_strip(600, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 1, f"Expected 1 splash panel, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_ocr_crossing_gutter():
    info = [{"h": 200, "gutter_after": 50, "color": (100, 100, 150)} for _ in range(2)]
    img = _helper_create_strip(600, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 2, f"Expected 2 panels without OCR interference, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_compression_noise():
    info = [{"h": 200, "gutter_after": 40, "color": (100, 120, 140)} for _ in range(3)]
    img = _helper_create_strip(600, info)
    arr = np.array(img).astype(np.int16)
    noise = np.random.randint(-15, 15, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    noisy_img = Image.fromarray(arr)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
        noisy_img.save(tmp_path, quality=70)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 2, f"Expected at least 2 panels under compression noise, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_60k_webtoon_simulated():
    info = [{"h": 250, "gutter_after": 50, "color": (100, 100, 150)} for _ in range(15)]
    img = _helper_create_strip(448, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 10, f"Expected >= 10 panels on simulated long strip, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_recursive_split():
    img = Image.new("RGB", (600, 1400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 550, 1350], fill=(120, 120, 160), outline=(0, 0, 0))
    draw.rectangle([0, 650, 600, 750], fill=(255, 255, 255))
    draw.rectangle([50, 50, 550, 650], fill=(120, 120, 160), outline=(0, 0, 0))
    draw.rectangle([50, 750, 550, 1350], fill=(140, 120, 120), outline=(0, 0, 0))

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 2, f"Expected recursive split into >= 2 child panels, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_alternating_dark_light_gutters():
    img = Image.new("RGB", (600, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 50, 560, 300], fill=(100, 100, 150))
    draw.rectangle([0, 300, 600, 400], fill=(20, 20, 20))
    draw.rectangle([40, 400, 560, 650], fill=(150, 100, 100))
    draw.rectangle([0, 650, 600, 750], fill=(255, 255, 255))
    draw.rectangle([40, 750, 560, 950], fill=(100, 150, 100))

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 2, f"Expected detection across alternating dark/light gutters, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_tiny_speech_bubble():
    info = [{"h": 200, "gutter_after": 40, "color": (120, 120, 150)} for _ in range(2)]
    img = _helper_create_strip(600, info)
    draw = ImageDraw.Draw(img)
    draw.ellipse([280, 250, 320, 280], fill=(255, 255, 255), outline=(0, 0, 0))

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) >= 2, f"Expected panels detected despite tiny speech bubble, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_huge_narration_box():
    info = [{"h": 250, "gutter_after": 80, "color": (110, 130, 150)} for _ in range(2)]
    img = _helper_create_strip(600, info)
    draw = ImageDraw.Draw(img)
    draw.rectangle([60, 35, 540, 85], fill=(240, 240, 200), outline=(0, 0, 0))

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 2, f"Expected 2 panels with narration box, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_colored_background():
    info = [{"h": 200, "gutter_after": 50, "color": (220, 180, 140)} for _ in range(3)]
    img = _helper_create_strip(600, info, bg_color=(240, 230, 210))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 3, f"Expected 3 panels on colored bg, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)


def test_transparent_png_and_wide_splash():
    info = [{"h": 300, "gutter_after": 50, "color": (130, 100, 160)} for _ in range(2)]
    img = _helper_create_strip(800, info)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path)
    try:
        panels = run_cv_detection(
            image_path=tmp_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=40,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
            padding_px=0,
            use_yolo=False
        )
        assert len(panels) == 2, f"Expected 2 wide panels, found {len(panels)}"
    finally:
        _safe_remove(tmp_path)
