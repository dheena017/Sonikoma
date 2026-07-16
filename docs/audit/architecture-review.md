# 🏛️ Enterprise Architecture Review Report

## Executive Summary
This report presents a comprehensive architectural review of the **Sonikoma** enterprise platform. The system is designed to automate the conversion of digital webtoon strips into high-fidelity animated cinematic videos.

Architecturally, the project implements a clean **Client-Server Separation** pattern:
- **Client Tier**: A modern Single Page Application (SPA) built using React 19, TypeScript, and Vite.
- **Server Tier**: A Python FastAPI computational backend that processes deep-learning models, OpenCV, MoviePy rendering, and Edge-TTS synthesis.
- **Database Layer**: Zero-config relational SQLite storage managed directly by the Python backend via raw query bindings.

The separation of concerns between layers is excellent. To further support enterprise scale, this review recommends standardizing the service layer patterns and optimizing database access paths.

---

## Architectural Flowchart

```
┌──────────────────────────────────────────────────────────────┐
│                    React Client (Vite SPA)                   │
│                                                              │
│  ┌───────────────────────┐        ┌───────────────────────┐  │
│  │   Zustand Store       │        │  Interactive Canvas   │  │
│  │   (ProjectState)      │◄───────│  (Fabric.js / Crop)   │  │
│  └───────────────────────┘        └───────────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                       REST / SSE Logs
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│                                                              │
│  ┌───────────────────────┐        ┌───────────────────────┐  │
│  │   Router Gateways     │        │  Computational Core   │  │
│  │   (ai_routes.py, ...) │◄───────│  (OpenCV, PyTorch)    │  │
│  └───────────────────────┘        └───────────────────────┘  │
│              │                                               │
│       Relational SQL                                         │
│              │                                               │
│  ┌───────────▼───────────┐        ┌───────────────────────┐  │
│  │   SQLite Local DB     │        │   Local File System   │  │
│  │   (webtoon_local.db)  │        │   (data/image_cache)  │  │
│  └───────────────────────┘        └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Architectural Strengths & Structural Boundaries

### 1. Unified Data Consolidation Strategy
- **Design Pattern**: All stateful databases, file caches, and compiled media are routed to a single, git-ignored root `/data` directory:
  - `data/webtoon_local.db` (Relational SQLite file)
  - `data/image_cache/` (Persistent image files)
  - `data/training_data/` (Human-corrected dataset for fine-tuning)
  - `data/media/` (Completed MP4 renders)
- **Benefit**: This consolidation isolates the application's runtime data from the source code, simplifying backups, deployments, and Docker container volume mappings.

### 2. Live Shell Logging Architecture
- **Design Pattern**: The system implements an asynchronous Server-Sent Events (SSE) log-listener stream in `health.py` that captures the server's standard outputs, formats them, and streams them directly to the frontend `/logs` panel.
- **Benefit**: Provides real-time, terminal-like visibility into heavy backend processes (such as YOLO fine-tuning or MoviePy rendering) directly within the web UI.

### 3. Edge-TTS & Whisper Alignment Loop
- **Design Pattern**: Synchronizes dialogue text to the exact seconds where characters speak by running OCR, aligning the text with local Whisper transcriptions, and extracting audio peaks using Librosa.
- **Benefit**: Achieves precise, automated mouth and subtitle timing without relying on manual audio keys.

---

## Technical Architecture Recommendations

### 1. Introduce a Standard Service Layer (FastAPI)
- **Problem**: Python route handlers (e.g., `/remove-speech-bubbles-batch` in `image_routes.py`) perform heavy business logic, error handling, and database updates inline.
- **Solution**: Decouple routes from business logic by introducing a dedicated Service layer:
```
  [Route Handler] ───► [Service Facade] ───► [Repository / Engine]
```
- **Estimated Effort**: **16 hours**

### 2. Transition to a Python ORM
- **Problem**: Raw SQL query strings in `db.py` are prone to syntax errors and require manual alignment between SQLite and Postgres setups.
- **Solution**: Integrate **SQLAlchemy** or **SQLModel**. This provides robust type-safety, automatic migrations, and dialect abstraction.
- **Estimated Effort**: **24 hours**

### 3. Replace Client-Side State Router
- **Problem**: Routing in `App.tsx` is driven by a custom state hook (`useAppRouter`) that intercepts window state transitions. While highly customizable, it lacks the standard features of established routers (such as nested route guards, layout caching, and parameter types).
- **Solution**: Transition to **React Router v6** or **TanStack Router**.
- **Estimated Effort**: **16 hours**
