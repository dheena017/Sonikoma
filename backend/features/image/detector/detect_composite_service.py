"""
backend/features/image_editor/services/detector/detect_composite_service.py
─────────────────────────────────────────────────────────────────────────────
Unified Composite Detection Service:
- Synchronous single-call pipeline for Panels + Speech Bubbles + Characters
- Multi-engine perception: OpenCV contours + YOLO speech bubbles + Character/face recognition
- Spatial entity fusion: containment, speaker attribution, and cinematography
- Returns standardized DetectCompositeResponse scene graph
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import Optional, Dict, Any, List
from PIL import Image

from features.platform.projects.schemas_project import (
    DetectPanelsUrlRequest,
    DetectCompositeResponse,
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
    PanelCinematography,
)
from common.media import resolve_image_to_buffer

import os
import sys

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Multi-path import resolution for module relocation compatibility
try:
    from .main_service_detector.panel_detector import detect_opencv_panels
    from .main_service_detector.speech_bubble_detector import (
        detect_speech_bubbles as detect_yolo_entities,
    )
    from .main_service_detector.detect_characters_service import (
        detect_character_entities,
    )
    from .panel_fusion_service import fuse_panels_and_bubbles
    from .detect_type_service import detect_image_layout_type
except (ImportError, ValueError):
    from features.image.detector.main_service_detector.panel_detector import (
        detect_opencv_panels,
    )
    from features.image.detector.main_service_detector.speech_bubble_detector import (
        detect_speech_bubbles as detect_yolo_entities,
    )
    from features.image.detector.main_service_detector.detect_characters_service import (
        detect_character_entities,
    )
    from features.image.detector.panel_fusion_service import (
        fuse_panels_and_bubbles,
    )
    from features.image.detector.detect_type_service import (
        detect_image_layout_type,
    )

logger = logging.getLogger("sonikoma.services.image.detector.composite")

__all__ = ["detect_composite_panels"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. Composite Multi-Entity Orchestration Engine
# ─────────────────────────────────────────────────────────────────────────────

async def detect_composite_panels(body: DetectPanelsUrlRequest) -> DetectCompositeResponse:
    """
    Executes unified composite detection on comic and manga image bytes:
    1. Resolves image buffer from URL or Base64 and normalizes color space to RGB.
    2. Runs OpenCV geometric panel contour detection.
    3. Runs YOLO deep-learning speech bubble detection (when enabled).
    4. Runs YOLO/Saliency character silhouette and face detection.
    5. Fuses all entities into rich PanelBoundingBox models with speaker attribution.
    6. Extracts cinematography metadata tags and reading flow.

    Args:
        body (DetectPanelsUrlRequest): Request containing image url or base64,
            plus YOLO toggles and contour parameters.

    Returns:
        DetectCompositeResponse: Full scene graph with panels, speech bubbles,
            characters, and cinematography tags.

    Raises:
        ValueError: If neither url nor base64 is provided or image payload is corrupt.
    """
    # ── Stage 1: Timing & Guard Clauses ───────────────────────────────────────
    start_time = time.perf_counter()

    if body is None:
        logger.error("[Composite Detector] No request payload provided.")
        raise ValueError("No request payload provided.")

    target_url = body.url or body.image_url
    if not target_url and not body.image_base64:
        logger.error(
            "[Composite Detector] Missing image input: neither 'url', 'image_url', "
            "nor 'image_base64' was provided."
        )
        raise ValueError(
            "Must provide 'url', 'image_url', or 'image_base64' for composite detection."
        )

    # ── Stage 2: Input Normalization & Buffer Resolution ──────────────────────
    raw_bytes: Optional[bytes] = None

    if target_url:
        logger.debug(f"[Composite Detector] Resolving image buffer from URL: {target_url}")
        download_start = time.perf_counter()
        try:
            resolved = await resolve_image_to_buffer(target_url)
            raw_bytes = resolved.get("data")
            download_ms = int((time.perf_counter() - download_start) * 1000)
            logger.debug(
                f"[Composite Detector] URL resolved successfully: "
                f"{len(raw_bytes) if raw_bytes else 0} bytes downloaded in {download_ms}ms"
            )
        except Exception as e:
            logger.error(
                f"[Composite Detector] Failed to resolve URL '{target_url}': {e}",
                exc_info=True,
            )
            raise ValueError(f"Could not download image from URL: {e}")

    elif body.image_base64:
        b64 = body.image_base64
        logger.debug(
            f"[Composite Detector] Decoding base64 image payload (input length={len(b64)} chars)"
        )
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        try:
            raw_bytes = base64.b64decode(b64)
            logger.debug(
                f"[Composite Detector] Base64 decoded successfully: {len(raw_bytes)} bytes"
            )
        except Exception as e:
            logger.error(f"[Composite Detector] Base64 decoding failed: {e}", exc_info=True)
            raise ValueError(f"Invalid base64 payload: {e}")

    if not raw_bytes or len(raw_bytes) == 0:
        logger.error("[Composite Detector] Resolved image buffer is empty (0 bytes).")
        raise ValueError("Resolved image buffer is empty (0 bytes).")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes))
        original_mode = pil_img.mode
        if pil_img.mode != "RGB":
            logger.debug(
                f"[Composite Detector] Converting image mode from '{original_mode}' to 'RGB'"
            )
            pil_img = pil_img.convert("RGB")
        img_w, img_h = pil_img.size
        logger.debug(
            f"[Composite Detector] Image parsed successfully: {img_w}x{img_h}px, "
            f"format={pil_img.format or 'in-memory'}, buffer={len(raw_bytes)} bytes"
        )
    except Exception as e:
        logger.error(f"[Composite Detector] Image parsing failed: {e}", exc_info=True)
        raise ValueError(f"Corrupt image payload: {e}")

    if img_w < 10 or img_h < 10:
        logger.warning(
            f"[Composite Detector] Image dimensions too small ({img_w}x{img_h}px) "
            "for composite detection."
        )
        raise ValueError(
            f"Image dimensions too small ({img_w}x{img_h}px) for composite detection."
        )

    aspect_ratio = round(img_h / float(max(1, img_w)), 2)

    # ── Stage 2.5: Pre-Flight 5-Layer Layout & Format Classification ──────────
    layout_info = None
    try:
        layout_info = await detect_image_layout_type(pil_image=pil_img)
        logger.info(
            f"[Composite: LayoutClassifier] Classified as '{layout_info.crop_type.value}' "
            f"({layout_info.type_label}, bg={layout_info.detected_bg_color}, "
            f"edge_complexity={layout_info.edge_complexity}, est_panels={layout_info.estimated_panel_count})"
        )
    except Exception as e:
        logger.warning(f"[Composite: LayoutClassifier] Pre-flight layout analysis fallback: {e}")

    crop_type_val = layout_info.crop_type.value if layout_info else ("long_panels" if img_h > img_w * 2 else "small_panels")
    is_tall = crop_type_val in ("long_panels", "ultra_long_panels", "four_koma") or (img_h > img_w * 2)
    crop_type = "tall_strip" if is_tall else "small_panels"
    optimal_canny = (
        layout_info.optimal_canny_thresholds
        if layout_info and layout_info.optimal_canny_thresholds
        else {"low": 20, "high": 100}
    )

    logger.info(
        f"[Composite Detector] Starting composite pipeline: {img_w}x{img_h}px "
        f"(aspect={aspect_ratio}, crop_type='{crop_type}', layout='{crop_type_val}', use_yolo={body.use_yolo})"
    )

    # ── Stage 3: Core Algorithmic Processing ──────────────────────────────────

    # 1. OpenCV Contour Extraction
    cv_panels: List[Dict[str, Any]] = []
    min_w_pct = body.min_width_pct if body.min_width_pct is not None else 0.15
    min_h_px = body.min_height_px if body.min_height_px is not None else 60
    canny_l = getattr(body, "canny_low", None) or int(optimal_canny.get("low", 20))
    canny_h = getattr(body, "canny_high", None) or int(optimal_canny.get("high", 100))
    close_kernel = getattr(body, "close_kernel_size", 15) or 15

    logger.debug(
        f"[Composite Detector] [Step 1/4] Running OpenCV contour extraction "
        f"(min_width_pct={min_w_pct}, min_height_px={min_h_px}, canny={canny_l}/{canny_h})..."
    )
    cv_start = time.perf_counter()
    try:
        cv_res = detect_opencv_panels(
            image_bytes=raw_bytes,
            canny_low=canny_l,
            canny_high=canny_h,
            close_kernel_size=close_kernel,
            min_width_pct=min_w_pct,
            min_height_px=min_h_px,
            bleed_padding_px=5,
        )
        cv_panels = cv_res.get("panels", []) if isinstance(cv_res, dict) else []
        cv_ms = int((time.perf_counter() - cv_start) * 1000)
        logger.debug(
            f"[Composite Detector] OpenCV contour extraction completed in {cv_ms}ms: "
            f"found {len(cv_panels)} candidate contour(s)"
        )
    except Exception as e:
        cv_ms = int((time.perf_counter() - cv_start) * 1000)
        logger.warning(
            f"[Composite Detector] OpenCV contour extraction failed after {cv_ms}ms ({e}); "
            "continuing with empty contour baseline",
            exc_info=True,
        )
        cv_panels = []

    # 2. YOLO Speech Bubble Detection
    yolo_bubbles: List[SpeechBubbleItem] = []
    if body.use_yolo:
        logger.debug(
            "[Composite Detector] [Step 2/4] Running YOLO deep-learning speech bubble detector "
            "(conf_threshold=0.25)..."
        )
        yolo_start = time.perf_counter()
        try:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
            yolo_ms = int((time.perf_counter() - yolo_start) * 1000)
            logger.debug(
                f"[Composite Detector] YOLO speech bubble detection completed in {yolo_ms}ms: "
                f"found {len(yolo_bubbles)} speech bubble(s)"
            )
        except Exception as e:
            yolo_ms = int((time.perf_counter() - yolo_start) * 1000)
            logger.warning(
                f"[Composite Detector] YOLO speech bubble detection failed after {yolo_ms}ms ({e}); "
                "continuing with empty bubbles fallback",
                exc_info=True,
            )
            yolo_bubbles = []
    else:
        logger.debug(
            "[Composite Detector] [Step 2/4] YOLO speech bubble detection skipped (body.use_yolo=False)"
        )

    # 3. Character & Face Detection
    characters: List[CharacterEntityItem] = []
    logger.debug(
        "[Composite Detector] [Step 3/4] Running character & facial feature detection "
        "(conf_threshold=0.25, detect_faces=True)..."
    )
    char_start = time.perf_counter()
    try:
        characters = detect_character_entities(
            raw_bytes, conf_threshold=0.25, detect_faces=True
        )
        char_ms = int((time.perf_counter() - char_start) * 1000)
        logger.debug(
            f"[Composite Detector] Character detection completed in {char_ms}ms: "
            f"found {len(characters)} character/face entity/entities"
        )
    except Exception as e:
        char_ms = int((time.perf_counter() - char_start) * 1000)
        logger.warning(
            f"[Composite Detector] Character detection failed after {char_ms}ms ({e}); "
            "continuing with empty characters fallback",
            exc_info=True,
        )
        characters = []

    # 4. Intelligent Multimodal Fusion
    logger.debug(
        f"[Composite Detector] [Step 4/4] Executing spatial fusion for {len(cv_panels)} contour(s), "
        f"{len(yolo_bubbles)} bubble(s), and {len(characters)} character(s)..."
    )
    fuse_start = time.perf_counter()
    try:
        fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
            cv_panels=cv_panels,
            yolo_bubbles=yolo_bubbles,
            img_w=img_w,
            img_h=img_h,
            characters=characters,
            is_small_panel=not is_tall,
            snap_to_frame=True,
            bleed_padding_px=5,
        )
        fuse_ms = int((time.perf_counter() - fuse_start) * 1000)
        logger.debug(
            f"[Composite Detector] Spatial fusion completed in {fuse_ms}ms: "
            f"produced {len(fused_panels)} fused panel(s)"
        )
    except Exception as e:
        fuse_ms = int((time.perf_counter() - fuse_start) * 1000)
        logger.warning(
            f"[Composite Detector] Spatial fusion failed after {fuse_ms}ms ({e}); "
            "synthesizing full-canvas panel fallback",
            exc_info=True,
        )
        fused_panels = [
            PanelBoundingBox(
                id="panel_1",
                index=1,
                x=0,
                y=0,
                w=img_w,
                h=img_h,
                width=img_w,
                height=img_h,
                polygon=[[0, 0], [img_w, 0], [img_w, img_h], [0, img_h]],
                has_bound_bubbles=len(yolo_bubbles) > 0,
                speech_bubbles_count=len(yolo_bubbles),
                speech_bubbles=yolo_bubbles,
                characters=characters,
                characters_count=len(characters),
            )
        ]

    # 5. Extract Cinematography metadata list
    cinematography_list = [
        p.cinematography for p in fused_panels if getattr(p, "cinematography", None)
    ]
    if cinematography_list:
        logger.debug(
            f"[Composite Detector] Extracted {len(cinematography_list)} cinematography tag(s)"
        )
    else:
        logger.debug("[Composite Detector] No specific cinematography tags assigned to panels")

    if not fused_panels:
        logger.warning(
            "[Composite Detector] Zero panels were produced after contour extraction and fusion"
        )

    # ── Stage 4: Structured Output & Traceable Logging ────────────────────────
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[Composite Detector] Finished composite detection in {elapsed_ms}ms: "
        f"{len(fused_panels)} panel(s), {len(yolo_bubbles)} bubble(s), "
        f"{len(characters)} character(s) [size={img_w}x{img_h}px, crop_type='{crop_type}']"
    )

    summary_msg = (
        f"Detected {len(fused_panels)} panel(s), {len(yolo_bubbles)} bubble(s), "
        f"and {len(characters)} character(s) in {elapsed_ms}ms"
    )

    return DetectCompositeResponse(
        success=True,
        crop_type=crop_type,
        image_width=img_w,
        image_height=img_h,
        reading_flow="top_to_bottom",
        panels=fused_panels,
        speech_bubbles=yolo_bubbles,
        characters=characters,
        cinematography=cinematography_list if cinematography_list else None,
        total_panels=len(fused_panels),
        total_speech_bubbles=len(yolo_bubbles),
        total_characters=len(characters),
        execution_time_ms=elapsed_ms,
        message=summary_msg,
    )
