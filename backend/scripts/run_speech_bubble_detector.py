"""
backend/scripts/run_speech_bubble_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Speech Bubble & Dialogue Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
properly named output files:
1. <image_name>_bubbles.json     -> Structured entity coordinates & metadata
2. <image_name>_annotated.png    -> Visual image with bounding boxes & polygons
3. <image_name>_mask.png         -> Binary alpha segmentation mask for inpainting
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_speech_bubble_detector.py
  python backend/scripts/run_speech_bubble_detector.py --input path/to/manga.png
  python backend/scripts/run_speech_bubble_detector.py -i https://example.com/panel.jpg -o my_output/
"""

import os
import sys
import io
import time
import json
import argparse
from pathlib import Path
from typing import Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image.detector.main_service_detector.speech_bubble_detector import (
    get_yolo_speech_bubble_model,
    detect_speech_bubbles,
    detect_chat_ui_bubbles,
    segment_speech_bubbles_and_text_balloons,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "speech_bubbles")


def load_input_image(input_source: str) -> tuple[Image.Image, str, str]:
    """
    Loads an image from a local path, URL, or generates a sample image.
    Returns (pil_image, base_name, temp_file_path_if_any).
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
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_image"
        # Save temp file for segmentation function
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


def create_demo_manga_canvas() -> tuple[Image.Image, str, str]:
    """Generates a synthetic manga canvas if no input is provided."""
    print("[*] Generating dynamic synthetic manga canvas for demonstration...")
    pil_img = Image.new("RGB", (600, 600), color=(225, 225, 225))
    draw = ImageDraw.Draw(pil_img)

    # Outer comic border
    draw.rectangle([25, 25, 575, 575], outline=(0, 0, 0), width=4)

    # 1. Main dialogue speech bubble
    bx1, by1, bx2, by2 = 80, 70, 360, 260
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    for y in range(by1 + 40, by2 - 40, 16):
        draw.line([bx1 + 35, y, bx2 - 35, y], fill=(0, 0, 0), width=3)

    # 2. Secondary rounded dialogue bubble
    bx1, by1, bx2, by2 = 360, 320, 540, 480
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    for y in range(by1 + 35, by2 - 35, 14):
        draw.line([bx1 + 25, y, bx2 - 25, y], fill=(0, 0, 0), width=2)

    base_name = "demo_sample_manga"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def render_annotated_image(
    source_img: Image.Image,
    bubbles: list,
) -> Image.Image:
    """Renders high-visibility bounding boxes, polygon contours, and labels."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Distinct color palette for bubble sub-types
    color_map = {
        "speech": (230, 30, 30),         # Red
        "chat_message": (0, 122, 255),    # Blue
        "thought": (160, 32, 240),        # Purple
        "caption": (255, 140, 0),         # Orange
    }

    for b in bubbles:
        bx, by, bw, bh = b.x, b.y, b.width, b.height
        sub_type = getattr(b, "sub_type", "speech")
        color = color_map.get(sub_type, (230, 30, 30))

        # 1. Draw polygon boundary if present
        if b.polygon and len(b.polygon) >= 3:
            pts = [(int(p[0]), int(p[1])) for p in b.polygon]
            draw.polygon(pts, outline=(0, 200, 255), width=2)

        # 2. Draw outer bounding rectangle
        draw.rectangle([bx, by, bx + bw, by + bh], outline=color, width=3)

        # 3. Draw badge banner for label
        badge_text = f"#{b.reading_order} {b.bubble_id} ({sub_type}) {b.confidence:.2f}"
        badge_h = 16
        badge_w = len(badge_text) * 7 + 8
        badge_y1 = max(0, by - badge_h - 2)
        badge_y2 = badge_y1 + badge_h

        draw.rectangle([bx, badge_y1, bx + badge_w, badge_y2], fill=color)
        draw.text((bx + 4, badge_y1 + 2), badge_text, fill=(255, 255, 255))

    return annotated


