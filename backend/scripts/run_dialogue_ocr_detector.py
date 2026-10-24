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
import base64
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
    extract_direct_image_ocr,
    extract_bubble_guided_ocr,
    extract_script_from_panels,
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
    source_bgr: Optional[np.ndarray] = None,
) -> np.ndarray:
    """
    Renders a single-channel uint8 binary alpha inpainting mask.
    Positive pixels (255) represent dialogue text regions for inpainting/cleaning.
    When source_bgr is provided, isolates exact text strokes inside the speech bubble
    rather than covering the entire bubble with solid white.
    """
    h, w = image_shape
    mask = np.zeros((h, w), dtype=np.uint8)

    for seg in segments:
        bx = int(getattr(seg, "x", 0) if hasattr(seg, "x") else (seg.get("x", 0) if isinstance(seg, dict) else 0))
        by = int(getattr(seg, "y", 0) if hasattr(seg, "y") else (seg.get("y", 0) if isinstance(seg, dict) else 0))
        bw = int(getattr(seg, "width", 0) if hasattr(seg, "width") else (seg.get("width", 0) if isinstance(seg, dict) else 0))
        bh = int(getattr(seg, "height", 0) if hasattr(seg, "height") else (seg.get("height", 0) if isinstance(seg, dict) else 0))

        if source_bgr is not None and bw > 0 and bh > 0:
            crop = source_bgr[by:by + bh, bx:bx + bw]
            if crop.size > 0:
                gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                # Adaptive threshold to isolate dark text strokes on colored/tinted bubble backgrounds
                thresh = cv2.adaptiveThreshold(
                    gray_crop, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 8
                )
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                dilated = cv2.dilate(thresh, kernel, iterations=1)

                # Focus on inner dialogue text region (avoid outer bubble outline/glows)
                pad_y = int(bh * 0.12)
                pad_x = int(bw * 0.12)
                clean_crop = np.zeros_like(dilated)
                clean_crop[pad_y:bh - pad_y, pad_x:bw - pad_x] = dilated[pad_y:bh - pad_y, pad_x:bw - pad_x]

                if np.count_nonzero(clean_crop) > 5:
                    mask[by:by + bh, bx:bx + bw] = cv2.bitwise_or(mask[by:by + bh, bx:bx + bw], clean_crop)
                    continue

        # Fallback to polygon or bounding box if stroke detection didn't apply
        if isinstance(seg, dict) and "box" in seg:
            box = seg["box"]
            if len(box) >= 3:
                pts = np.array(box, dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(mask, [pts], 255)
        elif hasattr(seg, "polygon") and seg.polygon and len(seg.polygon) == 4:
            pts = np.array(seg.polygon, dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(mask, [pts], 255)
        elif bw > 0 and bh > 0:
            cv2.rectangle(mask, (bx, by), (bx + bw, by + bh), 255, -1)

    # Slight dilation for antialiasing coverage
    dilated_mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)), iterations=1)
    return dilated_mask


