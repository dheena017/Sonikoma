# 🎯 Strategic Refactoring & Milestone Plan

## Executive Summary
This document outlines a structured, risk-mitigated plan for refactoring the **Sonikoma** enterprise codebase.

The primary goals of this plan are to reduce technical debt, improve code maintainability, and enhance developer velocity—all while strictly preserving current business logic, database integrity, and API contracts.

---

## 📊 Overall Repository Score: 8.0 / 10

The Sonikoma repository is highly mature, feature-rich, and stable. Its score is driven by:
* **Strengths**: A robust, containerizable multi-layer rendering architecture; advanced Web Audio & HTML5 canvas synchronizations; and a clean data segregation strategy.
* **Opportunities**: The primary opportunities for improvement lie in decomposing monolithic files (such as `db.py`, `ai_routes.py`, and `App.tsx`) and standardizing service patterns.

---

## 🏆 Top 50 Quick Wins (Low Risk / High Impact)

The following high-impact refactorings can be completed with minimal risk and effort:

### 🚀 Codebase Simplifications (1–15)
1. Delete the unreferenced file `frontend/src/utils/supabase.ts`.
2. Move developer-specific validation scripts from `backend/python/scripts/*` to `scratch/` or `tests/`.
3. Consolidate duplicative logos `logo.png` and `logo-dark.png` under a single image.
4. Replace raw `any[]` typing on key parameters inside `useProjectStore.ts` with explicit type interfaces.
5. Create a shared `DefaultVideoConfig` structure to unify fallback parameters across endpoints.
6. Extract the long, inline CSS scrollbar styles from the timeline components into global Tailwind layers.
7. Wrap Python temporary file cleanups in a reusable, safe context manager.
8. Set up a global `.env` validation schema in the frontend to flag missing environment variables on startup.
9. Explicitly label legacy scraper endpoints (such as `/process-url`) as `@deprecated` in the FastAPI docs.
10. Prune unused imports and comments across all route files.
11. Clean up unused styling rules from `frontend/src/index.css`.
12. Isolate dev-dependencies (like Prettier) from production dependencies in `package.json`.
13. Replace raw string manipulations in platform-specific scripts with native Node `path` methods.
14. Expose Python-side execution latency directly via HTTP headers for easier debugging.
15. Standardize API success response formats across all Python routes.

### 🎨 Frontend Layout Cleanups (16–35)
16. Move the sub-sections of `ProfilePage.tsx` into modular tab components.
17. Isolate the profile billing and invoice ledger components into their own files.
18. Extract modal dialog overlays from `App.tsx` into a modular `DialogProvider`.
19. Move timeline bulk operations out of `StoryboardTimeline.tsx`.
20. Extract help banners from `LogsPage.tsx` into a reusable component.
21. Move shortcut filters from `ShortcutsPage.tsx` into `/Shortcuts/components/`.
22. Isolate shortcut recording overlays into a standalone component.
23. Group user-settings layouts cleanly under `/components/settings/`.
24. Decouple custom range sliders from editor-specific types.
25. Isolate credentials configuration panels out of the AI models page.
26. Extract model benchmark history tables into a reusable component.
27. Move the main navigation header out of `App.tsx` and into a dedicated layout wrapper.
28. Standardize loading indicators across all lazy-loaded tabs.
29. Isolate the YouTube publication log history from publishing configurations.
30. Extract the playlist selector component out of `YouTubePage.tsx`.
31. Move character edit modals out of `CharacterProfilePage.tsx`.
32. Isolate character auto-detect parameters into a sidebar helper.
33. Standardize error message popups with a shared styling helper.
34. Extract SEO optimization forms out of `AIOptimizerPage.tsx`.
35. Move sound outro configurations out of the AI Optimizer panel.

### 🛡️ Security & Performance Enhancements (36–50)
36. Enforce strict type checking on the FastAPI request validation schema.
37. Set secure HTTP-only options on session cookie declarations.
38. Add a request rate-limiting header block on all static media requests.
39. Sanitize input paths in the image proxy to prevent directory traversal attempts.
40. Implement a maximum timeout constraint of 60 seconds on all external HTTP scrapers.
41. Explicitly clear local audio mixer buffers on component unmount.
42. Add a global error boundary to isolate canvas rendering exceptions in `CinemaPlayer.tsx`.
43. Run garbage collection immediately after executing concurrent MoviePy tasks.
44. Limit log streams to a maximum buffer of 1,000 entries in the SSE generator to prevent memory leaks.
45. Set default `cache-control` headers on image assets served by the local proxy.
46. Enforce secure password validation schemas on registration endpoints.
47. Implement automatic session timeout triggers in the frontend router.
48. Mask sensitive client secrets in standard logs.
49. Restrict administrative DB query execution endpoints to validated admin users only.
50. Implement automatic DB backup triggers before running YOLO fine-tuning.

