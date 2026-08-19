import os
import sys
import json
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from services.image.panel_detection.panel_detector import run_cv_detection
try:
    from tests.datasets.webtoon.generate_benchmark_dataset import generate_webtoon_benchmark_dataset
except ImportError:
    generate_webtoon_benchmark_dataset = None


def compute_box_iou(boxA, boxB):
    """
    Computes Intersection over Union (IoU) between two bounding boxes {x, y, w, h}.
    """
    xA = max(boxA["x"], boxB["x"])
    yA = max(boxA["y"], boxB["y"])
    xB = min(boxA["x"] + boxA["w"], boxB["x"] + boxB["w"])
    yB = min(boxA["y"] + boxA["h"], boxB["y"] + boxB["h"])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = boxA["w"] * boxA["h"]
    boxBArea = boxB["w"] * boxB["h"]
    unionArea = float(boxAArea + boxBArea - interArea)

    return interArea / unionArea if unionArea > 0 else 0.0


def evaluate_detection_performance(detected_panels, gt_panels, iou_threshold=0.50):
    """
    Evaluates IoU, Precision, Recall, False Positives, False Negatives.
    """
    matched_gt = set()
    matched_det = set()
    ious = []

    for det_idx, det in enumerate(detected_panels):
        det_box = {"x": det["x"], "y": det["y"], "w": det["width"], "h": det["height"]}
        best_iou = 0.0
        best_gt_idx = -1

        for gt_idx, gt in enumerate(gt_panels):
            if gt_idx in matched_gt:
                continue
            iou = compute_box_iou(det_box, gt)
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = gt_idx

        if best_iou >= iou_threshold and best_gt_idx != -1:
            matched_gt.add(best_gt_idx)
            matched_det.add(det_idx)
            ious.append(best_iou)

    tp = len(matched_gt)
    fp = len(detected_panels) - tp
    fn = len(gt_panels) - tp

    precision = tp / float(len(detected_panels)) if detected_panels else 0.0
    recall = tp / float(len(gt_panels)) if gt_panels else 0.0
    mean_iou = float(np.mean(ious)) if ious else 0.0

    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "mean_iou": round(mean_iou, 4)
    }


def test_ground_truth_benchmark_suite():
    dataset_dir = os.path.join(os.path.dirname(__file__), "datasets", "webtoon")
    generate_webtoon_benchmark_dataset(dataset_dir)

    chapter_dir = os.path.join(dataset_dir, "sample_chapter")
    img_path = os.path.join(chapter_dir, "merged.png")
    json_path = os.path.join(chapter_dir, "panels.json")

    assert os.path.exists(img_path)
    assert os.path.exists(json_path)

    with open(json_path, "r") as f:
        gt_panels = json.load(f)

    detected = run_cv_detection(
        image_path=img_path,
        sensitivity=30.0,
        bg_mode="auto",
        min_width_pct=0.15,
        min_height_px=60,
        merge_threshold=20,
        aspect_ratio_str="free",
        auto_split=True,
        padding_px=0,
        use_yolo=False
    )

    metrics = evaluate_detection_performance(detected, gt_panels)
    print("\n--- BASELINE v1.0.0 BENCHMARK REPORT ---")
    print(f"Ground Truth Panels: {len(gt_panels)}")
    print(f"Detected Panels: {len(detected)}")
    print(f"Metrics: {json.dumps(metrics, indent=2)}")

    assert metrics["recall"] >= 0.75, f"Baseline recall too low: {metrics['recall']}"
