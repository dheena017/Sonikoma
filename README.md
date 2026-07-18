<div align="center">

# 🎬 Sonikoma — Webtoon to Video

**Transform webtoon & manhwa comics into cinematic MP4 videos with AI-powered speech bubble removal, TTS voiceovers, and pan/zoom animations.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
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
- 📊 **Live Metrics** — `/api/health` endpoint reports system health, memory, and database state
- 🛡️ **Security Middleware** — Rate limiting, request timeouts, CSP headers, request IDs, and CORS baked into the server

---

## 📁 Project Structure

For a visual flowchart and detailed descriptions of each directory (including frontend component groupings, backend routers, services, and script boundaries), please see the dedicated reference:

👉 **[Sonikoma Project Structure & Folder Guidelines](./docs/architecture/project_structure.md)**

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
cd sonikoma
npm install
```

### 2️⃣ Install Python Dependencies

```bash
# Create and activate a virtual environment (optional but recommended)
# Then install dependencies:
pip install -r backend/requirements.txt
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

The ports are strictly validated on startup from the `.env` file (`FRONTEND_PORT`, `BACKEND_PORT`, and `APP_URL`). By default, the frontend app opens at **http://localhost:3000** (defined by `FRONTEND_PORT` and `APP_URL`) while the backend API listens on **http://localhost:8000** (defined by `BACKEND_PORT`).

---

## 🌐 API Reference

The Python FastAPI backend exposes endpoints for authentication, metrics, image transformations, speech bubble removal, and MoviePy audio/video compile routines. View the complete API reference in:

👉 **[Sonikoma API Reference & Routes](./docs/api/endpoints.md)**

---

## 🗄️ Local Database

The application utilizes a zero-config local SQLite instance managed by the backend engine. Check the tables structure and database guidelines in:

👉 **[Local Database Architecture](./docs/architecture/database.md)**

---

## 🛠️ NPM Scripts

A variety of npm scripts are configured to control dev daemons, production compilations, type validations, and Docker images. Read the complete guide:

👉 **[NPM Scripts Reference](./docs/architecture/npm_scripts.md)**

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

| Directory            | Purpose                           |
| -------------------- | --------------------------------- |
| `api/`               | FastAPI endpoints and routers     |
| `core/`              | Application settings, security    |
| `database/`          | Database connections and models   |
| `engines/`           | Video, audio, and SD engines      |
| `providers/`         | AI and TTS provider integrations  |
| `repositories/`      | Data access layer for DB entities |
| `services/`          | Core business logic orchestration |
| `utils/`             | Shared helper functions           |

---

## 🔐 Environment Variables

Key credentials, database routes, rate limits, and server execution variables are managed in `.env`. See the full variable table and security rules:

👉 **[Environment Variables Configuration](./docs/architecture/environment_variables.md)**

---

## 📜 For AI Agents

Read **[RULES.md](./RULES.md)** before making any changes.  
It contains the full project structure, coding rules, API patterns, and session changelog that all AI assistants must follow.

---

<div align="center">
Built with ❤️ using React, Python, FastAPI, OpenCV, MoviePy & Gemini AI
</div>