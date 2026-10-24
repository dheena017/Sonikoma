"""
backend/scripts/run_opencv_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Pure OpenCV Comic & Manga Panel Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
standardized, properly named output files:
1. <image_name>_opencv_panels.json  -> Structured panel coordinates & gutter metadata
2. <image_name>_annotated.png       -> Visual image with bounding boxes, polygons & badges
3. <image_name>_crops/             -> Individual cropped panel images (panel_01.png, ...)
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_opencv_detector.py
  python backend/scripts/run_opencv_detector.py --input "frontend/public/sample image/sample_manhwa_16_manga_grid_page.png"
  python backend/scripts/run_opencv_detector.py -i https://example.com/page.jpg -o my_output/
  python backend/scripts/run_opencv_detector.py --demo
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

from features.image.services.panel_detection.opencv_detector import (
    detect_opencv_panels,
    detect_opencv_panels,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "opencv_panels")


def to_file_uri(path_str: str) -> str:
    """Converts a local file path into a clickable file:// URI."""
    return Path(os.path.abspath(path_str)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, str]:
    """
    Loads an image from a local path, web URL, or sample path with fallback resolution.
    Returns (pil_image, base_name, local_file_path).
    """
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
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_image"
        temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{base_name}.png")
        pil_img.save(temp_path)
        return pil_img, base_name, temp_path

    # Case 2: Local File Path resolution with smart fallbacks
    project_root = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
    candidate_paths = [
        input_source,
        os.path.abspath(input_source),
        os.path.join(project_root, input_source),
        os.path.join(BACKEND_DIR, input_source),
        os.path.join(project_root, "frontend", "public", "sample image", input_source),
        os.path.join(project_root, "frontend", "public", "sample image", os.path.basename(input_source)),
    ]

    for candidate in candidate_paths:
        if os.path.exists(candidate) and os.path.isfile(candidate):
            print(f"[*] Loading local image: {candidate}")
            pil_img = Image.open(candidate).convert("RGB")
            base_name = os.path.splitext(os.path.basename(candidate))[0]
            return pil_img, base_name, candidate

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_comic_canvas() -> Tuple[Image.Image, str, str]:
    """Generates a dynamic multi-panel comic canvas with standard and diagonal frames."""
    print("[*] Generating dynamic synthetic comic canvas for demonstration...")
    w, h = 800, 1100
    pil_img = Image.new("RGB", (w, h), color=(250, 250, 250))
    draw = ImageDraw.Draw(pil_img)

    # 1. Top Wide Header Panel
    draw.rectangle([40, 40, 760, 280], outline=(15, 15, 15), fill=(240, 243, 246), width=5)
    draw.text((60, 60), "PANEL 1: WIDE HEADER FRAME", fill=(80, 80, 80))

    # Gutter between Panel 1 and Panel 2/3: Y=280 to 330 (50px gutter)

    # 2. Mid Left Panel (Standard Box)
    draw.rectangle([40, 330, 380, 680], outline=(15, 15, 15), fill=(245, 245, 240), width=5)
    draw.text((60, 350), "PANEL 2: STANDARD BOX", fill=(80, 80, 80))

    # 3. Mid Right Panel (Diagonal / Slanted Action Frame)
    slant_pts = [(420, 330), (760, 330), (760, 680), (450, 680)]
    draw.polygon(slant_pts, outline=(15, 15, 15), fill=(240, 245, 245), width=5)
    draw.text((470, 350), "PANEL 3: DIAGONAL SLANTED", fill=(80, 80, 80))

    # Gutter between Mid and Bottom: Y=680 to 730 (50px gutter)

    # 4. Bottom Full Panel
    draw.rectangle([40, 730, 760, 1040], outline=(15, 15, 15), fill=(244, 240, 245), width=5)
    draw.text((60, 750), "PANEL 4: BOTTOM CLIMAX FRAME", fill=(80, 80, 80))

    base_name = "demo_opencv_comic"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def render_annotated_image(
    source_img: Image.Image,
    panels: List[Dict[str, Any]],
    gutters: Optional[List[int]] = None,
) -> Image.Image:
    """Renders high-visibility bounding boxes, polygon contours, and badges on the image."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Vibrant palette for panel visualization
    color_standard = (0, 180, 80)     # Emerald Green
    color_diagonal = (235, 120, 20)   # Vivid Amber/Orange
    gutter_line_color = (180, 0, 220, 120) # Translucent Purple for gutters

    # Optional: Highlight gutter rows if detected
    if gutters and len(gutters) > 0:
        img_w, _ = source_img.size
        # Sample gutter points to avoid flooding image
        sample_step = max(1, len(gutters) // 30)
        for g_row in gutters[::sample_step]:
            draw.line([(0, g_row), (img_w, g_row)], fill=(200, 180, 230), width=1)

    for idx, p in enumerate(panels, start=1):
        px = int(p.get("x", 0))
        py = int(p.get("y", 0))
        pw = int(p.get("w") or p.get("width", 0))
        ph = int(p.get("h") or p.get("height", 0))
        label = p.get("label", "panel_standard")
        is_diagonal = "diagonal" in label.lower()
        color = color_diagonal if is_diagonal else color_standard

        # 1. Draw polygon boundary if available
        polygon = p.get("polygon")
        if polygon and len(polygon) >= 3:
            pts = [(int(pt[0]), int(pt[1])) for pt in polygon]
            draw.polygon(pts, outline=color, width=3)
            for pt in pts:
                draw.ellipse([pt[0] - 3, pt[1] - 3, pt[0] + 3, pt[1] + 3], fill=color)
        else:
            draw.rectangle([px, py, px + pw, py + ph], outline=color, width=3)

        # 2. Draw outer bounding box with dashed effect or secondary thin line
        draw.rectangle([px, py, px + pw, py + ph], outline=color, width=2)

        # 3. Draw badge banner
        badge_text = f"#{idx} [{label}] ({pw}x{ph}px)"
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
        px = max(0, int(p.get("x", 0)))
        py = max(0, int(p.get("y", 0)))
        pw = max(1, int(p.get("w") or p.get("width", 1)))
        ph = max(1, int(p.get("h") or p.get("height", 1)))

        x2 = min(img_w, px + pw)
        y2 = min(img_h, py + ph)

        cropped_img = source_img.crop((px, py, x2, y2))
        crop_filename = f"{base_name}_panel_{idx:02d}.png"
        crop_path = os.path.join(crops_dir, crop_filename)
        cropped_img.save(crop_path, format="PNG")
        crop_paths.append(crop_path)

    return crop_paths


def process_and_save_opencv_panels(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    canny_low: int = 20,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    min_width_pct: float = 0.15,
    min_height_px: int = 60,
    bleed_padding_px: int = 5,
    save_crops: bool = True,
) -> Dict[str, Any]:
    """
    Main processing pipeline for OpenCV panel detector runner:
    1. Loads input image
    2. Runs detect_opencv_panels()
    3. Writes structured JSON metadata, annotated visualization, and cropped panel PNGs.
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    # 1. Load image
    if input_source and input_source.strip():
        pil_img, base_name, local_file_path = load_input_image(input_source)
    else:
        pil_img, base_name, local_file_path = create_demo_comic_canvas()

    img_w, img_h = pil_img.size
    print("\n" + "=" * 78)
    print(f"▶ RUNNING OPENCV PANEL DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print("=" * 78)

    # 2. Call detect_opencv_panels()
    print("\n[Step 1/3] Executing detect_opencv_panels()...")
    t0 = time.perf_counter()
    img_bytes_buf = io.BytesIO()
    pil_img.save(img_bytes_buf, format="PNG")
    raw_bytes = img_bytes_buf.getvalue()

    result = detect_opencv_panels(
        image_bytes=raw_bytes,
        canny_low=canny_low,
        canny_high=canny_high,
        close_kernel_size=close_kernel_size,
        min_width_pct=min_width_pct,
        min_height_px=min_height_px,
        bleed_padding_px=bleed_padding_px,
    )
    detect_ms = int((time.perf_counter() - t0) * 1000)

    panels = result.get("panels", [])
    gutters = result.get("gutters", [])
    edge_energy = result.get("edge_energy", 0.0)

    print(f"  ✓ Extracted {len(panels)} panel(s), {len(gutters)} gutter rows in {detect_ms}ms")
    print(f"  ✓ Edge energy score: {edge_energy:.2f}")

    # 3. Save standardized output files
    print("\n[Step 2/3] Writing structured output artifacts...")

    # Output 1: JSON metadata
    json_filename = f"{base_name}_opencv_panels.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "parameters": {
            "canny_low": canny_low,
            "canny_high": canny_high,
            "close_kernel_size": close_kernel_size,
            "min_width_pct": min_width_pct,
            "min_height_px": min_height_px,
            "bleed_padding_px": bleed_padding_px,
        },
        "total_panels": len(panels),
        "total_gutter_rows": len(gutters),
        "edge_energy": edge_energy,
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "panels": panels,
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2)

    print(f"  [1] JSON Metadata   -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output 2: Annotated Image
    annotated_filename = f"{base_name}_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_image(pil_img, panels, gutters)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Image -> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output 3: Panel crops
    crops_dir = os.path.join(output_dir, f"{base_name}_crops")
    crop_paths = []
    if save_crops and panels:
        print("\n[Step 3/3] Extracting individual panel crops...")
        crop_paths = extract_panel_crops(pil_img, panels, crops_dir, base_name)
        print(f"  ✓ Successfully cropped {len(crop_paths)} panel(s) into: {crops_dir}")
        print(f"      URI: {to_file_uri(crops_dir)}")

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # 4. Print Summary Table
    print("\n" + "─" * 78)
    print("  OPENCV DETECTION SUMMARY RESULTS")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Total Panels     : {len(panels)}")
    print(f"  Gutter Rows      : {len(gutters)}")
    print(f"  Edge Energy      : {edge_energy:.2f}")
    print(f"  Total Time       : {total_time_ms} ms")
    print("─" * 78)
    for idx, p in enumerate(panels, start=1):
        pw = p.get("w") or p.get("width", 0)
        ph = p.get("h") or p.get("height", 0)
        label = p.get("label", "panel_standard")
        poly_pts = len(p.get("polygon") or [])
        area_pct = p.get("area_pct", 0.0) * 100
        print(
            f"  • #{idx:<2} | ID: {p.get('id', 'panel'):<13} | Type: {label:<16} "
            f"| Box: ({p.get('x', 0)}, {p.get('y', 0)}, {pw}, {ph}) "
            f"| Poly: {poly_pts} pts | Area: {area_pct:.1f}%"
        )
    print("─" * 78)

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Directory : {to_file_uri(output_dir)}")
    print(f"  • JSON Data : {to_file_uri(json_path)}")
    print(f"  • Annotated : {to_file_uri(annotated_path)}")
    if crop_paths:
        print(f"  • Crops Dir : {to_file_uri(crops_dir)}")
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
        description="Run Sonikoma OpenCV Comic & Manga Panel Detector on an image."
    )
    parser.add_argument(
        "-i", "--input",
        type=str,
        default=None,
        help="Path to image file or web URL. If omitted, prompts interactively or uses demo canvas."
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save output files (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--canny-low",
        type=int,
        default=20,
        help="Canny edge low threshold (default: 20)"
    )
    parser.add_argument(
        "--canny-high",
        type=int,
        default=100,
        help="Canny edge high threshold (default: 100)"
    )
    parser.add_argument(
        "--close-kernel",
        type=int,
        default=15,
        help="Morphological closing kernel size in pixels (default: 15)"
    )
    parser.add_argument(
        "--min-width",
        type=float,
        default=0.15,
        help="Minimum panel width fraction 0.0-1.0 (default: 0.15)"
    )
    parser.add_argument(
        "--min-height",
        type=int,
        default=60,
        help="Minimum panel height in pixels (default: 60)"
    )
    parser.add_argument(
        "--bleed",
        type=int,
        default=5,
        help="Bleed padding around panel frames in pixels (default: 5)"
    )
    parser.add_argument(
        "--no-crops",
        action="store_true",
        help="Disable extracting individual panel crop PNG files."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic demo comic canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma OpenCV Comic Panel Detector Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    process_and_save_opencv_panels(
        input_source=input_arg,
        output_dir=args.output_dir,
        canny_low=args.canny_low,
        canny_high=args.canny_high,
        close_kernel_size=args.close_kernel,
        min_width_pct=args.min_width,
        min_height_px=args.min_height,
        bleed_padding_px=args.bleed,
        save_crops=not args.no_crops,
    )


if __name__ == "__main__":
    main()
