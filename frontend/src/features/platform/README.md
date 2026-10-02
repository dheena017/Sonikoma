# Platform Domain (`features/platform/`)

## Executive Overview
The **Platform Domain** represents the foundational system operating environment of Sonikoma. It provides the application frame, core navigation shell, project management workspaces, system scraping facilities, notifications engine, terminal diagnostics, and user shortcut dispatchers.

## Domain Architecture & Sub-Modules
The Platform Domain is partitioned into the following isolated sub-modules:
- **`shell/`**: Top-level application shell, master headers, sidebars, global command search, and initial page loading orchestrators.
- **`dashboard/`**: High-level platform activity metrics, workspace summaries, and quick launch actions.
- **`projects/`**: Project catalog, series grouping, active workspace context bars, and project lifecycle management.
- **`scraper/`**: Webtoon/manga scraping engines, chapter scrapers, URL validation, and batch image extraction.
- **`notifications/`**: Real-time toast alerts, notification dropdowns, and persistent message queues.
- **`shortcuts/`**: Global keybindings, keyboard navigation matrix, and modal key combination configurators.
- **`terminal/`**: Diagnostic output stream, system event log viewer, log level filters, and backend process monitors.

## Standard Internal Structure
Each sub-module strictly implements:
```
<sub-module>/
├── hooks/        ← Business logic, store bindings, event listeners
├── components/   ← Module-scoped UI primitives and composites
├── utils/        ← Pure helper algorithms, formatters, validators
├── pages/        ← Routed screen views
└── README.md     ← Architectural blueprint
```

## Import & Boundary Rules
- **Allowed Inbound**: Generic utilities and UI primitives from `@/shared/`.
- **Allowed Outbound**: Public interfaces exposed via top-level sub-module `index.ts`.
- **Prohibited**: Direct deep cross-domain internal imports without public export barriers.
