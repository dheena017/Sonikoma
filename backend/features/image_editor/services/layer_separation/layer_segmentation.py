"""
backend/features/image_editor/services/layer_separation/layer_segmentation.py
─────────────────────────────────────────────────────────────────────────────
Panel Layer Segmentation Orchestrator:
Coordinates the multi-phase decomposition of a single comic panel into:
- Background environment plate (inpainted)
- Individual character subject cutouts (RGBA)
- Visual aura & energy effects
- Dialogue bubbles & speech text
- Sound effects & action typography (SFX)
- 3D parallax motion presets & reading-order OCR text nodes
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

import cv2
import numpy as np

from features.image_editor.services.detector.main_service_detector.panel_detector import (
    detect_background_color_and_threshold,
)
from features.image_editor.services.layer_separation.character_layer_extractor import (
    extract_characters_and_background,
)
from features.image_editor.services.layer_separation.inpainting import (
    create_blank_png,
    create_blank_webp,
    pyramid_guided_inpaint,
    smooth_contour,
)
from features.image_editor.services.layer_separation.layer_metadata import (
    build_motion_presets,
    build_text_nodes,
)
from features.image_editor.services.layer_separation.layer_storage import (
    persist_panel_layers,
)
from features.image_editor.services.layer_separation.sam import (
    extract_character_layer,
    has_rembg,
    has_sam,
)
from features.image_editor.services.ocr.ocr_engine import extract_full_ocr_data

logger = logging.getLogger("sonikoma.services.image.layer_separation.layer_segmentation")


# ─────────────────────────────────────────────────────────────────────────────
# Main Orchestrator Function (Single External Entry Point for Single Panels)
# ─────────────────────────────────────────────────────────────────────────────

async def process_layers(image_path: str, panel_id: str) -> Dict[str, Any]:
    """
    Main entry point for decomposing a panel image into layered components.

    Executes a structured 4-phase chronological separation:
    - Phase 1: Global Context Scan (Luminance analysis, OCR detection, character pre-scan)
    - Phase 2: Speech & SFX Extraction + Telea text inpainting
    - Phase 3: Character Isolation, Aura Extraction & Pyramidal-guided Background Inpainting
    - Phase 4: Text Nodes, Motion Presets & Layer Persistence

    Args:
        image_path: Absolute filepath to the source comic panel image.
        panel_id: Unique identifier for the panel.

    Returns:
        Structured dictionary containing URLs for all layers, text nodes, and motion presets.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Source image not found: {image_path}")

    logger.info(f"Starting chronological layer segmentation for panel: {panel_id}")

    original_img = cv2.imread(image_path)
    if original_img is None:
        raise ValueError(f"Could not load image: {image_path}")

    height, width = original_img.shape[:2]

    # Phase 1: Background Luminance & Context Detection
    gray_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)
    is_white_bg, threshold_val, *_ = detect_background_color_and_threshold(
        gray_img, bg_mode="auto", sensitivity=30.0
    )

    ocr_results: List[Dict[str, Any]] = []
    try:
        ocr_results = await extract_full_ocr_data(image_path, langs=["en"])
    except Exception as e:
        logger.error(f"[Global Detection] EasyOCR scan failed: {e}", exc_info=True)

    # Character pre-scan to protect character boundaries during text mask generation
    global_char_mask = np.zeros((height, width), dtype=np.uint8)
    try:
        if has_sam or has_rembg:
            char_pil_scan = extract_character_layer(original_img)
            if char_pil_scan is not None:
                char_np_scan = np.array(char_pil_scan)
                if char_np_scan.ndim == 3 and char_np_scan.shape[2] == 4:
                    global_char_mask = char_np_scan[:, :, 3]
    except Exception as e:
        logger.error(f"[Global Detection] Character pre-scan failed: {e}", exc_info=True)

    # Phase 2: Multi-Layer Text & Sound Effects Separation
    from features.image_editor.services.layer_separation.text_layer_extractor import (
        extract_text_and_sfx_layers,
    )
    (
        text_layer_bytes,
        sfx_layer_bytes,
        textless_img,
        _,
        _,
    ) = extract_text_and_sfx_layers(
        original_img=original_img,
        gray_img=gray_img,
        ocr_results=ocr_results,
        global_char_mask=global_char_mask,
        is_white_bg=is_white_bg,
        threshold_val=threshold_val,
        image_path=image_path,
    )

    # Phase 3: Character, Visual Effects & Background Inpainting
    (
        individual_char_layers,
        effects_layer_bytes,
        bg_layer_bytes,
        _,
    ) = extract_characters_and_background(
        original_img=original_img,
        textless_img=textless_img,
        image_path=image_path,
    )

    # Phase 4: Reading-Order Text Nodes & Motion Presets
    text_nodes = build_text_nodes(ocr_results)
    motion_presets = build_motion_presets(width, height, len(individual_char_layers))

    # Persistence: Save to Supabase (production) or local disk (development)
    return persist_panel_layers(
        panel_id=panel_id,
        bg_bytes=bg_layer_bytes,
        effects_bytes=effects_layer_bytes,
        text_bytes=text_layer_bytes,
        sfx_bytes=sfx_layer_bytes,
        char_layers=individual_char_layers,
        text_nodes=text_nodes,
        motion_presets=motion_presets,
    )


# Canonical aliases
separate_foreground_background_text = process_layers
process_panel_layers = process_layers

__all__ = [
    "process_layers",
    "process_panel_layers",
    "separate_foreground_background_text",
    "create_blank_webp",
    "create_blank_png",
    "pyramid_guided_inpaint",
    "smooth_contour",
]
