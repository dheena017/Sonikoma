# Dashboard Utilities (`features/platform/dashboard/utils/`)

## Overview
Modular utility functions and state calculators extracted from dashboard hooks and views.

## Exports (`dashboardHelpers.ts`)
- **Authentication & Headers**:
  - `getStoredAuthToken()`: Retrieves current authentication token from storage.
  - `getAuthHeaders()`: Generates Authorization bearer headers for project API calls.
- **Routing & Navigation**:
  - `navigateToDashboardPath(target)`: Navigates using app router or fallback window history.
  - `buildProjectEditorUrl(project)`: Generates correct deep link URL for chapter/series editor canvas.
- **Data & Panel Extraction**:
  - `extractProjectScrapedImages(data)`: Normalizes and extracts scraped panel images from project responses.
  - `filterProjectsByQuery(projects, query)`: Filters projects by title and URL matching.
- **Metrics & Onboarding**:
  - `countProjectsByStatus(projects, status)`: Counts projects by status code.
  - `calculateTotalPanels(projects)`: Sums total panel count across all active user projects.
  - `computeOnboardingTasks(tasks, projects, completedCount)`: Derives checklist completion status based on project state.
