# shared/api/hooks

Global API-level React hooks used across the whole application.

## Files

| File | Purpose |
|------|---------|
| `useBackendHealth.ts` | Polls `/api/v1/system/health` every 30s, exposes `status`, `latency` |

## Usage

```ts
import { useBackendHealth } from "@/shared/api/hooks/useBackendHealth";
```
