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
├── admin/                # 1. Platform administration, settings, telemetry, and moderation
├── landing/              # 2. Public showcase endpoints, stats, tiers, and demo reels
├── auth/                 # 3. Authentication, JWT sessions, OAuth, and user credentials
├── workspace/            # 4. Studio editor engine, storyboard, viewer, asset trays
├── image_editor/         # 5. Panel canvas, auto-cropping, OCR, enhancements, and stitching
├── video_editor/         # 6. Timeline rendering, multi-voice TTS synthesis, cuts, mixing
├── creative/             # 7. Creative suite tools, AI agent, translation, YouTube publishing
├── platform/             # 8. Core platform hub (dashboard, projects, scraper, jobs, terminal)
├── profile/              # 9. User profile, account preferences, developer API keys, billing
└── intelligence/         # 10. AI core, series studio, lore continuity memory, multi-model routing
```

---

## 2. Shared Kernel & Infrastructure Relationships
Feature domains interact with shared kernel infrastructure:
- **`app.core`**: Global configuration, JWT security, structured logging, cache, and exceptions.
- **`app.database`**: Database connection pool, session dependency injection (`get_db`), and migrations.
- **`app.providers`**: Third-party adapters for external APIs (OpenAI, Gemini, Anthropic, ElevenLabs, FFmpeg).

Cross-domain calls are orchestrated through public service functions rather than direct internal state mutations.

---

## 3. Parity Mapping Matrix (1 to 10)

| # | Backend Domain | Frontend Counterpart (`frontend/src/features/`) | Sub-Domains | What Lives Here |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **`admin/`** | `admin/` | `dashboard`, `users`, `content`, `usage`, `finance`, `scrapers`, `jobs`, `settings` | Admin dashboard, admin pages, superuser controls, telemetry |
| **2** | **`landing/`** | `landing/` | `hero`, `demo`, `features`, `pricing`, `faq` | Public landing page, demo reels, pricing tiers, marketing |
| **3** | **`auth/`** | `auth/` | `login`, `register`, `forgot-password`, `oauth`, `session` | Login, Register, Reset Password, OAuth, JWT sessions |
| **4** | **`workspace/`** | `workspace/` | `shell`, `imported-assets`, `storyboard`, `viewer`, `preview-video` | Studio shell, imported-assets, storyboard, vertical viewer, preview |
| **5** | **`image_editor/`** | `image-editor/` | `canvas`, `drawing`, `layers`, `auto-crop`, `splitter`, `enhancements`, `merge` | Canvas, drawing, layers, auto-crop, splitter, enhancements, merge |
| **6** | **`video_editor/`** | `video-editor/` | `timeline`, `audio`, `cuts`, `render`, `playback` | Video timeline, audio, cuts, FFmpeg render, playback |
| **7** | **`creative/`** | `creative/` | `suite`, `agent`, `optimizer`, `panel-gen`, `voice`, `thumbnails`, `translation`, `youtube` | Suite hub, agent, optimizer, panel-gen, voice, YouTube publishing |
| **8** | **`platform/`** | `platform/` | `dashboard`, `projects`, `notifications`, `terminal`, `shortcuts`, `scraper`, `jobs`, `shell` | Dashboard, Projects, Notifications, Terminal, Shortcuts, Scraper, Jobs |
| **9** | **`profile/`** | `profile/` | `profile`, `account`, `settings`, `api-keys`, `billing` | User profile, account settings, developer API keys, billing |
| **10** | **`intelligence/`** | `intelligence/` | `core`, `series-studio`, `routing`, `models`, `playground`, `keys`, `wallet` | AI core, series studio, routing, models, playground, keys, wallet |

---

## 4. Architectural Rules
1. **No Circular Dependencies**: Sub-domains inside `platform/` or `workspace/` must not circularly import each other.
2. **Schema Uniformity**: All API contracts must be defined with Pydantic V2 and exported in `schemas.py`.
3. **Decoupled Background Tasks**: Long-running operations (scraping, AI synthesis, video render) must be submitted via `services.jobs.job_manager` to prevent blocking the event loop.
4. **Documentation Compliance**: Every feature and sub-domain directory must contain a comprehensive `README.md` following the standard 7-section specification.
