"""
backend/scripts/run_grid_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Manga / Comic 2D Grid Panel Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
properly formatted and named developer validation files:
1. <image_name>_grid_panels.json    -> Structured panel coordinates, boxes & polygons
2. <image_name>_grid_annotated.png   -> Visual image with bounding boxes & badges
3. <image_name>_grid_mask.png        -> Binary panel layout mask
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_grid_detector.py
  python backend/scripts/run_grid_detector.py --input path/to/manga.png
  python backend/scripts/run_grid_detector.py -i https://example.com/page.jpg -o my_output/
  python backend/scripts/run_grid_detector.py --demo
"""

import os
import sys
import io
import time
import json
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image.services.panel_detection.grid_detector import (
    detect_manga_grid_panels,
    detect_manga_grid_pil,
    DEFAULT_IS_WHITE_BG,
    DEFAULT_THRESHOLD_VAL,
    DEFAULT_CANNY_LOW,
    DEFAULT_CANNY_HIGH,
    DEFAULT_CLOSE_KERNEL_SIZE,
    DEFAULT_HIGH_SENSITIVITY,
    DEFAULT_MIN_PANEL_AREA,
    DEFAULT_MAX_ASPECT_RATIO,
    DEFAULT_MIN_ASPECT_RATIO,
    DEFAULT_MIN_WIDTH_PCT,
    DEFAULT_MIN_HEIGHT_PX,
    DEFAULT_READING_FLOW,
    DEFAULT_SENSITIVITY,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "grid_panels")


def to_file_uri(path_str: str) -> str:
    """Converts a local file path into a clickable file:// URI."""
    return Path(os.path.abspath(path_str)).as_uri()


PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))


