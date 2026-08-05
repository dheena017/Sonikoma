"""
backend/app/services/image/detect_panels.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy facade.
Re-exports all panel detection functions and classes from the package:
`services.image.panel_detector.detector`.
─────────────────────────────────────────────────────────────────────────────
"""

from app.services.image.panel_detector.detector import *
from app.services.image.panel_detector.detector import (
    run_cv_detection,
    _sort_panels_reading_order,
    _split_oversized_webtoon_boxes,
    main,
)
from app.services.image.panel_detector.grid_detect import _detect_panels_grid_cv

if __name__ == "__main__":
    main()
