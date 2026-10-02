# shared/types

Global TypeScript type definitions and interfaces shared across the entire application.

## Contents

| File | Purpose |
|------|---------|
| `models.ts` | Core domain models: `GeneratedPanel`, `AIModel`, `CharacterMemory`, `StoryMemoryState`, etc. |
| `logs.ts` | `LogEntry`, `LogLevel`, `normalizeLog()` used across all feature domains for structured logging |
| `api.ts` | `ApiResponse<T>` and `PaginatedResponse<T>` generic API wrapper shapes |
| `index.ts` | Barrel export re-exports all of the above |

## Usage

```ts
// Preferred - import from the barrel
import { GeneratedPanel, AIModel } from "@/shared/types";

// Or import directly from a specific file
import { normalizeLog } from "@/shared/types/logs";
import { ApiResponse } from "@/shared/types/api";
```

## Rules

- Do NOT add feature-specific types here. Only truly global, cross-domain types belong here.
- Feature-specific types should live inside their own `features/<domain>/types.ts`.
