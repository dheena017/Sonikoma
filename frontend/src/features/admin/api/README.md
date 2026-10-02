# admin/api

Admin & analytics API endpoints.

## Files

| File | Purpose |
|------|---------|
| `admin.ts` | User CRUD, settings, audit logs, impersonation, announcements |
| `analytics.ts` | Token analytics, creator analytics |

## Usage

```ts
import { adminGetUsers }        from "@/features/admin/api/admin";
import { getCreatorAnalytics }  from "@/features/admin/api/analytics";
```
