# Image Editor Feature Module (`backend/features/image_editor/`)

## 1. Overview & Architecture
The **Image Editor** feature domain provides comprehensive comic and webtoon image manipulation, computer vision panel boundary extraction, speech bubble detection, parallax layer separation, and multi-language OCR transcription. It backs the frontend `src/features/image-editor/` suite.

- **Canonical Sub-Domain Routers**:
  - [`images/router.py`](file:///c:/Users/dheen/project/Sonikoma/backend/features/image_editor/images/router.py): Mounted at `/api/v1/images` (cropping, transformations, layers, uploads, metadata).
  - [`panels/router.py`](file:///c:/Users/dheen/project/Sonikoma/backend/features/image_editor/panels/router.py): Mounted at `/api/v1/panels` (CV & YOLO panel extraction, gutter slicing).
  - [`ocr/router.py`](file:///c:/Users/dheen/project/Sonikoma/backend/features/image_editor/ocr/router.py): Mounted at `/api/v1/ocr` (dialogue recognition and transcription).
- **Core Computational Services**:
  - Located in [`services/`](file:///c:/Users/dheen/project/Sonikoma/backend/features/image_editor/services/) (OpenCV, YOLO, EasyOCR, PIL, rembg, seam carving).
- **Schemas**:
  - Unified in [`schemas.py`](file:///c:/Users/dheen/project/Sonikoma/backend/features/image_editor/schemas.py).

---

## 2. Directory Structure & Layout

```
backend/features/image_editor/
├── __init__.py                  # Root package exports (routers, schemas, services)
├── README.md                    # Domain architectural documentation
├── schemas.py                   # Canonical Pydantic schemas for all image operations
│
├── images/                      # Sub-domain 1: Image Canvas, Crop & Transform
│   ├── __init__.py              # Sub-domain exports
│   ├── README.md                # Canvas & image operation documentation
│   ├── router.py                # Sub-router mounting all image operations
│   ├── crop.py                  # Layout classification & margin cropping routes
│   ├── detect.py                # Bubble detection & inpainting routes
│   ├── edit.py                  # Brightness, contrast, color, undo/redo routes
│   ├── metadata.py              # Image inspection & transcript routes
│   ├── transform.py             # Stitching, splitting, parallax layer routes
│   └── upload.py                # AI flywheel training data routes
│
├── panels/                      # Sub-domain 2: Comic & Webtoon Panel Detection
│   ├── __init__.py              # Sub-domain exports
│   ├── README.md                # Panel detection algorithms & documentation
│   └── router.py                # Panel detection API routes (/detect/*, /split)
│
├── ocr/                         # Sub-domain 3: Dialogue Recognition & Transcription
│   ├── __init__.py              # Sub-domain exports
│   ├── README.md                # Dialogue extraction & OCR documentation
│   └── router.py                # OCR API routes (/detect-text, /bubble-dialogue, /extract)
│
└── services/                    # Shared Underlying Computer Vision Engines
    ├── crop/                    # Multi-panel & single-panel margin cropping algorithms
    ├── layer_separation/        # Parallax layer extraction, SAM & rembg segmentation
    ├── ocr/                     # Speech bubble transcription & multi-lingual OCR engines
    ├── panel_detection/         # OpenCV contour detection, YOLOv8 speech bubble models
    ├── processing/              # Compose, transform, edit, and filter pipelines
    ├── stitching/               # Strip stitching cache and layout generators
    ├── thumbnails/              # High-performance thumbnail generation
    ├── upload/                  # Image upload and cloud asset resolution
    └── utils/                   # Color thresholding, bounding-box math, image resolvers
```
