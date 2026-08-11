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
from typing import Optional, Dict, List, Tuple, Any

logger = logging.getLogger("sonikoma.services.image.panel_detection.speech_bubble_detector")

try:
    from ultralytics import YOLO
    from huggingface_hub import hf_hub_download
    has_yolo_dependencies = True
except ImportError:
    has_yolo_dependencies = False
    logger.warning("[YOLO Detector] ultralytics or huggingface_hub is not installed. YOLO segmentation will be disabled.")

_yolo_model = None

def get_yolo_speech_bubble_model():
    """
    Lazily downloads and initializes the YOLO manga/comic speech bubble segmentation model.

    Tries models in priority order:
    1. kitsumed/yolov8m_seg-speech-bubble — YOLOv8m-seg, produces pixel masks, trained on manga/comic bubbles.
    2. ogkalu/comic-speech-bubble-detector-yolov8m — YOLOv8m detection, broader comic coverage.
    3. yolov8n-seg.pt — generic pretrained segmentation (last resort; not manga-specific).

    The first successfully loaded model is cached in `_yolo_model`.
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    if not has_yolo_dependencies:
        return None

    from ultralytics import YOLO
    from huggingface_hub import hf_hub_download

    # Priority 0: Custom locally fine-tuned model (if exists)
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        custom_model_path = os.path.join(base_dir, "local_media", "models", "manga_finetuned.pt")
        if os.path.exists(custom_model_path):
            logger.info(f"[YOLO Detector] Loading custom fine-tuned YOLO model from: {custom_model_path}")
            _yolo_model = YOLO(custom_model_path)
            logger.info("[YOLO Detector] Custom fine-tuned YOLO model loaded successfully.")
            return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] Failed to load custom fine-tuned model: {e}. Falling back to public models...")

    # Priority 1: kitsumed YOLOv8m-seg — produces pixel-level masks
    hf_token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
    try:
        logger.debug("[YOLO Detector] Downloading kitsumed/yolov8m_seg-speech-bubble (YOLOv8m-seg) from HuggingFace...")
        model_path = hf_hub_download(
            repo_id="kitsumed/yolov8m_seg-speech-bubble",
            filename="model.pt",
            token=hf_token
        )
        logger.debug(f"[YOLO Detector] Loading YOLO manga segmentation model from: {model_path}")
        _yolo_model = YOLO(model_path)
        logger.debug("[YOLO Detector] kitsumed/yolov8m_seg-speech-bubble model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] kitsumed model unavailable: {e}. Trying ogkalu fallback...")

    # Priority 2: ogkalu YOLOv8m — broader comic/webtoon coverage
    try:
        logger.info("[YOLO Detector] Downloading ogkalu/comic-speech-bubble-detector-yolov8m from HuggingFace...")
        model_path = hf_hub_download(
            repo_id="ogkalu/comic-speech-bubble-detector-yolov8m",
            filename="comic-speech-bubble-detector.pt",
            token=hf_token
        )
        logger.info(f"[YOLO Detector] Loading ogkalu YOLO fallback model from: {model_path}")
        _yolo_model = YOLO(model_path)
        logger.info("[YOLO Detector] ogkalu/comic-speech-bubble-detector-yolov8m fallback model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] ogkalu model unavailable: {e}. Trying generic YOLOv8n-seg last resort...")

    # Priority 3: Generic YOLOv8n-seg
    try:
        logger.info("[YOLO Detector] Loading generic YOLOv8n-seg pretrained model as last-resort fallback...")
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        project_model_path = os.path.join(base_dir, "data", "models", "yolov8n-seg.pt")
        if os.path.exists(project_model_path):
            logger.info(f"[YOLO Detector] Loading generic YOLOv8n-seg model from project data/models: {project_model_path}")
            _yolo_model = YOLO(project_model_path)
        else:
            _yolo_model = YOLO("yolov8n-seg.pt")
        logger.info("[YOLO Detector] Generic YOLOv8n-seg loaded.")
        return _yolo_model
    except Exception as e:
        logger.error(f"[YOLO Detector] All YOLO model loading attempts failed: {e}", exc_info=True)
        _yolo_model = None
        return None

# Backward compatibility alias
get_yolo_model = get_yolo_speech_bubble_model


def segment_speech_bubbles_and_text_balloons(image_path: str, conf_threshold: float = 0.25) -> Optional[np.ndarray]:
    """
    Infers text and speech balloon masks on a panel image using the YOLO model.
    Returns:
      Single-channel binary mask (numpy uint8 array, 255 for detected regions, 0 elsewhere), or None.
    """
    if not has_yolo_dependencies:
        logger.warning("[YOLO Detector] ultralytics or huggingface_hub is not installed. YOLO segmentation cannot run.")
        return None

    model = get_yolo_speech_bubble_model()
    if model is None:
        logger.warning("[YOLO Detector] YOLO speech bubble model unavailable — falling back to OpenCV.")
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist for YOLO segmentation: {image_path}")

    try:
        raw_results = model.predict(image_path, conf=conf_threshold, verbose=False)
        results = list(raw_results) if raw_results is not None else []
        if not results:
            return None

        result = results[0]
        if not hasattr(result, "masks") or result.masks is None or len(result.masks) == 0:
            logger.info("[YOLO Detector] YOLO segmentation completed: No masks found in this panel.")
            return None

        if hasattr(result, "orig_shape") and result.orig_shape is not None:
            orig_shape = result.orig_shape
            height, width = int(orig_shape[0]), int(orig_shape[1])
        else:
            img = cv2.imread(image_path)
            if img is not None:
                height, width = img.shape[:2]
            else:
                logger.warning(f"[YOLO Detector] Could not determine image dimensions: {image_path}")
                return None

        combined_mask = np.zeros((height, width), dtype=np.uint8)

        for i, mask_instance in enumerate(result.masks.data):
            if hasattr(result, "boxes") and result.boxes is not None and hasattr(result.boxes, "conf") and len(result.boxes.conf) > i:
                confidence = float(result.boxes.conf[i].item())
            else:
                confidence = 1.0

            if confidence >= conf_threshold:
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        if np.any(combined_mask > 0):
            mask_pixel_count = int(np.sum(combined_mask > 0))
            logger.info(f"[YOLO Detector] Successfully segmented text/balloon masks (conf >= {conf_threshold}, {mask_pixel_count} pixels masked)")
            return combined_mask
        else:
            return np.zeros((height, width), dtype=np.uint8)

    except Exception as e:
        logger.error(f"[YOLO Detector] Error running YOLO text/balloon segmentation: {e}", exc_info=True)
        return None

# Backward compatibility alias
segment_text_and_balloons = segment_speech_bubbles_and_text_balloons


_yolo_char_model = None

def get_yolo_character_segmentation_model():
    """Lazily loads the YOLOv8-seg model for character detection."""
    global _yolo_char_model
    if _yolo_char_model is not None:
        return _yolo_char_model

    if not has_yolo_dependencies:
        return None

    try:
        from ultralytics import YOLO

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        local_path = os.path.join(base_dir, "yolov8n-seg.pt")
        if os.path.exists(local_path):
            logger.info(f"[YOLO Detector] Loading local YOLOv8-seg character model from: {local_path}")
            _yolo_char_model = YOLO(local_path)
        else:
            logger.info("[YOLO Detector] Loading generic YOLOv8n-seg model for character detection...")
            _yolo_char_model = YOLO("yolov8n-seg.pt")
        return _yolo_char_model
    except Exception as e:
        logger.error(f"[YOLO Detector] Failed to load YOLOv8-seg character model: {e}", exc_info=True)
        return None

# Backward compatibility alias
get_yolo_char_model = get_yolo_character_segmentation_model


def segment_character_foreground(image_path: str, conf_threshold: float = 0.25) -> Optional[np.ndarray]:
    """Detects character foreground masks (class 0: person in COCO dataset) using YOLOv8-seg model."""
    if not has_yolo_dependencies:
        logger.warning("[YOLO Detector] ultralytics or huggingface_hub is not installed. YOLO segmentation cannot run.")
        return None

    model = get_yolo_character_segmentation_model()
    if model is None:
        logger.warning("[YOLO Detector] YOLO character segmentation model unavailable.")
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist for YOLO character segmentation: {image_path}")

    try:
        results = model.predict(image_path, conf=conf_threshold, verbose=False)
        if not results or len(results) == 0:
            return None

        result = results[0]
        if not hasattr(result, "masks") or result.masks is None or len(result.masks) == 0:
            img = cv2.imread(image_path)
            if img is not None:
                return np.zeros(img.shape[:2], dtype=np.uint8)
            return None

        if hasattr(result, "orig_shape") and result.orig_shape is not None:
            height, width = int(result.orig_shape[0]), int(result.orig_shape[1])
        else:
            img = cv2.imread(image_path)
            if img is not None:
                height, width = img.shape[:2]
            else:
                logger.warning(f"[YOLO Detector] Could not determine image dimensions for character segmentation: {image_path}")
                return None

        combined_mask = np.zeros((height, width), dtype=np.uint8)

        for i, mask_instance in enumerate(result.masks.data):
            if hasattr(result, "boxes") and result.boxes is not None and hasattr(result.boxes, "cls") and len(result.boxes.cls) > i and hasattr(result.boxes, "conf") and len(result.boxes.conf) > i:
                cls_id = int(result.boxes.cls[i].item())
                confidence = float(result.boxes.conf[i].item())
            else:
                cls_id = 0
                confidence = 1.0

            if cls_id == 0 and confidence >= conf_threshold:
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        return combined_mask

    except Exception as e:
        logger.error(f"[YOLO Detector] Error running YOLO character segmentation: {e}", exc_info=True)
        return None

# Backward compatibility alias
segment_characters = segment_character_foreground


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


def prepare_dataset(training_data_dir: str, dataset_dir: str) -> int:
    os.makedirs(os.path.join(dataset_dir, "images", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "images", "val"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "train"), exist_ok=True)
    os.makedirs(os.path.join(dataset_dir, "labels", "val"), exist_ok=True)

    orig_files = glob.glob(os.path.join(training_data_dir, "original_*.*"))
    pairs = []

    for orig_path in orig_files:
        match = re.search(r"original_([0-9a-fA-F]+)\.", os.path.basename(orig_path))
        if not match:
            continue
        pair_id = match.group(1)

        mask_pattern = os.path.join(training_data_dir, f"mask_{pair_id}.*")
        mask_matches = glob.glob(mask_pattern)
        if mask_matches:
            pairs.append((orig_path, mask_matches[0], pair_id))

    if len(pairs) == 0:
        raise ValueError(f"No original/mask training pairs found in {training_data_dir}")

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
        model_path = current_model.ckpt_path if hasattr(current_model, 'ckpt_path') else (default_model_path if os.path.exists(default_model_path) else 'yolov8n-seg.pt')
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

        global _yolo_model
        _yolo_model = YOLO(finetuned_path)

        elapsed = int(time.time() - status.start_time)
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

# Backward compatibility alias
trigger_fine_tuning = trigger_yolo_fine_tuning
