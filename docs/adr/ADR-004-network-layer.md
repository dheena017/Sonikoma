# ADR-004: Standardized Network Layer and API Client Separation

## Status
Proposed

## Context
In the current Sonikoma frontend, HTTP fetch requests, file uploads, real-time Server-Sent Events (SSE) telemetry listeners, and polling logic are written on an ad-hoc basis directly inside components (e.g., `TimelineHeader.tsx`, `useCompileActions.ts`, or custom panel editor views). This decentralization:
1. Prevents centralized request interceptors (for appending authorization tokens, injecting custom Request IDs, or capturing global rate-limiting metrics).
2. Makes it extremely difficult to handle error responses globally (e.g., showing unified error toasts or managing expired session logouts).
3. Causes duplicate network implementation patterns, making updates to the API client highly labor-intensive.

## Decision
We establish a **Unified, Centralized Network Layer** on the frontend, built upon a single configurable Axios or Fetch client instance located under `frontend/src/services/api/client.ts`.

### Key Elements:
1. **API Client Isolation:** All HTTP transactions must flow through dedicated, modular API services (e.g., `scraperService.ts`, `narrativeService.ts`, `compileService.ts`) located in `frontend/src/services/api/`. No component or custom hook should use `fetch` or `axios` directly.
2. **Global Interceptors:** Centralized middleware for error handling, request timeouts, adding trace headers, and updating token metrics.
3. **Structured Response Objects:** Ensure all network methods return a standardized, type-safe API container containing `{ data, error, status, message }` instead of bare raw network structures.

## Consequences
* **Pros:**
  - **Single Point of Control:** Applying security headers, credentials (CORS), or intercepting 429 Rate Limit states can be done in a single file.
  - **Seamless Mocking:** Simplifies unit and integration testing of components by providing clean, mockable API services.
  - **Consistent Error Behavior:** Users see reliable, unified toast notifications across all network request failures.
* **Cons:**
  - **Slight Overhead:** Developers must write API service methods for every endpoint instead of invoking fetch directly in standard event handlers.

## Alternatives Considered
* **Inline Fetch/Axios Calls (Status Quo):** Keep invoking asynchronous endpoints directly inside component event handlers. Rejected due to poor observability and massive duplicate error-handling blocks.
