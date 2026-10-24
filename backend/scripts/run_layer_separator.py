"""
backend/scripts/run_layer_separator.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Comic & Manga AI Layer Separation:
Separates comic panels and pages into distinct compositional layers:
1. <image_name>_layers.json     -> Structured layer metadata, OCR text nodes & 3D parallax presets
2. 00_layers_montage.png        -> Multi-layer exploded visualization / contact sheet
3. 01_background.png            -> Clean inpainted background environment layer
4. 02_character_1.png (etc.)    -> Isolated transparent character/subject cutout(s)
5. 03_effects.png               -> Visual effects, aura & energy glow layer
6. 04_sfx.png                   -> Sound effects (SFX) & action lettering layer
7. 05_text.png                  -> Dialogue bubbles & speech text layer
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_layer_separator.py
  python backend/scripts/run_layer_separator.py --input path/to/manga_panel.png
  python backend/scripts/run_layer_separator.py -i https://example.com/panel.jpg -o my_output/
  python backend/scripts/run_layer_separator.py --split-panels -i path/to/comic_page.png
"""

import os
import sys
import io
import time
import json
import shutil
import asyncio
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.image.layer_separation import (
    process_layers,
    extract_panel_layers_service,
    extract_character_layer,
)
from features.image.layer_separation.sam import has_sam, has_rembg
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "layer_separation")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, str]:
    """
    Loads an image from a local path, URL, or generates a sample image.
    Returns (pil_image, base_name, temp_file_path_if_any).
    """
    # Clean PowerShell syntax, quotes, and whitespace
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
        base_name = os.path.splitext(os.path.basename(input_source.split("?")[0]))[0] or "web_panel"
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


