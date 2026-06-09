# 📋 RULES.md — AI Agent Rules & Project Guidelines

> **EVERY AI assistant (Copilot, Cursor, Gemini, Claude, GPT, etc.) MUST read this file before
> making any change to this repository.**
> This file is the single source of truth for how this project is structured,
> how code should be written, and what patterns must be followed at all times.

---

## 🏗️ Project Overview

**Name:** Anivox — Webtoon-to-Video  
**Purpose:** A full-stack web application that scrapes Webtoon comic panels, processes them using
AI (Google Gemini, HuggingFace), applies image editing (crop, speech-bubble removal via OpenCV),
and compiles the results into a cinematic MP4 video.

**Tech Stack:**

| Layer | Technology |
|---|---|
| Frontend UI | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend Server | Node.js + Express + TypeScript (`tsx` for dev) |
| Image Processing | Python 3 + OpenCV + Sharp (Node) + Pillow |
| AI / ML | Google Gemini API (`@google/genai`) + HuggingFace Inference |
| Audio / TTS | `edge-tts` Python library + pydub |
| Video Compilation | MoviePy (Python) |
| Database | SQLite (via `better-sqlite3`) |
| Build Tool | Vite (frontend) + esbuild (backend bundle) |

---

## 📁 File & Folder Structure

