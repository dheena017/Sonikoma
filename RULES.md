# 📋 RULES.md — AI Agent Rules & Project Guidelines

> **EVERY AI assistant (Copilot, Cursor, Gemini, Claude, GPT, etc.) MUST read this file before
> making any change to this repository.**
> This file is the single source of truth for how this project is structured,
> how code should be written, and what patterns must be followed at all times.

---

## 🏗️ Project Overview

**Name:** Webtoon-to-Video  
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
| Audio / TTS | `edge-tts` Python library |
| Video Compilation | MoviePy (Python) |
| Database (optional) | PostgreSQL / Supabase |
| Build Tool | Vite (frontend) + esbuild (backend bundle) |

---

## 📁 File & Folder Structure

```
webtoon-to-video-backend/
│
├── frontend/                         ← FRONTEND — React/TypeScript UI
│   ├── src/
│   │   ├── components/               ← All reusable React UI components (.tsx)
│   │   │   ├── crop/                 ← Modular crop components (canvas, registry, splitters)
│   │   │   │   ├── AutoSlicer.tsx
│   │   │   │   ├── CleanBubblesPanel.tsx
│   │   │   │   ├── CropCanvas.tsx
│   │   │   │   ├── CutsRegistry.tsx
│   │   │   │   ├── EnhancementsPanel.tsx
│   │   │   │   ├── HorizontalSplitter.tsx
│   │   │   │   └── types.ts
│   │   │   ├── scraper/              ← Modular scraper deck card & toolbar components
│   │   │   │   ├── PanelCard.tsx
│   │   │   │   ├── ScraperControls.tsx
│   │   │   │   └── types.ts
│   │   │   ├── AdvancedSettings.tsx
│   │   │   ├── AutoCropModal.tsx
│   │   │   ├── BubbleCleanerModal.tsx
│   │   │   ├── CropEditorModal.tsx
│   │   │   ├── ErrorPopupModal.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LiveScraperDeck.tsx
│   │   │   ├── ModelStatusTable.tsx
│   │   │   ├── NotificationStack.tsx
│   │   │   ├── StoryboardTimeline.tsx
│   │   │   ├── TerminalLogs.tsx
│   │   │   ├── VideoMonitor.tsx
│   │   │   └── VolumeAndProgressPanel.tsx
│   │   ├── App.tsx                   ← Root React component (main page logic)
│   │   ├── audio.ts                  ← Frontend audio utilities (Web Audio API)
│   │   ├── index.css                 ← Global CSS styles + Tailwind base
│   │   ├── main.tsx                  ← React entry point (renders <App />)
│   │   ├── models.ts                 ← AI model registry
│   │   ├── types.ts                  ← Shared TypeScript interfaces (GeneratedPanel, etc.)
│   │   └── utils.ts                  ← Shared helper utilities (pure functions only)
│   ├── index.html                    ← HTML entry point for Vite
│   ├── vite.config.ts                ← Vite config (build + dev proxy → port 3000)
│   └── tsconfig.json                 ← TypeScript compiler settings
│
├── backend/                          ← BACKEND — Express server + Python services
│   ├── server.ts                     ← Express.js server (Entry point only)
│   ├── config/
│   │   └── clients.ts                ← Shared AI clients config
│   ├── database/                     ← LOCAL DATABASE (SQLite)
│   │   ├── db.ts                     ← DB singleton + typed query helpers
│   │   ├── schema.sql                ← Table definitions (applied on first boot)
│   │   └── webtoon_local.db          ← SQLite file (auto-created, NOT committed to git)
│   ├── routes/
│   │   ├── health.ts                 ← Health probe API router
│   │   ├── projects.ts               ← Projects & panels CRUD API router
│   │   ├── imageRoutes.ts            ← Image proxy, crop, cleaner & zip API router
│   │   ├── aiRoutes.ts               ← Smart crop, analysis & video compile API router
│   │   └── scraperRoutes.ts          ← Scraper & dynamic storyboard API router
│   ├── services/
│   │   ├── audio.py                  ← TTS generation using edge-tts
│   │   ├── cleaner.py                ← Speech bubble removal (OpenCV/Pillow, CLI)
│   │   ├── ocr.py                    ← OCR dialogue extraction
│   │   └── video.py                  ← MP4 compilation using MoviePy
│   └── utils/
│       ├── cache.ts                  ← Shared memory cache state map
│       ├── imageUtils.ts             ← Buffer resolver & auto-cropping helpers
│       └── urlUtils.ts               ← Webtoon URL parsing & region helpers
│
├── data/                             ← TEXT DATA — temp outputs, logs, text files
│   └── tmp_crop.txt
│
├── tests/                            ← TEST FILES
│   └── test_jszip.ts
│
├── .env.example                      ← Template for environment variables
├── .gitignore
├── metadata.json                     ← Project metadata for AI Studio deployment
├── package.json                      ← Node.js dependencies + npm scripts
├── package-lock.json                 ← Locked dependency versions (DO NOT edit)
├── requirements.txt                  ← Python pip dependencies (pip install -r requirements.txt)
├── RULES.md                          ← THIS FILE — AI rules and guidelines
└── README.md                         ← User-facing setup instructions
```

