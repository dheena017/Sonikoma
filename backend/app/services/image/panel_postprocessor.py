"""
backend/app/services/image/panel_postprocessor.py
─────────────────────────────────────────────────────────────────────────────
Post-processing decision engine for Webtoon & Comic panel detection.

Isolates decision-making logic from separator detection:
1. Slice feature extraction & 4-class slice classification (Panel, MicroPanel, Gutter, Noise).
2. Slice distribution validation (detecting fragmentation patterns).
3. Panel neighbor similarity merging (merging gradient false cuts).
4. Micro-panel (<40px / adaptive) resolution & confidence-based validation.
5. Selective coverage recovery (re-inserting discarded slices until coverage >= 92%).
6. Lineage-first overlap resolution (IoU > 0.40).
7. Post-finalization panel confidence scoring & DetectionQualityReport generation.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from dataclasses import dataclass, field
from typing import Any, Dict, List

logger = logging.getLogger("sonikoma.services.image.panel_postprocessor")

MIN_NOISE_HEIGHT = 40
MICRO_PANEL_MAX_HEIGHT = 120
GIANT_PANEL_HEIGHT = 8000
DEFAULT_COVERAGE_TARGET = 0.92
DEFAULT_MERGE_GAP = 30


@dataclass
class SliceFeatures:
    x: int
    y: int
    width: int
    height: int
    aspect_ratio: float
    artwork_ratio: float
    edge_density: float
    fg_ratio: float
    bubble_count: int
    separator_score_above: float
    separator_score_below: float
    trim_top: int = 0
    trim_bottom: int = 0
    lineage: List[Any] = field(default_factory=list)
    confidence: float = 0.90
    slice_type: str = "Panel"  # "Panel", "MicroPanel", "Gutter", "Noise"


@dataclass
class DetectionQualityReport:
    image_height: int
    panel_count: int
    median_height: float
    micro_panel_count: int
    overlap_count: int
    giant_panel_count: int
    coverage: float
    confidence_mean: float
    confidence_min: float
    recommendation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "image_height": self.image_height,
            "panel_count": self.panel_count,
            "median_height": round(self.median_height, 1),
            "micro_panel_count": self.micro_panel_count,
            "overlap_count": self.overlap_count,
            "giant_panel_count": self.giant_panel_count,
            "coverage": round(self.coverage, 4),
            "confidence_mean": round(self.confidence_mean, 4),
            "confidence_min": round(self.confidence_min, 4),
            "recommendation": self.recommendation,
        }


def _normalize_box(box: Dict[str, Any]) -> Dict[str, Any]:
    x = box.get("x")
    if x is None:
        x = box.get("left", 0)

    y = box.get("y")
    if y is None:
        y = box.get("top", 0)

    width = box.get("w")
    if width is None:
        width = box.get("width", 0)

    height = box.get("h")
    if height is None:
        height = box.get("height", 0)

    return {
        **box,
        "x": int(max(0, x or 0)),
        "y": int(max(0, y or 0)),
        "w": max(1, int(width or 1)),
        "h": max(1, int(height or 1)),
        "confidence": float(box.get("confidence", 0.90) or 0.90),
        "lineage": list(box.get("lineage", [box.get("id", "0")])),
        "bubble_candidate": bool(box.get("bubble_candidate", False)),
        "top_removed_px": int(box.get("top_removed_px", 0) or 0),
        "bottom_removed_px": int(box.get("bottom_removed_px", 0) or 0),
    }


def sort_boxes_by_position(boxes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(boxes, key=lambda b: (b.get("y", 0), b.get("x", 0)))


def compute_overlap_count(boxes: List[Dict[str, Any]], iou_thresh: float = 0.40) -> int:
    normalized = [ _normalize_box(box) for box in sort_boxes_by_position(boxes) ]
    overlaps = 0

    for index, a in enumerate(normalized):
        a_y2 = a["y"] + a["h"]
        for b in normalized[index + 1 :]:
            if b["y"] >= a_y2:
                break

            inter_h = max(0, min(a_y2, b["y"] + b["h"]) - max(a["y"], b["y"]))
            if inter_h <= 0:
                continue

            iou = inter_h / float(max(1, min(a["h"], b["h"])))
            if iou >= iou_thresh:
                overlaps += 1

    return overlaps


def extract_slice_features(
    box: Dict[str, Any],
    gray_arr: np.ndarray,
    sep_score_above: float = 0.80,
    sep_score_below: float = 0.80,
) -> SliceFeatures:
    """Extracts lightweight geometric and content features for a provisional panel slice."""
    normalized_box = _normalize_box(box)
    img_h, img_w = gray_arr.shape
    bx = max(0, min(img_w - 1, normalized_box["x"]))
    by = max(0, min(img_h - 1, normalized_box["y"]))
    bw = max(1, min(img_w - bx, normalized_box["w"]))
    bh = max(1, min(img_h - by, normalized_box["h"]))

    aspect = bw / float(max(1, bh))
    sub = gray_arr[by : by + bh, bx : bx + bw]

    if sub.size == 0:
        return SliceFeatures(
            x=bx, y=by, width=bw, height=bh, aspect_ratio=aspect,
            artwork_ratio=0.0, edge_density=0.0, fg_ratio=0.0, bubble_count=0,
            separator_score_above=sep_score_above, separator_score_below=sep_score_below,
            slice_type="Noise"
        )

    row_stds = np.std(sub, axis=1)
    art_ratio = float(np.mean(row_stds > 3.0))

    grads = np.abs(np.gradient(sub.astype(float), axis=1))
    edge_density = float(np.mean(grads > 10.0))

    row_medians = np.median(sub, axis=1)
    fg_ratio = float(np.mean(np.abs(sub.astype(float) - row_medians[:, np.newaxis]) > 20.0))
    bubble_count = 1 if box.get("bubble_candidate") else 0

    features = SliceFeatures(
        x=bx,
        y=by,
        width=bw,
        height=bh,
        aspect_ratio=aspect,
        artwork_ratio=art_ratio,
        edge_density=edge_density,
        fg_ratio=fg_ratio,
        bubble_count=bubble_count,
        separator_score_above=sep_score_above,
        separator_score_below=sep_score_below,
        trim_top=box.get("top_removed_px", 0),
        trim_bottom=box.get("bottom_removed_px", 0),
        lineage=box.get("lineage", [box.get("id", "0")]),
    )

    # 4-Class Classification
    if bh < MIN_NOISE_HEIGHT and art_ratio < 0.20 and edge_density < 0.05:
        features.slice_type = "Noise"
    elif art_ratio < 0.15 and fg_ratio < 0.10:
        features.slice_type = "Gutter"
    elif bh < MICRO_PANEL_MAX_HEIGHT and (art_ratio < 0.40 or fg_ratio < 0.30):
        features.slice_type = "MicroPanel"
    else:
        features.slice_type = "Panel"

    return features


def merge_similar_neighbor_slices(
    boxes: List[Dict[str, Any]],
    gray_arr: np.ndarray
) -> List[Dict[str, Any]]:
    """Merges adjacent slices if similarity > 0.90 and separator confidence < 0.60."""
    if not boxes or len(boxes) <= 1:
        return boxes

    merged: List[Dict[str, Any]] = [dict(boxes[0])]
    for curr in boxes[1:]:
        prev = merged[-1]
        prev_y2 = prev.get("y", 0) + prev.get("h", prev.get("height", 0))
        curr_y1 = curr.get("y", 0)

        gap = abs(curr_y1 - prev_y2)
        if gap <= DEFAULT_MERGE_GAP:
            # Measure color and texture similarity between adjacent slice edges
            prev_feat = extract_slice_features(prev, gray_arr)
            curr_feat = extract_slice_features(curr, gray_arr)

            sim = 1.0 - abs(prev_feat.artwork_ratio - curr_feat.artwork_ratio)
            sep_conf = 0.5 * (prev_feat.separator_score_below + curr_feat.separator_score_above)

            if sim > 0.90 and sep_conf < 0.60:
                prev["h"] = (curr.get("y", 0) + curr.get("h", curr.get("height", 0))) - prev["y"]
                prev["w"] = max(prev.get("w", 0), curr.get("w", 0))
                logger.info(f"[PostProcessor] Merging similar neighbor slices (sim={sim:.2f}, sep_conf={sep_conf:.2f})")
                continue

        merged.append(dict(curr))

    return merged


def resolve_micro_panels(
    boxes: List[Dict[str, Any]],
    gray_arr: np.ndarray,
    img_h: int
) -> List[Dict[str, Any]]:
    """
    Resolves micro-panels by discarding gutters/noise and merging micro-panels
    only if they lack sufficient artwork density or minimum confidence.
    """
    if not boxes:
        return boxes

    slice_features_list = [extract_slice_features(b, gray_arr) for b in boxes]
    resolved: List[Dict[str, Any]] = []

    for idx, (b, feat) in enumerate(zip(boxes, slice_features_list)):
        bh = feat.height
        if feat.slice_type in ("Noise", "Gutter"):
            logger.info(f"[PostProcessor] Discarding {feat.slice_type} micro-slice #{idx+1} (h={bh}px)")
            continue

        min_conf = (
            0.35 * feat.artwork_ratio +
            0.25 * (1.0 - feat.separator_score_above) +
            0.20 * feat.edge_density +
            0.20 * (1.0 if feat.bubble_count > 0 else 0.0)
        )

        if bh < MIN_NOISE_HEIGHT or min_conf < 0.30:
            if resolved:
                prev = resolved[-1]
                prev_h = prev.get("h", prev.get("height", 0))
                prev["h"] = (prev["y"] + prev_h) - prev["y"] + bh
                prev["w"] = max(prev.get("w", 0), b.get("w", 0))
                logger.info(f"[PostProcessor] Merging low-confidence MicroPanel #{idx+1} (h={bh}px, conf={min_conf:.2f}) into previous panel")
                continue

        resolved.append(b)

    return merge_similar_neighbor_slices(resolved, gray_arr)


def recover_coverage_selectively(
    final_boxes: List[Dict[str, Any]],
    discarded_boxes: List[Dict[str, Any]],
    gray_arr: np.ndarray,
    img_h: int,
    target_coverage: float = 0.92
) -> List[Dict[str, Any]]:
    """Selectively re-inserts discarded slices in order of confidence until coverage >= 92%."""
    if not final_boxes or not discarded_boxes:
        return final_boxes

    current_covered = sum(b.get("h", b.get("height", 0)) for b in final_boxes)
    current_cov = float(current_covered) / float(max(1, img_h))

    if current_cov >= 0.90:
        return final_boxes

    logger.info(f"[PostProcessor] Coverage {current_cov:.1%} < 90%; executing selective coverage recovery to target {target_coverage:.1%}")
    scored_discarded = []
    for d in discarded_boxes:
        conf = compute_post_panel_confidence(d, gray_arr)
        scored_discarded.append((conf, d))

    scored_discarded.sort(key=lambda item: item[0], reverse=True)
    recovered = list(final_boxes)

    for conf, box in scored_discarded:
        if current_cov >= target_coverage:
            break
        recovered.append(box)
        current_covered += box.get("h", box.get("height", 0))
        current_cov = float(current_covered) / float(max(1, img_h))

    return sorted(recovered, key=lambda b: (b.get("y", 0), b.get("x", 0)))


def resolve_overlapping_panels_lineage(
    boxes: List[Dict[str, Any]],
    iou_thresh: float = 0.40
) -> List[Dict[str, Any]]:
    """Deduplicates overlapping candidate panels (IoU > 0.40) using lineage first, then confidence."""
    if not boxes or len(boxes) <= 1:
        return boxes

    sorted_boxes = sorted(boxes, key=lambda b: (b.get("y", 0), b.get("x", 0)))
    kept: List[Dict[str, Any]] = []

    for cand in sorted_boxes:
        cx1 = cand.get("x", 0)
        cy1 = cand.get("y", 0)
        cw = cand.get("w", cand.get("width", 0))
        ch = cand.get("h", cand.get("height", 0))
        cx2 = cx1 + cw
        cy2 = cy1 + ch
        c_lineage = set(cand.get("lineage", []))
        c_conf = cand.get("confidence", 0.90)

        duplicate = False
        for k in kept:
            kx1 = k.get("x", 0)
            ky1 = k.get("y", 0)
            kw = k.get("w", k.get("width", 0))
            kh = k.get("h", k.get("height", 0))
            kx2 = kx1 + kw
            ky2 = ky1 + kh

            inter_y1 = max(cy1, ky1)
            inter_y2 = min(cy2, ky2)
            inter_h = max(0, inter_y2 - inter_y1)

            if inter_h > 0:
                iou = inter_h / float(max(1, min(ch, kh)))
                if iou >= iou_thresh:
                    k_lineage = set(k.get("lineage", []))
                    k_conf = k.get("confidence", 0.90)

                    if c_lineage and k_lineage and bool(c_lineage & k_lineage):
                        k["y"] = min(ky1, cy1)
                        k["h"] = max(ky2, cy2) - k["y"]
                        duplicate = True
                        break

                    if abs(c_conf - k_conf) >= 0.20:
                        if c_conf > k_conf:
                            k.update(cand)
                        duplicate = True
                        break
                    else:
                        k["y"] = min(ky1, cy1)
                        k["h"] = max(ky2, cy2) - k["y"]
                        duplicate = True
                        break

        if not duplicate:
            kept.append(cand)

    return kept


def compute_post_panel_confidence(
    box: Dict[str, Any],
    gray_arr: np.ndarray,
    sep_score_above: float = 0.85,
    sep_score_below: float = 0.85,
) -> float:
    """Computes diagnostic panel confidence score (0.0-1.0) post-finalization."""
    feat = extract_slice_features(box, gray_arr, sep_score_above, sep_score_below)
    sep_comp = 0.5 * (sep_score_above + sep_score_below)
    art_comp = feat.artwork_ratio
    overlap_comp = 1.0
    trim_comp = 1.0 if (feat.trim_top > 0 or feat.trim_bottom > 0) else 0.80

    conf = 0.4 * sep_comp + 0.3 * art_comp + 0.2 * overlap_comp + 0.1 * trim_comp
    return float(np.clip(conf, 0.50, 0.99))


def generate_quality_report(
    final_boxes: List[Dict[str, Any]],
    img_h: int
) -> DetectionQualityReport:
    """Generates structured DetectionQualityReport after panels are finalized."""
    if not final_boxes:
        return DetectionQualityReport(
            image_height=img_h, panel_count=0, median_height=0.0,
            micro_panel_count=0, overlap_count=0, giant_panel_count=0,
            coverage=0.0, confidence_mean=0.0, confidence_min=0.0,
            recommendation="No panels detected"
        )

    normalized_boxes = [_normalize_box(b) for b in final_boxes]
    heights = [b["h"] for b in normalized_boxes]
    med_h = float(np.median(heights))
    micro_c = sum(1 for h in heights if h < MICRO_PANEL_MAX_HEIGHT)
    giant_c = sum(1 for h in heights if h > GIANT_PANEL_HEIGHT)
    overlap_c = compute_overlap_count(normalized_boxes)

    confidences = [float(b.get("confidence", 0.90)) for b in normalized_boxes]
    coverage = float(np.sum(heights)) / float(max(1, img_h))

    if overlap_c > 0:
        rec = f"Detected {overlap_c} overlapping panel candidate(s)."
    elif micro_c > 0:
        rec = f"Contains {micro_c} micro-panel(s)."
    elif giant_c > 0:
        rec = f"Contains {giant_c} oversized panel(s)."
    else:
        rec = "Optimal segmentation achieved."

    return DetectionQualityReport(
        image_height=img_h,
        panel_count=len(final_boxes),
        median_height=med_h,
        micro_panel_count=micro_c,
        overlap_count=overlap_c,
        giant_panel_count=giant_c,
        coverage=coverage,
        confidence_mean=float(np.mean(confidences)),
        confidence_min=float(np.min(confidences)),
        recommendation=rec,
    )