def load_input_image(input_source: str) -> tuple[Image.Image, str, np.ndarray]:
    """
    Loads an image from a local path, URL, or generates a sample image.
    Returns (pil_image, base_name, gray_numpy_array).
    """
    # Clean PowerShell syntax, quotes, and whitespace
    input_source = input_source.strip()
    if input_source.startswith("&"):
        input_source = input_source[1:].strip()

    # Strip any leading/trailing quotes (single, double, or backticks)
    quote_chars = ('"', "'", "`")
    while input_source and (input_source[0] in quote_chars or input_source[-1] in quote_chars):
        if input_source[0] in quote_chars:
            input_source = input_source[1:].strip()
        if input_source and input_source[-1] in quote_chars:
            input_source = input_source[:-1].strip()

    # Case 1: Web URL
    if input_source.startswith("http://") or input_source.startswith("https://"):
        import asyncio
        print(f"[*] Downloading image from URL: {input_source}...")
        resolved = asyncio.run(resolve_image_to_buffer(input_source))
        raw_data = resolved.get("data")
        if not raw_data:
            raise ValueError(f"Failed to fetch image from URL: {input_source}")
        pil_img = Image.open(io.BytesIO(raw_data)).convert("RGB")
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_manga_page"
        gray = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
        return pil_img, base_name, gray

    # Case 2: Local File Path resolution with smart fallbacks
    candidate_paths = [
        input_source,
        os.path.abspath(input_source),
        os.path.join(PROJECT_ROOT, input_source),
        os.path.join(BACKEND_DIR, input_source),
        os.path.join(PROJECT_ROOT, "frontend", "public", "sample image", input_source),
        os.path.join(PROJECT_ROOT, "frontend", "public", "sample image", os.path.basename(input_source)),
    ]

    for candidate in candidate_paths:
        if os.path.exists(candidate) and os.path.isfile(candidate):
            print(f"[*] Loading local image: {candidate}")
            pil_img = Image.open(candidate).convert("RGB")
            base_name = os.path.splitext(os.path.basename(candidate))[0]
            gray = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
            return pil_img, base_name, gray

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_manga_canvas() -> tuple[Image.Image, str, np.ndarray]:
    """
    Generates a synthetic 3-tier multi-column manga page canvas for instant verification.
    Layout (classic Right-to-Left Manga 5-panel layout):
    Tier 1 (top): Panel 1 (right, wide), Panel 2 (left, narrow)
    Tier 2 (mid): Panel 3 (full width action panel)
    Tier 3 (bot): Panel 4 (right, slanted), Panel 5 (left)
    """
    print("[*] Generating dynamic synthetic manga grid page for demonstration...")
    w, h = 900, 1300
    canvas = np.full((h, w, 3), 255, dtype=np.uint8)  # White background gutters

    def draw_panel(x1, y1, x2, y2, border_color=(20, 20, 20), fill_color=(240, 240, 240)):
        # Fill panel content area
        cv2.rectangle(canvas, (x1, y1), (x2, y2), fill_color, -1)
        # Thick comic panel frame
        cv2.rectangle(canvas, (x1, y1), (x2, y2), border_color, 4)
        # Inner artwork texture
        center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
        cv2.circle(canvas, (center_x, center_y), min(35, (x2 - x1) // 6), (200, 200, 200), 2)
        cv2.line(canvas, (x1 + 15, y1 + 25), (x2 - 15, y2 - 25), (220, 220, 220), 1)

    # Outer page margin
    margin_x, margin_y = 50, 60
    gutter = 25

    # Tier 1: Two panels (Y: 60 -> 400)
    t1_y1, t1_y2 = margin_y, 420
    split_x = 520
    # Top-Left (Panel 2 in RTL)
    draw_panel(margin_x, t1_y1, split_x - gutter, t1_y2)
    # Top-Right (Panel 1 in RTL)
    draw_panel(split_x, t1_y1, w - margin_x, t1_y2)

    # Tier 2: Wide single panel (Y: 445 -> 780)
    t2_y1, t2_y2 = t1_y2 + gutter, 800
    draw_panel(margin_x, t2_y1, w - margin_x, t2_y2)

    # Tier 3: Two panels with a diagonal separator (Y: 825 -> 1240)
    t3_y1, t3_y2 = t2_y2 + gutter, h - margin_y
    split_bot_x = 440
    # Bottom-Left
    draw_panel(margin_x, t3_y1, split_bot_x - gutter, t3_y2)
    # Bottom-Right (Slanted polygon panel)
    poly_pts = np.array([
        [split_bot_x, t3_y1],
        [w - margin_x, t3_y1],
        [w - margin_x, t3_y2],
        [split_bot_x + 50, t3_y2]
    ], dtype=np.int32)
    cv2.fillPoly(canvas, [poly_pts], (235, 235, 235))
    cv2.polylines(canvas, [poly_pts], isClosed=True, color=(20, 20, 20), thickness=4)

    pil_img = Image.fromarray(canvas)
    gray = cv2.cvtColor(canvas, cv2.COLOR_RGB2GRAY)
    base_name = "demo_sample_manga_grid"
    return pil_img, base_name, gray


def render_annotated_grid(
    source_img: Image.Image,
    panels: List[Dict[str, Any]],
    reading_flow: str = "right_to_left",
) -> Image.Image:
    """
    Renders high-visibility bounding boxes, polygon contours, and badges indicating
    panel reading sequence (#1, #2...) and dimensions.
    """
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Harmonious distinct color palette for sequential panels
    palette = [
        (255, 59, 48),    # Vibrant Red
        (52, 199, 89),    # Fresh Green
        (0, 122, 255),    # Electric Blue
        (255, 149, 0),    # Orange
        (175, 82, 222),   # Purple
        (255, 45, 85),    # Pink
        (88, 86, 214),    # Indigo
        (90, 200, 250),   # Cyan
    ]

    for idx, p in enumerate(panels, start=1):
        x, y = p["x"], p["y"]
        w = p.get("w", p.get("width", 0))
        h = p.get("h", p.get("height", 0))
        label = p.get("label", "panel_manga_grid")
        conf = p.get("confidence", 0.95)
        polygon = p.get("polygon")
        color = palette[(idx - 1) % len(palette)]

        # 1. Draw polygon boundary if present (e.g. slanted/diagonal panels)
        if polygon and len(polygon) >= 3:
            pts = [(int(pt[0]), int(pt[1])) for pt in polygon]
            draw.polygon(pts, outline=color, width=4)
        else:
            # 2. Draw rectangular panel boundary
            draw.rectangle([x, y, x + w, y + h], outline=color, width=4)

        # 3. Draw numbered badge badge banner
        badge_text = f"#{idx} [{w}x{h}] ({label})"
        badge_h = 22
        badge_w = len(badge_text) * 8 + 12
        badge_x1 = x + 4
        badge_y1 = y + 4
        badge_x2 = badge_x1 + badge_w
        badge_y2 = badge_y1 + badge_h

        # Badge pill with shadow/contrast
        draw.rectangle([badge_x1, badge_y1, badge_x2, badge_y2], fill=(20, 20, 20))
        draw.rectangle([badge_x1, badge_y1, badge_x1 + 26, badge_y2], fill=color)
        draw.text((badge_x1 + 6, badge_y1 + 4), f"#{idx}", fill=(255, 255, 255))
        draw.text((badge_x1 + 32, badge_y1 + 4), f"[{w}x{h}] {conf:.2f}", fill=(255, 255, 255))

    return annotated


def render_grid_binary_mask(
    img_w: int,
    img_h: int,
    panels: List[Dict[str, Any]],
) -> np.ndarray:
    """Generates a binary raster mask of detected panel areas."""
    mask = np.zeros((img_h, img_w), dtype=np.uint8)
    for p in panels:
        poly = p.get("polygon")
        if poly and len(poly) >= 3:
            pts = np.array(poly, dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(mask, [pts], 255)
        else:
            x, y, w, h = p["x"], p["y"], p.get("w", p.get("width", 0)), p.get("h", p.get("height", 0))
            cv2.rectangle(mask, (x, y), (x + w, y + h), 255, -1)
    return mask


def process_and_save_manga_grid(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    reading_flow: str = DEFAULT_READING_FLOW,
    is_white_bg: bool = DEFAULT_IS_WHITE_BG,
    threshold_val: int = DEFAULT_THRESHOLD_VAL,
    canny_low: int = DEFAULT_CANNY_LOW,
    canny_high: int = DEFAULT_CANNY_HIGH,
    close_kernel_size: int = DEFAULT_CLOSE_KERNEL_SIZE,
    high_sensitivity: bool = DEFAULT_HIGH_SENSITIVITY,
    min_panel_area: float = DEFAULT_MIN_PANEL_AREA,
    min_width_pct: float = DEFAULT_MIN_WIDTH_PCT,
    min_height_px: int = DEFAULT_MIN_HEIGHT_PX,
) -> dict:
    """
    Main developer verification pipeline:
    - Loads input or generates synthetic manga canvas
    - Executes primary detect_manga_grid_panels()
    - Executes projection fallback detect_manga_grid_pil()
    - Generates standardized developer validation files
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    # 1. Load image
    if input_source and input_source.strip():
        pil_img, base_name, gray = load_input_image(input_source)
    else:
        pil_img, base_name, gray = create_demo_manga_canvas()

    img_w, img_h = pil_img.size
    print("\n" + "=" * 78)
    print(f"▶ RUNNING MANGA GRID DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print(f"  Reading Flow: {reading_flow} | Background: {'White' if is_white_bg else 'Dark'}")
    print("=" * 78)

    # 2. Test Primary Strategy: detect_manga_grid_panels()
    print("\n[Step 1/2] Calling detect_manga_grid_panels() [OpenCV Contour + Tier Fusion]...")
    t0 = time.perf_counter()
    panels = detect_manga_grid_panels(
        gray=gray,
        is_white_bg=is_white_bg,
        threshold_val=threshold_val,
        canny_low=canny_low,
        canny_high=canny_high,
        close_kernel_size=close_kernel_size,
        high_sensitivity=high_sensitivity,
        min_panel_area=min_panel_area,
        min_width_pct=min_width_pct,
        min_height_px=min_height_px,
        reading_flow=reading_flow,
    )
    grid_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ Found {len(panels)} panel(s) in {grid_ms}ms")

    # 3. Test Projection Fallback Strategy: detect_manga_grid_pil()
    print("\n[Step 2/2] Comparing with detect_manga_grid_pil() [2D Projection Profile]...")
    t0 = time.perf_counter()
    pil_panels = detect_manga_grid_pil(
        gray_arr=gray,
        is_white_bg=is_white_bg,
        sensitivity=DEFAULT_SENSITIVITY,
        min_height_px=min_height_px,
        min_panel_area=min_panel_area,
        reading_flow=reading_flow,
    )
    pil_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ 2D Projection found {len(pil_panels)} panel(s) in {pil_ms}ms")

    # 4. Generate Properly Named Output Files
    print("\n[Step 3/3] Saving outputs with standardized filenames...")

    # Output File 1: JSON metadata
    json_filename = f"{base_name}_grid_panels.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "reading_flow": reading_flow,
        "is_white_bg": is_white_bg,
        "total_panels": len(panels),
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "panels": [
            {
                "order": idx,
                "x": p["x"],
                "y": p["y"],
                "width": p.get("w", p.get("width")),
                "height": p.get("h", p.get("height")),
                "confidence": p.get("confidence", 0.95),
                "label": p.get("label", "panel_manga_grid"),
                "polygon": p.get("polygon"),
            }
            for idx, p in enumerate(panels, start=1)
        ],
        "projection_comparison_count": len(pil_panels),
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2)

    print(f"  [1] JSON Entities  -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output File 2: Annotated Image with Bounding Boxes & Badges
    annotated_filename = f"{base_name}_grid_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_grid(pil_img, panels, reading_flow=reading_flow)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Image-> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output File 3: Binary Inpainting / Layout Mask
    mask_filename = f"{base_name}_grid_mask.png"
    mask_path = os.path.join(output_dir, mask_filename)
    mask_np = render_grid_binary_mask(img_w, img_h, panels)
    cv2.imwrite(mask_path, mask_np)
    print(f"  [3] Binary Mask    -> {mask_path}")
    print(f"      URI: {to_file_uri(mask_path)}")

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # 5. Print Human-Readable Summary Table
    print("\n" + "─" * 78)
    print("  MANGA GRID DETECTION SUMMARY RESULTS")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Total Panels     : {len(panels)} panels")
    print(f"  Projection Check : {len(pil_panels)} panels")
    print(f"  Reading Order    : {reading_flow.upper()}")
    print(f"  Total Time       : {total_time_ms} ms")
    print("─" * 78)
    for idx, p in enumerate(panels, start=1):
        w = p.get("w", p.get("width"))
        h = p.get("h", p.get("height"))
        poly_note = f" (polygon: {len(p['polygon'])} pts)" if p.get("polygon") else ""
        print(f"  • #{idx:<2} | Box: ({p['x']:<4}, {p['y']:<4}, {w:<4}, {h:<4}) | Conf: {p.get('confidence', 0.95):<4} | {p.get('label')}{poly_note}")
    print("─" * 78)

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Directory : {to_file_uri(output_dir)}")
    print(f"  • JSON Data : {to_file_uri(json_path)}")
    print(f"  • Annotated : {to_file_uri(annotated_path)}")
    print(f"  • Mask PNG  : {to_file_uri(mask_path)}")
    print("─" * 78)

    return {
        "success": True,
        "total_panels": len(panels),
        "json_path": json_path,
        "annotated_path": annotated_path,
        "mask_path": mask_path,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Manga Grid Panel Detector on an image and save structured output files."
    )
    parser.add_argument(
        "-i", "--input",
        type=str,
        default=None,
        help="Path to image file or web URL. If omitted, prompts interactively or uses synthetic demo canvas."
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save output files (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--flow",
        type=str,
        choices=["right_to_left", "left_to_right"],
        default=DEFAULT_READING_FLOW,
        help="Reading order flow (right_to_left for Japanese Manga, left_to_right for Western comics)."
    )
    parser.add_argument(
        "--dark-bg",
        action="store_true",
        help="Set if page gutters/background are black or dark instead of standard white."
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=DEFAULT_THRESHOLD_VAL,
        help=f"Threshold intensity value (default: {DEFAULT_THRESHOLD_VAL})"
    )
    parser.add_argument(
        "--min-area",
        type=float,
        default=DEFAULT_MIN_PANEL_AREA,
        help=f"Minimum panel area in square pixels (default: {DEFAULT_MIN_PANEL_AREA})"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic 3-tier manga demo canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma Manga Grid Panel Detector Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    process_and_save_manga_grid(
        input_source=input_arg,
        output_dir=args.output_dir,
        reading_flow=args.flow,
        is_white_bg=not args.dark_bg,
        threshold_val=args.threshold,
        min_panel_area=args.min_area,
    )


if __name__ == "__main__":
    main()
