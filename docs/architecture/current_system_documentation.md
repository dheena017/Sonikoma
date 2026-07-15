# Sonikoma — Current System Architecture & Technical Review

This document provides a comprehensive overview of the current Sonikoma Webtoon-to-Video compiler application architecture, database schemas, processing pipelines, user state controllers, and recognized technical debt as of July 2026.

---

## 1. Current Architecture
Sonikoma is built as a two-tier, high-performance multimedia compiler:
1. **Frontend (React 19 + TypeScript + Vite + Tailwind CSS):** A client-side Single Page Application (SPA). Handles user interactions, timeline choreography, canvas drawing/manipulations (crop/inpainting brush via Fabric.js), dynamic audio mixing playback, and terminal logging streams.
2. **Backend Computational Engine (FastAPI + Python 3.11):** Serves as both the API server and the underlying graphics/audio orchestration layer. This eliminates separate Express-to-Python CLI marshalling bottlenecks, running a unified Python process that leverages native bindings like OpenCV (for boundary/panel scans and inpainting), PIL/Pillow (for cropping and transformations), Microsoft Edge-TTS (for synchronized narration synthesis), and MoviePy/FFmpeg (for video compilers).

### Dynamic Data-Flow Pipeline:
```
[User Input: Webtoon URL / ZIP]
   └───> 1. Scraper Service (Python / BeautifulSoup / Playwright)
            └───> Extracts Original Panel Strips & Metadata
                    └───> 2. Project Creation (Relational SQLite/Supabase Upsert)
                            └───> 3. AI Multimodal Analyzer (Gemini 2.5 Markdown Skills)
                                    └───> Generates Dialogue, SFX, Descriptions
                                            └───> 4. Interactive UI Board & Editor
                                                    └───> Synchronized Audio/Visual Playback
                                                            └───> 5. MoviePy Compiler Pipeline
                                                                    └───> Outputs Final MP4 Widescreen Video
```

---

## 2. Current AI Workflow
The existing AI features are built on **Multimodal AI Markdown Skills** under `backend/python/skills/`.
* **Single Panel Analysis (`/api/analyze-image`):** Downloads the target panel, computes its average brightness (to pass a dark/moody vs. light/vibrant style hint to the prompt), runs EasyOCR text extraction, and uses Gemini 2.5 Flash to generate a structured JSON object containing:
  - `speech_text` (extracted or storyteller narrator-generated dialogue)
  - `sfx` (sound effect keyword, e.g., "Swoosh", "Crash")
  - `duration` (ideal timing in seconds based on speech speaking rate)
  - `motion_type` (suggested camera effect, e.g., `zoom_in`, `pan_left`)
  - `visual_description` (for subsequent image generation or accessibility checks)
* **Silent Storyteller Fallback:** If OCR detects zero dialogue inside a panel, the system triggers the `panel_storyteller` skill. This acts as a Narrator that interprets the visual elements of the illustration and inserts dramatic, descriptive spoken voiceover scripts.
* **Context-Aware Sequence Analysis (`/api/analyze-sequence`):** Extracts downscaled JPEGs of up to 20 panels, sends them in a single multimodal batch to Gemini, and returns a sequential array of cohesive dialogue scripts, preventing disjointed "panel-by-panel" disjointed narration.

---

## 3. Current Project Lifecycle
1. **Scrape/Ingest Phase:** User enters Webtoon URL. Playwright launches (incremental scrolling to expand lazy-loaded panels) or a ZIP/CBZ local archive is extracted. Raw images are cached under `/api/image/cached/` or `/media/`.
2. **Project Creation:** An atomic SQLite transaction inserts a metadata parent row in `series` and an episodic chapter child row in `chapters`.
3. **Drafting Phase:** Images are sliced into panels. The AI populates initial narration scripts and pre-generates TTS audio tracks (Edge-TTS) stored locally in the stitched cache.
4. **Editor Refinement Phase:** The user manually crops, cleans speech bubbles using YOLO segmentation + OpenCV inpainting, alters dialogue, and arranges panel timing on the timeline.
5. **Compilation/Rendering Phase:** High-speed MoviePy/FFmpeg processes stitch frames, apply pan/zoom crops, overlay sub-audio channels (narration, music, and sound effects), burn subtitles, and output an MP4 video served under `/videos/`.

