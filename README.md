<div align="center">

# 🎬 Webtoon to Video

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
- 🫧 **AI Bubble Removal** — Removes speech bubbles using Gemini vision + OpenCV inpainting
- 🗣️ **TTS Voiceover** — Generates synced dialogue audio using Microsoft Edge TTS
- 🎬 **Video Compiler** — Renders animated MP4 with pan/zoom effects via MoviePy
- ✂️ **Crop Editor** — Manual and auto-crop panel editor with undo/redo
- 🗄️ **Local Database** — SQLite stores all projects and panels (no cloud required)
- 🤖 **Multi-AI** — Supports Gemini 2.5 Flash, Gemini 2.0 Pro, Llama 3, Mistral 7B

---

## 📁 Project Structure

```
webtoon-to-video-backend/
│
├── frontend/                         ← React + TypeScript UI (Vite)
│   ├── src/
│   │   ├── components/               ← All UI components (.tsx)
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
│   ├── server.ts                     ← Entry point only — imports, app setup
│   ├── config/
│   │   └── clients.ts                ← Shared AI clients (Gemini, HF)
│   ├── database/
│   │   ├── db.ts                     ← SQLite singleton + query helpers
│   │   ├── schema.sql                ← Table definitions (auto-applied)
│   │   └── webtoon_local.db          ← Auto-created SQLite file (git-ignored)
│   ├── routes/
│   │   ├── health.ts                 ← Liveliness probe route
│   │   ├── projects.ts               ← Project history and panels CRUD
│   │   ├── imageRoutes.ts            ← Proxy, crop edit, bubble cleaner, ZIPs
│   │   ├── aiRoutes.ts               ← Smart crop, image analysis, video wrapper
│   │   └── scraperRoutes.ts          ← Webtoon crawler and storyboard generation
│   ├── services/
│   │   ├── audio.py                  ← TTS via edge-tts + pydub
│   │   ├── cleaner.py                ← Speech bubble removal (OpenCV/Pillow)
│   │   ├── ocr.py                    ← Panel processor + OCR
│   │   └── video.py                  ← MP4 compiler via MoviePy
│   └── utils/
│       ├── cache.ts                  ← Shared memory cache state
│       ├── imageUtils.ts             ← Buffer resolution & auto-cropping
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

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| ffmpeg | any | https://ffmpeg.org/download.html |

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
npm run dev
```

The app opens at **http://localhost:3000** — backend API + frontend UI served together.

---

## 🌐 API Reference

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — returns DB status and stats |

### Project History (SQLite)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all saved projects |
| `GET` | `/api/projects/:id` | Get a project + all its panels |
| `POST` | `/api/projects` | Save a new project |
| `POST` | `/api/projects/:id/panels` | Save panels for a project |
| `DELETE` | `/api/projects/:id` | Delete a project |

### Image Processing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/proxy-image?url=` | Proxy-fetch a webtoon image (bypasses CORS) |
| `POST` | `/api/stitch-images` | Stitch multiple panel images vertically |
| `POST` | `/api/smart-crop` | AI-powered smart panel cropping |
| `POST` | `/api/crop-image` | Manual crop with pixel coordinates |
| `POST` | `/api/remove-speech-bubbles` | Run Python speech bubble removal (OpenCV + Gemini) |

### AI Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-image` | Generate panel image via Gemini |
| `POST` | `/api/ai-detect-panels` | Detect panel regions using Gemini vision |
| `POST` | `/api/analyze-image` | Full panel analysis — captions, SFX, motion |
| `POST` | `/api/generate-speech-text` | Generate dialogue/subtitle from image |

### Video & Audio

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-video` | Compile final MP4 from storyboard panels |
| `POST` | `/api/generate-tts` | Generate TTS audio for a panel |

### Scraper

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scrape` | Scrape panel images from a Webtoon URL |
| `POST` | `/api/detect-panels` | Detect and crop panels from a single image |

---

## 🗄️ Local Database

The app uses **SQLite** — a zero-config, file-based database stored at:

```
backend/database/webtoon_local.db
```

It is **auto-created on first startup** — no setup needed.

### Tables

| Table | Description |
|---|---|
| `projects` | All processed webtoon projects |
| `panels` | Every panel's image, text, filters, and settings |
| `scrape_sessions` | Cached scrape results per URL |
| `edit_history` | Undo/redo history (persists across restarts) |

---

## 🛠️ NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend + Vite frontend (port 3000) |
| `npm run build` | Build frontend + bundle backend to `dist/` |
| `npm run start` | Run production build from `dist/server.cjs` |
| `npm run lint` | TypeScript type check (`frontend/tsconfig.json`) |
| `npm run clean` | Delete the `dist/` folder |

---

## 🤖 AI Models Supported

| Model | Provider | Use |
|---|---|---|
| Gemini 2.5 Flash | Google | Default — fast, multimodal |
| Gemini 2.0 Pro | Google | High quality generation |
| Llama 3 70B | HuggingFace | Open source, privacy-friendly |
| Mistral 7B | HuggingFace | Lightweight open source |

---

## 🐍 Python Services

| File | Library | Purpose |
|---|---|---|
| `cleaner.py` | OpenCV, Pillow, EasyOCR | Speech bubble detection + removal |
| `audio.py` | edge-tts, pydub | TTS voice synthesis |
| `ocr.py` | OpenCV, Pillow, NumPy | Panel OCR + cropping processor |
| `video.py` | MoviePy, NumPy | MP4 animation + audio compilation |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key |
| `HUGGINGFACE_API_KEY` | Optional | HuggingFace token for open models |
| `NODE_ENV` | Optional | `development` or `production` |
| `PORT` | Optional | Server port (default: `3000`) |
| `DATABASE_URL` | Optional | SQLite path (auto-set) |

---

## 📜 For AI Agents

Read **[RULES.md](./RULES.md)** before making any changes.  
It contains the full project structure, coding rules, API patterns, and session changelog that all AI assistants must follow.

---

<div align="center">
Built with ❤️ using React, Express, Python, OpenCV, MoviePy & Gemini AI
</div>
