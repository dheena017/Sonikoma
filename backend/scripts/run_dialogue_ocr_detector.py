"""
backend/scripts/run_dialogue_ocr_detector.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Comic Dialogue OCR & Speech Text Detection:
Accepts user input (image file path, URL, or interactive prompt) and produces
standardized output files:
1. <image_name>_dialogue.json  -> Structured dialogue segments, reading order & transcript
2. <image_name>_annotated.png  -> Visual image with text bounding boxes, quads & badges
3. <image_name>_mask.png       -> Binary alpha text inpainting mask for text cleaning
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_dialogue_ocr_detector.py
  python backend/scripts/run_dialogue_ocr_detector.py --input path/to/manga.png
  python backend/scripts/run_dialogue_ocr_detector.py -i https://example.com/panel.jpg -o my_output/
  python backend/scripts/run_dialogue_ocr_detector.py --bubble-guided
"""

import os
import sys
import io
import time
import json
import asyncio
import argparse
from pathlib import Path
from typing import Optional, List, Tuple

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image_editor.services.ocr.dialogue_text_detector import (
    extract_full_ocr_data,
    detect_text_service,
    get_ocr_reader,
    clean_transcript_whitespace,
)
from features.image_editor.schemas import DetectTextRequest, DetectTextResponse
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "ocr_dialogue")