```
webtoon-to-video-backend/
│
├── frontend/                         ← FRONTEND — React/TypeScript UI
│   ├── src/
│   │   ├── api/
│   │   │   └── fetchWithInterceptor.ts   ← Global fetch wrapper + error interceptor
│   │   ├── components/               ← All reusable React UI components (.tsx)
│   │   │   ├── crop/                 ← Fully modular Crop Editor sub-components
│   │   │   │   ├── auto/             ← AutoSlicer.tsx, AutoSlicerCanny.tsx, AutoSlicerSettings.tsx, bubblePresets.ts
│   │   │   │   ├── canvas/           ← CropCanvas.tsx, CanvasBrushLayer.tsx, CanvasBubbleBoxes.tsx, CanvasCropSelection.tsx, CanvasSplitLines.tsx
│   │   │   │   ├── clean/            ← CleanBubblesPanel.tsx, CleanBubblesAdvanced.tsx, CleanBubblesManual.tsx, CleanBubblesPresets.tsx, CleanBubblesHistory.tsx, CleanBubblesModes.tsx
│   │   │   │   ├── cuts/             ← CutsRegistry.tsx, CutsRegistryFineTune.tsx, CutsRegistryHeader.tsx, CutsRegistryList.tsx, CutsRegistrySelector.tsx
│   │   │   │   ├── editor/           ← CropEditorCanvasContainer.tsx, CropEditorHeader.tsx, CropEditorFooter.tsx, CropEditorSidebar.tsx, CropToolsPanel.tsx
│   │   │   │   ├── enhancements/     ← EnhancementsPanel.tsx, EnhancementsAudio.tsx, EnhancementsCinematic.tsx, EnhancementsColors.tsx, EnhancementsPresets.tsx
│   │   │   │   ├── horizontal/       ← HorizontalSplitter.tsx, HorizontalSplitterControls.tsx, HorizontalSplitterPresets.tsx, HorizontalSplitterPreview.tsx
│   │   │   │   ├── merge/            ← MergePanel.tsx, MergePanelList.tsx, MergePanelOptions.tsx
│   │   │   │   ├── shared/           ← RangeSlider.tsx, SectionTitle.tsx, types.ts
│   │   │   │   ├── utils/            ← gutterScanner.ts
│   │   │   │   ├── index.ts          ← Barrel exports for all crop sub-components
│   │   │   │   └── types.ts          ← Crop-scoped TypeScript types
│   │   │   ├── pipeline/
│   │   │   │   └── PipelineStatusCard.tsx
│   │   │   ├── processing/
│   │   │   │   ├── AutoCropModal.tsx
│   │   │   │   └── BubbleCleanerModal.tsx
│   │   │   ├── scraper/
│   │   │   │   ├── AutoCropLeftColumn.tsx / AutoCropRightColumn.tsx / AutoCropSettingsPanel.tsx
│   │   │   │   ├── BubbleCleanerLeftColumn.tsx / BubbleCleanerRightColumn.tsx
│   │   │   │   ├── LiveScraperDeck.tsx / LiveScraperGrid.tsx / LiveScraperHeader.tsx
│   │   │   │   ├── PanelCard.tsx / PanelCardActions.tsx / PanelCardControls.tsx / PanelCardThumbnail.tsx
│   │   │   │   ├── ScraperActionButtons.tsx / ScraperControls.tsx / ScraperSelectionToolbar.tsx / UrlInputPanel.tsx
│   │   │   │   └── autoCropConfig.ts / bubbleCleanerConfig.ts / types.ts
│   │   │   ├── status/
│   │   │   │   └── ModelStatusTable.tsx
│   │   │   ├── terminal/
│   │   │   │   ├── TerminalLogs.tsx
│   │   │   │   ├── TerminalLogsFilter.tsx
│   │   │   │   ├── TerminalLogsHeader.tsx
│   │   │   │   └── TerminalLogsOutput.tsx
│   │   │   ├── timeline/
│   │   │   │   ├── StoryboardTimeline.tsx
│   │   │   │   ├── TimelineBulkOps.tsx
│   │   │   │   ├── TimelineCard.tsx
│   │   │   │   ├── TimelineEmptyState.tsx
│   │   │   │   └── TimelineHeader.tsx
│   │   │   ├── video/
│   │   │   │   ├── VideoMonitor.tsx / VideoMonitorActive.tsx / VideoMonitorTabs.tsx
│   │   │   │   ├── FinalVideoPlayer.tsx
│   │   │   │   └── VolumeAndProgressPanel.tsx
│   │   │   ├── AppWorkspace.tsx      ← Main workspace layout
│   │   │   ├── AdvancedSettings.tsx
│   │   │   ├── CropEditorModal.tsx   ← Modal shell for the crop editor
│   │   │   ├── ErrorPopupModal.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── NotificationStack.tsx
│   │   │   └── OutputMetadataPanel.tsx
│   │   ├── hooks/                    ← All custom React hooks
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
│   │   │   ├── filter.ts             ← Filter/style helpers
│   │   │   └── url.ts                ← Frontend URL helpers
│   │   ├── App.tsx                   ← Root React component (main page logic)
│   │   ├── audio.ts                  ← Frontend audio utilities (Web Audio API)
│   │   ├── index.css                 ← Global CSS styles + Tailwind base
│   │   ├── main.tsx                  ← React entry point (renders <App />)
│   │   ├── models.ts                 ← AI model registry
│   │   ├── types.ts                  ← Shared TypeScript interfaces (GeneratedPanel, etc.)
│   │   └── utils.ts                  ← Shared helper utilities (pure functions only)
│   ├── index.html                    ← HTML entry point for Vite
│   ├── vite.config.ts                ← Vite config (build + dev proxy → port 5173)
│   └── tsconfig.json                 ← TypeScript compiler settings
│
├── backend/                          ← BACKEND — Express server + Python services
│   ├── server.ts                     ← Main entry: middleware, ANSI logging, route mounting
│   ├── config/
│   │   └── clients.ts                ← Shared AI clients config (Gemini, HuggingFace)
│   ├── database/                     ← LOCAL DATABASE (SQLite)
│   │   ├── db.ts                     ← DB singleton + typed query helpers
│   │   ├── schema.sql                ← Table definitions (applied on first boot)
│   │   └── webtoon_local.db          ← SQLite file (auto-created, NOT committed to git)
│   ├── routes/
│   │   ├── health.ts                 ← Health probe API router
│   │   ├── projects.ts               ← Projects & panels CRUD API router
│   │   ├── imageRoutes.ts            ← Image router entry (mounts image/ sub-routes)
│   │   ├── aiRoutes.ts               ← AI router entry (mounts ai/ sub-routes)
│   │   ├── scraperRoutes.ts          ← Scraper router entry (mounts scraper/ sub-routes)
│   │   ├── ai/
│   │   │   ├── analyze.ts            ← Gemini image analysis, speech text, panel detect
│   │   │   ├── crop.ts               ← AI smart crop
│   │   │   └── video.ts              ← Video compile wrapper
│   │   ├── image/
│   │   │   ├── proxy.ts              ← Referrer-bypass image proxy
│   │   │   ├── edit.ts               ← Crop, rotate, flip pipeline
│   │   │   ├── merge.ts              ← Multi-panel canvas stitching
│   │   │   ├── cleanup.ts            ← Speech bubble removal (OpenCV/Gemini)
│   │   │   └── zip.ts                ← ZIP archive generation
│   │   └── scraper/
│   │       ├── scrape.ts             ← Webtoon crawler
│   │       ├── generate.ts           ← AI storyboard generation
│   │       └── process.ts            ← Panel detection pipeline
│   ├── services/                     ← Node.js service helpers
│   │   ├── crawlers.ts               ← Webtoon HTTP crawlers
│   │   ├── scraperService.ts         ← Scraper orchestration
│   │   └── storyboardAI.ts           ← AI storyboard narrative engine
│   ├── python/                       ← Python services package
│   │   ├── routes/
│   │   │   └── process.py            ← FastAPI panel detection route
│   │   └── services/
│   │       ├── audio.py              ← TTS generation using edge-tts
│   │       ├── borderless.py         ← Borderless panel detection helper
│   │       ├── bubble_detector.py    ← Bubble detection core logic
│   │       ├── cleaner.py            ← Speech bubble removal (OpenCV/Pillow, CLI)
│   │       ├── detect_panels.py      ← Panel boundary detection
│   │       ├── narration.py          ← Narration text utilities
│   │       ├── ocr.py                ← OCR dialogue extraction
│   │       ├── sfx.py                ← Sound effects helper
│   │       ├── shout.py              ← Shouting text detection
│   │       ├── standard.py           ← Standard speech bubble helper
│   │       ├── video.py              ← MP4 compilation using MoviePy
│   │       └── test_cleaner.py       ← Cleaner unit tests
│   └── utils/
│       ├── cache.ts                  ← Shared memory cache state + TTL eviction
│       ├── colors.ts                 ← ANSI color helper utilities (shared)
│       ├── cvUtils.py                ← OpenCV shared helper functions (Python)
│       ├── imageUtils.ts             ← Buffer resolver & auto-cropping helpers
│       ├── logInterceptor.ts         ← Intercepts console.* → SSE color broadcast
│       └── urlUtils.ts               ← Webtoon URL parsing & region helpers
│
├── data/                             ← TEXT DATA — temp outputs, logs, text files
├── tests/                            ← TEST FILES
├── .env.example                      ← Template for environment variables
├── .gitignore
├── metadata.json                     ← Project metadata
├── package.json                      ← Node.js dependencies + npm scripts
├── package-lock.json                 ← Locked dependency versions (DO NOT edit)
├── requirements.txt                  ← Python pip dependencies
├── RULES.md                          ← THIS FILE — AI rules and guidelines
└── README.md                         ← User-facing setup instructions
```

