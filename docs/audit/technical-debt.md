# 💸 Enterprise Technical Debt Report

## Executive Summary
This report identifies and assesses areas of **Technical Debt** across the Sonikoma enterprise repository. Technical debt is categorized based on its impact on code quality, developer velocity, pipeline stability, and structural maintainability.

While the system is highly performant and stable under active usage, several "hotspot" modules—characterized by high line counts, coupled responsibilities, and redundant database operations—have been identified. Addressing these hotspots will significantly reduce onboarding friction and prevent architectural regression as the platform grows.

---

## Technical Debt Heatmap

```
High Debt  ├── [App.tsx] ────────────────────── (Component coupling, 2166 lines)
           ├── [db.py] ──────────────────────── (Inline SQL operations, 2823 lines)
           ├── [ai_routes.py] ───────────────── (High endpoint density, 2272 lines)
           ├── [image_routes.py] ────────────── (Mixed logic & routing, 1391 lines)
Medium     ├── [useAppState.ts] ─────────────── (Massive bridge hook, 1392 lines)
           ├── [ProfilePage.tsx] ────────────── (Un-modularized child tabs, 1741 lines)
           └── [scraper.py] ─────────────────── (Sequential page processing, 1806 lines)
Low Debt   └── [useProjectStore.ts] ─────────── (Clean Zustand slice, 35 lines)
```

---

## File Quality & Maintainability Scores

The following table evaluates the 15 most structurally significant or complex files in the codebase (rated from 1 to 10, where 10 is exemplary):

| File Path | Primary Responsibility | Code Quality | Maintainability | Architecture | Security | Recommendation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`backend/python/database/db.py`** | SQLite DB transactions and schemas | 6/10 | 5/10 | 5/10 | 8/10 | **Split** - Extract queries into separate repositories. |
| **`backend/python/routes/ai_routes.py`** | Gemini skills, sequence analysis, crop APIs | 7/10 | 6/10 | 6/10 | 8/10 | **Split** - Break up into skill-specific route groups. |
| **`frontend/src/App.tsx`** | Layout workspace and modal triggers | 6/10 | 5/10 | 6/10 | 9/10 | **Split** - Decompose modal overlays & auth views. |
| **`backend/python/services/scraper.py`** | Multi-webtoon comic crawler and extractor | 7/10 | 6/10 | 7/10 | 8/10 | **Refactor** - Standardize parallel downloads. |
| **`frontend/src/components/profile/ProfilePage.tsx`** | User settings, billing tabs, security, MFA | 6/10 | 5/10 | 6/10 | 9/10 | **Split** - Move tabs to modular files. |
| **`frontend/src/components/Feature/video/CinemaPlayer.tsx`** | Client-side HTML5 multi-layer composition engine | 8/10 | 7/10 | 8/10 | 9/10 | **Keep / Refactor** - Optimize composite rendering. |
| **`frontend/src/hooks/useAppState.ts`** | Core Zustand-to-React state mapper hook | 7/10 | 6/10 | 7/10 | 9/10 | **Refactor** - Split into smaller context-specific hooks. |
| **`backend/python/routes/image_routes.py`** | Inpaint, layer process, transform, and ZIP | 7/10 | 6/10 | 6/10 | 8/10 | **Refactor** - Move processing logic to image_utils.py. |
| **`frontend/src/components/Feature/ai_models/AIModelsPage.tsx`** | Model ledger, benchmark run history, playground | 7/10 | 6/10 | 7/10 | 9/10 | **Split** - Isolate playground into its own container. |
| **`frontend/src/components/Workspace/AppWorkspace.tsx`** | Flexible layout container with collapsible panels | 8/10 | 7/10 | 8/10 | 9/10 | **Keep** - Clean UI layout management. |
| **`frontend/src/components/MainHeader.tsx`** | Top-bar, notification tray, theme switcher, auth | 7/10 | 6/10 | 7/10 | 9/10 | **Split** - Decompose notification panel. |
| **`frontend/src/components/Feature/editor/seloect/FloatingSelectionBar.tsx`**| Canvas annotations and custom crop coordinates | 7/10 | 7/10 | 8/10 | 9/10 | **Keep / Refactor** - Decouple from parent editor components. |
| **`backend/python/routes/auth_routes.py`** | User registrations, Google OAuth, credit balance | 8/10 | 7/10 | 8/10 | 9/10 | **Keep / Split** - Move admin operations to separate file. |
| **`frontend/src/components/Feature/youtube/hooks/useYouTubePublisher.ts`**| YouTube API profiles and playlist publications | 8/10 | 7/10 | 8/10 | 9/10 | **Keep** - Well-encapsulated logic. |
| **`backend/python/main.py`** | FastAPI app bootstrapping & middlewares | 8/10 | 7/10 | 8/10 | 9/10 | **Keep** - Clean initialization logic. |

---

## Detailed Hotspot Analysis

### 1. `backend/python/database/db.py` (2823 lines)
- **Problem**: This file acts as an "All-in-One" active record manager. It initializes connection strings, runs SQL tables, writes raw query parameters, hashes user passwords, manages credit balances, log transactions, and claims awards.
- **Risk**: A minor schema change or raw query typo can take down database-wide integrations. Testing individual queries requires heavy mocking of the SQLite connection.
- **Estimated Refactoring Effort**: **24 hours** (Migrate to SQLite SQLAlchemy ORM models or split into Repository patterns: `UserRepository.py`, `ProjectRepository.py`, `TransactionRepository.py`).

### 2. `frontend/src/App.tsx` (2166 lines)
- **Problem**: This file represents the layout hub of the single-page app. It renders the global `Layout`, sidebar controls, user profiles, the main workspace panel, and a massive list of conditional modal overlays (AutoCrop, SpeechBubble, DeleteConfirm, ErrorPopup, etc.).
- **Risk**: Any change to minor UI dialogs forces a complete compilation and re-render of the root app component.
- **Estimated Refactoring Effort**: **16 hours** (Extract dialog overlays into a global state-driven Modal Provider. Implement lazy loading for large sub-pages).

### 3. `backend/python/routes/ai_routes.py` (2272 lines)
- **Problem**: This router is overloaded with endpoints, schema models, sequence analyses, AI cropping algorithms, model latency tests, and custom Gemini skill mappings.
- **Risk**: Code changes are difficult to track; merging feature branches creates frequent Git conflicts inside this single file.
- **Estimated Refactoring Effort**: **16 hours** (Group routes by context: `/routes/ai_skills.py`, `/routes/ai_cropping.py`, `/routes/ai_analysis.py`).

---

## Architectural & Process Technical Debt

### Mixed Processing and Routing Handlers
- **Issue**: Standard routers (e.g., `image_routes.py`, `video.py`) frequently execute heavy pixel manipulation or multi-process MoviePy/FFmpeg compilation directly inside the route's async event loops.
- **Impact**: Heavy operations block the main single-threaded async event loops, impacting API request-response times.
- **Recommendation**: Offload heavy computational loads to background worker queues (such as FastAPI's background tasks or a Celery-based worker queue).

### Raw SQL Query Injection Risk & Type-Safety
- **Issue**: Database calls in `db.py` rely heavily on raw SQL strings. While parameters are safely bound to prevent injection, the lack of compile-time SQL verification or an ORM makes refactoring column names highly error-prone.
- **Recommendation**: Integrate **SQLAlchemy** or **Peewee** for strong type-checking of database layers.
