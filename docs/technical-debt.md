# Sonikoma Technical Debt Register

This document registers and categorizes the identified architectural and engineering debts across the Sonikoma Webtoon-to-Video compiler. This registry is used to prioritize refactoring milestones and track codebase quality over time.

---

## 🛑 High Priority (Immediate Remediation Recommended)

### 1. Bloated App.tsx
- **Description:** `App.tsx` contains roughly 1600 lines of code. It mixes application routing guards, modal states, authorization checking, global notification providers, header menus, and sidebar links in a single monolithic React component.
- **Impact:** Extremely high risk of regressions when making routing or layout adjustments. Makes onboarding new engineers difficult.
- **Remediation Plan:** Move routing definitions out to a dedicated router component (`AppRouter.tsx`). Move authorization states to a global auth provider or hook. Split floating dialogs into separate, lazy-loaded context modals.

### 2. Monolithic and Bloated State Controllers (`useAppLogic` / `useAppState`)
- **Description:** State parameters for scraping operations, timeline updates, panel cropping, rendering outputs, and user alerts are combined inside a few massive custom hooks.
- **Impact:** Triggers unnecessary re-renders across unaffected visual elements on minor state edits (e.g., updating timeline selection re-renders unrelated scraper UI panels).
- **Remediation Plan:** Refactor state boundaries into domain-specific Zustand slices (e.g., `useScraperStore`, `useTimelineStore`, `useEditorStore`).

### 3. Duplicate and Decentralized Network Layer
- **Description:** Many components invoke `fetch` or asynchronous Axios requests directly within localized event listeners instead of routing requests through an encapsulated API service wrapper.
- **Impact:** Obstructs central interception for authentication headers, trace headers, rate-limiting, and error-toasting.
- **Remediation Plan:** Establish a centralized client at `frontend/src/services/api/client.ts` and ensure all network integrations utilize dedicated, modular services.

---

## ⚠️ Medium Priority (Plan within Next Refactoring Sprints)

### 4. Monolithic Component Structures (`CinemaPlayer.tsx` / `ImageEditorPage.tsx`)
- **Description:** Components like `CinemaPlayer.tsx` handle layout presentation, coordinate calculations, keyframe scaling, sub-audio HTML5 synchronizations, HUD shortcuts sheets, and Picture-in-Picture logic all within a single file.
- **Impact:** Decreased code readability, challenging code reviews, and high file complexity (~1000+ lines).
- **Remediation Plan:** Break down UI layers (e.g., `CinemaPlayerHUD.tsx`, `CinemaPlayerAudioMixer.ts`, `CinemaPlayerCanvas.tsx`) into separate sub-components and isolated custom hooks.

### 5. Missing Shared Type/Schema Contracts
- **Description:** Shared models and enums (e.g., transition models, visual motion types like `zoom_in` or layer configurations like `character`, `bubble`) are duplicated independently in both Python and TypeScript.
- **Impact:** High likelihood of communication failures and layout crashes when modifying properties in one system but forgetting to update the other.
- **Remediation Plan:** Set up a static codegen task that parses FastAPI's Pydantic model OpenAPI definitions and outputs TypeScript interfaces.

### 6. TypeScript `any` Type Usages
- **Description:** Several sections of the frontend (such as crop parameters, timeline items, or dynamic player event variables) bypass the compiler type system using `any`.
- **Impact:** Negates the advantages of TypeScript, resulting in runtime exceptions and layout drift on the client.
- **Remediation Plan:** Enforce strict compilation checks (`noImplicitAny: true`) and replace instances of `any` with explicit interfaces or `unknown`.

---

## ℹ️ Low Priority (General Engineering Hygiene)

### 7. Duplicate Utility Routines
- **Description:** Core utility logic such as Pillow image resampling checks, image proxy URL wrapping (`wrap_proxy_url`), and TTS syllable duration estimations are rewritten multiple times across both backend route groups and frontend libraries.
- **Impact:** Maintenance overhead. Fixing a bug in one utility doesn't fix it in its duplicated counterpart.
- **Remediation Plan:** Group common Python helper logic under `backend/python/utils/` and common React helper scripts under `frontend/src/utils/`.

### 8. Tight Coupling between AI Services and API Handlers
- **Description:** API route controllers in the Python backend frequently handle direct database queries, file writing, and model compilation.
- **Impact:** Impedes unit testing. High complexity to test API contracts without a running database or file system.
- **Remediation Plan:** Transition routes to follow a strict Controller -> Service -> Repository layer pattern.
