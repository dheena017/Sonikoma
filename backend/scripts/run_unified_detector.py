"""
backend/scripts/run_unified_detector.py
─────────────────────────────────────────────────────────────────────────────
Master Standalone Runner for Unified Comic, Manga & Webtoon Detection:
Runs the complete top-to-bottom pipeline exposed by detector/__init__.py:
1. Resolves input image buffer (file path or web URL)
2. Executes Layout & Format Classification (detect_type_service)
3. Auto-dispatches based on format:
   - Tall Webtoon Strips -> detect_long_panels
   - Small Frames / Standard Manga Grid -> detect_small_panels
4. Runs the 3 underlying vision engines:
   - Panel contours & vertical seam projection (panel_detector)
   - Dialogue balloon & chat UI pill detection (speech_bubble_detector)
   - Character poses, silhouettes, and face recognition (detect_characters_service)
5. Executes Spatial Multi-Entity Fusion (panel_fusion_service):
   - 5 Canonical Manga Conventions
   - Speaker Attribution
   - Non-overlap midpoint boundary clipping
   - Cinematography shot framing inference
6. Extracts individual cropped panel images

Outputs:
1. <image_name>_full_analysis.json -> Unified response payload with scene graph
2. <image_name>_annotated.png      -> Annotated visual preview
3. <image_name>_crops/             -> Sliced discrete panel images
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_unified_detector.py
  python backend/scripts/run_unified_detector.py --input path/to/manga.png
  python backend/scripts/run_unified_detector.py -i https://example.com/strip.jpg -o my_output/
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
    DetectLongPanelsRequest,
)
from features.image_editor.services.detector import (
    detect_image_layout_type,
    detect_small_panels,
    detect_long_panels,
    detect_composite_panels,
)
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "unified_detector")


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


def create_demo_comic_canvas() -> Tuple[Image.Image, str, bytes]:
    """Generates a synthetic 3-panel comic canvas for demonstration."""
    print("[*] Generating dynamic synthetic comic canvas for Master Unified Runner demo...")
    w, h = 700, 1200
    pil_img = Image.new("RGB", (w, h), color=(250, 250, 252))
    draw = ImageDraw.Draw(pil_img)

    panels = [
        (40, 50, 660, 400),
        (40, 440, 660, 780),
        (40, 820, 660, 1150),
    ]
    for idx, (x1, y1, x2, y2) in enumerate(panels):
        draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255), outline=(0, 0, 0), width=4)
        draw.text((x1 + 25, y1 + 25), f"Panel {idx + 1}", fill=(40, 40, 40))
        # Draw simulated speech bubble
        bx, by = x1 + 50, y1 + 80
        draw.ellipse([bx, by, bx + 180, by + 100], fill=(255, 255, 255), outline=(0, 0, 0), width=2)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_data = buf.getvalue()
    return pil_img, "demo_master_unified_comic", raw_data


def render_annotated_result(
    source_img: Image.Image,
    panels: list,
    layout_tag: str,
) -> Image.Image:
    """Renders comprehensive overlay of panels, reading order, and layout badge."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)
    w, h = annotated.size

    # Top layout badge banner
    draw.rectangle([0, 0, w, 36], fill=(24, 24, 30))
    draw.text((15, 9), f"LAYOUT: {layout_tag.upper()} | TOTAL PANELS: {len(panels)}", fill=(0, 255, 204))

    for idx, p in enumerate(panels):
        px = getattr(p, "x", 0)
        py = getattr(p, "y", 0)
        pw = getattr(p, "width", getattr(p, "w", 0))
        ph = getattr(p, "height", getattr(p, "h", 0))

        # Panel outline
        draw.rectangle([px, py, px + pw, py + ph], outline=(0, 180, 255), width=3)

        # Panel Order Badge
        draw.rectangle([px, py, px + 50, py + 24], fill=(0, 180, 255))
        draw.text((px + 8, py + 4), f"#{idx + 1}", fill=(0, 0, 0))

        # Speech bubbles
        for b in getattr(p, "speech_bubbles", []) or []:
            bx = getattr(b, "x", 0)
            by = getattr(b, "y", 0)
            bw = getattr(b, "width", 0)
            bh = getattr(b, "height", 0)
            draw.rectangle([bx, by, bx + bw, by + bh], outline=(255, 75, 75), width=2)

    return annotated


