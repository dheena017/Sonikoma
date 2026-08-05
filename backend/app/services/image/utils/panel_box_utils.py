import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Any, Optional
import numpy as np

logger = logging.getLogger("sonikoma.services.image.panel_box_utils")


@dataclass(frozen=True)
class PanelBounds:
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
                f"exceeds image bounds ({img_w}x{img_h}) in coordinate space '{self.coordinate_space}'"
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
    def from_absolute_percent(cls, top: float, bottom: float, left: float, right: float, img_w: int, img_h: int, space: str = "ai_percent") -> "PanelBounds":
        y1 = int(round((top / 100.0) * img_h))
        y2 = int(round((bottom / 100.0) * img_h))
        x1 = int(round((left / 100.0) * img_w))
        x2 = int(round((right / 100.0) * img_w))
        if y2 < y1:
            y1, y2 = y2, y1
        if x2 < x1:
            x1, x2 = x2, x1
        w = max(1, x2 - x1)
        h = max(1, y2 - y1)
        return cls(x=x1, y=y1, width=w, height=h, coordinate_space=space)

    @classmethod
    def from_inset_percent(cls, crop_top: float, crop_bottom: float, crop_left: float, crop_right: float, img_w: int, img_h: int, space: str = "frontend_css") -> "PanelBounds":
        top_px = int(round((crop_top / 100.0) * img_h))
        bot_px = int(round((crop_bottom / 100.0) * img_h))
        left_px = int(round((crop_left / 100.0) * img_w))
        right_px = int(round((crop_right / 100.0) * img_w))
        x1 = max(0, min(img_w - 1, left_px))
        y1 = max(0, min(img_h - 1, top_px))
        x2 = max(x1 + 1, img_w - right_px)
        y2 = max(y1 + 1, img_h - bot_px)
        w = max(1, x2 - x1)
        h = max(1, y2 - y1)
        return cls(x=x1, y=y1, width=w, height=h, coordinate_space=space)

    def to_inset_percentages(self, img_w: int, img_h: int) -> Dict[str, float]:
        safe_h = max(1, img_h)
        safe_w = max(1, img_w)
        crop_top = (self.y / safe_h) * 100.0
        crop_bottom = ((safe_h - self.y2) / safe_h) * 100.0
        crop_left = (self.x / safe_w) * 100.0
        crop_right = ((safe_w - self.x2) / safe_w) * 100.0
        return {
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "coordinate_space": self.coordinate_space,
        }



def adjust_to_aspect_ratio(
    x: int, y: int, w_box: int, h_box: int, w_img: int, h_img: int, aspect_ratio_str: str
) -> Tuple[int, int, int, int]:
    if not aspect_ratio_str or aspect_ratio_str == "free":
        return x, y, w_box, h_box

    try:
        if aspect_ratio_str == "1:1":
            target_ratio = 1.0
        elif aspect_ratio_str == "16:9":
            target_ratio = 16.0 / 9.0
        elif aspect_ratio_str == "9:16":
            target_ratio = 9.0 / 16.0
        elif aspect_ratio_str == "4:3":
            target_ratio = 4.0 / 3.0
        else:
            return x, y, w_box, h_box
    except Exception:
        return x, y, w_box, h_box

    orig_x, orig_y, orig_w, orig_h = x, y, w_box, h_box
    curr_ratio = float(w_box) / float(h_box) if h_box > 0 else 1.0
    
    if curr_ratio < target_ratio:
        new_w = int(h_box * target_ratio)
        delta = new_w - w_box
        new_x = x - delta // 2
        if new_x < 0:
            new_x = 0
        if new_x + new_w > w_img:
            new_w = w_img - new_x
            new_h = int(new_w / target_ratio)
            y = y + (h_box - new_h) // 2
            h_box = new_h
        w_box = new_w
        x = new_x
    elif curr_ratio > target_ratio:
        new_h = int(w_box / target_ratio)
        delta = new_h - h_box
        new_y = y - delta // 2
        if new_y < 0:
            new_y = 0
        if new_y + new_h > h_img:
            new_h = h_img - new_y
            new_w = int(new_h * target_ratio)
            x = x + (w_box - new_w) // 2
            w_box = new_w
        h_box = new_h
        y = new_y
        
    logger.debug(f"[AutoCrop Aspect] Adjusted to '{aspect_ratio_str}': ({orig_x},{orig_y},{orig_w}x{orig_h}) -> ({x},{y},{w_box}x{h_box})")
    return x, y, w_box, h_box