### ❌ What NOT to Put Where

| ❌ Wrong | ✅ Correct |
|---|---|
| React components in root or `backend/` | All `.tsx` components go in `frontend/src/components/` |
| Python scripts in `frontend/` | All Python goes in `backend/python/services/` |
| API routes in `frontend/` files | All API routes go in `backend/routes/` sub-folders |
| Type definitions scattered everywhere | All shared types go in `frontend/src/types.ts` |
| One-off test scripts in root | Put tests in `tests/` folder |
| Temp/data files in root | Put them in the `data/` folder |
| Business logic in React components | Keep logic in hooks (`frontend/src/hooks/`) |
| Large monolithic component files | Split into modular sub-components in sub-folders |
| Large route files | Split into `backend/routes/ai/`, `image/`, `scraper/` sub-files |
| Configs at root (vite/tsconfig) | Frontend configs live in `frontend/` |

---

## 🔌 API Architecture

### Node.js Express API (`server.ts`)

All HTTP API endpoints are mounted via sub-routers. The server runs on **port 5173** by default.

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Liveness probe / health check |
| `/api/metrics` | GET | Live server + cache stats (memory, requests, rate limits) |
| `/api/system-logs` | GET | JSON log polling fallback |
| `/api/system-logs/stream` | GET | SSE stream — pushes ANSI-colored logs to UI |
| `/api/proxy-image` | GET | Proxies external Webtoon images (bypasses CORS + Referer) |
| `/api/edit-image` | POST | Crop, rotate, flip a single image using Sharp |
| `/api/merge-images` | POST | Stitch multiple panels vertically or horizontally |
| `/api/remove-speech-bubbles` | POST | Python OpenCV speech bubble removal |
| `/api/download-zip` | POST | Packages selected images into a ZIP archive |
| `/api/download-zip/get/:id` | GET | Downloads a pre-generated ZIP file |
| `/api/analyze-image` | POST | Gemini vision analysis: captions, SFX, timing |
| `/api/generate-speech-text` | POST | Generate dialogue/subtitle text from a panel image |
| `/api/ai-detect-panels` | POST | AI-powered panel detection using Gemini |
| `/api/ai-smart-crop` | POST | AI bounding-box auto-crop |
| `/api/convert-images-to-video` | POST | Compiles panels into a cinematic MP4 |
| `/api/generate-tts` | POST | Generate TTS audio for a panel |
| `/api/scrape-images` | POST | Scrape panel images from a Webtoon URL |
| `/api/generate` | POST | AI storyboard narrative generation |
| `/api/detect-panels` | POST | OpenCV contour-based panel detection |
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/:id` | GET/DELETE | Get or delete a project |
| `/api/projects/:id/panels` | POST | Save panels for a project |

### Python Routes (`backend/python/routes/process.py`)

FastAPI routes for heavy CPU/ML workloads:

| Endpoint | Method | Description |
|---|---|---|
| `/process` | POST | Full pipeline: scrape → OCR → TTS → video compile |
| `/detect-panels` | POST | OpenCV contour-based panel detection |

---

## 🛠️ Backend Rules (Node.js Express)

### 1. Gemini API Usage
- **Always** use `callGeminiWithRetry()` when calling `ai.models.generateContent()`. Never call the Gemini API directly without retry logic.
- Use exponential back-off for 429 (rate limit) and 503 (service unavailable) errors.
- Always provide a **structured fallback** response if all retries fail. Never throw a 500 with no data.
- Use `gemini-2.5-flash` as the default model unless the user explicitly selects another.

```typescript
// ✅ CORRECT — use callGeminiWithRetry
const response = await callGeminiWithRetry(() => ai.models.generateContent({...}), 4, 1500);

