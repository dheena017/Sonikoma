# Platform Dashboard Module (`features/platform/dashboard/`)

## 1. Overview & Scope
The **Platform Dashboard** provides high-level workspace analytics, project recents, quick action entry points, and onboarding guides for creators.

## 2. Directory Structure
- **`components/`**: Active dashboard UI components:
  - `DashboardHeader.tsx`: Search bar, greeting, and project creation actions.
  - `DashboardStats.tsx`: High-level metrics (projects count, completed, processing, total panels).
  - `DashboardProjectSection.tsx`: Project workspace with tabs for Standard Projects and AI Series, search filter, and project management actions.
  - `DashboardOnboardingGuide.tsx`: Getting started checklist for new creators without projects.
  - `index.ts`: Barrel export for all components.
- **`hooks/`**:
  - `useDashboardPage.ts`: Reactive state, caching, project fetching, search filtering, and action handlers.
  - `index.ts`: Barrel export for hooks.
- **`pages/`**:
  - `DashboardPage.tsx`: Primary dashboard overview route view.
  - `index.ts`: Barrel export for pages.
- **`types/`**:
  - `index.ts`: Centralized TypeScript data models (`Project`, `OnboardingTask`).
- **`utils/`**:
  - `dashboardHelpers.ts`: URL builders, auth token extraction, image parsing, and project count helpers.
  - `index.ts`: Barrel export for utility functions.
- **`index.ts`**: Root module public entry point.