### ❌ What NOT to Put Where

| ❌ Wrong | ✅ Correct |
|---|---|
| React components in root or `backend/` | All `.tsx` components go in `frontend/src/components/` |
| Python scripts in `frontend/` | All Python goes in `backend/services/` or `backend/routes/` |
| API routes in `frontend/` files | All API routes go in `backend/server.ts` (Node) or `backend/routes/` (Python) |
| Type definitions scattered everywhere | All shared types go in `frontend/src/types.ts` |
| One-off test scripts in root | Put tests in `tests/` folder |
| Temp/data files in root | Put them in the `data/` folder |
| Business logic in React components | Keep logic in `utils.ts`, `audio.ts`, or dedicated hooks |
| Configs at root (vite/tsconfig) | Frontend configs live in `frontend/` |

---

## 🔌 API Architecture

### Node.js Express API (primary, `server.ts`)

All HTTP API endpoints live in `server.ts`. The server runs on **port 3000**.

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Liveness probe / health check |
| `/api/proxy-image` | GET | Proxies external Webtoon images (bypasses CORS) |
| `/api/stitch-images/cached/:id` | GET | Serves in-memory cached processed images |
| `/api/edit-image` | POST | Crop and trim a single image using Sharp |
| `/api/transform-image` | POST | Rotate or flip an image frame |
| `/api/ai-detect-panels` | POST | AI-powered panel detection using Gemini |
| `/api/analyze-image` | POST | Gemini vision analysis: captions, SFX, timing |
| `/api/remove-speech-bubbles` | POST | Python OpenCV speech bubble removal |
| `/api/undo-crop` | POST | Restores previous image state from edit history |
| `/api/download-zip` | POST | Packages selected images into a ZIP archive |
| `/api/download-zip/get/:id` | GET | Downloads a pre-generated ZIP file |
| `/api/convert-images-to-video` | POST | Compiles panels into video timeline metadata |
| `/api/system-logs` | GET | JSON log lookup (polling fallback for console logs) |
| `/api/system-logs/stream` | GET | SSE stream to push server console logs to UI console |

### Python API Routes (`app/routes/process.py`)

These are FastAPI routes that handle heavy CPU/ML workloads:

| Endpoint | Method | Description |
|---|---|---|
| `/process` | POST | Full pipeline: scrape → OCR → TTS → video compile |
| `/detect-panels` | POST | OpenCV contour-based panel detection |

---

## 🛠️ Backend Rules (server.ts / Node.js Express)

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

### 4. Calling Python Scripts
- Call Python scripts via `exec()` with sanitized, allow-listed parameters only.
- The Python script path is: `backend/services/cleaner.py`
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

### 6. New API Endpoints
When adding a new endpoint to `server.ts`:
1. Add a comment header explaining the endpoint's purpose.
2. Validate all required body parameters at the top of the handler.
3. Use `resolveImageToBuffer()` for any image URL input.
4. Wrap the logic in `try/catch`.
5. Document the new endpoint in the API table in this `RULES.md`.

---

## 🎨 Frontend Rules (React / TypeScript)

### 1. File Placement
- **All** React components go in `frontend/src/components/` as `.tsx` files.
- **All** shared TypeScript types go in `frontend/src/types.ts`.
- **All** AI model definitions go in `frontend/src/models.ts`.
- **All** pure utility functions go in `frontend/src/utils.ts`.
- Audio/TTS browser utilities go in `frontend/src/audio.ts`.

### 2. Component Rules
- Use **functional components** only. No class components.
- Use `React.FC` or typed props interfaces for all components.
- Keep components **focused** — one responsibility per component.
- Do NOT put API fetch logic directly inside JSX. Use callbacks or helper functions.
- Prefix all console logs with a component tag: `console.log("[ComponentName]", ...)`.

### 3. TypeScript Types
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

