# Admin Utilities (`features/admin/utils/`)

Pure helper functions, formatters, authorization checks, and centralized metadata constants.

## Available Modules

| File | Purpose |
|------|---------|
| `adminConstants.ts` | Centralized `ADMIN_TAB_METADATA`, `ADMIN_SIDEBAR_GROUPS`, and `getTabMetadata` resolver |
| `adminFormatters.ts` | `formatDate`, `formatAvgDuration`, `formatElapsed`, `formatTimestamp`, `formatBytes` |
| `adminAuth.ts` | `isUserAdmin`, `selfPromoteToAdmin` elevation helper |

## Usage

```ts
import {
  ADMIN_TAB_METADATA,
  getTabMetadata,
  formatDate,
  formatAvgDuration,
  isUserAdmin,
} from "@/features/admin/utils";
```