@dataclass
class MergeFeatures:
    y_distance: float
    width_similarity: float
    background_similarity: float
    separator_present: bool = False
    ocr_boundary_conflict: bool = False
    max_height_exceeded: bool = False


@dataclass
class MergeWeights:
    distance: float = 0.40
    width: float = 0.30
    background: float = 0.30
    threshold: float = 0.65


def eval_merge_candidate_pair(
    box_a: Dict[str, Any],
    box_b: Dict[str, Any],
    features: MergeFeatures,
    weights: Optional[MergeWeights] = None
) -> Tuple[bool, str, float]:
    """
    Evaluates whether two candidate boxes should be merged using a two-stage decision process:
      Stage 1: Hard Blockers (ANY failure = IMMEDIATE REJECT)
      Stage 2: Weighted Soft Feature Vector Voting (if Hard Blockers PASS)
    """
    if weights is None:
        weights = MergeWeights()

    # Stage 1: Hard Blockers (Zero Separator, Zero OCR Conflict, Height Safety)
    if features.separator_present:
        return False, "hard_blocker_separator_detected", 0.0
    if features.ocr_boundary_conflict:
        return False, "hard_blocker_ocr_boundary_conflict", 0.0
    if features.max_height_exceeded:
        return False, "hard_blocker_max_height_exceeded", 0.0

    # Stage 2: Soft Weighted Scoring
    dist_score = max(0.0, 1.0 - min(1.0, features.y_distance / 100.0))
    score = (
        weights.distance * dist_score +
        weights.width * features.width_similarity +
        weights.background * features.background_similarity
    )

    should_merge = score >= weights.threshold
    reason = f"soft_vote_passed_{score:.2f}" if should_merge else f"soft_vote_failed_{score:.2f}"
    return should_merge, reason, score


def _has_vertical_separator_between(
    lower_top_box_y2: int,
    upper_bottom_box_y1: int,
    separator_bands: Optional[List[int]],
    gutter_ranges: Optional[List[Tuple[int, int]]]
) -> bool:
    y_min = lower_top_box_y2 - 15
    y_max = upper_bottom_box_y1 + 15

    if separator_bands:
        for sep_y in separator_bands:
            if y_min <= sep_y <= y_max:
                return True

    if gutter_ranges:
        for gutter_start, gutter_end in gutter_ranges:
            if max(y_min, gutter_start) < min(y_max, gutter_end):
                return True

    return False


def _max_merge_height(h_img: int) -> int:
    if h_img <= 0:
        return 0
    return min(int(h_img * 0.35), 20000)


def _is_detected_bubble_pair(
    box_a: Dict[str, Any],
    box_b: Dict[str, Any],
    h_a: int,
    h_b: int,
    w_a: int,
    w_b: int,
    x1_a: int,
    x1_b: int,
    h_overlap_ratio: float,
    y_dist: int,
    sep_between: bool,
) -> bool:
    if sep_between or y_dist > 30:
        return False

    has_bubble_marker = bool(
        box_a.get("bubble_candidate") or
        box_b.get("bubble_candidate") or
        box_a.get("is_speech_bubble") or
        box_b.get("is_speech_bubble") or
        box_a.get("ocr_bubble") or
        box_b.get("ocr_bubble")
    )
    if not has_bubble_marker:
        return False

    if min(h_a, h_b) >= 300:
        return False

    center_a = x1_a + (w_a / 2.0)
    center_b = x1_b + (w_b / 2.0)
    center_tolerance = max(30.0, min(w_a, w_b) * 0.12)
    if abs(center_a - center_b) > center_tolerance:
        return False

    width_similarity = min(w_a, w_b) / float(max(1, max(w_a, w_b)))
    return h_overlap_ratio >= 0.60 and width_similarity >= 0.35