---

## 4. Current Database Model
Sonikoma utilizes a zero-config SQLite local database (`webtoon_local.db`) with support for Supabase PostgreSQL mirror syncs:
* **`users`:** Manages identity, email credentials, credits ledger balances, avatar links, and social connection JSON configurations.
* **`series`:** The parent webtoon entity (holds title, slug, author, cover_image, genre, and synopsis).
* **`chapters` (Replaces legacy flat Projects):** Chronological episodic records (episode_number, slug, status, panels_count, compiled video_url, accumulated AI token usage, and sub-audio volume settings).
* **`scrape_sessions`:** Persisted caches of scraped image list arrays to bypass duplicate web crawling.
* **`edit_history`:** Redo/undo image operation logs referencing cached transformation outputs.
* **`credit_transactions`:** Atomically locked credit expense ledgers (ensuring no double-spending on AI routines).
* **`system_logs` / `user_audit_logs`:** System/user diagnostic telemetry.

---

## 5. Current Panel Model
Panels are stored as discrete relational records in the `panels` grandchild table, linked to `chapters.id` via foreign key cascade:
```sql
CREATE TABLE IF NOT EXISTS panels (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id       TEXT    NOT NULL,
  panel_index      INTEGER NOT NULL,
  image_url        TEXT    NOT NULL,
  original_url     TEXT,
  speech_text      TEXT    NOT NULL DEFAULT '',
  sfx              TEXT    NOT NULL DEFAULT '',
  duration         REAL    NOT NULL DEFAULT 4.5,
  motion_type      TEXT    NOT NULL DEFAULT 'zoom_in',
  visual_description TEXT,
  brightness       REAL,
  contrast         REAL,
  saturation       REAL,
  grayscale        INTEGER NOT NULL DEFAULT 0,
  filter_preset    TEXT,
  bubble_method    TEXT,
  bubble_sensitivity REAL,
  bubble_dilation  REAL,
  inpaint_radius   INTEGER,
  detection_style  TEXT,
  audio_url        TEXT,
  smart_crop       INTEGER NOT NULL DEFAULT 0,
  crop_padding     INTEGER,
  is_sanitized     INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
```

---

## 6. Current Rendering Pipeline
The compiler rendering engine utilizes a MoviePy sub-runner inside Python (`backend/python/media/video.py`):
1. **Frame Extraction:** Source images are loaded via Pillow, and CSS-style canvas filters (brightness, contrast, saturation, grayscale, custom presets) are pre-applied.
2. **Animation Choreography:** MoviePy applies real-time sub-clip transformations:
   - `zoom_in`/`zoom_out`: Dynamic resizing over the panel duration.
   - `pan_left`/`pan_right`/`pan_up`/`pan_down`: Translational crop offset increments.
3. **Audio Composing:** Sound layers are combined into a composite audio track:
   - Dialog voiceover track (`audio_url`).
   - Sound effect overlay (`sfx` keyframe trigger).
   - Background thematic music (`musicTheme`).
   - Dynamic ducking automatically drops the background track volume whenever speech narration is active.
4. **Subtitles & Video Export:** Subtitles (from `speech_text`) are either burned into the frames or exported as a soft-subtitle track, and FFmpeg compresses the output to MP4/WebM.

---

