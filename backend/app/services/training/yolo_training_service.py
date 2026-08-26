"""
backend/app/services/training/yolo_training_service.py
─────────────────────────────────────────────────────────────────────────────
YOLO Fine-Tuning & Model Training Engine:
- Background worker execution for comic/manga model training
- Dataset preparation, YOLO format annotation converter, and starter pair seeding
- Process lock acquisition and active thread management
- Real-time training status and epoch metrics reporting
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import glob
import yaml
import shutil
import logging
import threading
import numpy as np
import cv2
from typing import Optional, Dict, List, Tuple, Any

logger = logging.getLogger("sonikoma.services.training.yolo_training")


class TrainingStatus:
    def __init__(self):
        self.lock = threading.Lock()
        self.reset()

    def reset(self):
        with self.lock:
            self.is_training = False
            self.epoch = 0
            self.total_epochs = 0
            self.elapsed_seconds = 0
            self.training_pairs = 0
            self.metrics = {}
            self.error = None
            self.start_time = None
            self.dataset_dir = None

    def update(self, **kwargs):
        with self.lock:
            for k, v in kwargs.items():
                setattr(self, k, v)

    def to_dict(self):
        with self.lock:
            elapsed = 0
            if self.is_training and self.start_time:
                elapsed = int(time.time() - self.start_time)
            elif self.elapsed_seconds > 0:
                elapsed = self.elapsed_seconds

            return {
                "is_training": self.is_training,
                "epoch": self.epoch,
                "total_epochs": self.total_epochs,
                "elapsed_seconds": elapsed,
                "training_pairs": self.training_pairs,
                "metrics": self.metrics,
                "error": self.error
            }


status = TrainingStatus()


def get_yolo_training_status() -> Dict[str, Any]:
    return status.to_dict()


def is_process_running(pid: int) -> bool:
    try:
        import psutil
        return psutil.pid_exists(pid)
    except ImportError:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False


def get_lock_pid(lock_file_path: str) -> Optional[int]:
    try:
        if os.path.exists(lock_file_path):
            with open(lock_file_path, "r", encoding="utf-8") as f:
                content = f.read()
            match = re.search(r"PID:\s*(\d+)", content)
            if match:
                return int(match.group(1))
    except Exception as e:
        logger.warning(f"[YOLO Detector Training] Failed to read PID from lock file: {e}")
    return None


def is_training_locked(lock_file_path: str) -> bool:
    if not os.path.exists(lock_file_path):
        return False
    pid = get_lock_pid(lock_file_path)
    if pid is None:
        return False
    return is_process_running(pid)


def convert_mask_to_yolo_txt(mask_path: str, txt_output_path: str):
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise ValueError(f"Could not read mask image: {mask_path}")

    h, w = mask.shape[:2]
    _, thresh = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    lines = []
    for contour in contours:
        epsilon = 0.001 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        if len(approx) < 3:
            continue

        pts = []
        for pt in approx:
            x, y = pt[0]
            nx = max(0.0, min(1.0, x / w))
            ny = max(0.0, min(1.0, y / h))
            pts.append(f"{nx:.6f} {ny:.6f}")

        lines.append("0 " + " ".join(pts))

    with open(txt_output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def _seed_starter_training_pairs(training_dir: str):
    """Generate realistic starter training pairs if the user has not provided human corrections yet."""
    os.makedirs(training_dir, exist_ok=True)
    samples = [
        {"id": "starter_001", "text": "BOOM!", "color": (150, 100, 250), "shape": "circle"},
        {"id": "starter_002", "text": "WHAT?", "color": (100, 200, 150), "shape": "rect"},
        {"id": "starter_003", "text": "AHA!", "color": (250, 150, 100), "shape": "ellipse"},
        {"id": "starter_004", "text": "HEY!", "color": (120, 180, 220), "shape": "circle"},
        {"id": "starter_005", "text": "LOOK!", "color": (200, 120, 180), "shape": "rect"},
    ]
    for s in samples:
        pair_id = str(s["id"])
        text = str(s["text"])
        original = np.zeros((256, 256, 3), dtype=np.uint8)
        original[:, :] = s["color"]
        mask = np.zeros((256, 256), dtype=np.uint8)

        if s["shape"] == "rect":
            cv2.rectangle(original, (40, 60), (210, 190), (255, 255, 255), -1)
            cv2.putText(original, text, (75, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.rectangle(mask, (40, 60), (210, 190), 255, -1)
        elif s["shape"] == "circle":
            cv2.circle(original, (128, 128), 80, (255, 255, 255), -1)
            cv2.putText(original, text, (70, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.circle(mask, (128, 128), 80, 255, -1)
        else:
            cv2.ellipse(original, (128, 128), (95, 65), 0, 0, 360, (255, 255, 255), -1)
            cv2.putText(original, text, (80, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.ellipse(mask, (128, 128), (95, 65), 0, 0, 360, 255, -1)

        orig_path = os.path.join(training_dir, f"original_{pair_id}.png")
        mask_path = os.path.join(training_dir, f"mask_{pair_id}.png")
        cv2.imwrite(orig_path, original)
        cv2.imwrite(mask_path, mask)


def prepare_dataset(training_data_dir: str, dataset_dir: str) -> int:
    os.makedirs(os.path.join(dataset_dir, "images", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "images", "val"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "val"), exist_ok=True)

    orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))

    if not orig_files:
        alt_dirs = [
            os.path.abspath(os.path.join(training_data_dir, "..", "..", "..", "data", "training_data")),
            os.path.abspath(os.path.join(training_data_dir, "..", "..", "data", "training_data")),
        ]
        for alt_dir in alt_dirs:
            if os.path.exists(alt_dir):
                alt_files = glob.glob(os.path.join(alt_dir, "original_*.*"))
                if alt_files:
                    for f in glob.glob(os.path.join(alt_dir, "*.*")):
                        try:
                            shutil.copy(f, os.path.join(training_data_dir, os.path.basename(f)))
                        except Exception:
                            pass
                    orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))
                    break

    if not orig_files:
        logger.info("[YOLO Training] No manual training pairs found — auto-seeding starter training pairs...")
        _seed_starter_training_pairs(training_data_dir)
        orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))

    pairs = []

    for orig_path in orig_files:
        match = re.search(r"original_([0-9a-zA-Z_\-]+)\.", os.path.basename(orig_path))
        if not match:
            continue
        pair_id = match.group(1)

        mask_pattern = os.path.join(training_data_dir, f"mask_{pair_id}.*")
        mask_matches = glob.glob(mask_pattern)
        if mask_matches:
            pairs.append((orig_path, mask_matches[0], pair_id))

    if len(pairs) == 0:
        _seed_starter_training_pairs(training_data_dir)
        orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))
        for orig_path in orig_files:
            match = re.search(r"original_([0-9a-zA-Z_\-]+)\.", os.path.basename(orig_path))
            if match:
                pair_id = match.group(1)
                mask_matches = glob.glob(os.path.join(training_data_dir, f"mask_{pair_id}.*"))
                if mask_matches:
                    pairs.append((orig_path, mask_matches[0], pair_id))

    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(pairs))

    split_idx = int(len(pairs) * 0.8)
    if split_idx == 0 and len(pairs) > 0:
        split_idx = 1

    for idx, index in enumerate(shuffled_indices):
        orig_path, mask_path, pair_id = pairs[index]
        subdir = "train" if idx < split_idx else "val"

        orig_ext = os.path.splitext(orig_path)[1]
        dest_img_path = os.path.join(dataset_dir, "images", subdir, f"sample_{pair_id}{orig_ext}")
        dest_lbl_path = os.path.join(dataset_dir, "labels", subdir, f"sample_{pair_id}.txt")

        shutil.copy(orig_path, dest_img_path)
        convert_mask_to_yolo_txt(mask_path, dest_lbl_path)

    yaml_data = {
        "path": os.path.abspath(dataset_dir),
        "train": "images/train",
        "val": "images/val",
        "names": {
            0: "speech bubble"
        }
    }

    yaml_path = os.path.join(dataset_dir, "dataset.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(yaml_data, f, default_flow_style=False)

    return len(pairs)


def _train_worker(epochs: int, batch_size: int = 4):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    training_data_dir = os.path.join(base_dir, "data", "training_data")
    dataset_dir = os.path.abspath(os.path.join(base_dir, "data", "temp", "yolo_dataset"))
    lock_file_path = os.path.join(training_data_dir, "training.lock")

    lock_acquired = False

    try:
        os.makedirs(training_data_dir, exist_ok=True)
        if os.path.exists(lock_file_path):
            if is_training_locked(lock_file_path):
                logger.error("[YOLO Detector Training] Training is already running under an active OS process.")
                return
            else:
                try:
                    os.remove(lock_file_path)
                except Exception:
                    pass

        try:
            with open(lock_file_path, "w", encoding="utf-8") as f:
                f.write(f"PID: {os.getpid()}\nStarted: {time.time()}\n")
            lock_acquired = True
        except Exception as e:
            logger.error(f"[YOLO Detector Training] Failed to create lock file: {e}")
            raise

        from ultralytics import YOLO
        from services.image.panel_detection.speech_bubble_detector import get_yolo_speech_bubble_model, _set_loaded_yolo_model

        if os.path.exists(dataset_dir):
            shutil.rmtree(dataset_dir, ignore_errors=True)

        num_pairs = prepare_dataset(training_data_dir, dataset_dir)

        status.update(
            is_training=True,
            total_epochs=epochs,
            training_pairs=num_pairs,
            start_time=time.time(),
            dataset_dir=dataset_dir
        )

        current_model = get_yolo_speech_bubble_model()
        if current_model is None:
            raise RuntimeError("YOLO model not available/loading failed.")

        default_model_path = os.path.join(base_dir, "data", "models", "yolov8n-seg.pt")
        fallback_model_path = default_model_path if os.path.exists(default_model_path) else 'yolov8n-seg.pt'
        ckpt = getattr(current_model, 'ckpt_path', None)
        model_path: str = str(ckpt) if ckpt is not None else fallback_model_path
        model = YOLO(model_path)

        def on_fit_epoch_end(trainer):
            metrics = {}
            for k, v in trainer.validator.metrics.results_dict.items():
                clean_key = k.replace("metrics/", "")
                metrics[clean_key] = float(v)

            status.update(
                epoch=trainer.epoch + 1,
                metrics=metrics
            )

        model.add_callback("on_fit_epoch_end", on_fit_epoch_end)

        device = 'cpu'
        try:
            import torch
            if torch.cuda.is_available():
                device = 0
        except Exception:
            pass

        results = model.train(
            data=os.path.join(dataset_dir, "dataset.yaml"),
            epochs=epochs,
            imgsz=640,
            batch=batch_size,
            workers=1,
            device=device,
            project=os.path.join(dataset_dir, "runs"),
            name="manga_train",
            verbose=False
        )

        best_weights = os.path.join(dataset_dir, "runs", "manga_train", "weights", "best.pt")
        if not os.path.exists(best_weights):
            raise FileNotFoundError("YOLO training finished but best.pt weights were not found.")

        models_dir = os.path.abspath(os.path.join(base_dir, "local_media", "models"))
        os.makedirs(models_dir, exist_ok=True)
        finetuned_path = os.path.join(models_dir, "manga_finetuned.pt")

        shutil.copy(best_weights, finetuned_path)
        _set_loaded_yolo_model(YOLO(finetuned_path))

        elapsed = int(time.time() - status.start_time) if status.start_time is not None else 0
        status.update(
            is_training=False,
            elapsed_seconds=elapsed
        )
        logger.info("[YOLO Detector Training] Fine-tuning completed successfully! 🚀")

    except Exception as e:
        logger.error(f"[YOLO Detector Training] YOLO Fine-tuning failed: {e}", exc_info=True)
        status.update(is_training=False, error=str(e))

    finally:
        if dataset_dir and os.path.exists(dataset_dir):
            try:
                shutil.rmtree(dataset_dir, ignore_errors=True)
            except Exception:
                pass

        if lock_acquired:
            try:
                if os.path.exists(lock_file_path):
                    os.remove(lock_file_path)
            except Exception:
                pass


def trigger_yolo_fine_tuning(epochs: int = 20, batch_size: int = 4) -> bool:
    """Spawns a new training run background worker thread if not already running."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    training_data_dir = os.path.join(base_dir, "data", "training_data")
    lock_file_path = os.path.join(training_data_dir, "training.lock")

    if status.to_dict()["is_training"] or is_training_locked(lock_file_path):
        logger.warning("[YOLO Detector Training] Fine-tuning is already running.")
        return False

    status.reset()
    t = threading.Thread(target=_train_worker, args=(epochs, batch_size), name="YoloTrainingWorker")
    t.daemon = True
    t.start()
    return True


trigger_fine_tuning = trigger_yolo_fine_tuning
