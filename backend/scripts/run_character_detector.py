"""
backend/scripts/run_character_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Comic & Manga Character & Silhouette Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
properly named output files:
1. <image_name>_characters.json  -> Structured entity coordinates, poses & faces
2. <image_name>_annotated.png   -> Visual image with bounding boxes, faces & polygons
3. <image_name>_mask.png        -> Binary alpha foreground segmentation mask
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_character_detector.py
  python backend/scripts/run_character_detector.py --input path/to/manga.png
  python backend/scripts/run_character_detector.py -i https://example.com/panel.jpg -o my_output/
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
from PIL import Image, ImageDraw

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image.detector.main_service_detector.detect_characters_service import (
    get_yolo_character_segmentation_model,
    detect_character_entities,
    segment_character_foreground,
    estimate_character_pose,
    detect_character_face,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "characters")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


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
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_character_image"
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


def create_demo_manga_canvas() -> tuple[Image.Image, str, str]:
    """Generates a synthetic manga canvas with character figure if no input is provided."""
    print("[*] Generating dynamic synthetic manga character canvas for demonstration...")
    pil_img = Image.new("RGB", (600, 800), color=(240, 240, 240))
    draw = ImageDraw.Draw(pil_img)

    # Outer comic panel border
    draw.rectangle([25, 25, 575, 775], outline=(0, 0, 0), width=4)

    # Stylized vertical manga figure silhouette
    draw.ellipse([250, 110, 350, 230], fill=(45, 45, 45))  # Head
    draw.polygon([(210, 230), (390, 230), (420, 500), (180, 500)], fill=(35, 35, 35))  # Torso / coat
    draw.rectangle([220, 500, 280, 710], fill=(25, 25, 25))  # Left leg
    draw.rectangle([320, 500, 380, 710], fill=(25, 25, 25))  # Right leg

    base_name = "demo_sample_character"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def render_annotated_image(
    source_img: Image.Image,
    characters: list,
) -> Image.Image:
    """Renders high-visibility bounding boxes, facial sub-boxes, and contour polygons."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Color palette based on pose type
    pose_color_map = {
        "full_body": (0, 200, 115),      # Emerald Green
        "upper_body": (0, 140, 255),     # Royal Blue
        "face_closeup": (245, 40, 145),  # Magenta Pink
        "silhouette": (255, 140, 0),     # Amber Orange
        "unknown": (180, 180, 180),      # Gray
    }

    for c in characters:
        cx, cy, cw, ch = c.x, c.y, c.width, c.height
        pose_str = c.pose_type.value if hasattr(c.pose_type, "value") else str(c.pose_type)
        color = pose_color_map.get(pose_str, (0, 200, 115))

        # 1. Draw polygon boundary if present
        if c.polygon and len(c.polygon) >= 3:
            pts = [(int(p[0]), int(p[1])) for p in c.polygon]
            draw.polygon(pts, outline=(0, 255, 255), width=2)

        # 2. Draw outer character bounding rectangle
        draw.rectangle([cx, cy, cx + cw, cy + ch], outline=color, width=3)

        # 3. Draw face sub-box if detected
        if getattr(c, "face", None) is not None and c.face:
            fx, fy, fw, fh = c.face.x, c.face.y, c.face.width, c.face.height
            draw.rectangle([fx, fy, fx + fw, fy + fh], outline=(255, 235, 59), width=2)
            face_tag = f"Face: {c.face.emotion}"
            draw.text((fx + 2, max(0, fy - 12)), face_tag, fill=(255, 235, 59))

        # 4. Draw badge banner for label and metadata
        badge_text = f"#{c.character_id} ({pose_str}) {c.confidence:.2f}"
        badge_h = 16
        badge_w = len(badge_text) * 7 + 8
        badge_y1 = max(0, cy - badge_h - 2)
        badge_y2 = badge_y1 + badge_h

        draw.rectangle([cx, badge_y1, cx + badge_w, badge_y2], fill=color)
        draw.text((cx + 4, badge_y1 + 2), badge_text, fill=(255, 255, 255))

    return annotated


