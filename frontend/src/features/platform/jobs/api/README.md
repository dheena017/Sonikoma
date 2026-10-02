# platform/jobs/api

Background job polling and management.

## Files

| File | Purpose |
|------|---------|
| `jobs.ts` | getJobStatus, cancelJob, pollJob, listJobs — canonical job lifecycle |

## Usage

```ts
import { pollJob, getJobStatus } from "@/features/platform/jobs/api/jobs";
```
