# Sonikoma System Architecture Overview

This document provides a high-level overview of the global Sonikoma system topology, end-to-end data pipelines, and core technological integrations.

---

## 🗺️ 1. Global System Topology

Sonikoma is structured as a premium, lightweight, self-contained comic-to-video application stack:

```text
       ┌─────────────────────────────────────────────────────────┐
       │                 CLIENT BROWSER (Vite)                   │
       │  ┌───────────────────────┐   ┌───────────────────────┐  │
       │  │   Inline Canvas UI    │   │   Timeline / State    │  │
       │  └───────────┬───────────┘   └───────────▲───────────┘  │
       └──────────────┼───────────────────────────┼──────────────┘
                      │ HTTP / SSE                │ WebSocket / Polling
                      ▼                           │
       ┌──────────────────────────────────────────┴──────────────┐
       │                 FASTAPI BACKEND SERVICE                 │
       │  ┌───────────────────────────────────────────────────┐  │
       │  │ API Endpoints & Request Orchestrator              │  │
       │  └───────────────────────┬───────────────────────────┘  │
       │                          │ Invoke Local / APIs          │
       │  ┌───────────────────────▼───────────────────────────┐  │
       │  │ Media Engines (Pillow, OpenCV, MoviePy)           │  │
       │  └───────────────────────┬───────────────────────────┘  │
       │                          │ Persistent Reads/Writes      │
       │  ┌───────────────────────▼───────────────────────────┐  │
       │  │ Data Storage (SQLite webtoon_local.db)            │  │
       │  └───────────────────────────────────────────────────┘  │
       └─────────────────────────────────────────────────────────┘
```

---

## 🔄 2. End-to-End Processing Pipeline

The transformation of a static comic series into a high-fidelity widescreen cinematic video occurs across 5 sequential processing phases:

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. INGESTION    ├────►│ 2. SEGMENTATION ├────►│ 3. ENRICHMENT   ├────►│ 4. CHOREOGRAPHY ├────►│ 5. COMPILATION  │
│ Scrape panels   │     │ Crop individual │     │ AI generates    │     │ User structures │     │ MoviePy builds  │
│ via Playwright  │     │ panels & clean  │     │ TTS voiceovers  │     │ transitions,    │     │ final MP4 video │
│ / ZIP folders   │     │ speech bubbles  │     │ & narratives    │     │ layers, timing  │     │ & soft subtitles│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Detailed Pipeline Stages:
1. **Ingestion (Scraping):** The ingestion module crawls the webtoon chapter URL or extracts a local ZIP. Raw strip images are cached in the data repository, and metadata is populated.
2. **Segmentation (Layout Extraction):** Large multi-panel vertical strip images are automatically sliced into distinct individual panel files using advanced horizontal/vertical splitters and OpenCV boundary scans.
3. **Enrichment (AI Analysis):** Gemini 2.5 models execute a context-aware sequential analysis of all panels in a single pass to produce a unified Chapter Narrative. From this, speech texts, descriptions, and audio instructions are synchronized back to individual panels.
4. **Choreography (Editor Workflow):** In the inline workspace, characters are isolated (via RemBG), speech bubbles are removed (OpenCV inpainting), dialogue text is structured, and the interactive layer engine coordinates wiggle animations, scale entries, and HTML5 multi-track audio playback.
5. **Compilation (Rendering):** The backend compiles the timeline configuration into standard video. Frames are styled, keyframe transformations (zooms/pans) are applied, audio channels (speech, sfx, background music) are mixed, and FFmpeg outputs the production-ready MP4.

---

## 🗄️ 3. Centralized Data Consolidation Strategy

To facilitate zero-configuration local execution and robust state persistence, all system-wide data assets are globally routed to reside under a unified, single-source-of-truth **`data/`** directory in the repository root:

- **`data/webtoon_local.db`:** The primary SQLite relational database.
- **`data/image_cache/`:** Long-term caching for scraped panel strips.
- **`data/media/`:** Rendered output MP4 movies and soft subtitle packages.
- **`data/local_media/`:** Local isolated character layers, panel segmentation crops, and fine-tuned weight artifacts.
- **`data/temp/`:** Temporary compilation chunks and processing files globally managed in Python via a custom `tempfile.tempdir` override.
- **`data/scraped_html/`:** Scraper diagnostics and raw HTML caches.

---

## 🚀 4. System Architectural Reference Maps

For specific deeper layer mappings, refer to:
* **[Frontend Architecture](./frontend-architecture.md):** Client-side Canvas rendering, timeline coordination, and responsive layouts.
* **[Backend Architecture](./backend-architecture.md):** Relational schema structures, FastAPI router-service architectures, and compilation details.
* **[AI Subsystem Architecture](./ai-architecture.md):** Multimodal prompt-engineering skills, TTS provider abstractions, and local computer vision pipelines.
