<div align="center">

<img src="frontend\dist\logo-dark.png" alt="Sonikoma Logo" width="220" />

# 🎬 Sonikoma — Webtoon to Video AI Platform

**Transform webtoon & manhwa comics into animated MP4 videos with AI-powered panel extraction, speech bubble erasing, TTS voiceover synthesis, and cinematic camera pan/zoom animations.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)

</div>

---

## 🎨 Theme Support & Brand Identity

Sonikoma features dynamic dual-mode theme support (Dark / Light) built with Tailwind CSS & custom CSS design tokens:

|                            Dark Mode (Default)                            |                                 Light Mode                                  |
| :-----------------------------------------------------------------------: | :-------------------------------------------------------------------------: |
| <img src="./public/logo-dark.png" width="240" alt="Sonikoma Dark Logo" /> | <img src="./public/logo-light.png" width="240" alt="Sonikoma Light Logo" /> |
|                       Modern Sleek Dark (`#09090b`)                       |                      Pristine Clean Light (`#f4f4f5`)                       |

---

## 📸 Application Interface Previews

### 1. Interactive Studio & AI Panel Editor

![Sonikoma AI Storyboard & Video Editor](./public/editor-preview.png)

### 2. Creator Dashboard & Project Analytics

![Sonikoma Creator Dashboard & Analytics](./public/dashboard-preview.png)

---

## ✨ Features & Capabilities

- 🖼️ **Webtoon Panel Scraper** — Automatically fetches, parses, and slices webtoon/manhwa panels from any webtoon series URL.
- 🫧 **AI Speech Bubble Eraser** — Removes speech bubbles seamlessly using Gemini Vision AI + OpenCV inpainting. Includes manual brush refinement, presets, and undo/redo history.
- 🗣️ **TTS Voiceover & Dramatizer** — Synthesizes natural voice narration and multi-character dialogue audio via Microsoft Edge TTS.
- 🎬 **Cinematic Video Compiler** — Renders high-definition MP4 videos with dynamic camera pan/zoom motion effects via MoviePy.
- ✂️ **Advanced Crop & Stitch Editor** — Fully modular editor featuring manual/auto crop, horizontal panel splitting, multi-frame stitching, and style filters.
- 🔀 **Multi-Panel Stitcher** — Vertical and horizontal multi-panel layout canvas with customizable spacing, borders, and alignment.
- 🤖 **Multi-AI Engine Integration** — Powered by Google Gemini 2.5 Flash, Gemini 2.0 Pro, Llama 3 70B, and Mistral 7B.
- 📟 **Real-Time Terminal Streaming** — Live ANSI-colored SSE terminal log stream piped from the Python computational engine directly into the frontend console.
- 🛡️ **Enterprise Security & Reliability** — Rate limiting, CORS policies, JWT authentication, request timeout controls, and zero-downtime health monitoring.

---

## 🏛️ Enterprise Architecture (`src/`)

The application follows a scalable **Feature-First Architecture** designed for high maintainability:

```
frontend/src/
├── app/                        # App entry point, global providers & AppRouter.tsx
├── api/                        # Pure HTTP API Layer (client/ & endpoints/)
├── assets/                     # Organized static assets & CSS design system (theme.css, player.css, pills.css)
├── shared/                     # Reusable cross-feature UI controls (Modal, Tooltip) & shared hooks
├── features/                   # 29 Self-Contained Domain Modules
│   ├── auth/                   # Login, Register, Forgot Password & Auth Hooks
│   ├── dashboard/              # Workspace Dashboard & Project Management
│   ├── image/                  # Crop Canvas, Speech Bubble Cleaner & Image Tools
│   ├── video/                  # CinemaPlayer & Motion Video Compilation
│   ├── workspace/              # Interactive Webtoon Compiler Studio
│   ├── ai/                     # AI Model Hub & Training Diagnostics
│   ├── analytics/              # Analytics & Token Usage Monitor
│   ├── scraper/                # Webtoon Chapter Scraper & Deck Manager
│   ├── terminal/               # Real-Time Shell Logs & System Console
│   └── ...                     # (20+ additional feature modules)
├── services/                   # Business logic orchestration
├── store/                      # Zustand global state management (useProjectStore)
├── types/                      # Global enterprise models (models.ts, logs.ts, api.ts)
└── utils/                      # Modular application utilities (url, filter, logger, audio)
```

---

## 🚀 Quick Start Guide

### Prerequisites

| Component   | Minimum Version  | Download Link                                  |
| :---------- | :--------------- | :--------------------------------------------- |
| **Node.js** | 20.x or higher   | [nodejs.org](https://nodejs.org/)              |
| **Python**  | 3.11.x or higher | [python.org](https://www.python.org/)          |
| **FFmpeg**  | Latest stable    | [ffmpeg.org](https://ffmpeg.org/download.html) |

> 💡 **FFmpeg Installation**:
>
> - **Windows**: `winget install ffmpeg`
> - **macOS**: `brew install ffmpeg`
> - **Linux**: `sudo apt install ffmpeg`

---

### 1️⃣ Clone & Install Node Dependencies

```bash
git clone https://github.com/your-org/sonikoma.git
cd sonikoma
npm install
```

### 2️⃣ Install Python Backend Dependencies

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate    # macOS / Linux

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3️⃣ Configure Environment Variables

```bash
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

Open `.env` and configure your API keys:

```env
# REQUIRED — Google Gemini API Key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY="AIzaSy..."

# OPTIONAL — HuggingFace API Token (https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY="hf_..."
```

### 4️⃣ Launch Development Application

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Computational Backend**: [http://localhost:5173](http://localhost:5173)

---

## 🤖 Supported AI Models

| Model Name           | Provider    | Primary Use Case                                    |
| :------------------- | :---------- | :-------------------------------------------------- |
| **Gemini 2.5 Flash** | Google AI   | Default — Fast, multimodal vision & panel detection |
| **Gemini 2.0 Pro**   | Google AI   | High-precision text synthesis & prompt analysis     |
| **Llama 3 70B**      | HuggingFace | Open-source privacy-focused script generation       |
| **Mistral 7B**       | HuggingFace | Lightweight open-source model inference             |

---

## 🛠️ Verification & Build Commands

```bash
# Run TypeScript compilation check across all 400+ files
npm run typecheck

# Build minified production bundle with Vite code-splitting
npm run build

# Run Python FastAPI computational backend
npm run backend
```

---

<div align="center">

Built with ❤️ using React 19, TypeScript, Python 3.11, FastAPI, OpenCV, MoviePy & Google Gemini AI

</div>
