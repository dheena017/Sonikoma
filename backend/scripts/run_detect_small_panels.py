"""
backend/scripts/run_detect_small_panels.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Small Comic Images, Single Frames & Standard Manga Pages:
Executes the dedicated small-panel detection service:
1. Grid / Frame contour detection with tight border snapping
2. Deep-learning speech bubble detection & text balloon binding
3. Character silhouette & face recognition
4. Spatial fusion with bleed padding
5. Auto-trim margin calculation & individual panel cropping

Outputs:
1. <image_name>_small_panels.json -> Detailed panel & bubble metadata
2. <image_name>_annotated.png    -> Visual preview with reading order & dialogue
3. <image_name>_crops/           -> Cropped individual panel image files
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_detect_small_panels.py
  python backend/scripts/run_detect_small_panels.py --input path/to/page.png
  python backend/scripts/run_detect_small_panels.py -i https://example.com/frame.jpg -o my_output/
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

from features.platform.projects.schemas_project import (
    DetectSmallPanelsRequest,
    DetectSmallPanelsResponse,
)
from features.image.detector.detect_small_panels_service import detect_small_panels
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "small_panels")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, bytes, Optional[str]]:
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
        return pil_img, base_name, raw_data, input_source

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
            return pil_img, base_name, raw_data, None

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_manga_page() -> Tuple[Image.Image, str, bytes]:
    """Generates a synthetic 4-panel manga grid page for demonstration."""
    print("[*] Generating dynamic synthetic 4-panel manga grid for Small Panels demo...")
    w, h = 800, 1100
    pil_img = Image.new("RGB", (w, h), color=(255, 255, 255))
    draw = ImageDraw.Draw(pil_img)

    # 4-panel grid layout (2 rows x 2 cols)
    grid = [
        (40, 50, 380, 520),    # Top Left
        (420, 50, 760, 520),   # Top Right
        (40, 560, 380, 1040),  # Bottom Left
        (420, 560, 760, 1040), # Bottom Right
    ]
    for idx, (x1, y1, x2, y2) in enumerate(grid):
        draw.rectangle([x1, y1, x2, y2], fill=(240, 240, 245), outline=(0, 0, 0), width=4)
        draw.text((x1 + 20, y1 + 20), f"Frame {idx + 1}", fill=(50, 50, 50))
        # Add a simulated speech bubble inside each
        bx, by = x1 + 40, y1 + 80
        draw.ellipse([bx, by, bx + 160, by + 90], fill=(255, 255, 255), outline=(0, 0, 0), width=2)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_data = buf.getvalue()
    return pil_img, "demo_small_panels_grid", raw_data


def render_annotated_panels(
    source_img: Image.Image,
    panels: list,
    speech_bubbles: list,
) -> Image.Image:
    """Renders panel borders, reading order badges, and contained speech bubbles."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Draw speech bubbles
    for b in speech_bubbles:
        bx = getattr(b, "x", 0)
        by = getattr(b, "y", 0)
        bw = getattr(b, "width", 0)
        bh = getattr(b, "height", 0)
        draw.rectangle([bx, by, bx + bw, by + bh], outline=(255, 69, 0), width=2)

    # Draw panels
    for idx, p in enumerate(panels):
        px = getattr(p, "x", 0)
        py = getattr(p, "y", 0)
        pw = getattr(p, "width", getattr(p, "w", 0))
        ph = getattr(p, "height", getattr(p, "h", 0))

        # Panel frame
        draw.rectangle([px, py, px + pw, py + ph], outline=(0, 204, 102), width=3)

        # Panel index badge
        badge_text = f"#{idx + 1}"
        draw.rectangle([px, py, px + 45, py + 24], fill=(0, 204, 102))
        draw.text((px + 6, py + 4), badge_text, fill=(255, 255, 255))

    return annotated


def run_pipeline(input_source: Optional[str] = None, output_dir: Optional[str] = None) -> None:
    """Executes small panels detection pipeline, crops frames, and saves artifacts."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    if not input_source:
        print("\n" + "=" * 70)
        print("  SONIKOMA - SMALL PANELS & SINGLE FRAME DETECTOR")
        print("=" * 70)
        prompt_val = input("Enter Image File Path, URL, or press [Enter] for Demo canvas: ").strip()
        if prompt_val:
            input_source = prompt_val

    target_url = None
    if input_source and input_source.strip().lower() != "demo":
        pil_img, base_name, raw_bytes, target_url = load_input_image(input_source)
    else:
        pil_img, base_name, raw_bytes = create_demo_manga_page()

    import base64
    b64_payload = f"data:image/png;base64,{base64.b64encode(raw_bytes).decode('ascii')}"

    print(f"\n[*] Executing Small Panels Detection on '{base_name}' ({pil_img.width}x{pil_img.height}px)...")
    start_t = time.perf_counter()

    req = DetectSmallPanelsRequest(
        url=target_url,
        image_base64=None if target_url else b64_payload,
        engine_mode="cv_yolo",
        snap_to_frame=True,
        merge_speech_bubbles=True,
    )
    res: DetectSmallPanelsResponse = asyncio.run(detect_small_panels(req))
    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    panels = res.panels or ([res.panel] if res.panel else [])
    bubbles = res.speech_bubbles or []

    print(f"\n[+] Detection Complete in {elapsed_ms}ms:")
    print(f"    • Panels Detected       : {len(panels)}")
    print(f"    • Speech Bubbles Bound  : {res.bound_speech_bubbles_count} of {res.total_speech_bubbles_count}")
    print(f"    • Directional Margins   : {res.margins}")

    # Save JSON Metadata
    res_dict = res.model_dump() if hasattr(res, "model_dump") else res.dict()
    res_dict["execution_time_ms"] = elapsed_ms
    json_path = os.path.join(out_dir, f"{base_name}_small_panels.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(res_dict, f, indent=2)
    print(f"    • JSON Saved            : {to_file_uri(json_path)}")

    # Render and Save Annotated Image
    annotated_img = render_annotated_panels(pil_img, panels, bubbles)
    annotated_path = os.path.join(out_dir, f"{base_name}_annotated.png")
    annotated_img.save(annotated_path)
    print(f"    • Preview Saved         : {to_file_uri(annotated_path)}")

    # Extract & Save Cropped Individual Panels
    crops_dir = os.path.join(out_dir, f"{base_name}_crops")
    os.makedirs(crops_dir, exist_ok=True)
    saved_crops = 0
    for idx, p in enumerate(panels):
        px = max(0, getattr(p, "x", 0))
        py = max(0, getattr(p, "y", 0))
        pw = max(1, getattr(p, "width", getattr(p, "w", 0)))
        ph = max(1, getattr(p, "height", getattr(p, "h", 0)))

        crop = pil_img.crop((px, py, min(pil_img.width, px + pw), min(pil_img.height, py + ph)))
        crop_path = os.path.join(crops_dir, f"panel_{idx + 1:02d}.png")
        crop.save(crop_path)
        saved_crops += 1

    print(f"    • Extracted Panels ({saved_crops}) : {to_file_uri(crops_dir)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Runner for Small Panels & Single Frame Detection")
    parser.add_argument("-i", "--input", type=str, default=None, help="Path to input image file or web URL")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    run_pipeline(input_source=args.input, output_dir=args.output)