// ❌ WRONG — direct call with no retry protection
const response = await ai.models.generateContent({...});
```

### 2. Image Resolution
- **Always** use `resolveImageToBuffer(url)` to fetch any image by URL.
- Never call `fetch()` directly on an image URL in a route handler.

### 3. In-Memory Cache
- `stitchedCache` (`Map<string, {data: Buffer, contentType: string}>`) stores processed images.
- Keys follow the pattern: `stitched_<timestamp>_<descriptor>` (e.g., `stitched_1712345678_cropped`).
- **Always** register new URLs in `editHistory` so undo operations work correctly.
- The cache is in-memory only — it does not survive server restarts.
- Cache stats are exposed via `getAllCacheStats()` and the `/api/metrics` endpoint.

### 4. Calling Python Scripts
- Call Python scripts via `exec()` with sanitized, allow-listed parameters only.
- Python scripts live in `backend/python/services/`
- Always use `python3` (not `python`) when executing scripts.
- Always write temp files to `os.tmpdir()` (never to the project directory).
- Clean up temp files (`unlink`) after processing, even if an error occurs.
- If the Python script fails, return a structured error JSON — never crash the server.

```typescript
// ✅ CORRECT — sanitized params + structured error response
const allowedMethods = ["inpaint", "blur", "solid_white", "transparent"];
const activeMethod = allowedMethods.includes(method) ? method : "inpaint";
```

### 5. Route Error Handling
- Every `async` route handler must have a `try/catch`.
- On error: return `res.status(500).json({ error: "<descriptive message>" })`.
- Log errors with `console.error("[RoutePrefix] Error:", err)`.
- Never expose raw stack traces in API responses.

### 6. Console Logging (ANSI Colors)
- All `console.log/warn/error` calls in the backend are intercepted by `logInterceptor.ts` and broadcast via SSE to the UI terminal.
- Use the shared `colors.ts` helpers for consistent ANSI formatting.
- Prefix all log messages with a colored bracket tag, e.g. `[Scraper]`, `[Helper Scraper]`, `[API]`.
- Use `col.success()`, `col.warn()`, `col.error()`, `col.info()`, `col.label()` from the color palette.

### 7. New API Endpoints
When adding a new endpoint:
1. Add a comment header explaining the endpoint's purpose.
2. Validate all required body parameters at the top of the handler.
3. Use `resolveImageToBuffer()` for any image URL input.
4. Wrap the logic in `try/catch`.
5. Add the route to the correct sub-router in `backend/routes/ai/`, `image/`, or `scraper/`.
6. Document the new endpoint in the API table in this `RULES.md`.

### 8. Route Modularization
- Never put all routes in a single file.
- Routes must be split by domain: `ai/`, `image/`, `scraper/` sub-folders under `backend/routes/`.
- Each sub-folder has its own router file; the root `aiRoutes.ts`, `imageRoutes.ts`, and `scraperRoutes.ts` are entry points only.

---

## 🎨 Frontend Rules (React / TypeScript)

### 1. File Placement
- **All** React components go in `frontend/src/components/` as `.tsx` files.
- **All** shared TypeScript types go in `frontend/src/types.ts`.
- **All** AI model definitions go in `frontend/src/models.ts`.
- **All** pure utility functions go in `frontend/src/utils.ts` or `frontend/src/utils/`.
- **All** custom React hooks go in `frontend/src/hooks/`.
- Audio/TTS browser utilities go in `frontend/src/audio.ts`.
- The global fetch wrapper lives at `frontend/src/api/fetchWithInterceptor.ts`.

### 2. Component Rules
- Use **functional components** only. No class components.
- Use `React.FC` or typed props interfaces for all components.
- Keep components **focused** — one responsibility per component.
- Large components (>300 lines) MUST be split into modular sub-components in a sub-folder.
- Do NOT put API fetch logic directly inside JSX. Use hooks or callbacks.
- Prefix all console logs with a component tag: `console.log("[ComponentName]", ...)`.

### 3. Hook Rules
- All stateful logic and side effects should live in custom hooks in `frontend/src/hooks/`.
- Never put large blocks of business logic directly in `App.tsx` or `AppWorkspace.tsx`.
- Name hooks with the `use` prefix. Each hook should have a single, clear responsibility.

### 4. TypeScript Types
- Define all panel data shapes using the `GeneratedPanel` interface in `src/types.ts`.
- Do NOT use `any` type unless absolutely necessary with a comment explaining why.
- Use strict typing for all API response objects.

```typescript
// ✅ CORRECT
interface GeneratedPanel {
  id: number;
  image_url: string;
  speech_text: string;
  duration: number;
  motion_type: string;
  // ... see src/types.ts for full definition
}

