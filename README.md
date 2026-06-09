<div align="center">

# 🎬 Anivox — Webtoon to Video

**Transform webtoon & manhwa comics into cinematic MP4 videos with AI-powered speech bubble removal, TTS voiceovers, and pan/zoom animations.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)

</div>

---

## ✨ Features

- 🖼️ **Panel Scraper** — Fetches webtoon/manhwa panels from any Webtoon series URL
- 🫧 **AI Bubble Removal** — Removes speech bubbles using Gemini vision + OpenCV inpainting with advanced mode, manual brush, presets & history
- 🗣️ **TTS Voiceover** — Generates synced dialogue audio using Microsoft Edge TTS
- 🎬 **Video Compiler** — Renders animated MP4 with pan/zoom effects via MoviePy
- ✂️ **Crop Editor** — Advanced fully-modular editor: manual/auto-crop, horizontal splitter, frame merging/stitching, style filters, enhancements, undo/redo
- 🔀 **Merge Panel** — Vertical/horizontal multi-panel stitching with configurable gap, alignment, and direction
- 🗄️ **Local Database** — SQLite stores all projects and panels (no cloud required)
- 🤖 **Multi-AI** — Supports Gemini 2.5 Flash, Gemini 2.0 Pro, Llama 3, Mistral 7B
- 📟 **Real-Time Shell Logs** — ANSI-colored SSE/polling log stream piped from the backend terminal directly into the UI
- 📊 **Live Metrics** — `/api/metrics` endpoint reports uptime, memory, request stats, rate limits, and cache state
- 🛡️ **Security Middleware** — Rate limiting, request timeouts, CSP headers, request IDs, and CORS baked into the server

---

## 📁 Project Structure