def generate_cleaned_dialogue_image(
    source_img_rgb: Image.Image,
    text_mask: np.ndarray,
) -> Image.Image:
    """
    Erases dialogue text seamlessly without applying harsh white color:
    Inpaints using surrounding bubble colors, gradients, and natural shading.
    """
    src_bgr = cv2.cvtColor(np.array(source_img_rgb), cv2.COLOR_RGB2BGR)
    if np.any(text_mask > 0):
        try:
            cleaned_bgr = cv2.inpaint(src_bgr, text_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
            return Image.fromarray(cv2.cvtColor(cleaned_bgr, cv2.COLOR_BGR2RGB))
        except Exception:
            pass
    return source_img_rgb.copy()


def to_file_uri(path_str: str) -> str:
    """Converts a local file path to a clickable file:// URI."""
    return Path(os.path.abspath(path_str)).as_uri()


def process_and_save_ocr_dialogue(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    languages: Optional[List[str]] = None,
    conf_threshold: float = 0.20,
    api_mode: str = "direct",
) -> dict:
    """
    Main dialogue OCR runner pipeline executing any of the 3 backend OCR APIs:
    - API 1 ('direct' / '/detect-text'): Synchronous full-frame direct OCR
    - API 2 ('bubble' / '/bubble-dialogue'): YOLO speech-bubble-guided isolated dialogue OCR
    - API 3 ('script' / '/extract'): Multi-panel chapter script extraction
    - 'all': Executes all 3 APIs side-by-side and prints comparative summary
    """
    os.makedirs(output_dir, exist_ok=True)
    start_total_time = time.perf_counter()

    if languages is None:
        languages = ["en"]

    # 1. Load input image
    if input_source and input_source.strip():
        pil_img, base_name, file_path_for_ref = load_input_image(input_source)
    else:
        pil_img, base_name, file_path_for_ref = create_demo_manga_canvas()

    img_w, img_h = pil_img.size
    src_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    api_mode_normalized = api_mode.lower().strip()
    run_all = api_mode_normalized in ("all", "both", "all-apis")

    apis_to_run = ["direct", "bubble", "script"] if run_all else [api_mode_normalized]

    print("\n" + "=" * 78)
    print(f"▶ RUNNING DIALOGUE TEXT OCR DETECTOR ON: {base_name} ({img_w}x{img_h}px)")
    print(f"  Target API(s): {', '.join(apis_to_run).upper()}")
    print(f"  Languages: {languages} | Confidence Floor: {conf_threshold}")
    print("=" * 78)

    results_bundle = {}

    # ─────────────────────────────────────────────────────────────────────────
    # API 1: Direct Synchronous Image OCR (/api/ocr/detect-text)
    # ─────────────────────────────────────────────────────────────────────────
    if "direct" in apis_to_run or "1" in apis_to_run:
        print("\n[API 1/3] POST /api/ocr/detect-text (extract_direct_image_ocr)...")
        t0 = time.perf_counter()
        req_direct = DetectTextRequest(
            image_base64=b64_str,
            languages=languages,
            bubble_guided=False,
        )
        res_direct: DetectTextResponse = asyncio.run(extract_direct_image_ocr(req_direct))
        dur_direct = int((time.perf_counter() - t0) * 1000)

        # Generate Text Stroke Mask, Annotations & Cleaned Inpainted Image
        mask_np_direct = generate_binary_text_mask((img_h, img_w), res_direct.segments, source_bgr=src_bgr)
        annotated_img_direct = render_annotated_ocr_image(pil_img, res_direct.segments)
        cleaned_img_direct = generate_cleaned_dialogue_image(pil_img, mask_np_direct)

        # Save artifacts
        p_json = os.path.join(output_dir, f"{base_name}_direct_dialogue.json")
        p_img = os.path.join(output_dir, f"{base_name}_direct_annotated.png")
        p_mask = os.path.join(output_dir, f"{base_name}_direct_mask.png")
        p_clean = os.path.join(output_dir, f"{base_name}_direct_cleaned.png")

        with open(p_json, "w", encoding="utf-8") as f:
            json.dump({
                "api": "POST /api/ocr/detect-text",
                "function": "extract_direct_image_ocr",
                "source_image": base_name,
                "image_width": img_w,
                "image_height": img_h,
                "languages": languages,
                "execution_time_ms": dur_direct,
                "total_segments": len(res_direct.segments),
                "full_transcript": res_direct.full_transcript,
                "segments": [s.model_dump() if hasattr(s, "model_dump") else s for s in res_direct.segments],
            }, f, indent=2, ensure_ascii=False)
        annotated_img_direct.save(p_img)
        cleaned_img_direct.save(p_clean)
        cv2.imwrite(p_mask, mask_np_direct)

        print(f"  [OK] Segments: {len(res_direct.segments)} | Time: {dur_direct}ms | Transcript: \"{res_direct.full_transcript}\"")
        results_bundle["direct"] = {
            "api": "POST /api/ocr/detect-text",
            "segments": len(res_direct.segments),
            "time_ms": dur_direct,
            "transcript": res_direct.full_transcript,
            "json_path": p_json,
            "annotated_path": p_img,
            "mask_path": p_mask,
            "cleaned_path": p_clean,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # API 2: Bubble-Guided Isolated OCR (/api/ocr/bubble-dialogue)
    # ─────────────────────────────────────────────────────────────────────────
    if "bubble" in apis_to_run or "2" in apis_to_run:
        print("\n[API 2/3] POST /api/ocr/bubble-dialogue (extract_bubble_guided_ocr)...")
        t0 = time.perf_counter()
        req_bubble = DetectTextRequest(
            image_base64=b64_str,
            languages=languages,
            bubble_guided=True,
        )
        res_bubble: DetectTextResponse = asyncio.run(extract_bubble_guided_ocr(req_bubble))
        dur_bubble = int((time.perf_counter() - t0) * 1000)

        # Generate Text Stroke Mask, Annotations & Cleaned Inpainted Image
        mask_np_bubble = generate_binary_text_mask((img_h, img_w), res_bubble.segments, source_bgr=src_bgr)
        annotated_img_bubble = render_annotated_ocr_image(pil_img, res_bubble.segments)
        cleaned_img_bubble = generate_cleaned_dialogue_image(pil_img, mask_np_bubble)

        # Save artifacts
        p_json = os.path.join(output_dir, f"{base_name}_bubble_dialogue.json")
        p_img = os.path.join(output_dir, f"{base_name}_bubble_annotated.png")
        p_mask = os.path.join(output_dir, f"{base_name}_bubble_mask.png")
        p_clean = os.path.join(output_dir, f"{base_name}_bubble_cleaned.png")

        with open(p_json, "w", encoding="utf-8") as f:
            json.dump({
                "api": "POST /api/ocr/bubble-dialogue",
                "function": "extract_bubble_guided_ocr",
                "source_image": base_name,
                "image_width": img_w,
                "image_height": img_h,
                "languages": languages,
                "execution_time_ms": dur_bubble,
                "total_segments": len(res_bubble.segments),
                "full_transcript": res_bubble.full_transcript,
                "segments": [s.model_dump() if hasattr(s, "model_dump") else s for s in res_bubble.segments],
            }, f, indent=2, ensure_ascii=False)
        annotated_img_bubble.save(p_img)
        cleaned_img_bubble.save(p_clean)
        cv2.imwrite(p_mask, mask_np_bubble)

        print(f"  [OK] Segments: {len(res_bubble.segments)} | Time: {dur_bubble}ms | Transcript: \"{res_bubble.full_transcript}\"")
        results_bundle["bubble"] = {
            "api": "POST /api/ocr/bubble-dialogue",
            "segments": len(res_bubble.segments),
            "time_ms": dur_bubble,
            "transcript": res_bubble.full_transcript,
            "json_path": p_json,
            "annotated_path": p_img,
            "mask_path": p_mask,
            "cleaned_path": p_clean,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # API 3: Chapter / Multi-Panel Script Extraction (/api/ocr/extract)
    # ─────────────────────────────────────────────────────────────────────────
    if "script" in apis_to_run or "3" in apis_to_run:
        print("\n[API 3/3] POST /api/ocr/extract (extract_script_from_panels)...")
        t0 = time.perf_counter()
        script_res = asyncio.run(extract_script_from_panels([raw_bytes], languages=languages))
        dur_script = int((time.perf_counter() - t0) * 1000)

        p_json = os.path.join(output_dir, f"{base_name}_script_panels.json")
        with open(p_json, "w", encoding="utf-8") as f:
            json.dump({
                "api": "POST /api/ocr/extract",
                "function": "extract_script_from_panels",
                "source_image": base_name,
                "total_panels": len(script_res),
                "execution_time_ms": dur_script,
                "panels": script_res,
            }, f, indent=2, ensure_ascii=False)

        first_panel_txt = script_res[0].get("text", "") if script_res else ""
        print(f"  [OK] Panels: {len(script_res)} | Time: {dur_script}ms | Panel 1 Text: \"{first_panel_txt}\"")
        results_bundle["script"] = {
            "api": "POST /api/ocr/extract",
            "panels": len(script_res),
            "time_ms": dur_script,
            "transcript": first_panel_txt,
            "json_path": p_json,
        }

    total_time_ms = int((time.perf_counter() - start_total_time) * 1000)

    # ─────────────────────────────────────────────────────────────────────────
    # Summary Table & Clickable Output File Links
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "─" * 78)
    print("  SONIKOMA OCR APIS EXECUTION SUMMARY")
    print("─" * 78)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Total Duration   : {total_time_ms} ms")
    print("─" * 78)

    for key, data in results_bundle.items():
        api_name = data.get("api", key)
        count = data.get("segments") if "segments" in data else data.get("panels", 0)
        unit = "seg(s)" if "segments" in data else "panel(s)"
        t_ms = data.get("time_ms", 0)
        t_snippet = data.get("transcript", "")
        if len(t_snippet) > 40:
            t_snippet = t_snippet[:37] + "..."
        print(f"  • {api_name:<30} | {count} {unit} in {t_ms:>5}ms | \"{t_snippet}\"")

    print("─" * 78)
    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Output Folder : {to_file_uri(output_dir)}")
    for key, data in results_bundle.items():
        if "json_path" in data:
            print(f"  • [{key.upper()}] JSON     : {to_file_uri(data['json_path'])}")
        if "annotated_path" in data:
            print(f"  • [{key.upper()}] Visual   : {to_file_uri(data['annotated_path'])}")
        if "mask_path" in data:
            print(f"  • [{key.upper()}] Mask     : {to_file_uri(data['mask_path'])}")
        if "cleaned_path" in data:
            print(f"  • [{key.upper()}] Cleaned  : {to_file_uri(data['cleaned_path'])}")
    print("─" * 78 + "\n")

    return {
        "success": True,
        "results": results_bundle,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma Comic Dialogue OCR APIs on an image and save structured output files."
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
        "--api",
        choices=["1", "2", "3", "direct", "bubble", "script", "all"],
        default=None,
        help=(
            "Select which OCR API to execute: "
            "'direct' (API 1: /detect-text), "
            "'bubble' (API 2: /bubble-dialogue), "
            "'script' (API 3: /extract), "
            "or 'all' to run all 3 APIs."
        )
    )
    parser.add_argument(
        "-b", "--bubble-guided",
        action="store_true",
        help="Shortcut to run API 2 (Bubble-Guided Dialogue OCR)."
    )
    parser.add_argument(
        "-d", "--direct",
        action="store_true",
        help="Shortcut to run API 1 (Direct Synchronous Full-Frame OCR)."
    )
    parser.add_argument(
        "-s", "--script",
        action="store_true",
        help="Shortcut to run API 3 (Multi-Panel Script Extraction OCR)."
    )
    parser.add_argument(
        "-a", "--all-apis",
        action="store_true",
        help="Run and compare all 3 OCR APIs side-by-side."
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

    # Determine API mode
    if args.all_apis or args.api == "all":
        selected_mode = "all"
    elif args.api in ("1", "direct") or args.direct:
        selected_mode = "direct"
    elif args.api in ("2", "bubble") or args.bubble_guided:
        selected_mode = "bubble"
    elif args.api in ("3", "script") or args.script:
        selected_mode = "script"
    else:
        selected_mode = "direct"

    process_and_save_ocr_dialogue(
        input_source=input_arg,
        output_dir=args.output_dir,
        languages=parsed_langs,
        conf_threshold=args.conf,
        api_mode=selected_mode,
    )


if __name__ == "__main__":
    main()
