# Features (`backend/app/features/`)

## 1. Overview & Architecture
The `features/` directory contains Sonikoma's **10 domain-driven application modules**, establishing complete 1:1 structural parity with the frontend client.

Each feature domain is a self-contained module encapsulating its own:
- `router.py`: FastAPI route handlers and endpoint documentation.
- `service.py`: Business logic, domain workflows, and async orchestration.
- `schemas.py`: Pydantic request models, response DTOs, and input validation.
- `repository.py` *(where applicable)*: Database persistence queries and data mapping.
- `README.md`: Technical documentation, data flow diagrams, and API contracts.

```text
backend/app/features/
├── auth/                 # Authentication, JWT sessions, OAuth, and user models
├── admin/                # Platform administration, analytics, and telemetry
├── creative/             # Creative suite tools, YouTube publishing, export bundles
├── image_editor/         # Panel canvas, auto-cropping, OCR, bubble-guided text extraction
├── intelligence/         # AI core, series generation, prompt engineering, continuity memory
├── landing/              # Public showcase endpoints, stats, tiers, and demo reels
├── platform/             # Core platform hub (shell, dashboard, projects, scraper, jobs...)
│   ├── shell/            # Platform navigation schemas, layout state, and theme preferences
│   ├── dashboard/        # Hardware telemetry, project overviews, quick metrics, analytics
│   ├── projects/         # Project lifecycle (CRUD), chapter structures, asset references
│   ├── scraper/          # Webtoon & manga scraping engine, chapter downloads, search
│   ├── shortcuts/        # Keyboard shortcut registry and custom user keybindings
│   ├── terminal/         # Sandboxed web developer terminal, diagnostic commands, logs
│   ├── notifications/    # User notification feed, unread tracking, system alerts
│   └── jobs/             # Background task execution polling, cancellation, stage tracking
├── profile/              # User profile, avatars, API key management
├── video_editor/         # Timeline rendering, TTS synthesis, subtitle alignment, mixing
└── workspace/            # Studio editor engine, storyboard, asset trays
    ├── shell/            # Canvas viewport, zoom ratios, tool modes, and session context
    ├── storyboard/       # AI scene breakdown, voiceover scripts, audio cues, frame timings
    ├── viewer/           # Webtoon continuous vertical reader, manga reader, scroll progress
    └── imported_assets/  # Project media gallery, multipart asset upload, disk indexing
```

---

## 2. Shared Kernel & Infrastructure Relationships
Feature domains interact with shared kernel infrastructure:
- **`app.core`**: Global configuration, JWT security, structured logging, cache, and exceptions.
- **`app.database`**: Database connection pool, session dependency injection (`get_db`), and migrations.
- **`app.providers`**: Third-party adapters for external APIs (OpenAI, Gemini, Anthropic, ElevenLabs, FFmpeg).

Cross-domain calls are orchestrated through public service functions rather than direct internal state mutations.

---

## 3. Parity Mapping Matrix

| Backend Domain | Frontend Counterpart (`frontend/src/features/`) | Sub-Domains / Responsibilities |
| :--- | :--- | :--- |
| **`auth/`** | `auth/` | Registration, login, JWT issuance, OAuth verification |
| **`admin/`** | `admin/` | System configuration, AI usage telemetry, superuser console |
| **`creative/`** | `creative/` | Video export pipelines, YouTube publishing, export archives |
| **`image_editor/`** | `image-editor/` | Panel detection, smart slicing, OCR text, transformations |
| **`intelligence/`** | `intelligence/` | Multimodal AI vision, character consistency, series bibles |
| **`landing/`** | `landing/` | Public demo reels, platform metrics, subscription tiers |
| **`platform/`** | `platform/` | **8 Sub-domains**: `shell`, `dashboard`, `projects`, `scraper`, `shortcuts`, `terminal`, `notifications`, `jobs` |
| **`profile/`** | `profile/` | Account settings, API keys, avatar uploads, theme state |
| **`video_editor/`** | `video-editor/` | Timeline rendering, multi-voice TTS, audio mixing, subtitles |
| **`workspace/`** | `workspace/` | **4 Sub-domains**: `shell`, `storyboard`, `viewer`, `imported_assets` |

---

## 4. Architectural Rules
1. **No Circular Dependencies**: Sub-domains inside `platform/` or `workspace/` must not circularly import each other.
2. **Schema Uniformity**: All API contracts must be defined with Pydantic V2 and exported in `schemas.py`.
3. **Decoupled Background Tasks**: Long-running operations (scraping, AI synthesis, video render) must be submitted via `services.jobs.job_manager` to prevent blocking the event loop.
4. **Documentation Compliance**: Every feature and sub-domain directory must contain a comprehensive `README.md` following the standard 7-section specification.
