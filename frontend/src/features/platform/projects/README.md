# Projects Feature Module (`features/platform/projects/`)

## Overview
The Projects module provides complete project management, series grouping, chapter navigation, workspace switching, and metadata orchestration for Sonikoma.

## Architecture & Directory Layout

```
features/platform/projects/
├── api/             # API client functions for fetching, creating, updating, and deleting projects & series
├── components/      # UI components (cards, tables, filters, stats, series details subcomponents, modals, skeletons)
├── hooks/           # Business logic and state management hooks (useProjectsPage, useSeriesDetails, etc.)
├── pages/           # Routable pages (ProjectsPage, SeriesDetailsPage)
├── store/           # Zustand global store for active project state and local persistence
├── types/           # TypeScript domain interfaces and type definitions (Project, Series, ViewMode, etc.)
├── utils/           # Utility functions (series grouping, demo projects, project navigation helpers)
└── index.ts         # Public barrel export boundary
```

## Public Boundaries & Integration
- Components, hooks, types, and stores are exported via `index.ts`.
- Legacy imports from `hooks/ProjectTypes` and `hooks/ProjectsTable` are aliased for 100% backward compatibility.