def create_demo_manga_canvas() -> Tuple[Image.Image, str, str]:
    """Generates a synthetic comic panel canvas featuring character, scenery, bubble, and SFX."""
    print("[*] Generating dynamic synthetic comic canvas for demonstration...")
    canvas_w, canvas_h = 700, 700
    pil_img = Image.new("RGB", (canvas_w, canvas_h), color=(240, 242, 245))
    draw = ImageDraw.Draw(pil_img)

    # 1. Outer Panel Border
    draw.rectangle([30, 30, 670, 670], fill=(225, 230, 240), outline=(20, 20, 20), width=4)

    # 2. Background Scenery (horizon, sun & mountains)
    draw.ellipse([450, 100, 580, 230], fill=(255, 235, 150), outline=(230, 180, 50), width=2)
    draw.polygon([(40, 666), (220, 380), (390, 666)], fill=(150, 175, 195), outline=(90, 110, 130), width=2)
    draw.polygon([(260, 666), (460, 420), (660, 666)], fill=(170, 190, 210), outline=(100, 120, 140), width=2)

    # 3. Ground / Floor
    draw.rectangle([32, 540, 668, 668], fill=(130, 150, 165), outline=(60, 70, 80), width=2)

    # 4. Central Hero / Character Silhouette
    # Head & Hair
    draw.ellipse([270, 220, 390, 340], fill=(50, 55, 65), outline=(20, 20, 25), width=3)
    # Torso & Shoulders
    draw.polygon([(240, 340), (420, 340), (450, 560), (210, 560)], fill=(70, 85, 110), outline=(30, 40, 55), width=3)
    # Eyes & Visor
    draw.ellipse([295, 260, 365, 285], fill=(240, 245, 255), outline=(30, 30, 35), width=2)
    draw.ellipse([305, 265, 325, 280], fill=(40, 120, 220))
    draw.ellipse([335, 265, 355, 280], fill=(40, 120, 220))

    # 5. Speech Bubble & Dialogue Text
    bx1, by1, bx2, by2 = 60, 70, 340, 210
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(15, 15, 15), width=3)
    draw.polygon([(240, 190), (280, 240), (210, 195)], fill=(255, 255, 255), outline=(15, 15, 15), width=2)
    draw.text((bx1 + 45, by1 + 45), "WE MUST PROTECT\nTHE TIMELINE!", fill=(10, 10, 10), spacing=6)

    # 6. Action Sound Effect (SFX) Lettering
    draw.text((450, 320), "B A M !", fill=(220, 40, 40))

    base_name = "demo_comic_panel"
    temp_dir = os.path.join(DEFAULT_OUTPUT_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{base_name}.png")
    pil_img.save(temp_path)
    return pil_img, base_name, temp_path


def create_checkerboard(width: int, height: int, cell_size: int = 16) -> Image.Image:
    """Creates a transparent checkerboard pattern to visualize alpha transparency."""
    bg = Image.new("RGBA", (width, height), (220, 220, 220, 255))
    draw = ImageDraw.Draw(bg)
    color2 = (245, 245, 245, 255)
    for y in range(0, height, cell_size):
        for x in range(0, width, cell_size):
            if ((x // cell_size) + (y // cell_size)) % 2 == 1:
                draw.rectangle([x, y, x + cell_size, y + cell_size], fill=color2)
    return bg


def composite_on_checkerboard(layer_img: Image.Image) -> Image.Image:
    """Overlays an RGBA layer on top of a checkerboard background."""
    w, h = layer_img.size
    cb = create_checkerboard(w, h, cell_size=12)
    if layer_img.mode != "RGBA":
        layer_img = layer_img.convert("RGBA")
    cb.paste(layer_img, (0, 0), layer_img)
    return cb.convert("RGB")


def build_layers_montage(
    original_img: Image.Image,
    layer_images: Dict[str, Image.Image],
) -> Image.Image:
    """
    Renders an exploded contact sheet montage showcasing:
    Original | Inpainted Background | Characters | Effects | Dialogue & SFX
    """
    cell_w, cell_h = 320, 320

    cards: List[Tuple[str, Image.Image, Tuple[int, int, int]]] = []

    # 1. Original Image
    orig_thumb = original_img.copy()
    orig_thumb.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
    cards.append(("1. Original Input", orig_thumb.convert("RGB"), (40, 120, 220)))

    # 2. Clean Background
    if "bg.png" in layer_images:
        bg_card = layer_images["bg.png"].copy()
        bg_card.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        cards.append(("2. Inpainted Background", bg_card.convert("RGB"), (40, 180, 100)))

    # 3. Character Layer(s)
    char_keys = [k for k in layer_images.keys() if k.startswith("char_")]
    if char_keys:
        for c_key in sorted(char_keys)[:2]:  # show up to 2 characters
            c_img = layer_images[c_key].copy()
            c_img.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
            c_cb = composite_on_checkerboard(c_img)
            name = c_key.replace(".png", "").replace("_", " ").title()
            cards.append((f"3. {name} (Alpha)", c_cb, (220, 120, 30)))

    # 4. Effects Layer
    if "effects.png" in layer_images:
        eff_img = layer_images["effects.png"].copy()
        eff_img.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        eff_cb = composite_on_checkerboard(eff_img)
        cards.append(("4. Visual Effects & Aura", eff_cb, (180, 60, 220)))

    # 5. Dialogue & Speech Text
    if "text.png" in layer_images:
        txt_img = layer_images["text.png"].copy()
        txt_img.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        txt_cb = composite_on_checkerboard(txt_img)
        cards.append(("5. Dialogue & Speech", txt_cb, (220, 40, 40)))

    # 6. SFX Layer
    if "sfx.png" in layer_images:
        sfx_img = layer_images["sfx.png"].copy()
        sfx_img.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        sfx_cb = composite_on_checkerboard(sfx_img)
        cards.append(("6. Sound Effects (SFX)", sfx_cb, (230, 160, 20)))

    num_cards = len(cards)
    cols = min(num_cards, 3)
    rows = (num_cards + cols - 1) // cols

    padding = 16
    header_h = 44
    title_bar_h = 28

    total_w = cols * (cell_w + padding) + padding
    total_h = header_h + rows * (cell_h + title_bar_h + padding) + padding

    montage = Image.new("RGB", (total_w, total_h), (26, 29, 36))
    draw = ImageDraw.Draw(montage)

    # Top Header
    draw.rectangle([0, 0, total_w, header_h], fill=(18, 20, 26))
    draw.text((padding, 14), "SONIKOMA AI COMIC LAYER SEPARATION — EXPLODED LAYERS PREVIEW", fill=(240, 245, 255))

    for idx, (label, card_img, bar_color) in enumerate(cards):
        c_idx = idx % cols
        r_idx = idx // cols

        x0 = padding + c_idx * (cell_w + padding)
        y0 = header_h + padding + r_idx * (cell_h + title_bar_h + padding)

        # Title bar
        draw.rectangle([x0, y0, x0 + cell_w, y0 + title_bar_h], fill=bar_color)
        draw.text((x0 + 8, y0 + 7), label, fill=(255, 255, 255))

        # Card image area with border
        draw.rectangle([x0, y0 + title_bar_h, x0 + cell_w, y0 + title_bar_h + cell_h], fill=(15, 17, 21), outline=(60, 65, 75))

        # Center card image
        iw, ih = card_img.size
        ox = x0 + (cell_w - iw) // 2
        oy = y0 + title_bar_h + (cell_h - ih) // 2
        montage.paste(card_img, (ox, oy))

    return montage


def run_layer_separation_pipeline(
    input_source: Optional[str] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    split_panels: bool = False,
    panel_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes comic panel layer separation, saves individual transparent layers,
    JSON metadata, and an exploded contact sheet montage.
    """
    os.makedirs(output_dir, exist_ok=True)
    start_time = time.perf_counter()

    # 1. Load input image
    if input_source and input_source.strip():
        pil_img, base_name, local_file_path = load_input_image(input_source)
    else:
        pil_img, base_name, local_file_path = create_demo_manga_canvas()

    img_w, img_h = pil_img.size
    active_panel_id = panel_id or f"panel_{base_name}_{int(time.time())}"

    # Target specific destination directory for this image
    target_dir = os.path.join(output_dir, base_name)
    os.makedirs(target_dir, exist_ok=True)

    print("\n" + "=" * 80)
    print(f"▶ RUNNING COMIC LAYER SEPARATOR ON: {base_name} ({img_w}x{img_h}px)")
    print(f"  AI Backends Available: SAM/SAM2={has_sam} | rembg/U-2-Net={has_rembg}")
    print(f"  Mode: {'Panel-by-Panel Split' if split_panels else 'Direct Panel Separation'}")
    print("=" * 80)

    # 2. Execution Choice: Panel-by-Panel or Direct Panel Separation
    t0 = time.perf_counter()
    if split_panels:
        print("\n[Step 1/3] Running extract_panel_layers_service (page panel detection & per-panel split)...")
        # extract_panel_layers_service accepts url or local path
        result = asyncio.run(extract_panel_layers_service(active_panel_id, local_file_path))
        num_panels = len(result.get("panels", []))
        print(f"  ✓ Processed {num_panels} panel(s) in {int((time.perf_counter() - t0) * 1000)}ms")
        layers_data = result.get("layers", {})
    else:
        print("\n[Step 1/3] Running process_layers pipeline (Chronological Detection -> Text -> Characters -> Background)...")
        layers_data = asyncio.run(process_layers(local_file_path, active_panel_id))
        print(f"  ✓ Layer separation completed in {int((time.perf_counter() - t0) * 1000)}ms")
        result = {
            "success": True,
            "panel_id": active_panel_id,
            "layers": layers_data,
        }

    # 3. Locate and copy saved local layers into target output directory
    print("\n[Step 2/3] Extracting and organizing layer files into target directory...")
    from database.config import MEDIA_DIR
    local_source_dir = os.path.join(MEDIA_DIR, "panels", "layers", active_panel_id)

    saved_files: Dict[str, str] = {}
    loaded_layer_images: Dict[str, Image.Image] = {}

    layer_file_mapping = {
        "bg.png": "01_background.png",
        "effects.png": "03_effects.png",
        "sfx.png": "04_sfx.png",
        "text.png": "05_text.png",
    }

    if os.path.exists(local_source_dir):
        for f in sorted(os.listdir(local_source_dir)):
            if not f.endswith(".png"):
                continue
            src_f = os.path.join(local_source_dir, f)
            dest_name = layer_file_mapping.get(f)
            if not dest_name:
                if f.startswith("char_"):
                    # Format char_1.png -> 02_character_1.png
                    c_num = f.replace("char_", "").replace(".png", "")
                    dest_name = f"02_character_{c_num}.png"
                else:
                    dest_name = f

            dest_f = os.path.join(target_dir, dest_name)
            shutil.copy2(src_f, dest_f)
            saved_files[dest_name] = dest_f

            try:
                loaded_layer_images[f] = Image.open(dest_f)
            except Exception:
                pass

    # 4. Generate Exploded Layers Contact Sheet Montage
    print("\n[Step 3/3] Generating multi-layer exploded contact sheet montage...")
    montage_path = os.path.join(target_dir, "00_layers_montage.png")
    montage_img = build_layers_montage(pil_img, loaded_layer_images)
    montage_img.save(montage_path)
    saved_files["00_layers_montage.png"] = montage_path

    # Save JSON metadata payload
    json_path = os.path.join(target_dir, f"{base_name}_layers.json")
    json_payload = {
        "source_image": base_name,
        "panel_id": active_panel_id,
        "width": img_w,
        "height": img_h,
        "split_panels": split_panels,
        "execution_time_ms": int((time.perf_counter() - start_time) * 1000),
        "text_nodes": layers_data.get("text_nodes", []) if isinstance(layers_data, dict) else [],
        "motion_presets": layers_data.get("motion_presets", {}) if isinstance(layers_data, dict) else {},
        "all_layers": layers_data.get("all_layers", []) if isinstance(layers_data, dict) else [],
        "output_files": {k: os.path.abspath(v) for k, v in saved_files.items()},
    }
    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(json_payload, jf, indent=2)
    saved_files[f"{base_name}_layers.json"] = json_path

    total_time_ms = int((time.perf_counter() - start_time) * 1000)

    # 5. Print Rich Formatted Results Summary
    print("\n" + "─" * 80)
    print("  LAYER SEPARATION EXECUTION SUMMARY")
    print("─" * 80)
    print(f"  Source Image     : {base_name} ({img_w}x{img_h}px)")
    print(f"  Panel Identifier : {active_panel_id}")
    print(f"  Total Duration   : {total_time_ms} ms")
    print("─" * 80)

    print("  SEPARATED COMPONENT LAYERS:")
    for fname, fpath in saved_files.items():
        size_kb = os.path.getsize(fpath) / 1024
        print(f"    • {fname:<25} ({size_kb:>6.1f} KB) -> {to_file_uri(fpath)}")

    text_nodes = layers_data.get("text_nodes", []) if isinstance(layers_data, dict) else []
    if text_nodes:
        print("\n  DETECTED TEXT & DIALOGUE NODES:")
        for t in text_nodes:
            txt_preview = t.get("text", "").replace("\n", " ")
            print(f"    #{t.get('reading_order', 0):<2} [{t.get('type', 'dialogue').upper():<8}] ({t.get('confidence', 0):.2f}) : \"{txt_preview}\"")

    motion_presets = layers_data.get("motion_presets", {}) if isinstance(layers_data, dict) else {}
    if motion_presets:
        print("\n  3D MOTION COMIC PRESETS:")
        print(f"    • Suggested Focus      : {motion_presets.get('suggested_camera_focus')}")
        print(f"    • Suggested Transition : {motion_presets.get('suggested_transition')}")

    print("\n📂 CLICKABLE OUTPUT FILES:")
    print(f"  • Target Directory : {to_file_uri(target_dir)}")
    print(f"  • Contact Sheet    : {to_file_uri(montage_path)}")
    print(f"  • Metadata JSON    : {to_file_uri(json_path)}")
    print("─" * 80 + "\n")

    return {
        "success": True,
        "target_dir": target_dir,
        "montage_path": montage_path,
        "json_path": json_path,
        "saved_files": saved_files,
        "total_time_ms": total_time_ms,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run Sonikoma AI Layer Separator to decompose comic artwork into Background, Character, and Text layers."
    )
    parser.add_argument(
        "-i", "--input",
        type=str,
        default=None,
        help="Path to image file or web URL. If omitted, prompts interactively or runs synthetic demo canvas."
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save output layer files (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--split-panels",
        action="store_true",
        help="Automatically detect panels and perform layer separation per panel instead of full image."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run immediately using the built-in synthetic demo comic panel canvas."
    )

    args = parser.parse_args()

    input_arg = args.input
    if args.demo:
        input_arg = None
    elif not input_arg:
        if sys.stdin.isatty():
            print("\n=== Sonikoma AI Comic Layer Separator Runner ===")
            user_input = input("Enter image path, URL (or press Enter to run synthetic demo panel): ").strip()
            input_arg = user_input if user_input else None
        else:
            input_arg = None

    if input_arg and input_arg.lower() in ("demo", "sample", "default"):
        input_arg = None

    run_layer_separation_pipeline(
        input_source=input_arg,
        output_dir=args.output_dir,
        split_panels=args.split_panels,
    )


if __name__ == "__main__":
    main()
