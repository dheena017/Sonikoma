# shared/api/client

Low-level HTTP fetch utilities shared across the entire codebase.

## Files

| File | Purpose |
|------|---------|
| `fetchWithInterceptor.ts` | Creates an intercepted fetch with JWT injection, error popups, retry |
| `request.ts` | `apiRequest<T>()` — thin typed wrapper around fetchWithInterceptor |

## Usage

```ts
import { apiRequest }          from "@/shared/api/client/request";
import { createFetchWithInterceptor } from "@/shared/api/client/fetchWithInterceptor";
```