```
webtoon-to-video-backend/
│
├── frontend/                         ← React + TypeScript UI (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── fetchWithInterceptor.ts   ← Global fetch wrapper with error handling
│   │   ├── components/               ← All UI components (.tsx)
│   │   │   ├── crop/                 ← Fully modular Crop Editor sub-components
│   │   │   │   ├── auto/             ← AutoSlicer (Canny + settings)
│   │   │   │   ├── canvas/           ← CropCanvas, brush/bubble/split layers
│   │   │   │   ├── clean/            ← CleanBubblesPanel + Advanced/Manual/Presets/History/Modes
│   │   │   │   ├── cuts/             ← CutsRegistry + fine-tune, list, selector
│   │   │   │   ├── editor/           ← CropEditorCanvasContainer, Header, Footer, Sidebar, ToolsPanel
│   │   │   │   ├── enhancements/     ← Enhancements: Audio, Cinematic, Colors, Presets
│   │   │   │   ├── horizontal/       ← HorizontalSplitter + Controls, Presets, Preview
│   │   │   │   ├── merge/            ← MergePanel + List, Options
│   │   │   │   ├── shared/           ← RangeSlider, SectionTitle, shared types
│   │   │   │   ├── utils/            ← gutterScanner.ts (browser-based gutter detection)
│   │   │   │   ├── index.ts          ← Barrel exports for all crop sub-components
│   │   │   │   └── types.ts          ← Crop-scoped TypeScript types
│   │   │   ├── pipeline/
│   │   │   │   └── PipelineStatusCard.tsx
│   │   │   ├── processing/           ← AutoCropModal, BubbleCleanerModal
│   │   │   ├── scraper/              ← LiveScraperDeck, Grid, Header, PanelCard, Controls, etc.
│   │   │   │   ├── AutoCropLeftColumn.tsx / AutoCropRightColumn.tsx / AutoCropSettingsPanel.tsx
│   │   │   │   ├── BubbleCleanerLeftColumn.tsx / BubbleCleanerRightColumn.tsx
│   │   │   │   ├── LiveScraperDeck.tsx / LiveScraperGrid.tsx / LiveScraperHeader.tsx
│   │   │   │   ├── PanelCard.tsx / PanelCardActions.tsx / PanelCardControls.tsx / PanelCardThumbnail.tsx
│   │   │   │   ├── ScraperActionButtons.tsx / ScraperControls.tsx / ScraperSelectionToolbar.tsx / UrlInputPanel.tsx
│   │   │   │   ├── autoCropConfig.ts / bubbleCleanerConfig.ts / types.ts
│   │   │   ├── status/
│   │   │   │   └── ModelStatusTable.tsx
│   │   │   ├── terminal/             ← TerminalLogs + Filter, Header, Output
│   │   │   ├── timeline/             ← StoryboardTimeline + BulkOps, Card, EmptyState, Header
│   │   │   ├── video/                ← VideoMonitor, VideoMonitorActive, Tabs, FinalVideoPlayer, VolumePanel
│   │   │   ├── AppWorkspace.tsx      ← Main workspace layout component
│   │   │   ├── AdvancedSettings.tsx
│   │   │   ├── CropEditorModal.tsx   ← Crop editor modal shell
│   │   │   ├── ErrorPopupModal.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── NotificationStack.tsx
│   │   │   └── OutputMetadataPanel.tsx
│   │   ├── hooks/                    ← All custom React hooks (logic extracted from App.tsx)
│   │   │   ├── useAppLogic.ts / useAppState.ts
│   │   │   ├── useAutoAnalysis.ts
│   │   │   ├── useBatchImageActions.ts / useBulkOperations.ts
│   │   │   ├── useCompileActions.ts
│   │   │   ├── useCropEditor.ts / useCropEditorDrag.ts / useCropEditorHistory.ts
│   │   │   ├── useCropEditorPipelines.ts / useCropEditorState.ts
│   │   │   ├── useLiveScraperActions.ts
│   │   │   ├── usePersistedState.ts
│   │   │   ├── usePipelineActions.ts / usePlaybackEngine.ts
│   │   │   ├── useSceneModifier.ts / useSingleImageEdits.ts
│   │   │   ├── useStoryboardOperations.ts
│   │   │   └── useVideoGeneration.ts
│   │   ├── utils/
│   │   │   ├── filter.ts             ← Filter/style utility helpers
│   │   │   └── url.ts                ← Frontend URL helpers
│   │   ├── App.tsx                   ← Root page component
│   │   ├── types.ts                  ← Shared TypeScript types
│   │   ├── models.ts                 ← AI model registry
│   │   ├── audio.ts                  ← Web Audio / TTS utilities
│   │   └── utils.ts                  ← Pure helper functions
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                          ← Express server + Python services
│   ├── server.ts                     ← Main entry: middleware stack, route mounting, ANSI logging
│   ├── config/
│   │   └── clients.ts                ← Shared AI clients (Gemini, HF)
│   ├── database/
│   │   ├── db.ts                     ← SQLite singleton + query helpers
│   │   ├── schema.sql                ← Table definitions (auto-applied)
│   │   └── webtoon_local.db          ← Auto-created SQLite file (git-ignored)
│   ├── routes/
│   │   ├── health.ts                 ← Liveliness probe route
│   │   ├── projects.ts               ← Project history and panels CRUD
│   │   ├── imageRoutes.ts            ← Image router entry (mounts image/ sub-routes)
│   │   ├── aiRoutes.ts               ← AI router entry (mounts ai/ sub-routes)
│   │   ├── scraperRoutes.ts          ← Scraper router entry (mounts scraper/ sub-routes)
│   │   ├── ai/
│   │   │   ├── analyze.ts            ← Gemini image analysis, speech text, panel detection
│   │   │   ├── crop.ts               ← AI smart crop
│   │   │   └── video.ts              ← Video compile wrapper
│   │   ├── image/
│   │   │   ├── proxy.ts              ← Referrer-bypass image proxy
│   │   │   ├── edit.ts               ← Crop, rotate, flip
│   │   │   ├── merge.ts              ← Multi-panel stitching
│   │   │   ├── cleanup.ts            ← Speech bubble removal (OpenCV/Gemini)
│   │   │   └── zip.ts                ← ZIP archive generation
│   │   └── scraper/
│   │       ├── scrape.ts             ← Webtoon crawler
│   │       ├── generate.ts           ← Storyboard AI generation
│   │       └── process.ts            ← Panel detection pipeline
│   ├── services/                     ← Node.js service helpers
│   │   ├── crawlers.ts               ← Webtoon HTTP crawlers
│   │   ├── scraperService.ts         ← Scraper orchestration
│   │   └── storyboardAI.ts           ← AI storyboard narrative engine
│   ├── python/                       ← Python services package
│   │   ├── routes/
│   │   │   └── process.py            ← FastAPI panel detection route
│   │   └── services/
│   │       ├── audio.py              ← TTS via edge-tts + pydub
│   │       ├── borderless.py         ← Borderless panel detection helper
│   │       ├── bubble_detector.py    ← Bubble detection core logic
│   │       ├── cleaner.py            ← Speech bubble removal (OpenCV/Pillow)
│   │       ├── detect_panels.py      ← Panel boundary detection
│   │       ├── narration.py          ← Narration text utilities
│   │       ├── ocr.py                ← Panel processor + OCR
│   │       ├── sfx.py                ← Sound effects helper
│   │       ├── shout.py              ← Shouting text detection
│   │       ├── standard.py           ← Standard speech bubble helper
│   │       ├── video.py              ← MP4 compiler via MoviePy
│   │       └── test_cleaner.py       ← Cleaner unit tests
│   └── utils/
│       ├── cache.ts                  ← Shared memory cache + TTL eviction
│       ├── colors.ts                 ← ANSI color helper utilities
│       ├── cvUtils.py                ← OpenCV helper functions (Python)
│       ├── imageUtils.ts             ← Buffer resolution & auto-cropping
│       ├── logInterceptor.ts         ← console.* → SSE color-broadcast interceptor
│       └── urlUtils.ts               ← Region-stripping & URL parsing
│
├── data/                             ← Temp outputs & text files
├── tests/                            ← Test scripts
├── .env                              ← Your local env vars (git-ignored)
├── .env.example                      ← Template — copy to .env
├── requirements.txt                  ← Python pip dependencies
├── package.json                      ← Node.js dependencies + scripts
└── RULES.md                          ← AI agent guidelines (read first)
```