---

## 📊 Top 25 High-Risk Files (Priority Refactoring Targets)

The following files require careful refactoring due to their complexity, size, and architectural significance:

1. `backend/python/database/db.py` (2823 lines)
2. `backend/python/routes/ai_routes.py` (2272 lines)
3. `frontend/src/App.tsx` (2166 lines)
4. `backend/python/services/scraper.py` (1806 lines)
5. `frontend/src/components/profile/ProfilePage.tsx` (1741 lines)
6. `frontend/src/components/Feature/video/CinemaPlayer.tsx` (1408 lines)
7. `frontend/src/hooks/useAppState.ts` (1392 lines)
8. `backend/python/routes/image_routes.py` (1391 lines)
9. `frontend/src/components/Feature/ai_models/AIModelsPage.tsx` (1381 lines)
10. `frontend/src/components/Workspace/AppWorkspace.tsx` (1302 lines)
11. `frontend/src/components/MainHeader.tsx` (1296 lines)
12. `frontend/src/components/Feature/editor/seloect/FloatingSelectionBar.tsx` (1295 lines)
13. `backend/python/routes/auth_routes.py` (1241 lines)
14. `frontend/src/components/Feature/youtube/hooks/useYouTubePublisher.ts` (1216 lines)
15. `backend/python/main.py` (1169 lines)
16. `frontend/src/components/admin/Tabs/AdminCreditsTab.tsx` (1130 lines)
17. `frontend/src/components/profile/ProfilePreferencesTab.tsx` (1123 lines)
18. `frontend/src/components/Feature/video/AdvancedSettings.tsx` (1091 lines)
19. `backend/python/routes/video.py` (1081 lines)
20. `frontend/src/components/Status/StatusPage.tsx` (1051 lines)
21. `backend/python/scripts/list_models.py` (1045 lines)
22. `frontend/src/components/Feature/timeline/StoryboardTimeline.tsx` (1035 lines)
23. `frontend/src/components/Feature/youtube/PublishMonitor.tsx` (1006 lines)
24. `frontend/src/components/Feature/ai_models/ModelPlaygroundAndSkills.tsx` (1003 lines)
25. `frontend/src/components/Feature/timeline/TimelineCard.tsx` (961 lines)

---

## 📅 Recommended Refactoring Roadmap & Milestone Plan

We recommend executing this refactoring in **four structured milestones** to ensure stability, facilitate easy rollback, and allow for continuous verification.

```
 Milestone 1: Environment & Tooling (Week 1)
 ├── Isolate environments with pip-tools.
 └── Run CPU-mocked tests in CI.

 Milestone 2: Frontend Layout Modularization (Week 2)
 ├── Move sub-components out of App.tsx.
 └── Decompose ProfilePage.tsx child tabs.

 Milestone 3: Route & Logic Decoupling (Week 3)
 ├── Isolate business logic from ai_routes.py.
 └── Extract helpers out of image_routes.py.

 Milestone 4: Database Repository Migration (Week 4)
 └── Transition from raw SQL in db.py to SQLAlchemy models.
```

### Milestone 1: Environment & Tooling (Week 1)
- **Objective**: Standardize build steps and ensure the test suite passes out-of-the-box.
- **Tasks**:
  - Isolate and lock python dependencies using `pip-tools`.
  - Add CPU-only mock layers to the unittest suite to enable continuous integration (CI) execution without specialized deep-learning hardware.

### Milestone 2: Frontend Layout Modularization (Week 2)
- **Objective**: Decompose large files (App.tsx, ProfilePage.tsx) to improve readability and build performance.
- **Tasks**:
  - Extract child views and tabs out of `ProfilePage.tsx` and `AIModelsPage.tsx`.
  - Migrate inline modal dialog definitions in `App.tsx` to a global, state-driven dialog manager.

### Milestone 3: Route & Logic Decoupling (Week 3)
- **Objective**: Separate API route handling from business and processing logic.
- **Tasks**:
  - Extract processing logic out of `ai_routes.py` and `image_routes.py` into dedicated service files.
  - Standardize error responses and path-validation context managers across all routers.

### Milestone 4: Database Repository Migration (Week 4)
- **Objective**: Improve database type-safety and eliminate dual SQL maintenance overhead.
- **Tasks**:
  - Transition from raw SQL queries in `db.py` to type-safe **SQLAlchemy** or **SQLModel** structures.
  - Consolidate database setups into a single, unified schema definition file.