def process_and_save_speech_bubbles(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    conf_threshold: float = 0.25,
) -> dict:
    """
    Main processing pipeline:
    - Loads input
    - Executes speech bubble detector functions
    - Generates and writes properly named output files
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    # 1. Load image
    if input_source and input_source.strip():
        pil_img, base_name, file_path_for_seg = load_input_image(input_source)
    else:
        pil_img, base_name, file_path_for_seg = create_demo_manga_canvas()

    img_w, img_h = pil_img.size
    print("\n" + "=" * 78)
    print(f"▶ RUNNING SPEECH BUBBLE DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print("=" * 78)

    # 2. Call detect_speech_bubbles()
    print("\n[Step 1/3] Calling detect_speech_bubbles()...")
    t0 = time.perf_counter()
    bubbles = detect_speech_bubbles(pil_img, conf_threshold=conf_threshold)
    detect_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ Found {len(bubbles)} dialogue bubble(s) in {detect_ms}ms")

    # 3. Call segment_speech_bubbles_and_text_balloons()
    print("\n[Step 2/3] Calling segment_speech_bubbles_and_text_balloons()...")
    t0 = time.perf_counter()
    mask_np = segment_speech_bubbles_and_text_balloons(file_path_for_seg, conf_threshold=conf_threshold)
    seg_ms = int((time.perf_counter() - t0) * 1000)

    # If YOLO segmentation mask wasn't available, build mask from detected entities
    if mask_np is None and bubbles:
        print("  [*] Building binary mask raster from detected bubble boundaries...")
        mask_np = np.zeros((img_h, img_w), dtype=np.uint8)
        for b in bubbles:
            if b.polygon and len(b.polygon) >= 3:
                pts = np.array(b.polygon, dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(mask_np, [pts], 255)
            else:
                cv2.rectangle(mask_np, (b.x, b.y), (b.x + b.width, b.y + b.height), 255, -1)
    
    active_mask_pixels = int(np.count_nonzero(mask_np)) if mask_np is not None else 0
    print(f"  ✓ Binary mask generated with {active_mask_pixels:,} positive pixels in {seg_ms}ms")

    # 4. Generate Properly Named Output Files
    print("\n[Step 3/3] Saving outputs with standardized filenames...")

    # Output File 1: JSON metadata
    json_filename = f"{base_name}_bubbles.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "confidence_threshold": conf_threshold,
        "total_bubbles": len(bubbles),
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "bubbles": [b.model_dump() if hasattr(b, "model_dump") else b.__dict__ for b in bubbles],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2)
    def to_file_uri(p: str) -> str:
        return Path(os.path.abspath(p)).as_uri()

    print(f"  [1] JSON Entities  -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output File 2: Annotated Image with Bounding Boxes & Polygons
    annotated_filename = f"{base_name}_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_image(pil_img, bubbles)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Image-> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output File 3: Binary Inpainting Mask
    mask_filename = f"{base_name}_mask.png"
    mask_path = os.path.join(output_dir, mask_filename)
    if mask_np is not None:
        cv2.imwrite(mask_path, mask_np)
        print(f"  [3] Binary Mask    -> {mask_path}")
        print(f"      URI: {to_file_uri(mask_path)}")
    else:
        mask_path = None

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # 5. Print Human-Readable Summary Table
    print("\n" + "─" * 78)
    print("  DETECTION SUMMARY RESULTS")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Total Detected   : {len(bubbles)} dialogue bubbles")
    print(f"  Total Time       : {total_time_ms} ms")
    print("─" * 78)
    for b in bubbles:
        print(f"  • #{b.reading_order:<2} | {b.bubble_id:<12} | {b.sub_type:<12} | Conf: {b.confidence:<4} | Box: ({b.x}, {b.y}, {b.width}, {b.height})")
    print("─" * 78)

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Directory : {to_file_uri(output_dir)}")
    print(f"  • JSON Data : {to_file_uri(json_path)}")
    print(f"  • Annotated : {to_file_uri(annotated_path)}")
    if mask_path:
        print(f"  • Mask PNG  : {to_file_uri(mask_path)}")
    print("─" * 78)

    return {
        "success": True,
        "total_bubbles": len(bubbles),
        "json_path": json_path,
        "annotated_path": annotated_path,
        "mask_path": mask_path,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Speech Bubble Detector on an image and save structured output files."
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
        "-c", "--conf",
        type=float,
        default=0.25,
        help="YOLO detection confidence threshold 0.0 - 1.0 (default: 0.25)"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic demo canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma Speech Bubble Detector Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    process_and_save_speech_bubbles(
        input_source=input_arg,
        output_dir=args.output_dir,
        conf_threshold=args.conf,
    )


if __name__ == "__main__":
    main()