def load_input_image(input_source: str) -> Tuple[Image.Image, str, str]:
    """
    Loads an image from a local path, URL, or project sample folder.
    Returns (pil_image, base_name, local_file_path).
    """
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
    sample_dir = os.path.join(project_root, "frontend", "public", "sample image")

    # Clean path separators
    clean_src = input_source.replace("/", os.sep).replace("\\", os.sep)
    clean_base = os.path.splitext(os.path.basename(clean_src))[0]

    candidate_paths = [
        input_source,
        os.path.abspath(input_source),
        os.path.join(project_root, clean_src),
        os.path.join(BACKEND_DIR, clean_src),
        os.path.join(sample_dir, clean_src),
        os.path.join(sample_dir, os.path.basename(clean_src)),
    ]

    # Try common image extensions if missing or mismatched
    ext_candidates = []
    for c in list(candidate_paths):
        ext_candidates.append(c)
        base_without_ext = os.path.splitext(c)[0]
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            ext_candidates.append(f"{base_without_ext}{ext}")

    for candidate in ext_candidates:
        if os.path.exists(candidate) and os.path.isfile(candidate):
            print(f"[*] Loading local image: {candidate}")
            pil_img = Image.open(candidate).convert("RGB")
            base_name = os.path.splitext(os.path.basename(candidate))[0]
            return pil_img, base_name, candidate

    # Smart prefix/fuzzy search inside sample image folder
    if os.path.exists(sample_dir):
        sample_files = os.listdir(sample_dir)
        search_term = clean_base.lower().replace("_", "").replace(" ", "").replace("-", "")
        for fname in sample_files:
            fname_clean = os.path.splitext(fname)[0].lower().replace("_", "").replace(" ", "").replace("-", "")
            if search_term and (search_term in fname_clean or fname_clean in search_term):
                full_path = os.path.join(sample_dir, fname)
                print(f"[*] Fuzzy matched sample image '{fname}' for '{input_source}'")
                pil_img = Image.open(full_path).convert("RGB")
                base_name = os.path.splitext(fname)[0]
                return pil_img, base_name, full_path

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_manga_canvas() -> Tuple[Image.Image, str, str]:
    """Generates a synthetic manga dialogue canvas if no input is provided."""
    print("[*] Generating dynamic synthetic comic dialogue canvas for demonstration...")
    pil_img = Image.new("RGB", (650, 500), color=(245, 245, 245))
    draw = ImageDraw.Draw(pil_img)

    # Outer panel border
    draw.rectangle([25, 25, 625, 475], outline=(0, 0, 0), width=4)

    # 1. Main speech bubble with text
    bx1, by1, bx2, by2 = 60, 60, 380, 220
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    draw.polygon([(180, 210), (220, 210), (150, 280)], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.text((105, 120), "WAIT! DON'T TOUCH THAT!", fill=(0, 0, 0))

    # 2. Secondary thought cloud with text
    bx1, by1, bx2, by2 = 320, 260, 590, 410
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    draw.ellipse([300, 360, 325, 385], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.ellipse([280, 395, 295, 410], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.text((360, 320), "SOMETHING IS NOT RIGHT...", fill=(0, 0, 0))

    base_name = "demo_comic_ocr_panel"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def render_annotated_ocr_image(
    source_img: Image.Image,
    segments: list,
) -> Image.Image:
    """Renders high-visibility bounding boxes, quad polygons, and dialogue text badges."""
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    # Color palette
    box_color = (0, 180, 255)       # Cyan outline
    poly_color = (255, 40, 40)      # Red polygon outline
    badge_bg = (10, 40, 80)         # Dark navy background
    text_color = (255, 255, 255)    # White lettering

    for idx, seg in enumerate(segments, start=1):
        # Extract coordinates
        if hasattr(seg, "x"):
            x, y, w, h = seg.x, seg.y, seg.width, seg.height
            text_str = getattr(seg, "text", "")
            conf = getattr(seg, "confidence", 1.0)
            polygon = getattr(seg, "polygon", None)
            reading_order = getattr(seg, "reading_order", idx)
        elif isinstance(seg, dict):
            box = seg.get("box", [])
            xs = [p[0] for p in box] if box else [0]
            ys = [p[1] for p in box] if box else [0]
            x, y = min(xs), min(ys)
            w = max(1, max(xs) - min(xs))
            h = max(1, max(ys) - min(ys))
            text_str = seg.get("text", "")
            conf = seg.get("conf", 1.0)
            polygon = box
            reading_order = idx
        else:
            continue

        # 1. Draw quad polygon if available
        if polygon and len(polygon) >= 3:
            pts = [(int(p[0]), int(p[1])) for p in polygon]
            draw.polygon(pts, outline=poly_color, width=2)

        # 2. Draw outer axis-aligned bounding box
        draw.rectangle([x, y, x + w, y + h], outline=box_color, width=3)

        # 3. Draw dialogue label badge
        label = f"#{reading_order} \"{text_str}\" ({conf:.2f})"
        badge_h = 18
        badge_w = min(400, len(label) * 7 + 10)
        by1 = max(0, y - badge_h - 2)
        by2 = by1 + badge_h

        draw.rectangle([x, by1, x + badge_w, by2], fill=badge_bg)
        draw.text((x + 4, by1 + 2), label[:45], fill=text_color)

    return annotated


def generate_binary_text_mask(
    image_shape: Tuple[int, int],
    segments: list,
) -> np.ndarray:
    """
    Renders a single-channel uint8 binary alpha inpainting mask.
    Positive pixels (255) represent dialogue text regions for inpainting/cleaning.
    """
    h, w = image_shape
    mask = np.zeros((h, w), dtype=np.uint8)

    for seg in segments:
        if hasattr(seg, "polygon") and seg.polygon and len(seg.polygon) >= 3:
            pts = np.array(seg.polygon, dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(mask, [pts], 255)
        elif hasattr(seg, "x"):
            cv2.rectangle(mask, (seg.x, seg.y), (seg.x + seg.width, seg.y + seg.height), 255, -1)
        elif isinstance(seg, dict) and "box" in seg:
            box = seg["box"]
            if len(box) >= 3:
                pts = np.array(box, dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(mask, [pts], 255)

    # Apply slight 3px morphological dilation to fully cover font antialiasing edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)
    return dilated_mask


def to_file_uri(path_str: str) -> str:
    """Converts a local file path to a clickable file:// URI."""
    return Path(os.path.abspath(path_str)).as_uri()


def process_and_save_ocr_dialogue(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    languages: Optional[List[str]] = None,
    conf_threshold: float = 0.20,
    bubble_guided: bool = False,
) -> dict:
    """
    Main dialogue OCR runner pipeline:
    - Loads input image (file path, URL, or demo canvas)
    - Runs OCR text detection (direct or bubble-guided)
    - Saves 3 standardized output files: JSON metadata, Annotated image, Binary mask
    - Prints human-readable summary table and clickable URIs
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    if languages is None:
        languages = ["en"]

    # 1. Load image
    if input_source and input_source.strip():
        pil_img, base_name, file_path_for_ref = load_input_image(input_source)
    else:
        pil_img, base_name, file_path_for_ref = create_demo_manga_canvas()

    img_w, img_h = pil_img.size
    print("\n" + "=" * 78)
    print(f"▶ RUNNING DIALOGUE TEXT OCR DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print(f"  Mode: {'Bubble-Guided YOLO Isolation' if bubble_guided else 'Full-Frame Direct OCR'}")
    print(f"  Languages: {languages} | Confidence Floor: {conf_threshold}")
    print("=" * 78)

    # Encode image buffer
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    # 2. Call OCR service orchestrator
    print("\n[Step 1/3] Executing Dialogue OCR Vision Processing...")
    t0 = time.perf_counter()
    import base64
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")
    req = DetectTextRequest(
        image_base64=b64_str,
        languages=languages,
        bubble_guided=bubble_guided,
    )
    ocr_response: DetectTextResponse = asyncio.run(detect_text_service(req))
    detect_ms = int((time.perf_counter() - t0) * 1000)

    segments = ocr_response.segments
    full_transcript = ocr_response.full_transcript
    print(f"  [OK] Extracted {len(segments)} text segment(s) in {detect_ms}ms")
    print(f"  [OK] Joined Transcript: \"{full_transcript}\"")

    # 3. Generate Binary Inpainting Mask
    print("\n[Step 2/3] Generating Binary Text Inpainting Alpha Mask...")
    t0 = time.perf_counter()
    mask_np = generate_binary_text_mask((img_h, img_w), segments)
    mask_ms = int((time.perf_counter() - t0) * 1000)
    active_mask_pixels = int(np.count_nonzero(mask_np))
    coverage_pct = (active_mask_pixels / float(max(1, img_w * img_h))) * 100
    print(f"  [OK] Mask generated: {active_mask_pixels:,} positive text pixels ({coverage_pct:.2f}% coverage) in {mask_ms}ms")

    # 4. Generate Standardized Output Files
    print("\n[Step 3/3] Saving standardized output artifacts...")

    # Output File 1: JSON metadata
    json_filename = f"{base_name}_dialogue.json"
    json_path = os.path.join(output_dir, json_filename)
    json_payload = {
        "source_image": base_name,
        "image_width": img_w,
        "image_height": img_h,
        "mode": "bubble_guided" if bubble_guided else "direct_full_frame",
        "languages": languages,
        "confidence_threshold": conf_threshold,
        "total_segments": len(segments),
        "full_transcript": full_transcript,
        "execution_time_ms": int((time.perf_counter() - start_total_time) * 1000),
        "segments": [s.model_dump() if hasattr(s, "model_dump") else s for s in segments],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, indent=2, ensure_ascii=False)

    print(f"  [1] JSON Dialogue Data -> {json_path}")
    print(f"      URI: {to_file_uri(json_path)}")

    # Output File 2: Annotated Image
    annotated_filename = f"{base_name}_annotated.png"
    annotated_path = os.path.join(output_dir, annotated_filename)
    annotated_img = render_annotated_ocr_image(pil_img, segments)
    annotated_img.save(annotated_path)
    print(f"  [2] Annotated Visual   -> {annotated_path}")
    print(f"      URI: {to_file_uri(annotated_path)}")

    # Output File 3: Binary Inpainting Mask
    mask_filename = f"{base_name}_mask.png"
    mask_path = os.path.join(output_dir, mask_filename)
    cv2.imwrite(mask_path, mask_np)
    print(f"  [3] Binary Text Mask   -> {mask_path}")
    print(f"      URI: {to_file_uri(mask_path)}")

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # 5. Human-Readable Results Summary Table
    print("\n" + "─" * 78)
    print("  DIALOGUE OCR DETECTION SUMMARY")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Total Segments   : {len(segments)}")
    print(f"  Full Transcript  : \"{full_transcript}\"")
    print(f"  Processing Time  : {total_time_ms} ms")
    print("─" * 78)
    for s in segments:
        order = getattr(s, "reading_order", 0)
        s_id = getattr(s, "segment_id", "text")
        txt = getattr(s, "text", "")
        conf = getattr(s, "confidence", 1.0)
        x, y, w, h = getattr(s, "x", 0), getattr(s, "y", 0), getattr(s, "width", 0), getattr(s, "height", 0)
        print(f"  • #{order:<2} | {s_id:<8} | Conf: {conf:<4.2f} | Box: ({x}, {y}, {w}, {h}) | \"{txt}\"")
    print("─" * 78)

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Output Folder : {to_file_uri(output_dir)}")
    print(f"  • JSON Data     : {to_file_uri(json_path)}")
    print(f"  • Annotated PNG : {to_file_uri(annotated_path)}")
    print(f"  • Text Mask PNG : {to_file_uri(mask_path)}")
    print("─" * 78 + "\n")

    return {
        "success": True,
        "total_segments": len(segments),
        "transcript": full_transcript,
        "json_path": json_path,
        "annotated_path": annotated_path,
        "mask_path": mask_path,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Dialogue Text OCR Detector on an image and save structured output files."
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
        "-l", "--langs",
        type=str,
        default="en",
        help="Comma-separated language codes for EasyOCR (e.g. 'en', 'ja', 'ko'). Defaults to 'en'."
    )
    parser.add_argument(
        "-c", "--conf",
        type=float,
        default=0.20,
        help="Minimum OCR confidence threshold 0.0 - 1.0 (default: 0.20)"
    )
    parser.add_argument(
        "-b", "--bubble-guided",
        action="store_true",
        help="Engage YOLO speech-bubble-guided dialogue isolation (filters background artwork noise)."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic comic dialogue demo canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma Dialogue Text OCR Detector Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run demo canvas): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    parsed_langs = [l.strip() for l in args.langs.split(",") if l.strip()] or ["en"]

    process_and_save_ocr_dialogue(
        input_source=input_arg,
        output_dir=args.output_dir,
        languages=parsed_langs,
        conf_threshold=args.conf,
        bubble_guided=args.bubble_guided,
    )


if __name__ == "__main__":
    main()
