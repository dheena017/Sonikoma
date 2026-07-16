# Sonikoma Deprecation Map

This document lists legacy modules, patterns, and files in Sonikoma that are planned for deprecation or have already been deprecated. It provides clean upgrade paths for developers to prevent stale code accumulation.

---

## 🚫 Deprecated Components & Routes

### 1. Standalone `/player` (Theater Mode)
* **Legacy Item:** `/player` route, `TheaterModePage.tsx`, and the 'Open Theater Mode' / 'Analyze Full Sequence' buttons inside `TimelineHeader.tsx`.
* **Deprecation Date:** July 2026 (Completed)
* **Status:** **[REMOVED]**
* **Upgrade Path:** The system has moved to an inline layout. Use the `CinemaPlayer.tsx` component mounted directly above the Storyboard Timeline in `EditorPage.tsx` instead.

### 2. Standalone `/ai-engagement` Features
* **Legacy Item:** `/ai-engagement` route (`EngagementPage.tsx`, `CommentReplier.tsx`), `EngagementTab.tsx` in AI Optimizer, and `OutroCliffhangerAnalyzer.tsx` tabs.
* **Deprecation Date:** July 2026 (Completed)
* **Status:** **[REMOVED]**
* **Upgrade Path:** The AI engagement, cliffhanger, and comment reply functions have been permanently removed from both backend routes (`ai_routes.py`) and UI layers. No direct replacement exists.

---

## ⚠️ Target Items for Deprecation (Planned)

### 3. Inline Fetch Implementations
* **Legacy Item:** Direct `fetch` / `axios` invocations inside component UI methods or hooks (e.g., `TimelineCard.tsx`).
* **Target Refactoring Date:** Phase 2 Migration
* **Status:** **[STALE]**
* **Upgrade Path:** Replace with standardized calls to the central network layer services (`frontend/src/services/api/`).

### 4. Consolidated `useAppState` States
* **Legacy Item:** Mixing of unrelated states (e.g., scraping, cropping coordinates, project configuration) in a single custom hook state context.
* **Target Refactoring Date:** Phase 3 Migration
* **Status:** **[STALE]**
* **Upgrade Path:** Refactor states into dedicated domain Zustand stores.

### 5. Floating / Draggable Portal Layouts
* **Legacy Item:** Pop-up workspace floating panels utilizing draggable modules (e.g., `react-rnd`).
* **Target Refactoring Date:** Phase 4 Migration
* **Status:** **[DEPRECATED]**
* **Upgrade Path:** Enforce 100% flush, flat layouts bounded by dark borders (`border-neutral-800`) to match the premium flat aesthetic.
