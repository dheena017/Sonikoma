# Sonikoma Backend Architecture

This document maps the Python backend routing architecture, local database schemas, and media rendering pipelines.

---

## 🐍 1. Service Layer Design Pattern

The Sonikoma backend is powered by FastAPI. To separate routing interfaces from media math:

- **Routers (`backend/python/routes/`):** Define endpoints (e.g., `/api/projects`, `/api/cleaner`, `/api/video`). They parse parameters, handle authorization, validate schemas, and write standard JSON.
- **Service Layers (`backend/python/services/`):** Houses business logic. `cleaner.py` manages OpenCV inpainting routines; `video.py` orchestrates MoviePy video render tracks; `ocr.py` handles EasyOCR processing.
- **Database Model Layers (`backend/python/db.py`):** Holds SQL connections, executes query statements, and maps tables to python entities.

---

## 💾 2. Relational Database Architecture

All entities are persisted in a zero-configuration SQLite instance (`webtoon_local.db`). The primary data structure maintains cascading relational boundaries:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                         SERIES                              │
  │  (Represents the overall Webtoon Series Title & Cover URL)  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ 1 : N Cascade
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                        CHAPTERS                             │
  │  (Represents a specific Episode, holds Video URL & narrative)│
  └──────────────────────────────┬──────────────────────────────┘
                                 │ 1 : N Cascade
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                         PANELS                              │
  │  (Represents distinct panels with visual filters, duration, │
  │   transitions, coordinates, and dual speech/narration URLs) │
  └─────────────────────────────────────────────────────────────┘
```

### Table Mappings:
1. **`series`:** Parent information (Title, Slug, Cover Artwork, Author, Synopsis).
2. **`chapters`:** Child episodes (Slug, Episode Number, Status, JSON narrative script persistence, accumulated AI credits/token metrics, volume mixer profiles).
3. **`panels`:** Individual cut panels. Stores dialogue parameters, brightness, crop points, isolated layer offsets, speech bubble parameters, custom durations, camera motion types (`zoom_in`, `pan_left`, etc.), and compiled sound assets (`audio_url`, `narrative_audio_url`).

---

## 🎬 3. Video Compilation Pipeline

When a user requests full project compilation (`/api/video/compile`), MoviePy reads the active database panel records to construct a widescreen MP4 clip:

```text
Panel Records ──► Image Processing ──► Keyframe Animation ──► Audio Merging ──► FFmpeg Rendering ──► MP4 File
```

### Processing Steps:
1. **Image Pre-Processing:** For each panel, raw image assets are loaded via Pillow. Standard CSS filters (contrast, brightness, saturation, and custom color presets) are applied before rendering.
2. **Keyframe Animation (Choreography):**
   - **`zoom_in` / `zoom_out`:** Scales the image from base scale to target scale across the panel's active duration.
   - **`pan_left` / `pan_right` / `pan_up` / `pan_down`:** Linearly translates crop coordinates over the panel's active duration.
3. **Audio Channel Merging:**
   - Evaluates the custom audio mixer profile.
   - Merges character dialogue TTS audio, narrative TTS audio, and localized Sound Effects (SFX) with ducking triggers applied to background music.
4. **Soft Subtitle Compilation:** Compiles dialogue text timestamps and appends a matching SRT/WebVTT soft subtitle package.
5. **FFmpeg Compilation:** Invokes FFmpeg via MoviePy to render and compress the composite timeline into an H.264 widescreen MP4 served from the consolidated data storage.
