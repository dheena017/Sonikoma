"""
train_yolo.py
-------------
Converts collected training_data/ binary mask pairs to YOLO polygon format,
sets up a temporary dataset, fine-tunes the kitsumed YOLOv8m-seg model,
and hot-swaps the newly trained weights into the active backend.
"""
import os
import shutil
import logging
import threading
import time
import glob
import re
import yaml
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.train_yolo")

# Shared thread-safe status
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


def is_process_running(pid: int) -> bool:
    """Returns True if a process with given PID is currently active on the OS level."""
    try:
        import psutil
        return psutil.pid_exists(pid)
    except ImportError:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False


def get_lock_pid(lock_file_path: str) -> int:
    """Reads and parses the PID from the lock file."""
    try:
        if os.path.exists(lock_file_path):
            with open(lock_file_path, "r", encoding="utf-8") as f:
                content = f.read()
            match = re.search(r"PID:\s*(\d+)", content)
            if match:
                return int(match.group(1))
    except Exception as e:
        logger.warning(f"[Training] Failed to read PID from lock file: {e}")
    return None


def is_training_locked(lock_file_path: str) -> bool:
    """Returns True if training is locked by an active running OS process."""
    if not os.path.exists(lock_file_path):
        return False
    pid = get_lock_pid(lock_file_path)
    if pid is None:
        return False
    return is_process_running(pid)


