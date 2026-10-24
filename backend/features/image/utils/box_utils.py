"""
backend/features/image/utils/box_utils.py
─────────────────────────────────────────────────────────────────────────────
Coordinate Math & Bounding Box Utilities:
- PanelBounds frozen dataclass with pixel and percent transformations
- Aspect ratio calculations (9:16, 1:1, 16:9, etc.)
- Bounding box boundary clamping and intersection-over-union (IOU) math
─────────────────────────────────────────────────────────────────────────────
"""

import math
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional


# ─────────────────────────────────────────────────────────────────────────────
# 1. PanelBounds Dataclass
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class PanelBounds:
    """Immutable representation of an axis-aligned bounding box."""
    x: int
    y: int
    width: int
    height: int
    coordinate_space: str = "merged_canvas"

    @property
    def x2(self) -> int:
        return self.x + self.width

    @property
    def y2(self) -> int:
        return self.y + self.height

    @property
    def area(self) -> int:
        return self.width * self.height

    def is_valid(self, img_w: int, img_h: int) -> bool:
        return (
            self.x >= 0 and self.y >= 0 and
            self.width > 0 and self.height > 0 and
            self.x2 <= img_w and self.y2 <= img_h
        )

    def assert_valid(self, img_w: int, img_h: int, label: str = "") -> None:
        if not self.is_valid(img_w, img_h):
            raise ValueError(
                f"[PanelBounds Invalid] {label}: requested (x={self.x}, y={self.y}, w={self.width}, h={self.height}) "
                f"exceeds image bounds ({img_w}x{img_h}) in space '{self.coordinate_space}'"
            )

    def clamp(self, img_w: int, img_h: int) -> "PanelBounds":
        safe_w = max(1, img_w)
        safe_h = max(1, img_h)
        cx = max(0, min(self.x, safe_w - 1))
        cy = max(0, min(self.y, safe_h - 1))
        cw = max(1, min(self.width, safe_w - cx))
        ch = max(1, min(self.height, safe_h - cy))
        return PanelBounds(x=cx, y=cy, width=cw, height=ch, coordinate_space=self.coordinate_space)

    @classmethod
    def from_pixels(cls, x: int, y: int, width: int, height: int, space: str = "merged_canvas") -> "PanelBounds":
        return cls(x=int(x), y=int(y), width=int(width), height=int(height), coordinate_space=space)

    @classmethod
    def from_absolute_percent(
        cls, top: float, bottom: float, left: float, right: float, img_w: int, img_h: int, space: str = "ai_percent"
    ) -> "PanelBounds":
        y1 = round((top / 100.0) * img_h)
        y2 = round((bottom / 100.0) * img_h)
        x1 = round((left / 100.0) * img_w)
        x2 = round((right / 100.0) * img_w)
        if y2 < y1:
            y1, y2 = y2, y1
        if x2 < x1:
            x1, x2 = x2, x1
        w = max(1, x2 - x1)
        h = max(1, y2 - y1)
        return cls(x=x1, y=y1, width=w, height=h, coordinate_space=space)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "x2": self.x2,
            "y2": self.y2,
            "coordinate_space": self.coordinate_space,
        }

    def to_tuple(self) -> Tuple[int, int, int, int]:
        return self.x, self.y, self.width, self.height


# ─────────────────────────────────────────────────────────────────────────────
# 2. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _parse_aspect_ratio_string(ratio_str: str) -> Optional[float]:
    """Parses ratio strings like '16:9', '9:16', '1:1', '4:5' into a float."""
    if not ratio_str or ratio_str.lower() in ("free", "auto", "original"):
        return None
    try:
        if ":" in ratio_str:
            num, den = ratio_str.split(":", 1)
            return float(num.strip()) / float(den.strip())
        elif "/" in ratio_str:
            num, den = ratio_str.split("/", 1)
            return float(num.strip()) / float(den.strip())
        return float(ratio_str)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 3. Canonical Public API Functions (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def adjust_to_aspect_ratio(w: int, h: int, target_aspect: str) -> Tuple[int, int]:
    """
    Calculates adjusted dimensions (new_w, new_h) matching target aspect ratio.

    Args:
        w: Original width in pixels.
        h: Original height in pixels.
        target_aspect: Aspect ratio string (e.g. '9:16', '16:9', '1:1', '4:5').

    Returns:
        Tuple of (target_width, target_height).
    """
    ratio = _parse_aspect_ratio_string(target_aspect)
    if not ratio or ratio <= 0:
        return w, h

    current_ratio = w / float(max(1, h))
    if math.isclose(current_ratio, ratio, rel_tol=0.01):
        return w, h

    if current_ratio > ratio:
        # Too wide -> narrow the width
        new_w = max(1, round(h * ratio))
        return new_w, h
    else:
        # Too tall -> shorten the height
        new_h = max(1, round(w / ratio))
        return w, new_h


def clamp_box(x: int, y: int, w: int, h: int, max_w: int, max_h: int) -> Tuple[int, int, int, int]:
    """Clamps bounding box coordinates strictly within image bounds [0, max_w] and [0, max_h]."""
    safe_max_w = max(1, max_w)
    safe_max_h = max(1, max_h)
    cx = max(0, min(x, safe_max_w - 1))
    cy = max(0, min(y, safe_max_h - 1))
    cw = max(1, min(w, safe_max_w - cx))
    ch = max(1, min(h, safe_max_h - cy))
    return cx, cy, cw, ch


def calculate_iou(box_a: Tuple[int, int, int, int], box_b: Tuple[int, int, int, int]) -> float:
    """Calculates Intersection-over-Union (IOU) between two bounding boxes (x, y, w, h)."""
    ax, ay, aw, ah = box_a
    bx, by, bw, bh = box_b

    x_left = max(ax, bx)
    y_top = max(ay, by)
    x_right = min(ax + aw, bx + bw)
    y_bottom = min(ay + ah, by + bh)

    if x_right < x_left or y_bottom < y_top:
        return 0.0

    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    box_a_area = aw * ah
    box_b_area = bw * bh
    union_area = float(box_a_area + box_b_area - intersection_area)

    if union_area <= 0:
        return 0.0

    return intersection_area / union_area


__all__ = [
    "PanelBounds",
    "adjust_to_aspect_ratio",
    "clamp_box",
    "calculate_iou",
]
