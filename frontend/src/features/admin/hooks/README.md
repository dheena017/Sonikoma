# Admin Hooks (`features/admin/hooks/`)

Custom hooks for admin telemetry polling, analytics aggregation, and elevated permission validation.

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useAdminAuth(user, isAuthenticated)` | Checks administrator role status, elevates role via dev bypass, and tracks state |
| `useAdminAnalytics(fetchWithInterceptor, enabled)` | Fetches platform analytics with loading, error, and refetch capabilities |
| `useAdminStats(fetchWithInterceptor, enabled)` | Monitors backend health status, database ping latency, and worker telemetry |

## Usage

```tsx
import { useAdminAuth, useAdminAnalytics, useAdminStats } from "@/features/admin/hooks";
```
