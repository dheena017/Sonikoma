# Admin Pages (`features/admin/pages/`)

Complete inventory of all 17 administrative pages and workbench screens.

## Page Inventory

| Page Component | Path / Route | Description |
|----------------|--------------|-------------|
| `AdminPage` | `/admin`, `/admin/:section` | Primary router gateway that guards routes and renders the active admin page |
| `AdminDashboardPage` | `/admin-dashboard`, `/admin` | Root telemetry board with real-time stats, server metrics, user list, and audit logs |
| `AdminActivityPage` | `/admin/activity` | Real-time system audit trails, authentication logs, and IP history |
| `AdminAnalyticsPage` | `/admin/analytics` | Platform growth funnels, retention cohorts, project creation velocity |
| `AdminAnnouncementsPage` | `/admin/announcements` | System broadcasts, alerts, and scheduled maintenance notices |
| `AdminConsolePage` | `/admin/console` | Superuser interactive log viewer, filter, and streaming terminal |
| `AdminContentPage` | `/admin/content` | Storyboard inspection, content moderation, storage quotas |
| `AdminCreditsPage` | `/admin/credits` | Studio generation credits, economy balance grants, transaction ledger |
| `AdminExplorerPage` | `/admin/explorer` | Direct read-only database schema inspection and table workbench |
| `AdminFinancePage` | `/admin/finance` | Monthly Recurring Revenue (MRR), subscription churn, financial ledger |
| `AdminHealthPage` | `/admin/health` | Host CPU, GPU worker nodes, memory pools, connection latency |
| `AdminJobsPage` | `/admin/jobs` | Background task queues, live worker state, job cancellation |
| `AdminScrapersPage` | `/admin/scrapers` | Webtoon engine configuration, domain proxies, selectors, rates |
| `AdminSettingsPage` | `/admin/settings` | Global platform settings, AI model endpoints, webhook secrets |
| `AdminTrainingPage` | `/admin/training` | YOLO fine-tuning pipeline, speech bubble detection flywheel |
| `AdminUsagePage` | `/admin/usage` | AI token consumption, rendering compute, bandwidth quotas |
| `AdminUsersPage` | `/admin/users` | User accounts, creator roles, permissions, security suspension |

## Usage

```tsx
import {
  AdminPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminCreditsPage,
  AdminScrapersPage,
  AdminHealthPage,
  AdminTrainingPage,
  // ... all administrative pages
} from "@/features/admin/pages";
```
