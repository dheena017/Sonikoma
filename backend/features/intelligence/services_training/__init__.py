"""
backend/app/services/training/__init__.py
─────────────────────────────────────────────────────────────────────────────
Training & Fine-Tuning Service Package:
- YOLO fine-tuning worker & model fine-tuning (trigger_yolo_fine_tuning)
- Real-time training status & metrics (get_yolo_training_status)
- Automated sample threshold monitoring (check_and_trigger_training)
─────────────────────────────────────────────────────────────────────────────
"""

from .yolo_training_service import (
    TrainingStatus,
    status,
    get_yolo_training_status,
    trigger_yolo_fine_tuning,
    trigger_fine_tuning,
    is_training_locked,
    prepare_dataset,
    convert_mask_to_yolo_txt
)

from .training_monitor import (
    check_and_trigger_training,
    start_background_monitor,
    get_current_original_count,
    load_metadata,
    save_metadata,
    TRAINING_DATA_DIR,
    METADATA_FILE
)

__all__ = [
    "TrainingStatus",
    "status",
    "get_yolo_training_status",
    "trigger_yolo_fine_tuning",
    "trigger_fine_tuning",
    "is_training_locked",
    "prepare_dataset",
    "convert_mask_to_yolo_txt",
    "check_and_trigger_training",
    "start_background_monitor",
    "get_current_original_count",
    "load_metadata",
    "save_metadata",
    "TRAINING_DATA_DIR",
    "METADATA_FILE"
]