def process_and_save_characters(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    conf_threshold: float = 0.20,
    detect_faces: bool = True,
) -> dict:
    """
    Main processing pipeline:
    - Loads input image
    - Executes multi-tier character detection & segmentation
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
    print(f"▶ RUNNING CHARACTER DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print("=" * 78)

    # 2. Call detect_character_entities()
    print("\n[Step 1/3] Calling detect_character_entities()...")
    t0 = time.perf_counter()
    characters = detect_character_entities(
        image_input=pil_img,
        conf_threshold=conf_threshold,
        detect_faces=detect_faces,
    )
    detect_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ Found {len(characters)} character figure(s) in {detect_ms}ms")

    # 3. Call segment_character_foreground()
    print("\n[Step 2/3] Calling segment_character_foreground()...")
    t0 = time.perf_counter()
    mask_np = segment_character_foreground(file_path_for_seg, conf_threshold=conf_threshold)
    seg_ms = int((time.perf_counter() - t0) * 1000)

    # If YOLO segmentation mask wasn't available, rasterize from detected polygon boundaries
    if mask_np is None and characters:
        print("  [*] Building binary foreground mask from detected character silhouettes...")
        mask_np = np.zeros((img_h, img_w), dtype=np.uint8)
        for c in characters:
            if c.polygon and len(c.polygon) >= 3:
                pts = np.array(c.polygon, dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(mask_np, [pts], 255)
            else:
                cv2.rectangle(mask_np, (c.x, c.y), (c.x + c.width, c.y + c.height), 255, -1)

    active_mask_pixels = int(np.count_nonzero(mask_np)) if mask_np is not None else 0
    print(f"  ✓ Binary character mask generated with {active_mask_pixels:,} positive pixels in {seg_ms}ms")

    # 4. Generate Properly Named Output Files
    print("\n[Step 3/3] Saving outputs with standardized filenames...")

    # Output File 1: JSON metadata
    json_filename = f"{base_name}_characters.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "confidence_threshold": conf_threshold,
        "total_characters": len(characters),
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "characters": [c.model_dump() if hasattr(c, "model_dump") else c.__dict__ for c in characters],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2)

    print(f"  [1] JSON Entities  -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output File 2: Annotated Image with Bounding Boxes, Faces & Polygons
    annotated_filename = f"{base_name}_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_image(pil_img, characters)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Image-> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output File 3: Binary Foreground Mask
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
    print(f"  Total Detected   : {len(characters)} character figure(s)")
    print(f"  Total Time       : {total_time_ms} ms")
    print("─" * 78)
    for c in characters:
        pose_str = c.pose_type.value if hasattr(c.pose_type, "value") else str(c.pose_type)
        face_str = f"Face: ({c.face.width}x{c.face.height})" if getattr(c, "face", None) else "Face: None"
        poly_pts = len(c.polygon) if c.polygon else 0
        print(f"  • #{c.character_id:<8} | Label: {c.label:<16} | Pose: {pose_str:<12} | "
              f"Conf: {c.confidence:.2f} | Box: ({c.x}, {c.y}, {c.width}, {c.height}) | "
              f"Polygon: {poly_pts} pts | {face_str}")
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
        "total_characters": len(characters),
        "json_path": json_path,
        "annotated_path": annotated_path,
        "mask_path": mask_path,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Comic Character Detector on an image and save structured output files."
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
        default=0.20,
        help="YOLO detection confidence threshold 0.0 - 1.0 (default: 0.20)"
    )
    parser.add_argument(
        "--no-faces",
        action="store_true",
        help="Disable facial localization and emotion extraction."
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
            print("\n=== Sonikoma Comic Character Detector Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    process_and_save_characters(
        input_source=input_arg,
        output_dir=args.output_dir,
        conf_threshold=args.conf,
        detect_faces=not args.no_faces,
    )


if __name__ == "__main__":
    main()
