# shared/api

Shared HTTP client infrastructure used by every feature domain.

## Files

| File | Purpose |
|------|---------|
| `client/fetchWithInterceptor.ts` | JWT auth, 401/429/500 error handling, retry logic |
| `client/request.ts` | Generic `apiRequest<T>()` helper — wraps fetch, parses JSON |
| `types.ts` | `FetchClient`, `ApiResponse<T>`, `JobRecord`, payload shapes |
| `hooks/useBackendHealth.ts` | Global server health poller |
| `index.ts` | Master barrel — re-exports everything |

## Usage

```ts
import { apiRequest }           from "@/shared/api/client/request";
import { fetchWithInterceptor }  from "@/shared/api/client/fetchWithInterceptor";
import type { FetchClient }      from "@/shared/api/types";
import { useBackendHealth }      from "@/shared/api/hooks/useBackendHealth";
```