---

## 🚀 Quick Start

### Prerequisites

| Tool    | Version | Download                         |
| ------- | ------- | -------------------------------- |
| Node.js | 20+     | https://nodejs.org               |
| Python  | 3.11+   | https://python.org               |
| ffmpeg  | any     | https://ffmpeg.org/download.html |

> **Windows ffmpeg install:** `winget install ffmpeg`  
> **macOS:** `brew install ffmpeg`  
> **Linux:** `sudo apt install ffmpeg`

---

### 1️⃣ Clone & Install Node Dependencies

```bash
git clone <your-repo-url>
cd webtoon-to-video-backend
npm install
```

### 2️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ First install downloads ~2GB (PyTorch + EasyOCR models). Subsequent runs are instant.

### 3️⃣ Configure Environment Variables

```bash
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

Then open `.env` and fill in your keys:

```env
# REQUIRED — get free at https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIza..."

# OPTIONAL — get at https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY="hf_..."
```

### 4️⃣ Start the App

```bash
npm run start
```

The frontend app opens at **http://localhost:3000** while the backend API listens on **http://localhost:5173**.

---

## 🌐 API Reference

### System

| Method | Endpoint       | Description                                               |
| ------ | -------------- | --------------------------------------------------------- |
| `GET`  | `/api/health`  | Health check — returns DB status and stats                |
| `GET`  | `/api/metrics` | Live server metrics: memory, requests, cache, rate limits |

### Project History (SQLite)

| Method   | Endpoint                   | Description                    |
| -------- | -------------------------- | ------------------------------ |
| `GET`    | `/api/projects`            | List all saved projects        |
| `GET`    | `/api/projects/:id`        | Get a project + all its panels |
| `POST`   | `/api/projects`            | Save a new project             |
| `POST`   | `/api/projects/:id/panels` | Save panels for a project      |
| `DELETE` | `/api/projects/:id`        | Delete a project               |

### Image Processing

| Method | Endpoint                     | Description                                        |
| ------ | ---------------------------- | -------------------------------------------------- |
| `GET`  | `/api/proxy-image?url=`      | Proxy-fetch a webtoon image (bypasses CORS)        |
| `POST` | `/api/edit-image`            | Crop, rotate, or flip an image frame               |
| `POST` | `/api/merge-images`          | Stitch multiple panel images (vertical/horizontal) |
| `POST` | `/api/remove-speech-bubbles` | Run Python speech bubble removal (OpenCV + Gemini) |
| `POST` | `/api/download-zip`          | Package selected images into a ZIP archive         |
| `GET`  | `/api/download-zip/get/:id`  | Download a pre-generated ZIP file                  |

### AI Generation

| Method | Endpoint                    | Description                                 |
| ------ | --------------------------- | ------------------------------------------- |
| `POST` | `/api/analyze-image`        | Full panel analysis — captions, SFX, motion |
| `POST` | `/api/generate-speech-text` | Generate dialogue/subtitle from image       |
| `POST` | `/api/ai-detect-panels`     | Detect panel regions using Gemini vision    |
| `POST` | `/api/ai-smart-crop`        | AI bounding-box auto-crop                   |

### Video & Audio

| Method | Endpoint                       | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| `POST` | `/api/convert-images-to-video` | Compile final MP4 from storyboard panels |
| `POST` | `/api/generate-tts`            | Generate TTS audio for a panel           |

### Scraper

| Method | Endpoint             | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| `POST` | `/api/scrape-images` | Scrape panel images from a Webtoon URL       |
| `POST` | `/api/generate`      | Generate AI storyboard narrative from panels |
| `POST` | `/api/detect-panels` | Detect and crop panels from a single image   |

### Logs & Monitoring

| Method | Endpoint                  | Description                                        |
| ------ | ------------------------- | -------------------------------------------------- |
| `GET`  | `/api/system-logs`        | JSON log lookup (polling fallback)                 |
| `GET`  | `/api/system-logs/stream` | SSE stream — pushes ANSI-colored server logs to UI |

---

## 🗄️ Local Database

The app uses **SQLite** — a zero-config, file-based database stored at:

```
backend/database/webtoon_local.db
```

It is **auto-created on first startup** — no setup needed.

### Tables

| Table             | Description                                      |
| ----------------- | ------------------------------------------------ |
| `projects`        | All processed webtoon projects                   |
| `panels`          | Every panel's image, text, filters, and settings |
| `scrape_sessions` | Cached scrape results per URL                    |
| `edit_history`    | Undo/redo history (persists across restarts)     |

---

## 🛠️ NPM Scripts

| Command                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `npm run start`          | Start backend (5173) + Vite frontend (3000) (development) |
| `npm run dev`            | Alias for `npm run start`                                 |
| `npm run backend`        | Start backend dev server only                             |
| `npm run frontend`       | Start frontend dev server only                            |
| `npm run build`          | Build frontend and bundle backend to `dist/` (production) |
| `npm run build:frontend` | Build only the frontend package                           |
| `npm run build:backend`  | Bundle only the backend to `dist/server.cjs`              |
| `npm run preview`        | Preview the frontend build (Vite preview)                 |
| `npm run start:prod`     | Run production build from `dist/server.cjs`               |
| `npm run clean`          | Remove `dist/` (cross-platform; uses `rimraf`)            |
| `npm run lint`           | TypeScript type check (`frontend/tsconfig.json`)          |
| `npm run typecheck`      | Run `tsc --noEmit` across the workspace                   |
| `npm run format`         | Format code with Prettier                                 |
| `npm run test`           | Placeholder test command                                  |
| `npm run install:python` | Install Python dependencies from `requirements.txt`       |
| `npm run docker:build`   | Build a local Docker image                                |
| `npm run docker:run`     | Run the Docker image (exposes port 3000)                  |

Developer notes:

- Use `npm run start` for local development (starts both backend and frontend).
- Use `npm run build` and then `npm run start:prod` to run the production bundle.
- Run `npm run format` and `npm run typecheck` before committing changes.

---

## 🤖 AI Models Supported

| Model            | Provider    | Use                           |
| ---------------- | ----------- | ----------------------------- |
| Gemini 2.5 Flash | Google      | Default — fast, multimodal    |
| Gemini 2.0 Pro   | Google      | High quality generation       |
| Llama 3 70B      | HuggingFace | Open source, privacy-friendly |
| Mistral 7B       | HuggingFace | Lightweight open source       |

---

## 🐍 Python Services

| File                 | Library                 | Purpose                           |
| -------------------- | ----------------------- | --------------------------------- |
| `cleaner.py`         | OpenCV, Pillow, EasyOCR | Speech bubble detection + removal |
| `bubble_detector.py` | OpenCV, NumPy           | Bubble detection core logic       |
| `audio.py`           | edge-tts, pydub         | TTS voice synthesis               |
| `ocr.py`             | OpenCV, Pillow, NumPy   | Panel OCR + cropping processor    |
| `video.py`           | MoviePy, NumPy          | MP4 animation + audio compilation |
| `detect_panels.py`   | OpenCV                  | Panel boundary detection          |
| `cvUtils.py`         | OpenCV                  | Shared OpenCV utility functions   |

---

## 🔐 Environment Variables

| Variable              | Required | Description                                    |
| --------------------- | -------- | ---------------------------------------------- |
| `GEMINI_API_KEY`      | ✅ Yes   | Google AI Studio API key                       |
| `HUGGINGFACE_API_KEY` | Optional | HuggingFace token for open models              |
| `NODE_ENV`            | Optional | `development` or `production`                  |
| `PORT`                | Optional | Server port (default: `5173`)                  |
| `SLOW_REQ_MS`         | Optional | Slow request threshold in ms (default: `3000`) |
| `RATE_LIMIT_RPM`      | Optional | Max requests/min per IP (default: `120`)       |
| `REQ_TIMEOUT_MS`      | Optional | Request timeout in ms (default: `30000`)       |
| `MAINTENANCE_MODE`    | Optional | Set `true` to serve 503 to all requests        |
| `STANDALONE_SERVER`   | Optional | Set `true` to skip Vite and run API-only       |
| `DATABASE_URL`        | Optional | SQLite path (auto-set)                         |

---

## 📜 For AI Agents

Read **[RULES.md](./RULES.md)** before making any changes.  
It contains the full project structure, coding rules, API patterns, and session changelog that all AI assistants must follow.

---

<div align="center">
Built with ❤️ using React, Express, Python, OpenCV, MoviePy & Gemini AI
</div>
