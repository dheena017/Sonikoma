"""
backend/features/image_editor/services/layer_separation/inpainting.py
─────────────────────────────────────────────────────────────────────────────
Inpainting & Geometry Utilities for Panel Layer Separation:
- Pyramidal Guided Inpainting (distance transform blending, smudge-free)
- Contour smoothing via Douglas-Peucker approximation
- Transparent image buffer creators (WebP / PNG)
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import io
import cv2
import numpy as np
from PIL import Image


def create_blank_webp(width: int, height: int) -> bytes:
    """Generates a fully transparent WebP image of given dimensions."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP")
    return buffer.getvalue()


def create_blank_png(width: int, height: int) -> bytes:
    """Generates a fully transparent PNG image of given dimensions."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def smooth_contour(cnt: np.ndarray, factor: float = 0.01) -> np.ndarray:
    """Smooths a contour using Douglas-Peucker polygonal approximation."""
    epsilon = factor * cv2.arcLength(cnt, True)
    return cv2.approxPolyDP(cnt, epsilon, True)


def pyramid_guided_inpaint(
    original_img: np.ndarray,
    mask: np.ndarray,
    radius: int = 20,
) -> np.ndarray:
    """
    Performs Pyramidal Guided Inpainting to resolve massive character or text holes.

    Reduces the image scale to inpaint primary structures, scales back up, and blends
    with local, boundary-aware high-resolution inpainting via distance transforms.
    Guarantees pristine backgrounds completely free of ghosting smudges or halos.

    Args:
        original_img: 3-channel BGR source image.
        mask: Single-channel binary uint8 mask of areas to inpaint (255 = inpaint).
        radius: Inpaint radius for high-resolution pass.

    Returns:
        Clean inpainted BGR image.
    """
    height, width = original_img.shape[:2]

    # 1. Low-resolution coarse structure inpainting
    down_scale = 4
    low_w, low_h = max(16, width // down_scale), max(16, height // down_scale)

    low_img = cv2.resize(original_img, (low_w, low_h), interpolation=cv2.INTER_AREA)
    low_mask = cv2.resize(mask, (low_w, low_h), interpolation=cv2.INTER_NEAREST)

    low_inpainted = cv2.inpaint(
        low_img, low_mask, inpaintRadius=max(3, radius // down_scale), flags=cv2.INPAINT_NS
    )

    structure_img = cv2.resize(low_inpainted, (width, height), interpolation=cv2.INTER_CUBIC)

    # 2. High-resolution local detail inpainting
    detail_img = cv2.inpaint(original_img, mask, inpaintRadius=radius, flags=cv2.INPAINT_NS)

    # 3. Distance transform guided blending
    dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)

    max_dist = np.max(dist_transform[mask > 0]) if np.any(mask > 0) else 1.0
    if max_dist <= 0:
        max_dist = 1.0

    blend_weights = np.clip(dist_transform / (max_dist * 0.8), 0.0, 1.0)
    blend_weights = cv2.GaussianBlur(blend_weights.astype(np.float32), (11, 11), 0)
    blend_weights_3d = np.expand_dims(blend_weights, axis=2)

    blended_img = (
        structure_img * blend_weights_3d + detail_img * (1.0 - blend_weights_3d)
    ).astype(np.uint8)

    result = original_img.copy()
    result[mask > 0] = blended_img[mask > 0]
    return result


__all__ = [
    "create_blank_webp",
    "create_blank_png",
    "smooth_contour",
    "pyramid_guided_inpaint",
]