// ❌ WRONG
const panel: any = await fetchPanel();
```

### 5. API Calls from Frontend
- All API calls go to `/api/...` paths (proxied through Vite to the Express server).
- Always handle loading states and show errors to the user via the `NotificationStack` component.
- Use `try/catch` around all `fetch()` calls.
- Use `fetchWithInterceptor` from `frontend/src/api/fetchWithInterceptor.ts` for all API calls.
- Never hardcode `localhost:3000` or any port in frontend code.

### 6. Styling
- Use **Tailwind CSS** utility classes for all styling.
- No inline `style={{}}` objects unless for truly dynamic values (e.g., calculated widths/positions).
- Global CSS goes in `src/index.css`.
- Use dark-mode-first design (dark backgrounds, light text).

---

## 🐍 Python Backend Rules (`backend/python/`)

### 1. Service Responsibilities

| File | Responsibility |
|---|---|
| `backend/python/services/audio.py` | Text-to-speech generation using `edge-tts`. Outputs `.mp3` files. |
| `backend/python/services/cleaner.py` | Speech bubble detection and removal using OpenCV / Pillow. Called via CLI args. |
| `backend/python/services/bubble_detector.py` | Core bubble detection logic (used by cleaner.py). |
| `backend/python/services/ocr.py` | OCR to extract text/dialogue from comic panel images. |
| `backend/python/services/video.py` | MoviePy-based MP4 video compilation from panel images + audio. |
| `backend/python/services/detect_panels.py` | Panel boundary detection using OpenCV. |
| `backend/utils/cvUtils.py` | Shared OpenCV utility functions used across Python services. |

### 2. CLI Interface for `cleaner.py`
The cleaner script is called from Node.js via shell `exec()`. It must always:
- Accept `--image_path`, `--output_path`, `--method`, `--sensitivity`, `--dilation`, `--inpaint_radius`, `--detection_style` arguments.
- Print `OPENCV_SUPPORT=TRUE` to stdout if OpenCV is available.
- Print `BUBBLES_DETECTED=TRUE` to stdout if speech bubbles were found.
- Always write the output image to `--output_path`, even if no bubbles were found (just copy the input).

### 3. Graceful Fallbacks
- All Python services must handle `ImportError` for optional packages (cv2, moviepy).
- If a required library is unavailable, log a clear warning and fall back to a simpler implementation (e.g., use PIL instead of cv2).

### 4. No Absolute Paths
- Never hardcode absolute file paths in Python code.
- Use `os.path.join()`, `os.path.dirname(__file__)`, or receive paths as arguments.
- Temp files go in `os.tmpdir()` or `/tmp/webtoon_workspace/<project_id>/`.

### 5. Logging
- Use Python's `logging` module. Logger name format: `"webtoon_engine.<module>"`.
- Example: `logger = logging.getLogger("webtoon_engine.services.cleaner")`
- Do not use bare `print()` statements in service files (only in the CLI entry point).

---

## 🔑 Environment Variables

All environment variables are defined in `.env` (copy from `.env.example`). Never commit `.env`.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI features |
| `HUGGINGFACE_API_KEY` | ⚡ Optional | HuggingFace API key for open-source models |
| `PORT` | ⚡ Optional | Server port (default: `5173`) |
| `NODE_ENV` | ⚡ Optional | `development` or `production` |
| `SLOW_REQ_MS` | ⚡ Optional | Slow request threshold ms (default: `3000`) |
| `RATE_LIMIT_RPM` | ⚡ Optional | Max requests/min per IP (default: `120`) |
| `REQ_TIMEOUT_MS` | ⚡ Optional | Request timeout ms (default: `30000`) |
| `API_VERSION` | ⚡ Optional | API version string shown in headers |
| `MAINTENANCE_MODE` | ⚡ Optional | Set `true` to serve 503 to all requests |
| `STANDALONE_SERVER` | ⚡ Optional | Set `true` to skip Vite and run API-only |
| `DISABLE_HMR` | ⚡ Optional | Set `true` to disable Vite HMR in dev |
| `DATABASE_URL` | ⚡ Optional | SQLite path (auto-set) |

**Rules:**
- Always check `process.env.GEMINI_API_KEY` before initializing the AI client.
- If `GEMINI_API_KEY` is missing, the server must still start and serve non-AI endpoints.
- Never log API keys, even partially.
- Never hardcode API keys anywhere in code.

---

## 🗃️ Database

The project uses **SQLite** via `better-sqlite3`.

- DB file: `backend/database/webtoon_local.db` (auto-created, git-ignored)
- Schema: `backend/database/schema.sql` (applied on first boot)
- Query helpers: `backend/database/db.ts`
- The `/api/health` endpoint returns DB connection status and table stats.
- If adding DB functionality: use parameterized queries only. Never use string concatenation for SQL.

| Table | Description |
|---|---|
| `projects` | All processed webtoon projects |
| `panels` | Every panel's image, text, filters, and settings |
| `scrape_sessions` | Cached scrape results per URL |
| `edit_history` | Undo/redo history (persists across restarts) |

---

## 🚀 npm Scripts

| Command | Description |
|---|---|
| `npm run start` | Start backend + Vite frontend (development)
| `npm run dev` | Alias for `npm run start` (recommended shorthand)
| `npm run backend` | Start backend dev server only
| `npm run frontend` | Start frontend dev server only
| `npm run build` | Build frontend and bundle backend to `dist/` (production)
| `npm run build:frontend` | Build only the frontend with Vite
| `npm run build:backend` | Bundle only the backend with esbuild to `dist/server.cjs`
| `npm run preview` | Preview frontend build (Vite preview)
| `npm run start:prod` | Run the production bundle from `dist/server.cjs`
| `npm run clean` | Remove `dist/` (cross-platform using `rimraf`)
| `npm run lint` | TypeScript checks for the frontend (`frontend/tsconfig.json`)
| `npm run typecheck` | Run `tsc --noEmit` for workspace-wide type checking
| `npm run format` | Format code using Prettier
| `npm run test` | Placeholder test command (update when adding tests)
| `npm run install:python` | Install Python deps: `pip install -r requirements.txt`
| `npm run docker:build` | Build local Docker image
| `npm run docker:run` | Run the built Docker image (example helper)

**Rules & best practices:**
- Use `npm run start` for local development (starts both backend and frontend).
- Use `npm run build` then `npm run start:prod` to run the production bundle.
- Run `npm run format` and `npm run typecheck` before committing changes.
- Do not run `server.ts` directly in production; always use the bundled `dist/server.cjs`.
- Keep `package.json` scripts up-to-date and document any additions in this file.

---

## 🧩 Key Patterns Used in This Codebase

### 1. Image Cache Pattern
```typescript
// Store processed image in memory
const uniqueId = `stitched_${Date.now()}_<descriptor>`;
const newUrl = `/api/stitch-images/cached/${uniqueId}`;
stitchedCache.set(uniqueId, { data: buffer, contentType: "image/png" });
editHistory.set(newUrl, originalUrl); // Register for undo support
return res.json({ success: true, url: newUrl });
```

### 2. Gemini Retry Pattern
```typescript
const result = await callGeminiWithRetry(() =>
  ai.models.generateContent({ model, contents, config }), 4, 1500
);
```

### 3. Python Shell Call Pattern
```typescript
const pythonCommand = `python3 backend/python/services/cleaner.py --image_path "${tempIn}" --output_path "${tempOut}" --method "${method}"`;
exec(pythonCommand, (error, stdout, stderr) => {
  if (error) { /* handle failure, return structured error */ }
  else { /* read tempOut, cache result, return URL */ }
});
```

### 4. ANSI Console Logging Pattern
```typescript
// Use the color palette from backend/utils/colors.ts
import { col, c } from '../utils/colors.js';
console.log(`${col.info('[Scraper]')} Fetching ${col.value(url)}`);
console.warn(`${col.warn('[Helper Scraper]')} Retrying after ${col.value('2s')}...`);
console.error(`${col.error('[API]')} Request failed: ${col.error(err.message)}`);
```

### 5. Modular Route Pattern
```typescript
// Root entry file (e.g., imageRoutes.ts) — mount sub-routers
import editRouter   from './image/edit.js';
import mergeRouter  from './image/merge.js';
const router = express.Router();
router.use(editRouter);
router.use(mergeRouter);
export default router;
```

### 6. Custom Hook Pattern (Frontend)
```typescript
// Extract logic from components into hooks/
// hooks/useSingleImageEdits.ts
export function useSingleImageEdits(panel: GeneratedPanel, onUpdate: (p: GeneratedPanel) => void) {
  // All crop/edit state and handlers live here
  return { handleCrop, handleFlip, handleRotate, ... };
}
```

### 7. Webtoon URL Parsing
- Always use `stripRegionFromUrl()` before parsing to remove locale prefixes (en, fr, ko, etc.).
- Use `parseWebtoonUrl()` to extract `{ genre, title, episode }` from any Webtoon URL.

---

## 🔄 Auto-Update Rule — MANDATORY FOR ALL AI AGENTS

> **Every AI assistant MUST update this file at the end of every conversation.**
> This keeps `RULES.md` as a living document that is always 100% accurate.

### When to Update RULES.md

You MUST update this file if you did ANY of the following during the conversation:

| Action | What to Update |
|---|---|
| Added a new file or folder | Update the 📁 File & Folder Structure section |
| Added a new API endpoint | Update the 🔌 API Architecture table |
| Added a new npm package | Update the Tech Stack table |
| Added a new environment variable | Update the 🔑 Environment Variables table |
| Added a new npm script | Update the 🚀 npm Scripts table |
| Introduced a new coding pattern | Add it to the 🧩 Key Patterns section |
| Added a new "never do" rule | Add it to the 🚫 Things AI Must NEVER Do list |
| Changed a Python service's CLI interface | Update the 🐍 Python Backend Rules section |
| Changed the database schema or ORM | Update the 🗃️ Database section |
| **Any** change at all | Append a row to the 📅 Session Changelog below |

### How to Update the Changelog

At the **end of every conversation**, append one row to the Session Changelog table below:

```
| YYYY-MM-DD | Brief summary of what changed | Files affected |
```

- Use `—` (em dash) if a column doesn't apply.
- Keep summaries short (under 15 words).
- List all affected files separated by commas.
- **Do not skip this step, even for small changes.**

---

## 📅 Session Changelog

> Auto-updated by AI at the end of each conversation. Newest entries at the top.

| Date | Summary | Files Affected |
|---|---|---|
| 2026-06-08 | Fixed critical paths, routes, insecure shell calls, implemented video pipeline, ported FastAPI logic, standardized cache | `backend/routes/*`, `backend/python/services/*`, `frontend/src/hooks/*`, `backend/utils/*` |
| 2026-06-08 | Generated BUG_REPORT2.md focusing on frontend state race conditions, missing OCR functions, and data persistence issues | `BUG_REPORT2.md`, `RULES.md` |
| 2026-06-08 | Generated comprehensive BUG_REPORT.md after deep audit of the Storyboard AI pipeline and architectural integrity | `BUG_REPORT.md`, `RULES.md` |
| 2026-06-08 | Fully rewrote README.md and RULES.md to reflect current modular structure, new routes, hooks, utils, and server features | `README.md`, `RULES.md` |
| 2026-06-08 | Added ANSI color system to server.ts and all backend log prefixes via logInterceptor.ts and colors.ts | `backend/server.ts`, `backend/utils/logInterceptor.ts`, `backend/utils/colors.ts`, `backend/routes/scraper/*`, `backend/routes/image/*`, `backend/routes/ai/*` |
| 2026-06-08 | Refactored large files: split App.tsx logic into 19 hooks, CropEditorModal into 10+ sub-components, TerminalLogs/Timeline/VideoMonitor/Scraper into modular sub-folders | `frontend/src/hooks/*`, `frontend/src/components/crop/*`, `frontend/src/components/terminal/*`, `frontend/src/components/timeline/*`, `frontend/src/components/video/*`, `frontend/src/components/scraper/*` |
| 2026-06-07 | Added Merge panel (vertical/horizontal stitching, gaps), prevented auto-close of Crop Editor, improved 500 error logging | `frontend/src/components/crop/MergePanel.tsx`, `frontend/src/components/CropEditorModal.tsx`, `frontend/src/App.tsx`, `backend/routes/imageRoutes.ts` |
| 2026-06-07 | Added advanced manual horizontal split cutter features (precision inputs, equal parts division, presets, intervals, inline coordinate list editor, browser-based gutter gap detection, magnetic snapping, and templates), next/prev frame navigation buttons and shortcuts, edit panel delete buttons, and fixed /api/transform-image API bug | `frontend/src/components/crop/HorizontalSplitter.tsx`, `frontend/src/components/CropEditorModal.tsx`, `frontend/src/App.tsx`, `backend/routes/imageRoutes.ts`, `RULES.md`, `README.md` |
| 2026-06-07 | Modularized LiveScraperDeck & CropEditorModal, added CleanBubblesPanel and AutoCropModal | `frontend/src/components/LiveScraperDeck.tsx`, `frontend/src/components/CropEditorModal.tsx`, `frontend/src/components/AutoCropModal.tsx`, `frontend/src/components/scraper/*`, `frontend/src/components/crop/*`, `frontend/src/App.tsx`, `RULES.md` |
| 2026-06-07 | Implemented sequential auto-decision speech bubble cleaner and specialized cleaning functions | `backend/services/cleaner.py`, `backend/routes/process.py`, `backend/services/test_cleaner.py`, `RULES.md` |
| 2026-06-07 | Split server.ts into modular files; added self-healing validation fallback to scraperRoutes | `backend/server.ts`, `backend/config/*`, `backend/utils/*`, `backend/routes/*`, `RULES.md`, `README.md` |
| 2026-06-07 | Created requirements.txt with all Python pip dependencies and ran pip install | `requirements.txt` |
| 2026-06-07 | Created `.env` and fully rewrote `.env.example` with all variables documented | `.env`, `.env.example` |
| 2026-06-07 | Created local SQLite database (`backend/database/db.ts`, `schema.sql`) with full CRUD API | `backend/database/`, `backend/server.ts`, `.env`, `.gitignore` |
| 2026-06-07 | Rewrote `README.md` with full setup guide, API reference, DB docs, and project structure | `README.md` |
| 2026-06-07 | Created RULES.md with full project structure, API docs, patterns, and rules | `RULES.md` |
| 2026-06-07 | Added auto-update mandate and session changelog to RULES.md | `RULES.md` |
| 2026-06-07 | Reorganized project: moved all files into `frontend/`, `backend/`, `data/`, `tests/` | `frontend/`, `backend/`, `data/`, `tests/`, `package.json`, `RULES.md` |

---

## 🚫 Things AI Must NEVER Do

1. **Never delete** `package-lock.json` — it ensures reproducible builds.
2. **Never commit** `.env`, `.env.local`, or any file containing real API keys.
3. **Never call** `ai.models.generateContent()` without wrapping it in `callGeminiWithRetry()`.
4. **Never use** `python` (without the `3`) in shell commands — use `python3`.
5. **Never add** new npm packages without updating this file's tech stack table.
6. **Never place** React components outside of `frontend/src/components/`.
7. **Never place** Python service files outside of `backend/python/services/`.
8. **Never expose** stack traces or raw error objects in API JSON responses.
9. **Never hardcode** localhost, IP addresses, or port numbers in frontend code.
10. **Never use** `any` TypeScript type without a comment explaining why.
11. **Never put** all routes in one giant file — split by domain into `ai/`, `image/`, `scraper/` sub-folders.
12. **Never put** hook logic directly in `App.tsx` — extract into `frontend/src/hooks/`.
13. **Never put** Python scripts directly in `backend/services/` — use `backend/python/services/`.

---

## ✅ Before Submitting Any Change

- [ ] Does the new code follow the file placement rules above?
- [ ] Are all TypeScript types properly defined in `src/types.ts`?
- [ ] Do all Gemini API calls use `callGeminiWithRetry()`?
- [ ] Do all Python service calls handle `ImportError` gracefully?
- [ ] Is the `.env.example` updated if new environment variables were added?
- [ ] Is this `RULES.md` updated if new files, folders, or API endpoints were added?
- [ ] Are all API routes documented in the API table above?
- [ ] Are all new console log calls using ANSI color helpers from `colors.ts`?
- [ ] Are new components split into modular sub-components if over ~300 lines?

---

> [!IMPORTANT]
> **AI Agent Reminder:** Before ending this conversation, scroll up to the 📅 Session Changelog
> and add a row describing what you changed. Then update any stale sections above.
> This is not optional — it is a required step of every session.

*All AI agents must treat this file as the highest-priority context for this repository.*
*Automatically maintained — do not edit the changelog manually outside of AI sessions.*