## 7. Current Player Architecture
The player is built as an inline component (**`CinemaPlayer.tsx`**) that serves as a high-fidelity Client-Side Layered Composition Engine:
* **Coordination Offsets:** Renders independent, absolute-positioned DOM layers for background artwork, cropped character assets (`rembg`), and speech bubbles.
* **Aspect-Lock Scaling:** Wraps the entire canvas in an aspect-ratio-locked viewport container. It utilizes a `ResizeObserver` to monitor parent dimensions, applying a CSS transform scale (`transform: scale(scaleFactor)`) to ensure perfect layout preservation across mobile, tablet, and widescreen viewports.
* **Interactions Overlay:** Symmetrical seeks, "Skip Intro" glassmorphic pills, native and mock Picture-in-Picture toggles, variable subtitle styling sliders, and keyboard shortcuts.
* **Wiggle & Breather Animations:** character layers perform continuous, soft 2D breathing hover wiggles via Framer Motion, and speech bubbles pop in with elastic spring entrance physics.

---

## 8. Current Editor Architecture
The crop and edit workspace is designed around **`ImageEditorPage.tsx`**:
* **Fully Flush App Layout:** Employs flat, non-floating tool and properties panels demarcated by dark borders (`border-neutral-800`), spanning 100% height with zero outer margins or rounded corners on outer workspace boundaries.
* **Dynamic Slicing & Merging:** Real-time vertical/horizontal slicing, frame multi-stitching (configurable gap, alignment, and magnetic snapping), and manual brush-inpainting.
* **Zustand State Synch:** Custom hooks (`useImageEditorState.ts`, `useImageEditor.ts`) prevent infinite render loops by decoupling state synchronizations using ref trackers (`activeImageUrlRef`).

---

## 9. Existing Technical Debt
* **Lack of Single Source of Truth:** Dialogues, transitions, and audio configurations exist strictly at the individual panel level. If a user modifies story structures, there is no centralized document to check for overall narrative flow.
* **FastAPI Direct File Paths:** Image caches and media outputs are written to local folders (`backend/python/local_media`, `public/videos`), which complicates multi-instance cloud deployments (e.g., Vercel, Docker clusters) without S3/Supabase Storage integrations.
* **Hardcoded Edge-TTS Voices:** Language score selections are hardcoded across `usePlaybackEngine.ts` and fallback arrays, rather than querying clean, extensible metadata providers.

---

## 10. Existing Duplicated Logic
* **Proxy Image URLs:** `unwrap_proxy_url` and `wrap_proxy_url` utility logic is rewritten multiple times across `projects.py`, `ai_routes.py`, `db.py`, and the scraper utility.
* **Pillow Resampling Filters:** Backward-compatibility Pillow Lanczos resample checks are duplicated inside `ai_routes.py` and helper image utilities.
* **Audio Calculations:** Word-to-duration ratios are calculated using different speaking speeds in `ai_routes.py` compared to the playback hook.

---

## 11. Performance Bottlenecks
* **Cold Starts on AI Pipelines:** Model warmups for YOLO and rembg are deferred, which can cause severe latencies (10-15s) on the first user crop/segmentation request if models aren't pre-warmed.
* **Synchronous CLI Subprocesses:** Heavy video rendering uses MoviePy processes that block single-thread execution in some workers if not deferred asynchronously.
* **Concurrent SQLite WAL Lockups:** Under massive parallel request volumes, multiple background YOLO model fine-tunings and log streams can write to SQLite simultaneously, causing database busy states.

---

## 12. Components That Should Be Refactored
* **`App.tsx`:** Highly bloated (~1600 lines) with mixed router logic, modal popups, in-memory state hooks, auth states, and header layout blocks. Needs splitting into cleaner router sub-components and isolated modal providers.
* **`useAppLogic.ts` / `useAppState.ts`:** Holds hundreds of lines of mixed states across scraping, cropping, rendering, and notifications. These state boundaries should be modularized.
* **`CinemaPlayer.tsx`:** Renders both layout controls, overlay HUDs, sub-layers, and shortcut listeners. Splitting keyboard HUD sheet, widescreen letterbox overlays, and control menus into sub-files will dramatically improve readability.
