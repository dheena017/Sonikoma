"""
backend/scripts/run_panel_fusion.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Panel, Speech Bubble & Character Spatial Fusion:
Merges panel bounding boxes, speech bubbles, and character entities using
the intelligent fusion engine in panel_fusion_service.py:
1. Assigns characters to containing panels
2. Binds speech bubbles via 5 Canonical Manga Conventions:
   - Inside panel (containment)
   - Crossing panel border (reveal/accusation)
   - Outside gutter (distant/offscreen narration)
   - One bubble spanning two panels
   - Overlapping dialogue chains
3. Speaker Attribution (draws proximity vectors from speaker to bubble)
4. Strict non-overlap boundary clipping & inset panel tagging
5. Cinematography shot framing inference (Close-up, Medium, Wide)

Outputs:
1. <image_name>_fusion.json      -> Complete fused scene graph & relationships
2. <image_name>_annotated.png    -> Annotated preview with attribution vectors
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_panel_fusion.py
  python backend/scripts/run_panel_fusion.py --input path/to/manga.png
  python backend/scripts/run_panel_fusion.py -i https://example.com/page.jpg -o my_output/
"""

import os
import sys
import io
import time
import json
import math
import argparse
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, List
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.platform.projects.schemas_project import (
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
    BubblePlacementRelation,
)
from features.image.detector.panel_fusion_service import (
    fuse_panels_and_bubbles,
    classify_speech_bubble_placement,
)
from features.image.detector.main_service_detector.panel_detector import detect_opencv_panels
from features.image.detector.main_service_detector.speech_bubble_detector import detect_speech_bubbles
from features.image.detector.main_service_detector.detect_characters_service import detect_character_entities
from common.media import resolve_image_to_buffer

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "panel_fusion")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


def load_input_image(input_source: str) -> Tuple[Image.Image, str, bytes]:
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
        return pil_img, base_name, raw_data

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
            return pil_img, base_name, raw_data

    raise FileNotFoundError(f"Input file or URL not found: '{input_source}'")


def create_demo_fusion_canvas() -> Tuple[Image.Image, str, bytes, List[Dict[str, Any]], List[SpeechBubbleItem], List[CharacterEntityItem]]:
    """
    Generates a synthetic multi-panel manga canvas explicitly demonstrating
    all 5 canonical speech bubble placement conventions and character speakers.
    """
    print("[*] Generating dynamic synthetic multi-entity manga canvas for Fusion demo...")
    w, h = 800, 1000
    pil_img = Image.new("RGB", (w, h), color=(245, 245, 248))
    draw = ImageDraw.Draw(pil_img)

    # Panel 1 (Top)
    p1 = {"id": "panel_1", "x": 50, "y": 50, "w": 700, "h": 400, "confidence": 0.98}
    draw.rectangle([50, 50, 750, 450], outline=(0, 0, 0), width=4, fill=(255, 255, 255))

    # Panel 2 (Bottom)
    p2 = {"id": "panel_2", "x": 50, "y": 520, "w": 700, "h": 420, "confidence": 0.98}
    draw.rectangle([50, 520, 750, 940], outline=(0, 0, 0), width=4, fill=(255, 255, 255))

    # Character 1 in Panel 1 (Close up portrait)
    c1 = CharacterEntityItem(
        character_id="char_1",
        panel_id="panel_1",
        x=100, y=100, width=200, height=320,
        confidence=0.92,
        pose_framing="close_up",
    )
    draw.rectangle([c1.x, c1.y, c1.x + c1.width, c1.y + c1.height], outline=(30, 144, 255), width=3)
    draw.text((c1.x + 10, c1.y + 10), "Char 1 (Speaker)", fill=(30, 144, 255))

    # Character 2 in Panel 2 (Medium shot)
    c2 = CharacterEntityItem(
        character_id="char_2",
        panel_id="panel_2",
        x=500, y=560, width=180, height=260,
        confidence=0.88,
        pose_framing="medium_shot",
    )
    draw.rectangle([c2.x, c2.y, c2.x + c2.width, c2.y + c2.height], outline=(30, 144, 255), width=3)
    draw.text((c2.x + 10, c2.y + 10), "Char 2 (Speaker)", fill=(30, 144, 255))

    # Speech Bubble 1: Inside Panel 1 (spoken by Char 1)
    b1 = SpeechBubbleItem(
        bubble_id="bubble_1",
        x=340, y=120, width=160, height=90,
        confidence=0.95,
        sub_type="speech",
    )
    draw.ellipse([b1.x, b1.y, b1.x + b1.width, b1.y + b1.height], outline=(220, 20, 60), width=3, fill=(255, 255, 255))

    # Speech Bubble 2: Crossing border of Panel 1 (dramatic line)
    b2 = SpeechBubbleItem(
        bubble_id="bubble_2",
        x=520, y=410, width=150, height=80,
        confidence=0.91,
        sub_type="speech",
    )
    draw.ellipse([b2.x, b2.y, b2.x + b2.width, b2.y + b2.height], outline=(255, 140, 0), width=3, fill=(255, 255, 255))

    # Speech Bubble 3: Gutter bubble between Panel 1 & 2
    b3 = SpeechBubbleItem(
        bubble_id="bubble_3",
        x=220, y=465, width=140, height=45,
        confidence=0.85,
        sub_type="caption",
    )
    draw.rectangle([b3.x, b3.y, b3.x + b3.width, b3.y + b3.height], outline=(148, 0, 211), width=2, fill=(255, 255, 255))

    # Speech Bubble 4: Inside Panel 2 (spoken by Char 2)
    b4 = SpeechBubbleItem(
        bubble_id="bubble_4",
        x=200, y=600, width=180, height=100,
        confidence=0.94,
        sub_type="speech",
    )
    draw.ellipse([b4.x, b4.y, b4.x + b4.width, b4.y + b4.height], outline=(220, 20, 60), width=3, fill=(255, 255, 255))

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_data = buf.getvalue()

    return pil_img, "demo_spatial_fusion_canvas", raw_data, [p1, p2], [b1, b2, b3, b4], [c1, c2]


