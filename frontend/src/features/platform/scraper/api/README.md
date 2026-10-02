# platform/scraper/api

Web scraper — chapter scraping, series discovery, panel split, batch import.

## Files

| File | Purpose |
|------|---------|
| `scraper.ts` | scrapeChapter, getSeriesChapters, createBatchScrapeJob, pollJobUntilComplete, domain management |

## Usage

```ts
import { scrapeChapter, getSeriesChapters } from "@/features/platform/scraper/api/scraper";
```
