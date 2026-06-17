# 📁 Project Structure & Folder Guidelines

This document details the folder hierarchy of the **Anivox — Webtoon-to-Video** codebase. It outlines the responsibilities of each directory and defines strict boundaries of where specific types of files must be placed.

---

## 🏗️ Visual Directory Tree

```
webtoon-to-video-backend/
│
├── frontend/                         ← React 19 + TypeScript + Vite + Tailwind UI
│   ├── src/
│   │   ├── api/                      
│   │   │   └── fetchWithInterceptor.ts   ← Global fetch wrapper + error handler
│   │   ├── components/               ← Modular UI component tree
│   │   │   ├── crop/                 ← Modular Crop Editor workspace layout
│   │   │   │   ├── auto/             ← AutoSlicer (Canny slicing settings)
│   │   │   │   ├── canvas/           ← Interactive crop canvas and brush/bubble layers
│   │   │   │   ├── clean/            ← Advanced speech bubble removal panels & presets
│   │   │   │   ├── cuts/             ← Fine-tune cropping list registry
│   │   │   │   ├── editor/           ← Sidebar, tools, footer, and editor containers
│   │   │   │   ├── enhancements/     ← Cinematic zoom, speed, audio adjustments
│   │   │   │   ├── horizontal/       ← Horizontal slicing panels & magnetic snapping
│   │   │   │   ├── merge/            ← Vertical & horizontal stitch selectors
│   │   │   │   ├── shared/           ← Reusable crop controls (RangeSlider, etc.)
│   │   │   │   ├── utils/            ← Browser-based gutter detection utility
│   │   │   │   ├── index.ts          ← Barrel export mapping
│   │   │   │   └── types.ts          ← Editor-specific TypeScript types
│   │   │   ├── pipeline/             ← Pipeline status monitors
│   │   │   ├── processing/           ← Auto-crop and bubble removal modals
│   │   │   ├── scraper/              ← Scraper columns, decks, settings, UrlInput panels
│   │   │   ├── status/               ← Model status layout
│   │   │   ├── terminal/             ← SSE-stream terminal logger panels
│   │   │   ├── timeline/             ← Storyboard workspace lists & cards
│   │   │   ├── video/                ← MP4 generation, video monitor & audio controls
│   │   │   ├── AppWorkspace.tsx      ← Application workspace layout container
│   │   │   ├── CropEditorModal.tsx   ← Canvas editor modal container
│   │   │   └── ...
│   │   ├── hooks/                    ← Stateful custom Hooks (extracted logic)
│   │   ├── utils/                    ← Style filter helpers and URL parser
│   │   ├── App.tsx                   ← Entry view layout
│   │   ├── audio.ts                  ← Web Audio client wrappers
│   │   ├── index.css                 ← Core CSS styles
│   │   ├── main.tsx                  ← Vite React bootstrapping
│   │   ├── models.ts                 ← Supported AI models list
│   │   └── types.ts                  ← Shared TypeScript type interfaces
│   └── vite.config.ts                ← Development dev server proxy config
│
├── backend/                          ← Express.js server + Python FastAPI wrappers
│   ├── server.ts                     ← Server bootstrapping, middlewares, log SSE
│   ├── config/                       
│   │   └── clients.ts                ← Gemini & HuggingFace API configurations
│   ├── database/                     
│   │   ├── db.ts                     ← SQLite helper singleton (better-sqlite3)
│   │   ├── schema.sql                ← Local SQL bootstrapping table setups
│   │   └── webtoon_local.db          ← Git-ignored local DB file
│   ├── routes/                       ← Express HTTP endpoints segregated by domain
│   │   ├── health.ts                 
│   │   ├── projects.ts               
│   │   ├── aiRoutes.ts               ← Mounted router routing to ai/
│   │   ├── imageRoutes.ts            ← Mounted router routing to image/
│   │   ├── scraperRoutes.ts          ← Mounted router routing to scraper/
│   │   ├── ai/                       ← Gemini analyzer and compiler routes
│   │   ├── image/                    ← Sharp crop, stitch, zip, and cv cleanup routes
│   │   └── scraper/                  ← Crawlers, storyboard AI pipelines
│   ├── services/                     ← Scraper orchestrator and storyboard narrative AI
│   ├── python/                       ← Python modules folder
│   │   ├── routes/                   
│   │   │   └── process.py            ← FastAPI panel extraction route
│   │   └── services/                 
│   │       ├── audio.py              ← edge-tts and pydub wrappers
│   │       ├── cleaner.py            ← Bubble segmentation and cleanup CLI
│   │       ├── detect_panels.py      ← OpenCV contour scanner
│   │       ├── video.py              ← MoviePy movie compilation script
│   │       └── ...
│   └── utils/                        
│       ├── colors.ts                 ← ANSI logger color tools
│       ├── cvUtils.py                ← Shared python OpenCV helper functions
│       └── imageUtils.ts             ← Node image buffer fetch helpers
│
├── data/                             ← Output caches, file dumps, temp buffers
├── tests/                            ← Code quality and integration scripts
├── requirements.txt                  ← Python script dependencies list
└── package.json                      ← Node package scripts and dev options
```

---

## 🚫 File Placement Boundaries

To maintain long-term architectural integrity, strictly adhere to the following file boundaries. Putting the wrong files in the wrong places is highly discouraged.

| File Type / Content | ❌ Forbidden Locations | ✅ Approved Location |
| :--- | :--- | :--- |
| **React Components (`.tsx`)** | Project root directory, any subfolder inside `backend/` | `frontend/src/components/` (or modular nested subfolders) |
| **Stateful Logic Hooks** | Direct layout components, root `App.tsx` | `frontend/src/hooks/` |
| **Python Script Actions** | Anywhere inside `frontend/`, directly in `backend/services/` | `backend/python/services/` |
| **API Endpoint Handlers** | Inside React components or inline routes inside `server.ts` | Segregated under `backend/routes/` |
| **Type Definitions** | Scattered across files | Shared in `frontend/src/types.ts` |
| **Test/Scratch Scripts** | Project root workspace, temporary folder | `tests/` folder (or `.gemini` sandbox folders) |
| **Temporary Media Artifacts** | Root directory folder | `data/` or standard system temp folder (`os.tmpdir()`) |

---

## 📁 Key Folder Responsibilities

### `frontend/`
Contains the browser-based single-page application built on Vite and React 19. All interactions, cropping editors, storyboard timelines, and SSE-based server log displays are defined here.

### `backend/`
Contains the Express.js HTTP application server. It serves as an orchestrator, handling request validation, routing, database state management, caching, and calling Python services via sanitized CLI parameters.

### `backend/python/`
Handles heavy computational tasks such as image inpainting, contour boundary extraction, speech bubble segmentation, text-to-speech voiceovers, and MoviePy compilation. Contains its own sub-routing system running on FastAPI for high-performance process detection.