### 4. API Calls from Frontend
- All API calls go to `/api/...` paths (proxied through Vite to the Express server).
- Always handle loading states and show errors to the user via the `NotificationStack` component.
- Use `try/catch` around all `fetch()` calls.
- Never hardcode `localhost:3000` in frontend code.

### 5. Styling
- Use **Tailwind CSS** utility classes for all styling.
- No inline `style={{}}` objects unless for truly dynamic values (e.g., calculated widths/positions).
- Global CSS goes in `src/index.css`.
- Use dark-mode-first design (dark backgrounds, light text).

---

## 🐍 Python Backend Rules (app/services/)

### 1. Service Responsibilities

| File | Responsibility |
|---|---|
| `backend/services/audio.py` | Text-to-speech generation using `edge-tts`. Outputs `.mp3` files. |
| `backend/services/cleaner.py` | Speech bubble detection and removal using OpenCV / Pillow. Called via CLI args. |
| `backend/services/ocr.py` | OCR to extract text/dialogue from comic panel images. |
| `backend/services/video.py` | MoviePy-based MP4 video compilation from panel images + audio. |

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
| `APP_URL` | ⚡ Optional | Public URL of the deployed app |
| `DATABASE_URL` | ⚡ Optional | PostgreSQL connection string |
| `SUPABASE_URL` | ⚡ Optional | Supabase project URL |
| `SUPABASE_KEY` | ⚡ Optional | Supabase anon/service key |

**Rules:**
- Always check `process.env.GEMINI_API_KEY` before initializing the AI client.
- If `GEMINI_API_KEY` is missing, the server must still start and serve non-AI endpoints.
- Never log API keys, even partially.
- Never hardcode API keys anywhere in code.

---

## 🗃️ Database

The project has a **planned** (optional) PostgreSQL/Supabase database.

- Connection string: `DATABASE_URL` in `.env`
- The `/api/health` endpoint currently returns `"database": "disconnected"` — update this if DB is connected.
- If adding DB functionality: use parameterized queries only. Never use string concatenation for SQL.
- No ORM is currently used. If adding one, use **Prisma** (TypeScript) or **SQLAlchemy** (Python).

---

## 🚀 npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend/server.ts via tsx + Vite HMR frontend |
| `npm run build` | Build frontend with Vite + bundle backend with esbuild |
| `npm run start` | Start the production bundle from `dist/server.cjs` |
| `npm run lint` | Run TypeScript type checking on `frontend/tsconfig.json` |
| `npm run clean` | Remove build artifacts from `dist/` |

**Rules:**
- Always use `npm run dev` for local development — never run `server.ts` directly.
- The dev server runs on **http://localhost:3000**.
- The Vite dev proxy forwards `/api/*` and `/media/*` to `http://127.0.0.1:8000` (for future Python FastAPI server integration).

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
const pythonCommand = `python3 app/services/cleaner.py --image_path "${tempIn}" --output_path "${tempOut}" --method "${method}"`;
exec(pythonCommand, (error, stdout, stderr) => {
  if (error) { /* handle failure, return structured error */ }
  else { /* read tempOut, cache result, return URL */ }
});
```

### 4. Genre-Based Background Video Selection
```typescript
const DYNAMIC_BACKGROUND_VIDEOS = {
  action: "...", romance: "...", fantasy: "...", cyberpunk: "...", general: "..."
};
// Always select from this map based on parsed Webtoon URL genre.
```

### 5. Webtoon URL Parsing
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
7. **Never place** Python files outside of `backend/services/` or `backend/routes/`.
8. **Never expose** stack traces or raw error objects in API JSON responses.
9. **Never hardcode** localhost, IP addresses, or port numbers in frontend code.
10. **Never use** `any` TypeScript type without a comment explaining why.

---

## ✅ Before Submitting Any Change

- [ ] Does the new code follow the file placement rules above?
- [ ] Are all TypeScript types properly defined in `src/types.ts`?
- [ ] Do all Gemini API calls use `callGeminiWithRetry()`?
- [ ] Do all Python service calls handle `ImportError` gracefully?
- [ ] Is the `.env.example` updated if new environment variables were added?
- [ ] Is this `RULES.md` updated if new files, folders, or API endpoints were added?
- [ ] Are all API routes documented in the API table above?

---

> [!IMPORTANT]
> **AI Agent Reminder:** Before ending this conversation, scroll up to the 📅 Session Changelog
> and add a row describing what you changed. Then update any stale sections above.
> This is not optional — it is a required step of every session.

*All AI agents must treat this file as the highest-priority context for this repository.*
*Automatically maintained — do not edit the changelog manually outside of AI sessions.*