def run_pipeline(input_source: Optional[str] = None, output_dir: Optional[str] = None) -> None:
    """Executes the master unified pipeline and produces complete artifacts."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    if not input_source:
        print("\n" + "=" * 70)
        print("  SONIKOMA - UNIFIED MASTER DETECTION PIPELINE")
        print("=" * 70)
        prompt_val = input("Enter Image File Path, URL, or press [Enter] for Demo canvas: ").strip()
        if prompt_val:
            input_source = prompt_val

    target_url = None
    if input_source and input_source.strip().lower() != "demo":
        pil_img, base_name, raw_bytes, target_url = load_input_image(input_source)
    else:
        pil_img, base_name, raw_bytes = create_demo_comic_canvas()

    import base64
    b64_payload = f"data:image/png;base64,{base64.b64encode(raw_bytes).decode('ascii')}"

    print(f"\n[*] Step 1/3: Classifying layout format for '{base_name}' ({pil_img.width}x{pil_img.height}px)...")
    start_t = time.perf_counter()

    layout_info = asyncio.run(detect_image_layout_type(raw_bytes=raw_bytes))
    crop_type_str = layout_info.crop_type.value if hasattr(layout_info.crop_type, "value") else str(layout_info.crop_type)
    is_tall = (
        crop_type_str in ("long_panels", "ultra_long_panels", "four_koma")
        or (layout_info.aspect_ratio or 0) >= 2.0
    )

    print(f"    • Detected Layout : {crop_type_str} (ratio={layout_info.aspect_ratio:.2f}, bg={layout_info.detected_bg_color})")

    # Step 2: Dispatch to the appropriate orchestrator
    if is_tall:
        print(f"[*] Step 2/3: Dispatching to Tall Strip Pipeline (detect_long_panels)...")
        req_long = DetectLongPanelsRequest(
            url=target_url,
            image_base64=None if target_url else b64_payload,
            engine_mode="cv_yolo",
            sensitivity=30.0,
            auto_split=True,
        )
        res = asyncio.run(detect_long_panels(req_long))
        panels = res.panels or []
        bubbles_count = res.total_speech_bubbles_count
    else:
        print(f"[*] Step 2/3: Dispatching to Standard / Small Frame Pipeline (detect_small_panels)...")
        req_small = DetectSmallPanelsRequest(
            url=target_url,
            image_base64=None if target_url else b64_payload,
            engine_mode="cv_yolo",
            snap_to_frame=True,
            merge_speech_bubbles=True,
        )
        res = asyncio.run(detect_small_panels(req_small))
        panels = res.panels or ([res.panel] if res.panel else [])
        bubbles_count = res.bound_speech_bubbles_count

    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    print(f"\n[+] Master Pipeline Succeeded in {elapsed_ms}ms:")
    print(f"    • Panels Extracted     : {len(panels)}")
    print(f"    • Bound Speech Bubbles : {bubbles_count}")

    # Step 3: Save Artifacts
    res_dict = res.model_dump() if hasattr(res, "model_dump") else res.dict()
    res_dict["layout_metadata"] = layout_info.model_dump() if hasattr(layout_info, "model_dump") else layout_info.dict()
    res_dict["execution_time_ms"] = elapsed_ms

    json_path = os.path.join(out_dir, f"{base_name}_full_analysis.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(res_dict, f, indent=2)
    print(f"    • JSON Saved           : {to_file_uri(json_path)}")

    # Render Annotated Preview
    annotated_img = render_annotated_result(pil_img, panels, crop_type_str)
    annotated_path = os.path.join(out_dir, f"{base_name}_annotated.png")
    annotated_img.save(annotated_path)
    print(f"    • Preview Saved        : {to_file_uri(annotated_path)}")

    # Extract Individual Cropped Panels
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

    print(f"    • Sliced Panels ({saved_crops})   : {to_file_uri(crops_dir)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Standalone Runner for Unified Comic & Webtoon Detection")
    parser.add_argument("-i", "--input", type=str, default=None, help="Path to input image file or web URL")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    run_pipeline(input_source=args.input, output_dir=args.output)
