# Shared UI Status (`shared/ui/status/`)

## Overview
Global server diagnostics, connection health badges, and backend process inspectors shared across all studio views, editor headers, and admin monitoring dashboards.

## Components
| Component | Purpose |
| :--- | :--- |
| `ServerStatusIndicator.tsx` | Compact interactive pill badge showing `ONLINE`, `OFFLINE`, or `CHECKING` with pulse anims |
| `ServerStatusPopover.tsx` | Diagnostic popover displaying detailed metrics (CPU, RAM, DB connection, latency) |
| `BackendStatusPanel.tsx` | Full-width status card with telemetry indicators and manual reconnect triggers |

## Data Flow
```
useBackendHealth() (shared/hooks)
       │
       ▼
ServerStatusIndicator ──(click)──► ServerStatusPopover ──► getBackendStatus() (API)
```
