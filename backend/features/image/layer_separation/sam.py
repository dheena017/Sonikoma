"""
backend/features/image_editor/services/layer_separation/sam.py
─────────────────────────────────────────────────────────────────────────────
SAM 2 (Segment Anything Model 2) & U-2-Net Vision Segmentation Service:
- Deep learning promptable comic artwork and character layer segmentation
- Bounding-box and point-guided character cutout extraction
- Zero-shot foreground silhouette generation
- Resilient fallback cascade: SAM 2 -> MobileSAM / SAM -> U-2-Net (rembg)
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, List, Optional, Union

import cv2
import numpy as np
from PIL import Image
from ultralytics import SAM

# Configuration flags for engine availability
has_sam: bool = True
has_rembg: bool = True

logger = logging.getLogger("sonikoma.services.image.layer_separation.sam")

# Cached model & session singletons
_sam_model: Optional[SAM] = None
_rembg_session: Any = None
_rembg_remove_fn: Any = None


# ─────────────────────────────────────────────────────────────────────────────
# Internal Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_image_to_rgb(image_input: Union[Image.Image, np.ndarray, str, Path]) -> Optional[np.ndarray]:
    """
    Normalizes any supported image input format (PIL, NumPy, or filepath)
    into a standardized uint8 3-channel RGB NumPy array.
    """
    if isinstance(image_input, Image.Image):
        return np.array(image_input.convert("RGB"))

    if isinstance(image_input, (str, Path)):
        file_path = str(image_input)
        if not os.path.isfile(file_path):
            logger.warning(f"[SAM Engine] Input image file does not exist: {file_path}")
            return None
        bgr = cv2.imread(file_path)
        if bgr is None:
            logger.warning(f"[SAM Engine] Failed to decode image from path: {file_path}")
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    if isinstance(image_input, np.ndarray):
        if image_input.ndim == 2:
            return cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
        if image_input.ndim == 3:
            channels = image_input.shape[2]
            if channels == 4:
                return cv2.cvtColor(image_input, cv2.COLOR_BGRA2RGB)
            if channels == 3:
                return cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)

    return None


def _resolve_model_path(model_name: str) -> str:
    """Resolves local weights path across standard model directories."""
    candidate_paths: List[str] = [
        model_name,
        os.path.join(os.getcwd(), model_name),
    ]

    try:
        from database.config import DATA_DIR, _BACKEND_ROOT
        candidate_paths.extend([
            os.path.join(DATA_DIR, "models", model_name),
            os.path.join(_BACKEND_ROOT, "models", model_name),
            os.path.join(_BACKEND_ROOT, model_name),
        ])
    except Exception:
        pass

    for path in candidate_paths:
        if os.path.isfile(path):
            return path

    return model_name


# ─────────────────────────────────────────────────────────────────────────────
# 1. SAM 2 & SAM Model Management
# ─────────────────────────────────────────────────────────────────────────────

def get_sam_model(model_name: Optional[str] = None) -> Optional[SAM]:
    """
    Lazily initializes and caches the Segment Anything Model (SAM 2 / SAM).

    Supported model checkpoints:
    - 'sam2_b.pt' / 'sam2_t.pt': SAM 2 (Segment Anything Model 2)
    - 'mobile_sam.pt': Ultra-lightweight MobileSAM for CPU environments
    - 'sam_b.pt': Classic SAM base
    """
    global _sam_model
    if _sam_model is not None:
        return _sam_model

    target_model = model_name or os.getenv("SAM_MODEL_NAME", "sam2_t.pt")
    candidate_path = _resolve_model_path(target_model)

    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        device = "cpu"

    try:
        logger.info(f"[SAM Engine] Loading SAM model '{target_model}' on device='{device}'...")
        _sam_model = SAM(candidate_path)
        is_sam2 = getattr(_sam_model, "is_sam2", False)
        logger.info(f"[SAM Engine] Successfully loaded SAM model (is_sam2={is_sam2})")
        return _sam_model
    except Exception as e:
        logger.warning(
            f"[SAM Engine] Failed to load SAM model '{target_model}': {e}. Attempting fallback..."
        )
        if target_model != "mobile_sam.pt":
            try:
                fallback_path = _resolve_model_path("mobile_sam.pt")
                logger.info("[SAM Engine] Attempting MobileSAM fallback...")
                _sam_model = SAM(fallback_path)
                return _sam_model
            except Exception as fallback_err:
                logger.warning(f"[SAM Engine] MobileSAM fallback also unavailable: {fallback_err}")

        return None


# ─────────────────────────────────────────────────────────────────────────────
# 2. SAM 2 Promptable Mask Segmentation
# ─────────────────────────────────────────────────────────────────────────────

def segment_with_sam(
    image_input: Union[Image.Image, np.ndarray, str, Path],
    bboxes: Optional[List[List[int]]] = None,
    points: Optional[List[List[int]]] = None,
    labels: Optional[List[int]] = None,
    conf_threshold: float = 0.25,
) -> Optional[np.ndarray]:
    """
    Executes promptable SAM 2 / SAM segmentation on an input image.

    Args:
        image_input: Source image as PIL Image, NumPy array, or filepath.
        bboxes: Optional bounding boxes [[x1, y1, x2, y2], ...] to segment.
        points: Optional coordinate points [[x, y], ...] for foreground/background guidance.
        labels: Optional label per point (1 = foreground, 0 = background). Defaults to 1.
        conf_threshold: Minimum confidence score threshold.

    Returns:
        A binary uint8 mask (255 for foreground, 0 for background), or None if inference fails.
    """
    model = get_sam_model()
    if model is None:
        return None

    np_rgb = _normalize_image_to_rgb(image_input)
    if np_rgb is None:
        return None

    h, w = np_rgb.shape[:2]
    predict_kwargs: dict[str, Any] = {"verbose": False}

    if bboxes:
        predict_kwargs["bboxes"] = bboxes
    if points:
        predict_kwargs["points"] = points
        if labels and len(labels) == len(points):
            predict_kwargs["labels"] = labels
        else:
            predict_kwargs["labels"] = [1] * len(points)

    try:
        pred_output = model.predict(np_rgb, **predict_kwargs)
        results: List[Any] = list(pred_output) if pred_output is not None else []
        if not results:
            return None

        result: Any = results[0]
        raw_masks = getattr(result, "masks", None)
        if raw_masks is None or len(raw_masks) == 0:
            return None

        combined_mask = np.zeros((h, w), dtype=np.uint8)
        raw_mask_data: Any = raw_masks.data
        if hasattr(raw_mask_data, "cpu"):
            mask_data = raw_mask_data.cpu().numpy()
        else:
            mask_data = np.asarray(raw_mask_data)

        for mask in mask_data:
            # Resize mask to original image dimensions if necessary
            if mask.shape[:2] != (h, w):
                resized = cv2.resize((mask > 0.5).astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
            else:
                resized = (mask > 0.5).astype(np.uint8)
            combined_mask = cv2.bitwise_or(combined_mask, (resized * 255).astype(np.uint8))

        return combined_mask
    except Exception as e:
        logger.warning(f"[SAM Engine] Segmentation inference error: {e}")
        return None


def segment_character_sam(
    pil_img: Image.Image,
    bboxes: Optional[List[List[int]]] = None,
) -> Optional[Image.Image]:
    """
    Applies SAM 2 promptable segmentation to isolate character(s)/subject(s).

    Args:
        pil_img: Source PIL Image.
        bboxes: Optional bounding boxes around target characters.

    Returns:
        Isolated subject as an RGBA PIL Image with transparent background (alpha = 0),
        or None if no mask is detected.
    """
    mask = segment_with_sam(pil_img, bboxes=bboxes)
    if mask is None or np.count_nonzero(mask) == 0:
        return None

    rgb_img = pil_img.convert("RGB")
    rgba_np = np.array(rgb_img)

    # Smooth the alpha boundary slightly to remove edge aliasing
    alpha = cv2.GaussianBlur(mask, (3, 3), 0)

    rgba_out = np.dstack((rgba_np, alpha))
    return Image.fromarray(rgba_out, mode="RGBA")


# ─────────────────────────────────────────────────────────────────────────────
# 3. U-2-Net (rembg) Fallback Engine
# ─────────────────────────────────────────────────────────────────────────────

def _load_rembg():
    """Dynamically imports rembg remove function and session creator."""
    global _rembg_remove_fn
    try:
        from rembg import new_session, remove
        _rembg_remove_fn = remove
        return remove, new_session
    except (ImportError, Exception):
        return None, None


def get_rembg_session():
    """Lazily creates and caches a U-2-Net session for rembg fallback."""
    global _rembg_session, _rembg_remove_fn, has_rembg
    if _rembg_session is not None:
        return _rembg_session

    rembg_remove, new_session = _load_rembg()
    if new_session is None or rembg_remove is None:
        logger.warning(
            "[rembg] rembg/onnxruntime is not installed. Fallback segmentation is unavailable."
        )
        has_rembg = False
        return None

    try:
        import torch
        use_gpu = torch.cuda.is_available()
    except ImportError:
        use_gpu = False

    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
    try:
        _rembg_session = new_session("u2net", providers=providers)
    except Exception as e:
        logger.warning(f"[rembg] Session creation failed: {e}")
        _rembg_session = None

    return _rembg_session


def segment_character_u2net(pil_img: Image.Image) -> Optional[Image.Image]:
    """
    Applies U-2-Net based background removal (rembg) to isolate characters/subjects.

    Args:
        pil_img: Input PIL Image.

    Returns:
        Isolated RGBA PIL Image with background removed, or None if rembg fails.
    """
    session = get_rembg_session()
    if session is None or _rembg_remove_fn is None:
        return None

    try:
        return _rembg_remove_fn(pil_img, session=session)
    except Exception as e:
        logger.warning(f"[rembg] Background removal execution failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 4. Main Public Interface (Single Entry Point for External Callers)
# ─────────────────────────────────────────────────────────────────────────────

def extract_character_layer(
    image_input: Union[Image.Image, np.ndarray, str, Path],
    bboxes: Optional[List[List[int]]] = None,
    points: Optional[List[List[int]]] = None,
    labels: Optional[List[int]] = None,
) -> Optional[Image.Image]:
    """
    Main unified entry point for character & subject layer separation.

    This is the primary function intended for external callers. It accepts
    any image format (PIL Image, NumPy array in BGR/RGB, or filepath), manages
    the model fallback cascade (SAM 2 / SAM -> U-2-Net / rembg), and returns
    an isolated RGBA cutout image ready for layer composition.

    Args:
        image_input: Input panel image (PIL Image, NumPy array, or file path).
        bboxes: Optional bounding boxes [[x1, y1, x2, y2], ...] for targeted extraction.
        points: Optional coordinate points [[x, y], ...] for positive/negative guidance.
        labels: Optional labels for points (1 = foreground, 0 = background).

    Returns:
        Isolated subject as an RGBA PIL Image (transparent background, alpha = 0),
        or None if separation fails.
    """
    if isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB")
    else:
        rgb_np = _normalize_image_to_rgb(image_input)
        if rgb_np is None:
            return None
        pil_img = Image.fromarray(rgb_np)

    # 1. Primary engine: SAM 2 / SAM segmentation
    if has_sam:
        sam_cutout = segment_character_sam(pil_img, bboxes=bboxes)
        if sam_cutout is not None:
            logger.info("[Character Segmentation] Successfully extracted layer using SAM 2 / SAM.")
            return sam_cutout

    # 2. Resilient fallback: U-2-Net (rembg)
    logger.info("[Character Segmentation] Falling back to U-2-Net (rembg)...")
    return segment_character_u2net(pil_img)


def extract_character_mask(
    image_input: Union[Image.Image, np.ndarray, str, Path],
    bboxes: Optional[List[List[int]]] = None,
) -> Optional[np.ndarray]:
    """
    Convenience function that returns the binary uint8 character mask (255 foreground, 0 background).

    Args:
        image_input: Input panel image (PIL Image, NumPy array, or file path).
        bboxes: Optional bounding boxes [[x1, y1, x2, y2], ...] for targeted extraction.

    Returns:
        Binary uint8 mask of the character, or None if extraction fails.
    """
    rgba_image = extract_character_layer(image_input, bboxes=bboxes)
    if rgba_image is None:
        return None
    rgba_np = np.array(rgba_image)
    if rgba_np.ndim == 3 and rgba_np.shape[2] == 4:
        return rgba_np[:, :, 3]
    return None


segment_character_layer = extract_character_layer

__all__ = [
    "extract_character_layer",
    "segment_character_layer",
    "extract_character_mask",
    "has_sam",
    "has_rembg",
    "get_sam_model",
    "segment_with_sam",
    "segment_character_sam",
    "get_rembg_session",
    "segment_character_u2net",
]