def merge_overlapping_boxes(
    boxes: List[Dict[str, Any]],
    w_img: int,
    h_img: int,
    merge_threshold: int,
    separator_bands: Optional[List[int]] = None,
    gutter_ranges: Optional[List[Tuple[int, int]]] = None
) -> List[Dict[str, Any]]:
    if not boxes:
        return boxes
    
    # Initialize candidate IDs and lineage for tracking
    for idx, box in enumerate(boxes):
        if "candidate_id" not in box:
            box["candidate_id"] = idx + 1
        if "lineage" not in box:
            box["lineage"] = [box["candidate_id"]]

    initial_count = len(boxes)
    boxes = sorted(boxes, key=lambda b: (b.get("y", 0), b.get("x", 0)))
    
    # Merge Statistics Counters
    total_pairs_eval = 0
    successful_merges = 0
    rejected_merges = 0
    rejected_sep = 0
    rejected_height = 0
    rejected_ocr = 0
    soft_scores = []

    merged = True
    while merged:
        merged = False
        new_boxes = []
        skip_indices = set()
        
        for i in range(len(boxes)):
            if i in skip_indices:
                continue
                
            box_a = boxes[i]
            x1_a, y1_a, x2_a, y2_a = box_a["x"], box_a["y"], box_a["x"] + box_a["w"], box_a["y"] + box_a["h"]
            lineage_a = box_a.get("lineage", [box_a.get("candidate_id", i + 1)])
            
            for j in range(i + 1, len(boxes)):
                if j in skip_indices:
                    continue
                    
                box_b = boxes[j]
                x1_b, y1_b, x2_b, y2_b = box_b["x"], box_b["y"], box_b["x"] + box_b["w"], box_b["y"] + box_b["h"]
                lineage_b = box_b.get("lineage", [box_b.get("candidate_id", j + 1)])
                
                w_a, h_a = x2_a - x1_a, y2_a - y1_a
                w_b, h_b = x2_b - x1_b, y2_b - y1_b
                
                w_min = min(w_a, w_b)
                h_min = min(h_a, h_b)
                area_a = w_a * h_a
                area_b = w_b * h_b
                min_area = min(area_a, area_b)
                
                x_overlap_val = max(0, min(x2_a, x2_b) - max(x1_a, x1_b))
                y_overlap_val = max(0, min(y2_a, y2_b) - max(y1_a, y1_b))
                inter_area = x_overlap_val * y_overlap_val
                
                union_area = area_a + area_b - inter_area
                iou = inter_area / union_area if union_area > 0 else 0.0
                overlap_min_ratio = inter_area / min_area if min_area > 0 else 0.0

                x_overlap_ratio = x_overlap_val / w_min if w_min > 0 else 0.0
                y_dist = max(0, y1_b - y2_a) if y1_b >= y2_a else max(0, y1_a - y2_b)
                
                y_overlap_ratio = y_overlap_val / float(h_min) if h_min > 0 else 0.0

                min_y_between = min(y2_a, y2_b)
                max_y_between = max(y1_a, y1_b)
                sep_between = _has_vertical_separator_between(
                    min_y_between, max_y_between, separator_bands, gutter_ranges
                )

                combined_h = max(y2_a, y2_b) - min(y1_a, y1_b)
                max_h_limit = _max_merge_height(h_img)
                max_height_exceeded = h_img > 3000 and max_h_limit > 0 and combined_h > max_h_limit

                is_bubble_pair = _is_detected_bubble_pair(
                    box_a, box_b, h_a, h_b, w_a, w_b, x1_a, x1_b,
                    x_overlap_ratio, y_dist, sep_between
                )
                
                features = MergeFeatures(
                    y_distance=float(y_dist),
                    width_similarity=round(min(w_a, w_b) / max(1, max(w_a, w_b)), 4),
                    background_similarity=1.0,
                    separator_present=sep_between,
                    ocr_boundary_conflict=False,
                    max_height_exceeded=max_height_exceeded
                )

                # ── Phase 2.3: Mandatory Stage 1 Hard Blockers ─────────────────────────
                should_merge = False
                if sep_between:
                    should_merge = False
                    reason_str = "hard_blocker_separator_detected"
                elif max_height_exceeded:
                    should_merge = False
                    reason_str = "hard_blocker_max_height_exceeded"
                elif features.ocr_boundary_conflict:
                    should_merge = False
                    reason_str = "hard_blocker_ocr_boundary_conflict"
                # ── Stage 2: Soft Feature Vector & IoU Voting (Passed Hard Blockers) ──
                elif iou >= 0.65 or overlap_min_ratio >= 0.80:
                    should_merge = True
                    reason_str = "high_iou_or_overlap"
                elif y_overlap_ratio >= 0.50 and x_overlap_ratio >= 0.50:
                    should_merge = True
                    reason_str = "high_y_h_overlap"
                elif is_bubble_pair and x_overlap_ratio >= 0.35 and y_dist <= 30:
                    should_merge = True
                    reason_str = "bubble_pair_y_dist"
                elif merge_threshold > 0 and x_overlap_ratio > 0 and y_dist <= merge_threshold:
                    ev_merge, ev_reason, ev_score = eval_merge_candidate_pair(box_a, box_b, features)
                    should_merge = ev_merge
                    reason_str = ev_reason
                    soft_scores.append(ev_score)
                else:
                    reason_str = "no_merge_condition_met"

                total_pairs_eval += 1

                if should_merge:
                    successful_merges += 1
                    x1_a = min(x1_a, x1_b)
                    y1_a = min(y1_a, y1_b)
                    x2_a = max(x2_a, x2_b)
                    y2_a = max(y2_a, y2_b)
                    lineage_a = lineage_a + lineage_b

                    box_a["x"] = x1_a
                    box_a["y"] = y1_a
                    box_a["w"] = x2_a - x1_a
                    box_a["h"] = y2_a - y1_a
                    box_a["lineage"] = lineage_a
                    box_a["merge_reason"] = reason_str
                    skip_indices.add(j)
                    merged = True

            new_boxes.append(box_a)

        boxes = new_boxes
            
    avg_soft_score = float(np.mean(soft_scores)) if soft_scores else 0.0
    logger.info(
        f"[Merge Engine Summary] Raw Candidates: {initial_count} -> Final Panels: {len(boxes)} | "
        f"Pairs Evaluated: {total_pairs_eval} (Merges: {successful_merges}, Rejections: {rejected_merges}) | "
        f"Avg Soft Score: {avg_soft_score:.2f} | Rejections Breakdown -> Separators: {rejected_sep}, Height Limit: {rejected_height}, OCR: {rejected_ocr}"
    )
    return boxes


def protect_slice_y(y: int, ocr_boxes: List[Dict[str, Any]], h_img: int) -> int:
    for box in ocr_boxes:
        by1 = box["y"]
        by2 = box["y"] + box["h"]
        if by1 < y < by2:
            if abs(y - by1) < abs(y - by2):
                y = max(0, by1)
            else:
                y = min(h_img, by2)
    return y


def protect_slice_x(x: int, ocr_boxes: List[Dict[str, Any]], w_img: int) -> int:
    for box in ocr_boxes:
        bx1 = box["x"]
        bx2 = box["x"] + box["w"]
        if bx1 < x < bx2:
            if abs(x - bx1) < abs(x - bx2):
                x = max(0, bx1)
            else:
                x = min(w_img, bx2)
    return x
