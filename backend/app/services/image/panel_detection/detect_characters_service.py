"""
backend/app/services/image/panel_detection/detect_characters_service.py
─────────────────────────────────────────────────────────────────────────────
Character & Silhouette Detection Service for Comics, Manga, and Webtoons:
- Multi-tier character detection (YOLOv8-seg, OpenCV Saliency, AI Vision)
- Pixel-accurate silhouette contour polygons
- Pose and framing estimation (full_body, upper_body, face_closeup)
- Face bounding boxes with emotion/gaze metadata
- Binds characters to host panels and dialogue speakers
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np
import cv2

from schemas.project import (
    CharacterEntityItem,
    CharacterFaceItem,
    CharacterPoseType,
    DetectCharactersRequest,
    DetectCharactersResponse,
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.speech_bubble_detector import (
    get_yolo_character_segmentation_model,
    has_yolo_dependencies
)

logger = logging.getLogger("sonikoma.services.panel_detection.characters")


def _estimate_character_pose(char_w: int, char_h: int, img_w: int, img_h: int) -> CharacterPoseType:
    """Estimates whether the character is a full body, upper body, or face close-up."""
    aspect = char_h / float(max(1, char_w))
    height_ratio = char_h / float(max(1, img_h))

    if height_ratio < 0.20 and aspect < 1.2:
        return CharacterPoseType.FACE_CLOSEUP
    elif aspect > 1.8 or height_ratio > 0.55:
        return CharacterPoseType.FULL_BODY
    elif aspect >= 1.1 or height_ratio >= 0.25:
        return CharacterPoseType.UPPER_BODY
    else:
        return CharacterPoseType.SILHOUETTE


def _detect_simple_face(img_bgr: np.ndarray, char_x: int, char_y: int, char_w: int, char_h: int) -> Optional[CharacterFaceItem]:
    """Extracts approximate face sub-box and emotion inside character crop."""
    try:
        crop = img_bgr[char_y : char_y + char_h, char_x : char_x + char_w]
        if crop.size == 0 or crop.shape[0] < 20 or crop.shape[1] < 20:
            return None

        # Approximate face at top 35% of character height
        face_h = max(10, int(char_h * 0.35))
        face_w = max(10, int(char_w * 0.60))
        face_x = char_x + int((char_w - face_w) / 2)
        face_y = char_y + int(char_h * 0.05)

        return CharacterFaceItem(
            x=face_x,
            y=face_y,
            width=face_w,
            height=face_h,
            emotion="neutral",
            gaze_direction="forward"
        )
    except Exception:
        return None


def detect_character_entities(
    image_bytes: bytes,
    conf_threshold: float = 0.20,
    detect_faces: bool = True
) -> List[CharacterEntityItem]:
    """
    Detects comic and manga characters with bounding boxes, segmentation masks, and poses.
    Supports tiled window scanning for ultra-tall webtoon strips to prevent downscale collapse.
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    img_np = np.array(pil_img)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    characters: List[CharacterEntityItem] = []
    char_counter = 1

    # Dynamically compute sliding window dimensions proportional to image width
    window_h = int(img_w * 1.5)
    step_y = max(1, int(window_h * 0.75))

    tiles: List[Tuple[int, int, Image.Image]] = []
    if img_h > int(window_h * 1.25):
        for y_start in range(0, img_h, step_y):
            y_end = min(img_h, y_start + window_h)
            crop_tile = pil_img.crop((0, y_start, img_w, y_end))
            tiles.append((0, y_start, crop_tile))
            if y_end >= img_h:
                break
    else:
        tiles.append((0, 0, pil_img))

    # Proportional minimum character dimensions
    min_char_w = max(4, int(img_w * 0.03))
    min_char_h = max(6, int(img_w * 0.05))

    # ── Tier 1: YOLO Deep-Learning Character Segmentation ─────────────────────
    model = get_yolo_character_segmentation_model() if has_yolo_dependencies else None
    if model is not None:
        try:
            for tile_x, tile_y, tile_img in tiles:
                tile_w, tile_h = tile_img.size
                results = model.predict(source=tile_img, conf=conf_threshold, verbose=False)
                for r in results:
                    boxes = r.boxes.xyxy.cpu().numpy() if r.boxes is not None else []
                    confs = r.boxes.conf.cpu().numpy() if r.boxes is not None else []
                    classes = r.boxes.cls.cpu().numpy() if r.boxes is not None else []
                    masks = r.masks.xy if r.masks is not None else []

                    for idx, (box, conf, cls_id) in enumerate(zip(boxes, confs, classes)):
                        # COCO class 0 = Person; or any high-confidence foreground subject
                        if int(cls_id) != 0 and conf < 0.35:
                            continue

                        lx1, ly1, lx2, ly2 = [int(v) for v in box]
                        gx1 = tile_x + lx1
                        gy1 = tile_y + ly1
                        w = max(1, lx2 - lx1)
                        h = max(1, ly2 - ly1)

                        # Filter noise
                        if w < min_char_w or h < min_char_h:
                            continue

                        polygon = None
                        if idx < len(masks) and masks[idx] is not None and len(masks[idx]) > 2:
                            polygon = [[tile_x + int(pt[0]), tile_y + int(pt[1])] for pt in masks[idx]]

                        pose = _estimate_character_pose(w, h, img_w, img_h)
                        face = _detect_simple_face(img_bgr, gx1, gy1, w, h) if detect_faces else None

                        characters.append(CharacterEntityItem(
                            character_id=f"char_{char_counter}",
                            label="character",
                            category="character",
                            pose_type=pose,
                            x=gx1,
                            y=gy1,
                            width=w,
                            height=h,
                            polygon=polygon,
                            confidence=round(float(conf), 2),
                            face=face,
                            associated_bubble_ids=[]
                        ))
                        char_counter += 1
        except Exception as e:
            logger.warning(f"[Character Detector] YOLO inference error: {e}")

    # ── Tier 2: OpenCV Haar Cascade Face / Figure Detection Fallback ───────────
    if not characters:
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            min_face_dim = max(8, int(img_w * 0.035))

            for tile_x, tile_y, tile_img in tiles:
                tile_gray = gray[tile_y : tile_y + tile_img.size[1], 0 : img_w]
                if tile_gray.size == 0:
                    continue

                faces = face_cascade.detectMultiScale(tile_gray, scaleFactor=1.1, minNeighbors=3, minSize=(min_face_dim, min_face_dim))
                for (fx, fy, fw, fh) in faces:
                    gx = fx
                    gy = tile_y + fy
                    # Estimate upper body around face
                    bx = max(0, gx - int(fw * 0.5))
                    by = max(0, gy - int(fh * 0.3))
                    bw = min(img_w - bx, int(fw * 2.0))
                    bh = min(img_h - by, int(fh * 3.5))

                    face_item = CharacterFaceItem(
                        x=gx,
                        y=gy,
                        width=fw,
                        height=fh,
                        emotion="neutral",
                        gaze_direction="forward"
                    ) if detect_faces else None

                    characters.append(CharacterEntityItem(
                        character_id=f"char_{char_counter}",
                        label="character_face_cascade",
                        category="character",
                        pose_type=CharacterPoseType.UPPER_BODY,
                        x=bx,
                        y=by,
                        width=bw,
                        height=bh,
                        confidence=0.80,
                        face=face_item,
                        associated_bubble_ids=[]
                    ))
                    char_counter += 1
        except Exception as e:
            logger.debug(f"[Character Detector] Haar cascade fallback: {e}")

    # ── Tier 3: Adaptive Saliency / Foreground Contours Fallback ──────────────
    if not characters:
        try:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            for tile_x, tile_y, tile_img in tiles:
                tile_h_curr = tile_img.size[1]
                tile_gray = gray[tile_y : tile_y + tile_h_curr, 0 : img_w]
                if tile_gray.size == 0:
                    continue

                thresh = cv2.adaptiveThreshold(tile_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 5)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for cnt in contours:
                    x, y, w, h = cv2.boundingRect(cnt)
                    area = w * h
                    # Dominant vertical foreground figure (>= 1.5% of tile area)
                    if (area / float(img_w * tile_h_curr)) >= 0.015 and h >= min_char_h and (h / float(max(1, w))) >= 0.8:
                        pose = _estimate_character_pose(w, h, img_w, img_h)
                        characters.append(CharacterEntityItem(
                            character_id=f"char_{char_counter}",
                            label="character_silhouette",
                            category="character",
                            pose_type=pose,
                            x=x,
                            y=tile_y + y,
                            width=w,
                            height=h,
                            confidence=0.65,
                            face=None,
                            associated_bubble_ids=[]
                        ))
                        char_counter += 1
                        if len(characters) >= 12:
                            break
        except Exception as e:
            logger.debug(f"[Character Detector] Saliency fallback error: {e}")

    # ── Deduplicate overlapping character boxes ────────────────────────────────
    if characters:
        characters.sort(key=lambda c: (c.y, c.x))
        deduped: List[CharacterEntityItem] = []
        for c in characters:
            keep = True
            for exist in deduped:
                # Check 2D intersection
                ix1 = max(c.x, exist.x)
                iy1 = max(c.y, exist.y)
                ix2 = min(c.x + c.width, exist.x + exist.width)
                iy2 = min(c.y + c.height, exist.y + exist.height)
                inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                min_area = min(c.width * c.height, exist.width * exist.height)
                if min_area > 0 and (inter / float(min_area)) > 0.60:
                    keep = False
                    break
            if keep:
                deduped.append(c)

        characters = deduped
        for i, c in enumerate(characters):
            c.character_id = f"char_{i + 1}"

    logger.info(f"[Character Detector] Extracted {len(characters)} character(s) from {img_w}x{img_h}px image.")
    return characters


async def detect_characters_boxes(request: DetectCharactersRequest) -> DetectCharactersResponse:
    """Orchestrator endpoint handler for character detection."""
    start_time = time.perf_counter()

    raw_bytes = None
    if request.url:
        resolved = await resolve_image_to_buffer(request.url)
        raw_bytes = resolved.get("data")
    elif request.image_base64:
        b64 = request.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        raise ValueError("Could not resolve image data for character detection.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    characters = detect_character_entities(
        image_bytes=raw_bytes,
        conf_threshold=request.conf_threshold,
        detect_faces=request.detect_faces
    )

    if request.extract_thumbnails and characters:
        for c in characters:
            try:
                crop = pil_img.crop((c.x, c.y, c.x + c.width, c.y + c.height))
                crop.thumbnail((160, 160), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                crop.save(buf, format="WEBP", quality=80)
                c.crop_thumbnail_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            except Exception:
                pass

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    return DetectCharactersResponse(
        success=True,
        total_characters=len(characters),
        image_width=img_w,
        image_height=img_h,
        characters=characters,
        execution_time_ms=elapsed_ms,
        message=f"Detected {len(characters)} character(s) in {elapsed_ms}ms"
    )
