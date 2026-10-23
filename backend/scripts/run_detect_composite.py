"""
backend/scripts/run_detect_composite.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Multimodal Composite Panel Detection:
Executes the unified composite pipeline in detect_composite_service.py:
1. Normalizes input image buffer and derives layout dimensions
2. Runs OpenCV geometric contour extraction
3. Runs YOLO deep-learning speech bubble detector
4. Runs YOLO character pose, face landmark, and silhouette recognition
5. Fuses all entities with speaker attribution and 5 placement conventions
6. Extracts cinematography tags (shot type, mood, camera angle)

Outputs:
1. <image_name>_composite.json   -> Complete multimodal scene graph response
2. <image_name>_annotated.png    -> Annotated visual image with all entities
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_detect_composite.py
  python backend/scripts/run_detect_composite.py --input path/to/manga.png
  python backend/scripts/run_detect_composite.py -i https://example.com/page.jpg -o my_output/
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
    DetectPanelsUrlRequest,
    DetectCompositeResponse,
)
from features.image_editor.services.detector.detect_composite_service import detect_composite_panels
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "composite")


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


def create_demo_composite_canvas() -> Tuple[Image.Image, str, bytes]:
    """Generates a synthetic multi-entity comic canvas for demonstration."""
    print("[*] Generating dynamic synthetic multi-entity comic canvas for Composite demo...")
    w, h = 800, 900
    pil_img = Image.new("RGB", (w, h), color=(245, 245, 248))
    draw = ImageDraw.Draw(pil_img)

    # 2 Main Panels
    draw.rectangle([40, 40, 760, 420], outline=(0, 0, 0), width=4, fill=(255, 255, 255))
    draw.rectangle([40, 460, 760, 860], outline=(0, 0, 0), width=4, fill=(255, 255, 255))

    # Character in Panel 1
    draw.rectangle([80, 80, 260, 380], outline=(30, 144, 255), width=3)
    draw.text((90, 90), "Character 1", fill=(30, 144, 255))

    # Dialogue in Panel 1
    draw.ellipse([320, 100, 520, 220], outline=(220, 20, 60), width=3, fill=(255, 255, 255))

    # Character in Panel 2
    draw.rectangle([500, 500, 720, 800], outline=(30, 144, 255), width=3)
    draw.text((510, 510), "Character 2", fill=(30, 144, 255))

    # Dialogue in Panel 2
    draw.ellipse([140, 540, 360, 660], outline=(220, 20, 60), width=3, fill=(255, 255, 255))

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_data = buf.getvalue()
    return pil_img, "demo_composite_page", raw_data


def render_annotated_composite(
    source_img: Image.Image,
    composite_res: DetectCompositeResponse,
) -> Image.Image:
    """Renders panels, characters, speech bubbles, and cinematography badges."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # 1. Panels
    for p in composite_res.panels:
        draw.rectangle([p.x, p.y, p.x + p.w, p.y + p.h], outline=(0, 204, 255), width=3)

        cine_text = p.cinematography.shot_type.upper() if p.cinematography else "WIDE"
        badge = f"{p.id.upper()} [{cine_text}]"
        draw.rectangle([p.x, p.y - 22, p.x + len(badge) * 8 + 12, p.y], fill=(0, 204, 255))
        draw.text((p.x + 6, p.y - 18), badge, fill=(0, 0, 0))

    # 2. Characters
    for c in composite_res.characters:
        draw.rectangle([c.x, c.y, c.x + c.width, c.y + c.height], outline=(30, 144, 255), width=2)
        c_label = f"CHAR: {c.character_id}"
        draw.rectangle([c.x, c.y, c.x + len(c_label) * 7 + 8, c.y + 16], fill=(30, 144, 255))
        draw.text((c.x + 4, c.y + 2), c_label, fill=(255, 255, 255))

    # 3. Speech Bubbles
    for b in composite_res.speech_bubbles:
        draw.rectangle([b.x, b.y, b.x + b.width, b.y + b.height], outline=(231, 76, 60), width=2)
        b_rel = b.placement_relation or "inside"
        b_label = f"{b.bubble_id} ({b_rel})"
        draw.rectangle([b.x, b.y, b.x + len(b_label) * 7 + 8, b.y + 16], fill=(231, 76, 60))
        draw.text((b.x + 4, b.y + 2), b_label, fill=(255, 255, 255))

    return annotated


def run_pipeline(input_source: Optional[str] = None, output_dir: Optional[str] = None) -> None:
    """Executes composite detection pipeline and saves structured response."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    if not input_source:
        print("\n" + "=" * 70)
        print("  SONIKOMA - MULTIMODAL COMPOSITE DETECTOR")
        print("=" * 70)
        prompt_val = input("Enter Image File Path, URL, or press [Enter] for Demo canvas: ").strip()
        if prompt_val:
            input_source = prompt_val

    target_url = None
    if input_source and input_source.strip().lower() != "demo":
        pil_img, base_name, raw_bytes, target_url = load_input_image(input_source)
    else:
        pil_img, base_name, raw_bytes = create_demo_composite_canvas()

    import base64
    b64_payload = f"data:image/png;base64,{base64.b64encode(raw_bytes).decode('ascii')}"

    print(f"\n[*] Executing Unified Composite Pipeline on '{base_name}' ({pil_img.width}x{pil_img.height}px)...")
    start_t = time.perf_counter()

    req = DetectPanelsUrlRequest(
        url=target_url,
        image_base64=None if target_url else b64_payload,
        engine_mode="cv_yolo",
        use_yolo=True,
    )
    res: DetectCompositeResponse = asyncio.run(detect_composite_panels(req))
    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    print(f"\n[+] Composite Detection Complete in {elapsed_ms}ms:")
    print(f"    • Panels Detected       : {res.total_panels}")
    print(f"    • Speech Bubbles Found  : {res.total_speech_bubbles}")
    print(f"    • Characters Identified : {res.total_characters}")
    print(f"    • Reading Flow Mode     : {res.reading_flow}")

    # Save JSON Metadata
    res_dict = res.model_dump() if hasattr(res, "model_dump") else res.dict()
    res_dict["execution_time_ms"] = elapsed_ms
    json_path = os.path.join(out_dir, f"{base_name}_composite.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(res_dict, f, indent=2)
    print(f"    • JSON Saved            : {to_file_uri(json_path)}")

    # Render and Save Annotated Image
    annotated_img = render_annotated_composite(pil_img, res)
    annotated_path = os.path.join(out_dir, f"{base_name}_annotated.png")
    annotated_img.save(annotated_path)
    print(f"    • Preview Saved         : {to_file_uri(annotated_path)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Runner for Multimodal Composite Panel Detection")
    parser.add_argument("-i", "--input", type=str, default=None, help="Path to input image file or web URL")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    run_pipeline(input_source=args.input, output_dir=args.output)
