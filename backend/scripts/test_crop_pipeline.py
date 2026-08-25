"""
backend/scripts/test_crop_pipeline.py
─────────────────────────────────────────────────────────────────────────────
Interactive Developer Tool for Testing Comic Panel Detection & Cropping:
- Enter any image URL or local file path
- Analyzes layout type (small_panels vs long_panels vs ultra_long_panels)
- Runs OpenCV + YOLO + AI detection pipeline
- Slices and crops panels into an output folder
- Generates a visual debug overlay image with drawn cut seams & bubble boxes
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
from schemas.project import DetectSmallPanelsRequest, DetectLongPanelsRequest


async def run_pipeline(source: str, out_dir: str, bleed_padding: int = 5):
    print("\n" + "═" * 80)
    print("  🎨 SONIKOMA COMIC PANEL DETECTION & CROP DEVELOPER TESTBENCH")
    print("═" * 80)

    # 1. Load Image
    print(f"\n[1/4] Loading input image: {source} ...")
    raw_bytes = None
    if source.startswith("http://") or source.startswith("https://") or source.startswith("data:"):
        res = await resolve_image_to_buffer(source)
        raw_bytes = res.get("data")
    else:
        file_path = Path(source)
        if not file_path.exists():
            print(f"❌ Error: Local file not found: {source}")
            return
        raw_bytes = file_path.read_bytes()

    if not raw_bytes:
        print("❌ Error: Could not load image data.")
        return

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    aspect_ratio = img_h / float(max(1, img_w))
    print(f"  ✓ Image loaded: {img_w} x {img_h} px (Aspect Ratio: {aspect_ratio:.2f})")

    # 2. Classify Layout Type
    print("\n[2/4] Classifying layout type (detect_image_layout_type) ...")
    t0 = time.perf_counter()
    import base64
    b64 = base64.b64encode(raw_bytes).decode("utf-8")
    layout_info = await detect_image_layout_type(image_base64=b64)
    t_classify = (time.perf_counter() - t0) * 1000

    print(f"  • Detected Layout:  {layout_info.crop_type.value} ({layout_info.type_label})")
    print(f"  • Background Color: {layout_info.detected_bg_color}")
    print(f"  • Edge Complexity:  {layout_info.edge_complexity}")
    print(f"  • Estimated Panels: {layout_info.estimated_panel_count}")
    print(f"  • Classification Time: {t_classify:.1f}ms")

    is_small = layout_info.crop_type.value == "small_panels" or aspect_ratio < 2.2

    # Prepare output directory
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 3. Execute Detection
    print(f"\n[3/4] Running detection pipeline ({'small-panels' if is_small else 'long-panels'}) ...")
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
        panels = [res.panel] if res.panel else res.panels
        bubbles = res.speech_bubbles
        margins = res.margins
        t_detect = (time.perf_counter() - t1) * 1000
        print(f"  ✓ Tight frame snapped in {t_detect:.1f}ms")
        print(f"  • Frame Box: x={res.panel.x}, y={res.panel.y}, w={res.panel.w}, h={res.panel.h}")
        print(f"  • Calculated Margins: {margins}")
        print(f"  • Bound Speech Bubbles: {res.bound_speech_bubbles_count}")
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
        print(f"  ✓ Sliced into {len(panels)} panels in {t_detect:.1f}ms")
        print(f"  • Total Speech Bubbles Found: {res.total_speech_bubbles_count}")

    # 4. Crop and Save Panel Slices & Debug Overlay
    print(f"\n[4/4] Slicing image and saving results to '{out_path.resolve()}' ...")
    
    # Save cropped individual panels
    if is_small:
        p = panels[0] if panels else None
        if p:
            crop_box = (p.x, p.y, min(img_w, p.x + p.w), min(img_h, p.y + p.h))
            cropped = pil_img.crop(crop_box)
            crop_file = out_path / "panel_snapped.webp"
            cropped.save(crop_file, format="WEBP", quality=95)
            print(f"  ✓ Saved cropped panel: {crop_file.name} ({cropped.width}x{cropped.height}px)")
    else:
        for idx, p in enumerate(panels):
            px1 = max(0, p.x)
            py1 = max(0, p.y)
            px2 = min(img_w, p.x + p.w)
            py2 = min(img_h, p.y + p.h)
            
            if px2 > px1 and py2 > py1:
                slice_img = pil_img.crop((px1, py1, px2, py2))
                slice_file = out_path / f"panel_{idx + 1:03d}.webp"
                slice_img.save(slice_file, format="WEBP", quality=92)
                b_count = len(p.speech_bubbles or [])
                print(f"  ✓ Saved panel {idx + 1:02d}: {slice_file.name} | {slice_img.width}x{slice_img.height}px | y: {py1}→{py2} | {b_count} bubble(s)")

    # 5. Create Annotated Visual Debug Overlay
    debug_img = pil_img.copy()
    draw = ImageDraw.Draw(debug_img)

    # Draw panel bounding boxes in GREEN
    for idx, p in enumerate(panels):
        x1, y1, x2, y2 = p.x, p.y, p.x + p.w, p.y + p.h
        draw.rectangle([x1, y1, x2, y2], outline=(0, 230, 80), width=4)
        draw.text((x1 + 10, y1 + 10), f"PANEL #{idx + 1} ({p.label})", fill=(0, 230, 80))
        # Draw horizontal seam line across image width
        draw.line([(0, y1), (img_w, y1)], fill=(255, 140, 0), width=2)
        draw.line([(0, y2), (img_w, y2)], fill=(255, 140, 0), width=2)

    # Draw speech bubble boxes in CYAN
    for b in bubbles:
        bx1, by1, bx2, by2 = b.x, b.y, b.x + b.width, b.y + b.height
        draw.rectangle([bx1, by1, bx2, by2], outline=(0, 200, 255), width=3)
        draw.text((bx1 + 5, max(0, by1 - 15)), f"[{b.sub_type or b.label}]", fill=(0, 200, 255))

    overlay_file = out_path / "debug_annotated_strip.png"
    # Resize down if monstrous for preview
    if debug_img.height > 15000:
        preview_scale = 15000.0 / debug_img.height
        preview_w = int(debug_img.width * preview_scale)
        debug_img = debug_img.resize((preview_w, 15000), Image.Resampling.BILINEAR)

    debug_img.save(overlay_file, format="PNG")
    print(f"\n  🔍 Visual Debug Overlay saved: {overlay_file.resolve()}")
    print("\n" + "═" * 80)
    print(f"  🎉 DONE! All panels and debug overlay generated in '{out_path.resolve()}'")
    print("═" * 80 + "\n")


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
        source = input("\n👉 Enter image URL or local file path: ").strip().strip('"').strip("'")

    if not source:
        print("No image provided. Exiting.")
        return

    asyncio.run(run_pipeline(source=source, out_dir=args.out_dir, bleed_padding=args.bleed))


if __name__ == "__main__":
    main()
