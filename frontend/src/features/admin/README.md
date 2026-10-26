# Admin Domain (`features/admin/`)

## 1. Executive Overview & Scope
The **Admin Domain** provides administrative back-office controls, user account management, model training dashboards, system resource metrics, billing/credits control, webtoon scraper worker engines, and elevated access configuration for Sonikoma superusers.

Following strict architectural separation, the domain contains **Pages** and **Components** only (no "tabs" abstraction).

## 2. Directory & Architecture Inventory
- **`pages/`**: 17 dedicated administrative page views:
  - `AdminPage.tsx`: Gateway router with route guards
  - `AdminDashboardPage.tsx`: Primary telemetry & live metric board
  - `AdminActivityPage.tsx`: Security audit trail & auth logs
  - `AdminAnalyticsPage.tsx`: Growth funnels & platform analytics
  - `AdminAnnouncementsPage.tsx`: System broadcasts & alerts
  - `AdminConsolePage.tsx`: Interactive superuser terminal
  - `AdminContentPage.tsx`: Moderation & project quotas
  - `AdminCreditsPage.tsx`: Credit ledger & economy management
  - `AdminExplorerPage.tsx`: Database query explorer
  - `AdminFinancePage.tsx`: Financial MRR & transactions
  - `AdminHealthPage.tsx`: Server & node infrastructure health
  - `AdminJobsPage.tsx`: Background queue worker management
  - `AdminScrapersPage.tsx`: Webtoon scraper engine config
  - `AdminSettingsPage.tsx`: Global system environment settings
  - `AdminTrainingPage.tsx`: AI YOLO fine-tuning pipeline
  - `AdminUsagePage.tsx`: Compute & token quota limits
  - `AdminUsersPage.tsx`: User accounts & role permissions
  - `index.ts`: Unified pages export
- **`components/`**: Reusable layout compounds:
  - `AdminLayout.tsx`: Shell layout with header, sidebar, and page container
  - `AdminHeader.tsx`: Navigation bar with command palette, health status, and user profile
  - `AdminSidebar.tsx`: Expanded drawer navigation
  - `AdminMiniSidebar.tsx`: Compact quick navigation rail
  - `index.ts`: Unified components export
- **`types/`**:
  - `index.ts`: Strong TypeScript definitions for pages, navigation, metrics, users
- **`api/`**:
  - `admin.ts`: CRUD endpoints
  - `analytics.ts`: Telemetry & analytics endpoints
  - `index.ts`: Unified API export
- **`utils/`**:
  - `adminConstants.ts`: Centralized page metadata and sidebar navigation groups
  - `adminFormatters.ts`: Date, duration, elapsed, and byte normalizers
  - `adminAuth.ts`: RBAC permission evaluation & elevation
  - `index.ts`: Unified utils export
- **`hooks/`**:
  - `useAdminAuth.ts`: Admin status determination and elevation
  - `useAdminAnalytics.ts`: Platform analytics state & fetcher
  - `useAdminStats.ts`: Backend telemetry polling
  - `index.ts`: Unified hooks export
- **`index.ts`**: Root feature domain barrel export

## 3. UI Hierarchy Blueprint
```
AdminLayout
├── AdminHeader
├── AdminSidebar / AdminMiniSidebar
└── Page Container (17 Dedicated Pages)
    ├── Overview / AdminDashboardPage
    ├── Users & Permissions
    ├── Credits & Economy
    ├── System Broadcasts
    ├── Content Moderation
    ├── Background Jobs
    ├── Scrapers Engine
    ├── Node Health & Telemetry
    ├── Security Audit Logs
    ├── Growth Analytics
    ├── Revenue & MRR
    ├── Quota Limits
    ├── Global Settings
    ├── Database Explorer
    ├── Superuser Console
    └── AI Training Flywheel
```

## 4. Routing & Navigation
Mounted under `/admin`, `/admin/:page` (e.g., `/admin/users`, `/admin/settings`, `/admin/scrapers`, `/admin/training`, `/admin/console`). Guarded by superuser / administrator role verifications.