def render_annotated_fusion(
    source_img: Image.Image,
    fused_panels: List[PanelBoundingBox],
) -> Image.Image:
    """
    Renders high-visibility bounding boxes, speaker attribution connection vectors,
    cinematography shot badges, and placement convention labels.
    """
    annotated = source_img.copy()
    draw = ImageDraw.Draw(annotated)

    convention_colors = {
        BubblePlacementRelation.INSIDE.value: (46, 204, 113),         # Green
        BubblePlacementRelation.CROSSING_BORDER.value: (243, 156, 18),  # Amber
        BubblePlacementRelation.OUTSIDE_GUTTER.value: (155, 89, 182),  # Purple
        BubblePlacementRelation.SPANNING_PANELS.value: (52, 152, 219),  # Blue
        BubblePlacementRelation.OVERLAPPING_CHAIN.value: (231, 76, 60), # Red
    }

    for p in fused_panels:
        # 1. Draw Panel Frame (Bold Black / Cyan border)
        draw.rectangle([p.x, p.y, p.x + p.w, p.y + p.h], outline=(0, 200, 255), width=3)

        # Panel Cinematography Header Badge
        cine = p.cinematography
        shot = cine.shot_type.upper() if cine and cine.shot_type else "STANDARD"
        badge = f"[{p.id.upper()} | {shot}]"
        draw.rectangle([p.x, p.y - 24, p.x + 180, p.y], fill=(0, 200, 255))
        draw.text((p.x + 8, p.y - 20), badge, fill=(0, 0, 0))

        # 2. Draw Characters
        for c in (p.characters or []):
            draw.rectangle([c.x, c.y, c.x + c.width, c.y + c.height], outline=(30, 144, 255), width=2)
            c_center = (c.x + c.width // 2, c.y + c.height // 2)

            # 3. Draw Speaker Attribution Vectors (Character Center -> Bubble Center)
            for b in (p.speech_bubbles or []):
                if b.bubble_id in (c.associated_bubble_ids or []):
                    b_center = (b.x + b.width // 2, b.y + b.height // 2)
                    draw.line([c_center, b_center], fill=(255, 215, 0), width=3)
                    # Small circle at bubble connection
                    draw.ellipse([b_center[0] - 4, b_center[1] - 4, b_center[0] + 4, b_center[1] + 4], fill=(255, 215, 0))

        # 4. Draw Speech Bubbles with Convention Badges
        for b in (p.speech_bubbles or []):
            rel = b.placement_relation or "inside"
            color = convention_colors.get(rel, (46, 204, 113))

            draw.rectangle([b.x, b.y, b.x + b.width, b.y + b.height], outline=color, width=3)
            # Label badge
            label_text = f"{b.bubble_id}: {rel.upper()}"
            draw.rectangle([b.x, b.y - 18, b.x + len(label_text) * 7 + 10, b.y], fill=color)
            draw.text((b.x + 4, b.y - 16), label_text, fill=(255, 255, 255))

    return annotated


def run_pipeline(input_source: Optional[str] = None, output_dir: Optional[str] = None) -> None:
    """Executes panel fusion pipeline and saves structured scene graph."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    if not input_source:
        print("\n" + "=" * 70)
        print("  SONIKOMA - SPATIAL MULTI-ENTITY FUSION RUNNER")
        print("=" * 70)
        prompt_val = input("Enter Image File Path, URL, or press [Enter] for Demo canvas: ").strip()
        if prompt_val:
            input_source = prompt_val

    if input_source and input_source.strip().lower() != "demo":
        pil_img, base_name, raw_bytes = load_input_image(input_source)
        img_w, img_h = pil_img.size
        print(f"\n[*] Detecting underlying vision entities on '{base_name}'...")
        # Run 3 detectors to gather inputs
        cv_res = detect_opencv_panels(image_bytes=raw_bytes)
        cv_panels = cv_res.get("panels", []) if isinstance(cv_res, dict) else []
        bubbles = detect_speech_bubbles(raw_bytes, conf_threshold=0.25)
        characters = detect_character_entities(raw_bytes, conf_threshold=0.25, detect_faces=True)
    else:
        pil_img, base_name, raw_bytes, cv_panels, bubbles, characters = create_demo_fusion_canvas()
        img_w, img_h = pil_img.size

    print(f"\n[*] Executing Spatial Fusion on {len(cv_panels)} panel(s), {len(bubbles)} bubble(s), {len(characters)} character(s)...")
    start_t = time.perf_counter()

    fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=bubbles,
        img_w=img_w,
        img_h=img_h,
        characters=characters,
        is_small_panel=False,
        snap_to_frame=True,
        bleed_padding_px=5,
    )
    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    print(f"\n[+] Fusion Complete in {elapsed_ms}ms:")
    print(f"    • Fused Panels Produced : {len(fused_panels)}")
    print(f"    • Bound Speech Bubbles  : {len(bound_bubbles)}")
    print(f"    • Crop Margins (px)     : {margins}")

    # Inspect speaker associations
    for p in fused_panels:
        cine_tag = p.cinematography.shot_type if p.cinematography else "unknown"
        print(f"    • [{p.id}] Shot: {cine_tag.upper()} | Characters: {len(p.characters or [])} | Bubbles: {len(p.speech_bubbles or [])}")
        for c in (p.characters or []):
            if c.associated_bubble_ids:
                print(f"        └─ Character '{c.character_id}' speaks dialogue: {c.associated_bubble_ids}")

    # Save JSON Metadata
    res_dict = {
        "image_width": img_w,
        "image_height": img_h,
        "execution_time_ms": elapsed_ms,
        "panels_count": len(fused_panels),
        "margins": margins,
        "panels": [p.model_dump() if hasattr(p, "model_dump") else p.dict() for p in fused_panels],
    }
    json_path = os.path.join(out_dir, f"{base_name}_fusion.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(res_dict, f, indent=2)
    print(f"\n    • JSON Saved            : {to_file_uri(json_path)}")

    # Render and Save Annotated Image
    annotated_img = render_annotated_fusion(pil_img, fused_panels)
    annotated_path = os.path.join(out_dir, f"{base_name}_annotated.png")
    annotated_img.save(annotated_path)
    print(f"    • Preview Saved         : {to_file_uri(annotated_path)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Runner for Spatial Panel, Bubble & Character Fusion")
    parser.add_argument("-i", "--input", type=str, default=None, help="Path to input image file or web URL")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    run_pipeline(input_source=args.input, output_dir=args.output)
