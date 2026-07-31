# Sonikoma Migration Log

This running journal tracks completed, active, and scheduled migration tasks during the Sonikoma enterprise refactoring. It serves as the single source of truth for tracking progress across architectural phases.

---

## 📅 Active Phase: Phase 1 — Architectural Documentation (Current)

*Goal: Establish baseline architectural constraints, decision records (ADRs), coding standards, and technical debt mapping.*

| Task ID | Description | Target Files | Status | Assigned / Author |
| :--- | :--- | :--- | :---: | :--- |
| **MIG-001** | Create Baseline Architecture Decision Records | `docs/adr/*` | **[COMPLETED]** | Jules (AI Lead) |
| **MIG-002** | Design Project Health Dashboard | `docs/project-health.md` | **[COMPLETED]** | Jules (AI Lead) |
| **MIG-003** | Map Technical Debt Register | `docs/technical-debt.md` | **[COMPLETED]** | Jules (AI Lead) |
| **MIG-004** | Formulate Repository Coding Standards | `docs/coding-standards.md` | **[COMPLETED]** | Jules (AI Lead) |
| **MIG-005** | Formulate Migration Framework Documents | `docs/migration/*` | **[COMPLETED]** | Jules (AI Lead) |
| **MIG-006** | Author High-Level Architecture Overviews | `docs/architecture/*` | **[IN PROGRESS]**| Jules (AI Lead) |

---

## 📅 Upcoming Phase: Phase 2 — Network Layer Separation

*Goal: Decouple inline fetch requests from UI elements and centralize API routing under a unified network client.*

| Task ID | Description | Target Files | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **MIG-201** | Create central Axios client | `frontend/src/services/api/client.ts` | **[PLANNED]** | Must support token injection |
| **MIG-202** | Extract scraper integrations | `frontend/src/services/scraper.ts` | **[PLANNED]** | Move from hooks to service |
| **MIG-203** | Extract compiler integrations | `frontend/src/services/compile.ts` | **[PLANNED]** | Centralize in compiler module |

---

## 📅 Upcoming Phase: Phase 3 — Component Decoupling

*Goal: Extract sub-components and layout panels out of bloated page files like `App.tsx` and `CinemaPlayer.tsx`.*

| Task ID | Description | Target Files | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **MIG-301** | Split Router from App.tsx | `frontend/src/components/AppRouter.tsx`| **[PLANNED]** | Decouple routing definitions |
| **MIG-302** | Extract CinemaPlayer HUD overlays | `frontend/src/components/player/HUD.tsx` | **[PLANNED]** | Extract shortcuts cheat-sheet |
| **MIG-303** | Segment useAppState Hook | `frontend/src/hooks/use*Store.ts` | **[PLANNED]** | Split into domain-specific Zustand |