def convert_mask_to_yolo_txt(mask_path: str, txt_output_path: str):
    """Reads a binary mask PNG, finds contours, normalizes, and writes YOLO segment line."""
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise ValueError(f"Could not read mask image: {mask_path}")

    h, w = mask.shape[:2]
    _, thresh = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    lines = []
    for contour in contours:
        # Simplify contour to keep points reasonable
        epsilon = 0.001 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        if len(approx) < 3:
            continue

        pts = []
        for pt in approx:
            x, y = pt[0]
            # Normalize to 0..1
            nx = max(0.0, min(1.0, x / w))
            ny = max(0.0, min(1.0, y / h))
            pts.append(f"{nx:.6f} {ny:.6f}")

        # Class 0: speech bubble
        lines.append(f"0 " + " ".join(pts))

    # Write file (create empty label if no speech bubble contours exist)
    with open(txt_output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def prepare_dataset(training_data_dir: str, dataset_dir: str) -> int:
    """Prepares standard YOLO segmentation directories from flywheel pairs."""
    os.makedirs(os.path.join(dataset_dir, "images", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "images", "val"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "val"), exist_ok=True)

    # Find all original panel files
    orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))
    pairs = []

    for orig_path in orig_files:
        # Extract unique_pair_id
        match = re.search(r"original_([0-9a-fA-F]+)\.", os.path.basename(orig_path))
        if not match:
            continue
        pair_id = match.group(1)

        # Look for corresponding mask
        mask_pattern = os.path.join(training_data_dir, f"mask_{pair_id}.*")
        mask_matches = glob.glob(mask_pattern)
        if mask_matches:
            pairs.append((orig_path, mask_matches[0], pair_id))

    if len(pairs) == 0:
        raise ValueError(f"No original/mask training pairs found in {training_data_dir}")

    # Shuffle and split 80/20
    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(pairs))

    split_idx = int(len(pairs) * 0.8)
    if split_idx == 0 and len(pairs) > 0:
        split_idx = 1 # at least 1 training item

    for idx, index in enumerate(shuffled_indices):
        orig_path, mask_path, pair_id = pairs[index]
        subdir = "train" if idx < split_idx else "val"

        # Paths
        orig_ext = os.path.splitext(orig_path)[1]
        dest_img_path = os.path.join(dataset_dir, "images", subdir, f"sample_{pair_id}{orig_ext}")
        dest_lbl_path = os.path.join(dataset_dir, "labels", subdir, f"sample_{pair_id}.txt")

        # Copy original image
        shutil.copy(orig_path, dest_img_path)

        # Convert binary mask to YOLO segments txt file
        convert_mask_to_yolo_txt(mask_path, dest_lbl_path)

    # Create dataset.yaml
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
    """Background training runner."""
    # Standardize path resolution:
    # __file__ is backend/python/media/image/train_yolo.py
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # backend/python
    project_root = os.path.abspath(os.path.join(base_dir, "..", "..")) # project root
    training_data_dir = os.path.join(project_root, "data", "training_data")
    dataset_dir = os.path.abspath(os.path.join(project_root, "data", "temp", "yolo_dataset"))
    lock_file_path = os.path.join(training_data_dir, "training.lock")

    lock_acquired = False

    try:
        # Lock file mechanism to prevent concurrent runs (OS process-safe)
        os.makedirs(training_data_dir, exist_ok=True)
        if os.path.exists(lock_file_path):
            if is_training_locked(lock_file_path):
                logger.error("[Training] Training is already running under an active OS process. Aborting worker.")
                return
            else:
                logger.warning("[Training] Stale lock file detected (PID not running). Removing and proceeding.")
                try:
                    os.remove(lock_file_path)
                except Exception:
                    pass

        try:
            with open(lock_file_path, "w", encoding="utf-8") as f:
                f.write(f"PID: {os.getpid()}\nStarted: {time.time()}\n")
            lock_acquired = True
            logger.info(f"[Training] Created lock file: {lock_file_path}")
        except Exception as e:
            logger.error(f"[Training] Failed to create lock file: {e}")
            raise

        # Now do the required lazy-imports to prevent NameError
        from ultralytics import YOLO
        from media.image.segmentation_engine import get_yolo_model

        # Cleanup old run dataset if exists
        if os.path.exists(dataset_dir):
            shutil.rmtree(dataset_dir, ignore_errors=True)

        logger.info("[Training] Preparing dataset...")
        num_pairs = prepare_dataset(training_data_dir, dataset_dir)
        logger.info(f"[Training] Dataset ready with {num_pairs} pairs.")

        status.update(
            is_training=True,
            total_epochs=epochs,
            training_pairs=num_pairs,
            start_time=time.time(),
            dataset_dir=dataset_dir
        )

        # Load starting model (lazy-load kitsumed or whatever is configured)
        logger.info("[Training] Loading starting YOLO model...")
        current_model = get_yolo_model()
        if current_model is None:
            raise RuntimeError("YOLO model not available/loading failed.")

        # Re-initialize to fetch clean pretrained segmentation weights
        model_path = current_model.ckpt_path if hasattr(current_model, 'ckpt_path') else 'yolov8n-seg.pt'
        model = YOLO(model_path)

        # Callbacks to update status
        def on_fit_epoch_end(trainer):
            # Parse validation metrics
            metrics = {}
            for k, v in trainer.validator.metrics.results_dict.items():
                clean_key = k.replace("metrics/", "")
                metrics[clean_key] = float(v)

            status.update(
                epoch=trainer.epoch + 1,
                metrics=metrics
            )

        model.add_callback("on_fit_epoch_end", on_fit_epoch_end)

        # Detect device automatically: GPU if available, else CPU
        device = 'cpu'
        try:
            import torch
            if torch.cuda.is_available():
                device = 0
                logger.info("[Training] CUDA GPU is available. Training on GPU (device=0).")
            else:
                logger.info("[Training] CUDA GPU is not available. Training on CPU.")
        except Exception as e:
            logger.warning(f"[Training] Error checking CUDA GPU status, defaulting to CPU: {e}")

        logger.info(f"[Training] Beginning YOLO segmentation training for {epochs} epochs (batch={batch_size}) on device={device}...")
        # Train!
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

        # Check best weights location
        best_weights = os.path.join(dataset_dir, "runs", "manga_train", "weights", "best.pt")
        if not os.path.exists(best_weights):
            raise FileNotFoundError("YOLO training finished but best.pt weights were not found.")

        # Save to local_media/models
        models_dir = os.path.abspath(os.path.join(base_dir, "local_media", "models"))
        os.makedirs(models_dir, exist_ok=True)
        finetuned_path = os.path.join(models_dir, "manga_finetuned.pt")
        
        shutil.copy(best_weights, finetuned_path)
        logger.info(f"[Training] Best weights copied to: {finetuned_path}")

        # Hot-swap the model into active backend
        logger.info("[Training] Hot-swapping fine-tuned model into active server instance...")
        import media.image.segmentation_engine as se
        se._yolo_model = YOLO(finetuned_path)

        # Set final status
        elapsed = int(time.time() - status.start_time)
        status.update(
            is_training=False,
            elapsed_seconds=elapsed
        )
        logger.info("[Training] Fine-tuning completed successfully! 🚀")

    except Exception as e:
        logger.error(f"[Training] YOLO Fine-tuning failed: {e}", exc_info=True)
        status.update(is_training=False, error=str(e))

    finally:
        # Clean up temp dataset
        if dataset_dir and os.path.exists(dataset_dir):
            try:
                shutil.rmtree(dataset_dir, ignore_errors=True)
            except Exception:
                pass

        # Clean up lock file (Guaranteed to execute on any worker crash/OOM)
        if lock_acquired:
            try:
                if os.path.exists(lock_file_path):
                    os.remove(lock_file_path)
                    logger.info(f"[Training] Cleaned up lock file: {lock_file_path}")
            except Exception as e:
                logger.error(f"[Training] Failed to clean up lock file: {e}")


def trigger_fine_tuning(epochs: int = 20, batch_size: int = 4) -> bool:
    """Spawns a new training run background worker thread if not already running."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # backend/python
    project_root = os.path.abspath(os.path.join(base_dir, "..", "..")) # project root
    training_data_dir = os.path.join(project_root, "data", "training_data")
    lock_file_path = os.path.join(training_data_dir, "training.lock")

    if status.to_dict()["is_training"] or is_training_locked(lock_file_path):
        logger.warning("[Training] Fine-tuning is already running (status says active or lock file is held by running process).")
        return False

    status.reset()
    t = threading.Thread(target=_train_worker, args=(epochs, batch_size), name="YoloTrainingWorker")
    t.daemon = True
    t.start()
    return True
