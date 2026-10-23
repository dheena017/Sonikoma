"""
backend/scripts/run_panel_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Comic & Webtoon Panel Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
standardized, properly named output files:
1. <image_name>_panels.json     -> Structured panel coordinates, reading order & metadata
2. <image_name>_annotated.png    -> Visual image with bounding boxes, polygons & order badges
3. <image_name>_crops/          -> Extracted individual cropped panel images (panel_01.png, ...)
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_panel_detector.py
  python backend/scripts/run_panel_detector.py --input path/to/webtoon_strip.png
  python backend/scripts/run_panel_detector.py -i https://example.com/strip.jpg -o my_output/
"""

import os
import sys
import io
import time
import json
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image_editor.services.panel_detection.panel_detector import (
    PanelDetectionResult,
    detect_vertical_strip_panels,
    detect_background_color_and_threshold,
    detect_vertical_subgutters,
    subdivide_continuous_tall_art_panel,
    sort_panels_reading_order,
    run_cv_detection,
    normalize_panel_box,
    resolve_overlapping_panels,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "panels")


def to_file_uri(path_str: str) -> str:
    """Converts a local file path into a clickable file:// URI."""
    return Path(os.path.abspath(path_str)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, str]:
    """
    Loads an image from a local path, web URL, or generates a sample canvas.
    Returns (pil_image, base_name, local_file_path).
    """
    # Clean PowerShell syntax, quotes, and whitespace
    input_source = input_source.strip()
    if input_source.startswith("&"):
        input_source = input_source[1:].strip()

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
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_strip"
        temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{base_name}.png")
        pil_img.save(temp_path)
        return pil_img, base_name, temp_path

    # Case 2: Local File Path
    if os.path.exists(input_source):
        print(f"[*] Loading local image: {input_source}")
        pil_img = Image.open(input_source).convert("RGB")
        base_name = os.path.splitext(os.path.basename(input_source))[0]
        return pil_img, base_name, input_source

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_webtoon_canvas() -> Tuple[Image.Image, str, str]:
    """Generates a synthetic webtoon strip with 3 distinct panels and gutters."""
    print("[*] Generating dynamic synthetic Webtoon strip canvas for demonstration...")
    canvas_w, canvas_h = 600, 1500
    pil_img = Image.new("RGB", (canvas_w, canvas_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(pil_img)

    # Panel 1: Top Manga Scene (Y: 60..450)
    draw.rectangle([40, 60, 560, 450], fill=(245, 245, 248), outline=(20, 20, 20), width=4)
    # Interior character speedlines and art strokes
    for y in range(120, 400, 30):
        draw.line([80, y, 520, y], fill=(80, 80, 90), width=2)
    draw.ellipse([180, 160, 420, 350], fill=(220, 220, 230), outline=(30, 30, 30), width=3)

    # Gutter 1: Y: 450..570 (120px whitespace gutter)

    # Panel 2: Middle Landscape Panel (Y: 570..950)
    draw.rectangle([40, 570, 560, 950], fill=(240, 245, 240), outline=(20, 20, 20), width=4)
    draw.polygon([(80, 900), (300, 650), (520, 900)], fill=(180, 200, 180), outline=(30, 30, 30))

    # Gutter 2: Y: 950..1070 (120px whitespace gutter)

    # Panel 3: Bottom Action Scene (Y: 1070..1420)
    draw.rectangle([40, 1070, 560, 1420], fill=(250, 242, 242), outline=(20, 20, 20), width=4)
    for x in range(100, 520, 40):
        draw.line([x, 1120, x + 60, 1370], fill=(120, 70, 70), width=2)

    base_name = "demo_sample_webtoon"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def render_annotated_panels(
    source_img: Image.Image,
    panels: List[Dict[str, Any]],
    separator_bands: Optional[List[int]] = None,
) -> Image.Image:
    """Renders high-visibility panel boundaries, separator lines, and reading badges."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)
    w_img, h_img = source_img.size

    # Distinct vibrant colors for panel cycling
    palette = [
        (0, 122, 255),    # Blue
        (52, 199, 89),    # Green
        (255, 149, 0),    # Orange
        (175, 82, 222),   # Purple
        (255, 45, 85),    # Pink
        (255, 204, 0),    # Yellow
    ]

    # 1. Draw horizontal cut lines if available
    if separator_bands:
        for cut_y in separator_bands:
            # Draw dashed/dotted separation guide line
            draw.line([(0, cut_y), (w_img, cut_y)], fill=(255, 59, 48), width=2)
            badge_text = f" CUT Y={cut_y} "
            draw.rectangle([w_img - 95, max(0, cut_y - 8), w_img - 5, cut_y + 8], fill=(255, 59, 48))
            draw.text((w_img - 90, max(0, cut_y - 6)), badge_text, fill=(255, 255, 255))

    # 2. Draw each panel boundary and badge
    for idx, p in enumerate(panels, start=1):
        color = palette[(idx - 1) % len(palette)]
        px = int(p.get("x", 0))
        py = int(p.get("y", 0))
        pw = int(p.get("width") or p.get("w", 0))
        ph = int(p.get("height") or p.get("h", 0))
        ro = p.get("reading_order", idx)
        conf = float(p.get("confidence", 0.90))

        # Draw polygon if present
        polygon = p.get("polygon")
        if polygon and len(polygon) >= 3:
            pts = [(int(pt[0]), int(pt[1])) for pt in polygon]
            draw.polygon(pts, outline=color, width=3)
        else:
            draw.rectangle([px, py, px + pw, py + ph], outline=color, width=3)

        # Draw Order & Dimension Badge Banner
        badge_text = f"Panel #{ro} ({pw}x{ph}px) {conf:.2f}"
        badge_h = 18
        badge_w = len(badge_text) * 7 + 10
        badge_y1 = max(0, py - badge_h)
        badge_y2 = badge_y1 + badge_h

        draw.rectangle([px, badge_y1, px + badge_w, badge_y2], fill=color)
        draw.text((px + 5, badge_y1 + 2), badge_text, fill=(255, 255, 255))

    return annotated


def extract_panel_crops(
    source_img: Image.Image,
    panels: List[Dict[str, Any]],
    crops_dir: str,
    base_name: str,
) -> List[str]:
    """Crops individual panel bounding boxes and saves them to disk."""
    os.makedirs(crops_dir, exist_ok=True)
    crop_paths = []
    img_w, img_h = source_img.size

    for idx, p in enumerate(panels, start=1):
        ro = p.get("reading_order", idx)
        px = max(0, int(p.get("x", 0)))
        py = max(0, int(p.get("y", 0)))
        pw = max(1, int(p.get("width") or p.get("w", 1)))
        ph = max(1, int(p.get("height") or p.get("h", 1)))

        x2 = min(img_w, px + pw)
        y2 = min(img_h, py + ph)

        cropped_img = source_img.crop((px, py, x2, y2))
        crop_filename = f"{base_name}_panel_{ro:02d}.png"
        crop_path = os.path.join(crops_dir, crop_filename)
        cropped_img.save(crop_path, format="PNG")
        crop_paths.append(crop_path)

    return crop_paths


def process_and_save_panels(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    sensitivity: float = 30.0,
    save_crops: bool = True,
) -> Dict[str, Any]:
    """
    Main execution pipeline:
    1. Loads input image (path, URL, or demo canvas).
    2. Runs background color calibration & panel detector.
    3. Saves structured JSON metadata, annotated visualization, and cropped panel PNGs.
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    # Step 1: Load input image
    if input_source and input_source.strip():
        pil_img, base_name, local_file_path = load_input_image(input_source)
    else:
        pil_img, base_name, local_file_path = create_demo_webtoon_canvas()

    img_w, img_h = pil_img.size
    print("\n" + "=" * 78)
    print(f"▶ RUNNING COMIC & WEBTOON PANEL DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print("=" * 78)

    # Step 2: Background estimation & Layout analysis
    gray_np = np.array(pil_img.convert("L"))
    print("\n[Step 1/3] Estimating Canvas Background & Layout Mode...")
    t0 = time.perf_counter()
    is_white, thresh, med_bg, bg_std, top_m, bot_m, bg_rgb = detect_background_color_and_threshold(
        gray_np, sensitivity=sensitivity
    )
    bg_ms = int((time.perf_counter() - t0) * 1000)
    polarity_str = "WHITE / LIGHT" if is_white else "DARK / BLACK"
    print(f"  ✓ Background: {polarity_str} (median={med_bg:.1f}, thresh={thresh}, std={bg_std:.2f}) in {bg_ms}ms")

    # Step 3: Run Panel Detection Engine
    print("\n[Step 2/3] Executing Unified Panel Detection Engine...")
    t0 = time.perf_counter()
    is_tall = img_h > img_w * 2.2
    separator_bands: List[int] = []

    print(f"  [*] Running Unified Panel Detection Engine on {img_w}x{img_h}px canvas...")
    raw_panels = run_cv_detection(pil_img, sensitivity=sensitivity)

    # Derive gutter cut bands between consecutive ordered panels
    sorted_raw = sorted(raw_panels, key=lambda p: int(p.get("y", 0)))
    for idx in range(len(sorted_raw) - 1):
        p1 = sorted_raw[idx]
        p2 = sorted_raw[idx + 1]
        y1_end = int(p1.get("y", 0)) + int(p1.get("height", p1.get("h", 0)))
        y2_start = int(p2.get("y", 0))
        if y2_start >= y1_end:
            separator_bands.append((y1_end + y2_start) // 2)

    normalized = [normalize_panel_box(p) for p in raw_panels]
    deduped = resolve_overlapping_panels(normalized, orig_w=img_w, orig_h=img_h)
    panels = sort_panels_reading_order(deduped)
    detect_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ Successfully extracted {len(panels)} panel(s) in {detect_ms}ms")

    # Step 4: Generate Output Files
    print("\n[Step 3/3] Saving outputs with standardized filenames...")

    # Output 1: JSON metadata
    json_filename = f"{base_name}_panels.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "is_tall_strip": is_tall,
        "background_mode": polarity_str,
        "total_panels": len(panels),
        "separator_bands": separator_bands,
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "panels": panels,
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2)

    print(f"  [1] JSON Entities   -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output 2: Annotated Image with Boxes and Badges
    annotated_filename = f"{base_name}_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_panels(pil_img, panels, separator_bands=separator_bands)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Image -> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output 3: Individual Cropped Panels
    crop_paths = []
    crops_dir = os.path.join(output_dir, f"{base_name}_crops")
    if save_crops and panels:
        crop_paths = extract_panel_crops(pil_img, panels, crops_dir, base_name)
        print(f"  [3] Extracted Crops -> {crops_dir} ({len(crop_paths)} PNGs)")
        print(f"      URI: {to_file_uri(crops_dir)}")

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # Step 5: Print Formatted Summary Table
    print("\n" + "─" * 78)
    print("  PANEL DETECTION SUMMARY RESULTS")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Layout Mode      : {'Webtoon Vertical Strip' if is_tall else '2D Manga Page'}")
    print(f"  Total Panels     : {len(panels)} panel(s)")
    if separator_bands:
        print(f"  Cut Lines        : {len(separator_bands)} gutter cuts at Y={separator_bands}")
    print(f"  Total Time       : {total_time_ms} ms")
    print("─" * 78)
    for p in panels:
        ro = p.get("reading_order", 0)
        px = p.get("x", 0)
        py = p.get("y", 0)
        pw = p.get("width") or p.get("w", 0)
        ph = p.get("height") or p.get("h", 0)
        conf = float(p.get("confidence", 0.90))
        top_rm = p.get("top_removed_px", 0)
        bot_rm = p.get("bottom_removed_px", 0)
        poly_pts = len(p.get("polygon", []))
        print(
            f"  • #{ro:<2} | Box: (x={px:4d}, y={py:4d}, w={pw:4d}, h={ph:4d}) | "
            f"Conf: {conf:.2f} | Poly: {poly_pts:2d} pts | Trimmed: -{top_rm}px top, -{bot_rm}px bot"
        )
    print("─" * 78)

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Output Directory: {to_file_uri(output_dir)}")
    print(f"  • JSON Metadata   : {to_file_uri(json_path)}")
    print(f"  • Annotated Image : {to_file_uri(annotated_path)}")
    if crop_paths:
        print(f"  • Panel Crops Dir : {to_file_uri(crops_dir)}")
    print("─" * 78)

    return {
        "success": True,
        "total_panels": len(panels),
        "json_path": json_path,
        "annotated_path": annotated_path,
        "crops_dir": crops_dir if crop_paths else None,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Comic & Webtoon Panel Detector and save structured outputs."
    )
    parser.add_argument(
        "-i", "--input",
        type=str,
        default=None,
        help="Path to image file or web URL. If omitted, prompts interactively or runs demo canvas."
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save output files (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "-s", "--sensitivity",
        type=float,
        default=30.0,
        help="Gutter detection sensitivity multiplier (default: 30.0)"
    )
    parser.add_argument(
        "--no-crops",
        action="store_true",
        help="Skip saving individual cropped panel PNG files."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic webtoon demo canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma Panel Detector Standalone Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    process_and_save_panels(
        input_source=input_arg,
        output_dir=args.output_dir,
        sensitivity=args.sensitivity,
        save_crops=not args.no_crops,
    )


if __name__ == "__main__":
    main()
