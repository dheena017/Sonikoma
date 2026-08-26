"""
backend/scripts/test_crop_pipeline.py
─────────────────────────────────────────────────────────────────────────────
Interactive Developer Tool for Testing Comic Panel Detection, Characters & Cropping:
- Enter any image URL or local file path
- Analyzes layout type (small_panels vs long_panels vs ultra_long_panels)
- Runs OpenCV + YOLO + Character + Bubble OCR pipeline
- Slices and crops all panels & character figures into an output folder
- Generates a visual debug overlay with panel frames, speech bubbles, and character silhouettes
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/test_crop_pipeline.py
  python backend/scripts/test_crop_pipeline.py --url "https://example.com/webtoon.webp"
  python backend/scripts/test_crop_pipeline.py --file "C:/path/to/chapter.png" --out-dir "test_output"
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import io
import time
import json
import base64
import argparse
import asyncio
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configure UTF-8 stdout/stderr for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend and backend/app to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
APP_DIR = ROOT_DIR / "app"

for p in (str(ROOT_DIR), str(APP_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.crop.detect_type_service import detect_image_layout_type
from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes
from services.image.panel_detection.detect_characters_service import detect_characters_boxes
from services.image.ocr.ocr_service import extract_bubble_guided_ocr
from schemas.project import DetectSmallPanelsRequest, DetectLongPanelsRequest, DetectCharactersRequest
from schemas.ocr import DetectTextRequest


async def run_pipeline(source: str, out_dir: str, bleed_padding: int = 5):
    print("\n" + "=" * 80)
    print("  SONIKOMA COMIC VISION & CROP PIPELINE DEVELOPER TESTBENCH")
    print("=" * 80)

    # 1. Load Image
    print(f"\n[1/5] Loading input image: {source} ...")
    raw_bytes = None
    if source.startswith("http://") or source.startswith("https://") or source.startswith("data:"):
        res = await resolve_image_to_buffer(source)
        raw_bytes = res.get("data")
    else:
        file_path = Path(source)
        if not file_path.exists():
            print(f"Error: Local file not found: {source}")
            return
        raw_bytes = file_path.read_bytes()

    if not raw_bytes:
        print("Error: Could not load image data.")
        return

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    aspect_ratio = img_h / float(max(1, img_w))
    print(f"  * Image loaded: {img_w} x {img_h} px (Aspect Ratio: {aspect_ratio:.2f})")

    # 2. Classify Layout Type
    print("\n[2/5] Classifying layout type (detect_image_layout_type) ...")
    t0 = time.perf_counter()
    b64 = base64.b64encode(raw_bytes).decode("utf-8")
    layout_info = await detect_image_layout_type(image_base64=b64)
    t_classify = (time.perf_counter() - t0) * 1000

    print(f"  * Detected Layout:  {layout_info.crop_type.value} ({layout_info.type_label})")
    print(f"  * Background Color: {layout_info.detected_bg_color}")
    print(f"  * Edge Complexity:  {layout_info.edge_complexity}")
    print(f"  * Estimated Panels: {layout_info.estimated_panel_count}")
    print(f"  * Classification Time: {t_classify:.1f}ms")

    is_small = layout_info.crop_type.value == "small_panels" or aspect_ratio < 2.2

    # Prepare output directory
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 3. Execute Character Detection
    print("\n[3/5] Running Character & Face Detection (detect_characters_boxes) ...")
    t_char_start = time.perf_counter()
    char_req = DetectCharactersRequest(image_base64=b64, detect_faces=True, extract_thumbnails=True)
    char_res = await detect_characters_boxes(char_req)
    t_char = (time.perf_counter() - t_char_start) * 1000
    print(f"  * Detected {char_res.total_characters} character(s) in {t_char:.1f}ms")
    for c in char_res.characters:
        print(f"    - {c.character_id}: ({c.x}, {c.y}, {c.width}x{c.height}) | Pose: {c.pose_type.value} | Conf: {c.confidence}")
        if c.face:
            print(f"      Face: ({c.face.x}, {c.face.y}, {c.face.width}x{c.face.height}) | Emotion: {c.face.emotion}")

    # 4. Execute Panel Detection
    print(f"\n[4/5] Running panel detection ({'small-panels' if is_small else 'long-panels'}) ...")
    t1 = time.perf_counter()

    panels = []
    bubbles = []
    margins = {}

    if is_small:
        req = DetectSmallPanelsRequest(
            image_base64=b64,
            auto_trim=True,
            snap_to_frame=True,
            merge_speech_bubbles=True,
            bleed_padding_px=bleed_padding
        )
        res = await detect_small_panels_boxes(req)
        panels = res.panels if (res.panels and len(res.panels) > 0) else ([res.panel] if res.panel else [])
        bubbles = res.speech_bubbles
        margins = res.margins
        t_detect = (time.perf_counter() - t1) * 1000
        print(f"  * Detected {len(panels)} panel(s) in {t_detect:.1f}ms")
        for idx, p in enumerate(panels):
            print(f"    - Panel #{idx+1} ({p.id}): x={p.x}, y={p.y}, w={p.w}, h={p.h} | Bubbles: {p.speech_bubbles_count} | Chars: {p.characters_count}")
        print(f"  * Calculated Margins: {margins}")
    else:
        req = DetectLongPanelsRequest(
            image_base64=b64,
            sensitivity=30.0,
            background_mode="auto",
            min_panel_height=120,
            auto_split=True,
            bleed_padding_px=bleed_padding
        )
        res = await detect_long_panels_boxes(req)
        panels = res.panels
        bubbles = [b for p in res.panels for b in (p.speech_bubbles or [])]
        t_detect = (time.perf_counter() - t1) * 1000
        print(f"  * Sliced into {len(panels)} panels in {t_detect:.1f}ms")
        print(f"  * Total Speech Bubbles Found: {res.total_speech_bubbles_count}")

    # 5. Execute Bubble-Guided OCR
    print("\n[5/5] Extracting dialogue transcript via bubble-guided OCR ...")
    ocr_req = DetectTextRequest(image_base64=b64, bubble_guided=True)
    ocr_res = await extract_bubble_guided_ocr(ocr_req)
    print(f"  * OCR Transcript ({ocr_res.total_segments} segments, {ocr_res.execution_time_ms}ms):")
    for s in ocr_res.segments:
        print(f"    - [{s.text_type.value}] \"{s.text}\" (Conf: {s.confidence:.2f})")

    # 6. Crop and Save Panel Slices, Characters & Debug Overlay
    print(f"\n[Artifacts] Slicing image and saving results to '{out_path.resolve()}' ...")
    
    # Save cropped individual panels
    for idx, p in enumerate(panels):
        px1 = max(0, p.x)
        py1 = max(0, p.y)
        px2 = min(img_w, p.x + p.w)
        py2 = min(img_h, p.y + p.h)
        
        if px2 > px1 and py2 > py1:
            slice_img = pil_img.crop((px1, py1, px2, py2))
            slice_file = out_path / f"panel_{idx + 1:03d}.webp"
            slice_img.save(slice_file, format="WEBP", quality=95)
            b_count = len(p.speech_bubbles or [])
            c_count = len(p.characters or [])
            shot = p.cinematography.shot_type if p.cinematography else "standard"
            print(f"  * Saved panel {idx + 1:02d}: {slice_file.name} | {slice_img.width}x{slice_img.height}px | Shot: {shot} | {b_count} bubble(s) | {c_count} char(s)")

    # Save character avatar thumbnails
    for idx, c in enumerate(char_res.characters):
        cx1 = max(0, c.x)
        cy1 = max(0, c.y)
        cx2 = min(img_w, c.x + c.width)
        cy2 = min(img_h, c.y + c.height)
        if cx2 > cx1 and cy2 > cy1:
            char_crop = pil_img.crop((cx1, cy1, cx2, cy2))
            char_file = out_path / f"character_{idx + 1:02d}_{c.pose_type.value}.webp"
            char_crop.save(char_file, format="WEBP", quality=90)
            print(f"  * Saved character: {char_file.name} ({char_crop.width}x{char_crop.height}px)")

    # Save transcript JSON
    transcript_file = out_path / "transcript.json"
    with open(transcript_file, "w", encoding="utf-8") as f:
        json.dump({
            "full_transcript": ocr_res.full_transcript,
            "total_segments": ocr_res.total_segments,
            "segments": [s.model_dump() for s in ocr_res.segments],
            "total_characters": len(char_res.characters),
            "characters": [c.model_dump() for c in char_res.characters],
            "total_panels": len(panels),
            "panels": [p.model_dump() for p in panels]
        }, f, indent=2)
    print(f"  * Saved transcript & scene graph JSON: {transcript_file.name}")

    # 7. Create Annotated Visual Debug Overlay
    debug_img = pil_img.copy()
    draw = ImageDraw.Draw(debug_img)

    # Draw panel bounding boxes in GREEN / Polygons
    for idx, p in enumerate(panels):
        color = (255, 0, 200) if p.depth == 1 else (0, 230, 80)
        
        # If polygonal contour is available (slanted/diagonal frames), draw polygon
        if p.polygon and len(p.polygon) >= 3:
            pts = [(pt[0], pt[1]) for pt in p.polygon]
            draw.polygon(pts, outline=color, width=4)
        else:
            x1, y1, x2, y2 = p.x, p.y, p.x + p.w, p.y + p.h
            draw.rectangle([x1, y1, x2, y2], outline=color, width=4)
            
        draw.text((p.x + 10, p.y + 10), f"PANEL #{idx + 1} ({p.label})", fill=color)

    # Draw characters in MAGENTA / VIOLET
    for c in char_res.characters:
        cx1, cy1, cx2, cy2 = c.x, c.y, c.x + c.width, c.y + c.height
        draw.rectangle([cx1, cy1, cx2, cy2], outline=(200, 50, 255), width=3)
        draw.text((cx1 + 5, cy1 + 5), f"[{c.character_id}: {c.pose_type.value}]", fill=(200, 50, 255))
        if c.face:
            fx1, fy1, fx2, fy2 = c.face.x, c.face.y, c.face.x + c.face.width, c.face.y + c.face.height
            draw.rectangle([fx1, fy1, fx2, fy2], outline=(255, 200, 0), width=2)

    # Draw true speech bubble boxes in CYAN
    for b in bubbles:
        bx1, by1, bx2, by2 = b.x, b.y, b.x + b.width, b.y + b.height
        draw.rectangle([bx1, by1, bx2, by2], outline=(0, 200, 255), width=3)
        draw.text((bx1 + 5, max(0, by1 - 15)), f"[{b.sub_type or b.label}]", fill=(0, 200, 255))

    overlay_file = out_path / "debug_annotated_strip.png"
    if debug_img.height > 15000:
        preview_scale = 15000.0 / debug_img.height
        preview_w = int(debug_img.width * preview_scale)
        debug_img = debug_img.resize((preview_w, 15000), Image.Resampling.BILINEAR)

    debug_img.save(overlay_file, format="PNG")
    print(f"\n  * Visual Debug Overlay saved: {overlay_file.resolve()}")
    print("\n" + "=" * 80)
    print(f"  DONE! All panels, characters, OCR, and debug overlay generated in '{out_path.resolve()}'")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Developer Comic Panel & Crop Test Tool")
    parser.add_argument("--url", type=str, help="Image URL to test")
    parser.add_argument("--file", type=str, help="Local image file path to test")
    parser.add_argument("--out-dir", type=str, default="output_test_crops", help="Output directory for cropped slices")
    parser.add_argument("--bleed", type=int, default=5, help="Bleed padding in pixels")
    args = parser.parse_args()

    source = args.url or args.file
    if not source:
        print("\n" + "=" * 60)
        print("  SONIKOMA PANEL DETECTION DEVELOPER TEST TOOL")
        print("=" * 60)
        source = input("\nEnter image URL or local file path: ").strip().strip('"').strip("'")

    if not source:
        print("No image provided. Exiting.")
        return

    asyncio.run(run_pipeline(source=source, out_dir=args.out_dir, bleed_padding=args.bleed))


if __name__ == "__main__":
    main()
