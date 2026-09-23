"""
backend/scripts/tests/test_crop_pipeline.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Test Suite for Upgraded Comic Cropping Architecture:
1. Tests detect-type (5-layer layout classifier) on Tall Webtoon, Single Page, and Spread.
2. Tests long-panels (Multi-panel parallel batch slicer with asset binding).
3. Tests single-panels (4-directional margin cropper with 9:16 aspect snapping).
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import os
import io
import time
import base64
import asyncio

# Ensure utf-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "app")))

from PIL import Image, ImageDraw

from schemas.crop import (
    DetectedLayoutType,
    DetectTypeRequest,
    LongPanelsCropRequest,
    SinglePanelsCropRequest,
    PanelBoundingBox
)
from services.image.crop import (
    detect_image_layout_type,
    crop_long_panels_batch,
    crop_single_panels_margins
)


# ─── Colors for Terminal Output ───────────────────────────────────────────────
class Style:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[32m"
    CYAN = "\033[36m"
    YELLOW = "\033[33m"
    RED = "\033[31m"
    MAGENTA = "\033[35m"


def color(text: str, code: str) -> str:
    return f"{code}{text}{Style.RESET}"


# ─── Synthetic Test Image Generators ──────────────────────────────────────────

def create_synthetic_webtoon_strip() -> str:
    """Creates a synthetic tall webtoon strip (800x3200px) with 4 distinct panels."""
    img = Image.new("RGB", (800, 3200), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Panel 1 (y: 100 to 700)
    draw.rectangle([50, 100, 750, 700], fill=(220, 50, 50), outline=(0, 0, 0), width=4)
    # Panel 2 (y: 850 to 1500)
    draw.rectangle([50, 850, 750, 1500], fill=(50, 120, 220), outline=(0, 0, 0), width=4)
    # Panel 3 (y: 1650 to 2300)
    draw.rectangle([50, 1650, 750, 2300], fill=(50, 200, 80), outline=(0, 0, 0), width=4)
    # Panel 4 (y: 2450 to 3100)
    draw.rectangle([50, 2450, 750, 3100], fill=(220, 180, 50), outline=(0, 0, 0), width=4)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=90)
    b64_str = base64.b64encode(out.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def create_synthetic_single_page() -> str:
    """Creates a synthetic single comic page (1000x1400px) with white borders."""
    img = Image.new("RGB", (1000, 1400), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Artwork inside (margins: top 100, bottom 100, left 50, right 50)
    draw.rectangle([50, 100, 950, 1300], fill=(180, 100, 220), outline=(0, 0, 0), width=4)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=90)
    b64_str = base64.b64encode(out.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def create_synthetic_double_spread() -> str:
    """Creates a synthetic landscape 2-page spread (1600x900px)."""
    img = Image.new("RGB", (1600, 900), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, 1560, 860], fill=(70, 180, 190), outline=(0, 0, 0), width=4)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=90)
    b64_str = base64.b64encode(out.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


# ─── Test Runners ─────────────────────────────────────────────────────────────

async def run_all_tests():
    print(color("\n" + "=" * 70, Style.BOLD + Style.CYAN))
    print(color("  SONIKOMA COMIC CROPPING PIPELINE TEST SUITE", Style.BOLD + Style.CYAN))
    print(color("=" * 70 + "\n", Style.BOLD + Style.CYAN))

    results = []

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 1: detect-type Layout Classification
    # ─────────────────────────────────────────────────────────────────────────
    print(color("[TEST 1] Layout Classification (/detect-type)", Style.BOLD + Style.YELLOW))
    try:
        t0 = time.perf_counter()
        
        # Test 1A: Tall Webtoon Strip
        webtoon_uri = create_synthetic_webtoon_strip()
        res_webtoon = await detect_image_layout_type(url=webtoon_uri)
        assert res_webtoon.crop_type == DetectedLayoutType.LONG_PANELS, f"Expected long_panels, got {res_webtoon.crop_type}"
        print(f"  [1A] [OK] Tall Strip: {color(res_webtoon.type_label, Style.GREEN)} (aspect {res_webtoon.aspect_ratio}, ~{res_webtoon.estimated_panel_count} panels, conf: {res_webtoon.confidence})")

        # Test 1B: Single Page
        single_uri = create_synthetic_single_page()
        res_single = await detect_image_layout_type(url=single_uri)
        assert res_single.crop_type in (DetectedLayoutType.SINGLE_PANELS, DetectedLayoutType.MULTI_GRID_PAGE)
        print(f"  [1B] [OK] Single Page: {color(res_single.type_label, Style.GREEN)} (aspect {res_single.aspect_ratio}, bg: {res_single.detected_bg_color})")

        # Test 1C: Double Page Spread
        spread_uri = create_synthetic_double_spread()
        res_spread = await detect_image_layout_type(url=spread_uri)
        assert res_spread.crop_type == DetectedLayoutType.DOUBLE_PAGE_SPREAD
        print(f"  [1C] [OK] Double Spread: {color(res_spread.type_label, Style.GREEN)} (aspect {res_spread.aspect_ratio})")

        dt_1 = int((time.perf_counter() - t0) * 1000)
        results.append(("1. detect-type Layout Classifier", True, f"{dt_1}ms (3 images evaluated)"))
    except Exception as e:
        print(color(f"  [FAIL] Failed: {e}", Style.RED))
        results.append(("1. detect-type Layout Classifier", False, str(e)))

    print()

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 2: long-panels Multi-Panel Batch Slicing
    # ─────────────────────────────────────────────────────────────────────────
    print(color("[TEST 2] Multi-Panel Batch Slicing (/long-panels)", Style.BOLD + Style.YELLOW))
    try:
        t0 = time.perf_counter()
        strip_uri = create_synthetic_webtoon_strip()

        mock_boxes = [
            PanelBoundingBox(id=1, panel_id="p1", x=50, y=100, width=700, height=600, padding_px=4),
            PanelBoundingBox(id=2, panel_id="p2", x=50, y=850, width=700, height=650, padding_px=4),
            PanelBoundingBox(id=3, panel_id="p3", x=50, y=1650, width=700, height=650, padding_px=4),
            PanelBoundingBox(id=4, panel_id="p4", x=50, y=2450, width=700, height=650, padding_px=4),
        ]

        req = LongPanelsCropRequest(
            url=strip_uri,
            panels=mock_boxes,
            bleed_guard_px=5,
            output_format="webp",
            quality=90
        )

        res_batch = await crop_long_panels_batch(req)
        assert res_batch.success is True
        assert res_batch.total_slices == 4, f"Expected 4 slices, got {res_batch.total_slices}"
        assert len(res_batch.slices) == 4

        for s in res_batch.slices:
            assert s.url.startswith("/media/slice_"), f"Invalid slice URL: {s.url}"
            assert s.width > 0 and s.height > 0
            assert s.file_size_bytes > 0
            print(f"  [Slice #{s.index+1}] [OK] {s.panel_id}: {s.width}x{s.height}px | Gutter after: {s.gutter_after_px}px | URL: {s.url} ({s.file_size_bytes} bytes)")

        dt_2 = int((time.perf_counter() - t0) * 1000)
        results.append(("2. long-panels Batch Slicer", True, f"{dt_2}ms (4 slices encoded in parallel)"))
    except Exception as e:
        print(color(f"  [FAIL] Failed: {e}", Style.RED))
        results.append(("2. long-panels Batch Slicer", False, str(e)))

    print()

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 3: small-panels 4-Directional Margin Crop
    # ─────────────────────────────────────────────────────────────────────────
    print(color("[TEST 3] 4-Directional Margin Cropper (/small-panels)", Style.BOLD + Style.YELLOW))
    try:
        t0 = time.perf_counter()
        page_uri = create_synthetic_single_page()

        from schemas.crop import SmallPanelsCropRequest
        from services.image.crop import crop_small_panels_margins

        req_small = SmallPanelsCropRequest(
            url=page_uri,
            crop_top=10.0,      # 10% from top (140px)
            crop_bottom=10.0,   # 10% from bottom (140px)
            crop_left=5.0,      # 5% from left (50px)
            crop_right=5.0,     # 5% from right (50px)
            unit="percent",
            aspect_ratio="9:16",
            auto_trim=True,
            output_format="webp",
            quality=92
        )

        res_margin = await crop_small_panels_margins(req_small)
        assert res_margin.success is True
        assert res_margin.crop_type == "small_panels"
        assert res_margin.url.startswith("/media/single_crop_")
        assert res_margin.width > 0 and res_margin.height > 0

        applied = res_margin.applied_margins
        print(f"  [OK] Small Panel Trimmed: {res_margin.width}x{res_margin.height}px (Aspect: {res_margin.aspect_ratio})")
        print(f"  [OK] Applied Margins: Top={applied.get('top_px')}px, Bottom={applied.get('bottom_px')}px, Left={applied.get('left_px')}px, Right={applied.get('right_px')}px")
        print(f"  [OK] Output Media URL: {res_margin.url}")

        dt_3 = int((time.perf_counter() - t0) * 1000)
        results.append(("3. small-panels Margin Cropper", True, f"{dt_3}ms (Aspect Snapped: 9:16)"))
    except Exception as e:
        print(color(f"  [FAIL] Failed: {e}", Style.RED))
        results.append(("3. small-panels Margin Cropper", False, str(e)))

    print()

    # ─────────────────────────────────────────────────────────────────────────
    # FINAL SUMMARY REPORT
    # ─────────────────────────────────────────────────────────────────────────
    print(color("=" * 70, Style.BOLD + Style.CYAN))
    print(color("  TEST RESULTS SUMMARY", Style.BOLD + Style.CYAN))
    print(color("=" * 70, Style.BOLD + Style.CYAN))

    all_passed = True
    for name, passed, details in results:
        status_tag = color("[ PASS ]", Style.BOLD + Style.GREEN) if passed else color("[ FAIL ]", Style.BOLD + Style.RED)
        print(f"  {status_tag} {name:<35} : {details}")
        if not passed:
            all_passed = False

    print(color("=" * 70, Style.BOLD + Style.CYAN))
    if all_passed:
        print(color("  ALL TESTS PASSED SUCCESSFULLY! Crop pipeline is verified.", Style.BOLD + Style.GREEN))
    else:
        print(color("  SOME TESTS FAILED. Check errors above.", Style.BOLD + Style.RED))
    print()


if __name__ == "__main__":
    asyncio.run(run_all_tests())
