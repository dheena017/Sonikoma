"""
backend/scripts/run_detect_type.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Comic Layout & Reading Flow Classification:
Analyzes an image using the 5-layer classification engine:
1. Geometric aspect ratio & matrix dimensions
2. Background color & corner palette scanning
3. Projection profile & horizontal whitespace gutter detection
4. Edge energy & dynamic Canny threshold optimizer
5. Decision tree classification (Long strip, Manga grid, Single frame, etc.)

Outputs:
1. <image_name>_layout.json      -> Complete layout metadata and classification
2. <image_name>_annotated.png    -> Annotated preview showing gutters and palette
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_detect_type.py
  python backend/scripts/run_detect_type.py --input path/to/manga.png
  python backend/scripts/run_detect_type.py -i https://example.com/strip.jpg -o my_output/
"""

import os
import sys
import io
import time
import json
import argparse
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image_editor.services.detector.detect_type_service import (
    detect_image_layout_type,
    sample_background_palette,
    analyze_horizontal_gutters,
    calculate_edge_complexity,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "layout_type")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, bytes]:
    """Loads an image from local path, URL, or sample directory."""
    input_source = input_source.strip()
    if input_source.startswith("&"):
        input_source = input_source[1:].strip()
    quote_chars = ('"', "'", "`")
    while input_source and (input_source[0] in quote_chars or input_source[-1] in quote_chars):
        if input_source[0] in quote_chars:
            input_source = input_source[1:].strip()
        if input_source and input_source[-1] in quote_chars:
            input_source = input_source[:-1].strip()

    # Web URL
    if input_source.startswith("http://") or input_source.startswith("https://"):
        print(f"[*] Downloading image from URL: {input_source}...")
        resolved = asyncio.run(resolve_image_to_buffer(input_source))
        raw_data = resolved.get("data")
        if not raw_data:
            raise ValueError(f"Failed to fetch image from URL: {input_source}")
        pil_img = Image.open(io.BytesIO(raw_data)).convert("RGB")
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_image"
        return pil_img, base_name, raw_data

    # Local file candidate lookup
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
            with open(candidate, "rb") as f:
                raw_data = f.read()
            pil_img = Image.open(io.BytesIO(raw_data)).convert("RGB")
            base_name = os.path.splitext(os.path.basename(candidate))[0]
            return pil_img, base_name, raw_data

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_strip_canvas() -> Tuple[Image.Image, str, bytes]:
    """Generates a synthetic webtoon strip for demonstration."""
    print("[*] Generating dynamic synthetic webtoon strip canvas for layout demo...")
    w, h = 600, 1600
    pil_img = Image.new("RGB", (w, h), color=(255, 255, 255))
    draw = ImageDraw.Draw(pil_img)

    # 3 stacked panels with white gutters
    panels = [
        (40, 60, 560, 480),
        (40, 580, 560, 1020),
        (40, 1120, 560, 1540),
    ]
    for idx, (x1, y1, x2, y2) in enumerate(panels):
        draw.rectangle([x1, y1, x2, y2], fill=(235, 235, 240), outline=(0, 0, 0), width=4)
        draw.text((x1 + 30, y1 + 30), f"Panel {idx + 1}", fill=(40, 40, 40))

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_data = buf.getvalue()
    return pil_img, "demo_layout_webtoon_strip", raw_data


def render_annotated_layout(
    source_img: Image.Image,
    layout_res: Any,
    gutter_y_positions: list,
) -> Image.Image:
    """Renders layout type badges, gutter seam lines, and corner palette markers."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)
    w, h = annotated.size

    # Draw horizontal gutter lines
    for gy in gutter_y_positions:
        draw.line([(0, gy), (w, gy)], fill=(0, 180, 255), width=3)

    # Banner header at top
    crop_type = getattr(layout_res, "crop_type", None)
    crop_str = crop_type.value if hasattr(crop_type, "value") else str(crop_type)
    aspect = float(getattr(layout_res, "aspect_ratio", 0.0) or 0.0)
    bg_color = getattr(layout_res, "detected_bg_color", "unknown")
    reading_flow = getattr(layout_res, "reading_flow", None)
    flow_str = reading_flow.value if hasattr(reading_flow, "value") else str(reading_flow)

    badge_text = (
        f"TYPE: {crop_str.upper()} | RATIO: {aspect:.2f} | "
        f"BG: {bg_color} | FLOW: {flow_str}"
    )
    draw.rectangle([0, 0, w, 44], fill=(20, 20, 25))
    draw.text((15, 12), badge_text, fill=(0, 255, 180))

    return annotated


def run_pipeline(input_source: Optional[str] = None, output_dir: Optional[str] = None) -> None:
    """Executes layout type classification pipeline and saves artifacts."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    if not input_source:
        print("\n" + "=" * 70)
        print("  SONIKOMA - COMIC LAYOUT & READING FLOW CLASSIFIER")
        print("=" * 70)
        prompt_val = input("Enter Image File Path, URL, or press [Enter] for Demo canvas: ").strip()
        if prompt_val:
            input_source = prompt_val

    if input_source and input_source.strip().lower() != "demo":
        pil_img, base_name, raw_bytes = load_input_image(input_source)
    else:
        pil_img, base_name, raw_bytes = create_demo_strip_canvas()

    print(f"\n[*] Processing Image: '{base_name}' ({pil_img.width}x{pil_img.height}px)...")
    start_t = time.perf_counter()

    # 1. Execute layout classifier
    layout_res = asyncio.run(detect_image_layout_type(raw_bytes=raw_bytes))
    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    # 2. Extract gutter lines for visualization
    valleys, gutter_ratio, gutter_row_count = analyze_horizontal_gutters(pil_img)
    gutter_seams = []

    print(f"\n[+] Classification Complete in {elapsed_ms}ms:")
    crop_type_val = layout_res.crop_type.value if hasattr(layout_res.crop_type, "value") else layout_res.crop_type
    print(f"    • Detected Format : {crop_type_val} ({layout_res.type_label})")
    print(f"    • Aspect Ratio    : {layout_res.aspect_ratio:.2f}")
    print(f"    • Background Color: {layout_res.detected_bg_color}")
    print(f"    • Reading Flow    : {layout_res.reading_flow.value if hasattr(layout_res.reading_flow, 'value') else layout_res.reading_flow}")
    print(f"    • Est. Panels     : {layout_res.estimated_panel_count}")
    canny = getattr(layout_res, "optimal_canny_thresholds", {}) or {}
    print(f"    • Recom. Canny    : {canny.get('low', 20)}/{canny.get('high', 100)}")

    # 3. Save JSON Metadata
    res_dict = layout_res.model_dump() if hasattr(layout_res, "model_dump") else layout_res.dict()
    res_dict["execution_time_ms"] = elapsed_ms
    res_dict["horizontal_gutters_detected"] = len(gutter_seams)

    json_path = os.path.join(out_dir, f"{base_name}_layout.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(res_dict, f, indent=2)
    print(f"    • JSON Saved      : {to_file_uri(json_path)}")

    # 4. Render and Save Annotated Image
    annotated_img = render_annotated_layout(pil_img, layout_res, gutter_seams)
    annotated_path = os.path.join(out_dir, f"{base_name}_annotated.png")
    annotated_img.save(annotated_path)
    print(f"    • Preview Saved   : {to_file_uri(annotated_path)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Runner for Comic Layout & Format Classifier")
    parser.add_argument("-i", "--input", type=str, default=None, help="Path to input image file or web URL")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    run_pipeline(input_source=args.input, output_dir=args.output)
