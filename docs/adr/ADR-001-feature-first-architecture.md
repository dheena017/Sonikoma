# ADR-001: Feature-First Frontend Architecture

## Status
Proposed

## Context
The Sonikoma frontend currently hosts high-complexity multimedia tools (e.g., Image Crop Editors, Timeline Choreographers, Canvas Layer Compositors, and AI Narrative Panels) within loosely nested folders in `frontend/src/components/`. As the application scales to support enterprise-grade capabilities, the flat component layout results in files with high coupling, low discoverability, and difficult state management. For instance, `App.tsx` contains mixed routing, state, and presentation layers, while dashboard elements are spread out.

## Decision
We adopt a **Feature-First Architecture** for the Sonikoma frontend. This pattern groups codebase assets by user-facing product domain or "feature" (e.g., `workspace`, `scraper`, `timeline`, `player`, `admin`, `shared`) rather than technical type (e.g., `components`, `hooks`, `services`).

### Directory Structure Blueprint:
```text
frontend/src/
├── features/
│   ├── scraper/
│   │   ├── components/       # Scraper-specific UI
│   │   ├── hooks/            # Scraper business logic (Zustand/React hooks)
│   │   ├── services/         # Scraper-specific API client routines
│   │   └── types.ts          # Scraper domain definitions
│   ├── workspace/
│   ├── timeline/
│   └── player/
├── components/               # Truly global reusable UI (Button, Modal, Input)
├── hooks/                    # Truly global hooks (useWindowSize, useKeyPress)
├── services/                 # Global HTTP / SSE infrastructure clients
└── App.tsx                   # Thin entry routing container
```

## Consequences
* **Pros:**
  - **High Cohesion & High Locality:** Developers working on the Image Editor can find hooks, types, and components in one feature directory.
  - **Easier Refactoring:** Decoupling features into self-contained units prevents ripple-effect regressions.
  - **Clear Ownership:** Simplifies developer allocation across different functional domains.
* **Cons:**
  - **Refactoring Overhead:** Requires moving files and updating import paths across a large number of files.
  - **Shared Boundary Decisions:** Developers must carefully decide if a component belongs in `features/shared/` or global `components/`.

## Alternatives Considered
* **Layer-First Architecture (Status Quo):** Keep grouping by technical files (all hooks in `/hooks`, all components in `/components`). This was rejected due to excessive cognitive overhead when jumping between layers to implement a single feature.
* **Sub-module / Micro-frontend Architecture:** Too complex and premature for a unified Vite-based application stack.
