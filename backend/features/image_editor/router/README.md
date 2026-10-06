# Images Sub-Domain (`backend/features/image_editor/images/`)

## 1. Overview
The **Images Sub-Domain** powers the core image editing, cropping, stitching, inpainting, layer extraction, and asset upload capabilities of Sonikoma. It directly backs the frontend Image Editor workspace canvas, auto-crop radar, image merge tools, and horizontal panel splitters.

Following the standard sub-domain pattern:
- **`router.py`**: Mounts all image operation sub-routers under `/api/v1/images/*`.
- **`schemas.py`**: Pydantic models for editing, margin cropping, transformations, and inpainting.
- **`service.py`**: `ImageService` facade class and `image_service` singleton.
- **`services/`**: Specialized processing micro-services (`crop/`, `layer_separation/`, `processing/`, `stitching/`, `thumbnails/`, `upload/`, `utils/`).
- **`README.md`**: Architecture and endpoint documentation.

---

## 2. Directory Layout

```
backend/features/image_editor/images/
├── __init__.py                  # Sub-domain exports
├── README.md                    # Sub-domain documentation
├── router.py                    # Master images sub-router
├── crop.py                      # Margin cropping & layout classification routes
├── detect.py                    # Speech bubble inpainting & eraser routes
├── edit.py                      # Brightness, contrast, color, undo/redo routes
├── metadata.py                  # Image inspection & transcript routes
├── transform.py                 # Stitching, splitting, parallax layer routes
├── upload.py                    # AI flywheel training data routes
├── schemas.py                   # Consolidated image Pydantic schemas
├── service.py                   # ImageService facade & image_service singleton
└── services/                    # Specialized image processing engines
    ├── __init__.py              # Service exports
    ├── crop/                    # Margin cropping & single panel auto-trim
    ├── layer_separation/        # SAM & YOLO parallax layer separator
    ├── processing/              # Inpainting, ImageMagick, transformer, splitter
    ├── stitching/               # Canvas strip stitching & cache
    ├── thumbnails/              # Thumbnail generator
    ├── upload/                  # Image & training asset persistence
    └── utils/                   # Coordinate bounding math & buffer resolvers
```

---

## 3. Endpoints

| Method | Endpoint | Summary | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/images/crop/detect-type` | Layout Classifier | Evaluates aspect ratio and gutter variance in <30ms. |
| `POST` | `/api/v1/images/crop/long-panels` | Long-Panels Slicing | Slices tall continuous webtoon strips into panels. |
| `POST` | `/api/v1/images/crop/small-panels` | Margin Cropping | 4-directional margin crop with auto-trim & aspect snapping. |
| `POST` | `/api/v1/images/remove-speech-bubbles` | Bubble Inpainting | Erases speech balloons and reconstructs background artwork. |
| `POST` | `/api/v1/images/edit` | Canvas Edits | Applies brightness, contrast, hue, rotation, and auto-trim. |
| `POST` | `/api/v1/images/merge` | Canvas Stitching | Stitches multiple image panels vertically or horizontally. |
| `POST` | `/api/v1/images/split` | Manual Splitter | Cuts tall strips along custom line percentages. |
| `POST` | `/api/v1/images/process-layers/{id}` | Parallax Separation | Decomposes panel into foreground, character, and background layers. |
| `POST` | `/api/v1/images/save-training-data` | Flywheel Feedback | Saves user-corrected inpainting pairs for AI fine-tuning. |
