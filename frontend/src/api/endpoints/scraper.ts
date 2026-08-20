import { apiRequest } from "../client/request";
import {
  FetchClient,
  ApiResponse,
  ChapterResult,
  ScrapeChapterPayload,
  JobRecord,
  JobStatus,
} from "../types";
import { getJobStatus, type JobStatusResponse } from "./jobs";

// ============================================================================
// 1. Unified Job Management & Polling
// ============================================================================

/**
 * Retrieves the status, progress, stage, and result of any background Job.
 */
export const getScraperJobStatus = async <T = any>(
  fetchWithInterceptor: FetchClient,
  jobId: string,
  options?: RequestInit
): Promise<JobStatusResponse<T>> => {
  return apiRequest(fetchWithInterceptor, `/api/v1/jobs/${jobId}`, {
    method: "GET",
    ...options,
  });
};

/**
 * Cancels an active or queued background Job.
 */
export const cancelScraperJob = async (
  fetchWithInterceptor: FetchClient,
  jobId: string,
  options?: RequestInit
): Promise<JobStatusResponse> => {
  return apiRequest(fetchWithInterceptor, `/api/v1/jobs/${jobId}/cancel`, {
    method: "POST",
    ...options,
  });
};

/**
 * Polls a Job until COMPLETED or FAILED, invoking onProgress at each step.
 */
export const pollJobUntilComplete = async <T = any>(
  fetchWithInterceptor: FetchClient,
  jobId: string,
  onProgress?: (progress: number, stage: string, job: JobStatusResponse<T>) => void,
  intervalMs: number = 1000,
  timeoutMs: number = 180000
): Promise<JobStatusResponse<T>> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const job = await getScraperJobStatus<T>(fetchWithInterceptor, jobId);
    if (onProgress) {
      onProgress(job.progress ?? 0, job.stage ?? "running", job);
    }

    const st = (job.status || "").toLowerCase();
    if (st === "completed") {
      return job;
    }

    if (st === "failed") {
      const errMsg = job.error?.message || "Job execution failed.";
      throw new Error(`[Job ${jobId} FAILED] ${errMsg}`);
    }

    if (st === "cancelled") {
      throw new Error(`[Job ${jobId}] Job was cancelled.`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.warn(`[Job ${jobId}] Polling timed out. Returning last known state.`);
  return await getScraperJobStatus<T>(fetchWithInterceptor, jobId);
};

// ============================================================================
// 2. Canonical Chapter Scraping (One Chapter = One Job)
// ============================================================================

/**
 * Submits a new SCRAPE_CHAPTER Job.
 */
export const createChapterScrapeJob = async (
  fetchWithInterceptor: FetchClient,
  data:
    | ScrapeChapterPayload
    | { url: string; project_id?: string; job_id?: string; [key: string]: any },
  options?: RequestInit
): Promise<ApiResponse<JobRecord<ChapterResult>>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/scraper/chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Authoritative chapter scraping function: submits a chapter Job, polls to completion,
 * and returns the authoritative ChapterResult with all images discovered internally.
 */
export const scrapeChapter = async (
  fetchWithInterceptor: FetchClient,
  data:
    | ScrapeChapterPayload
    | { url: string; project_id?: string; job_id?: string; [key: string]: any },
  onProgress?: (progress: number, stage: string) => void,
  options?: RequestInit
): Promise<ApiResponse<ChapterResult>> => {
  // 1. Submit Chapter Scrape Job
  const jobResponse = await createChapterScrapeJob(
    fetchWithInterceptor,
    data,
    options
  );
  const jobId = jobResponse.job_id;

  // 2. Poll until background extraction finishes
  const finishedJob = await pollJobUntilComplete<ChapterResult>(
    fetchWithInterceptor,
    jobId,
    (pct, stage) => {
      if (onProgress) onProgress(pct, stage);
    }
  );

  const result = finishedJob.result;
  if (!result) {
    throw new Error("Scraper Job finished without returning a ChapterResult.");
  }

  return {
    ...result,
    job_id: jobId,
    project_id: (data as any).project_id || finishedJob.project_id,
  } as ApiResponse<ChapterResult>;
};

/**
 * @deprecated Use scrapeChapter instead. Kept for legacy compatibility bridge.
 */
export const scrapeImages = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/scrape-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

// ============================================================================
// 3. Series & Episodes Discovery
// ============================================================================

export interface SeriesEpisodesPayload {
  url?: string;
  title_no?: string;
  max_episodes?: number;
  page?: number;
  sort_by?: "latest" | "oldest" | "rating" | "likes";
  include_ratings?: boolean;
  auto_paginate?: boolean;
  bypass_cache?: boolean;
  project_id?: string;
  job_id?: string;
}

export const createEpisodeDiscoveryJob = async (
  fetchWithInterceptor: FetchClient,
  data: SeriesEpisodesPayload,
  options?: RequestInit
): Promise<ApiResponse<JobRecord>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/scraper/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Canonical unified series and episodes crawler.
 */
export const getSeriesEpisodes = async (
  fetchWithInterceptor: FetchClient,
  data: SeriesEpisodesPayload,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const job = await createEpisodeDiscoveryJob(
    fetchWithInterceptor,
    data,
    options
  );
  if (job.status === "COMPLETED" && job.result) {
    return job.result;
  }
  const finished = await pollJobUntilComplete(fetchWithInterceptor, job.job_id);
  return finished.result || finished;
};

export const scrapeEpisodes = getSeriesEpisodes;

export const scrapeEpisodesAdvanced = async (
  fetchWithInterceptor: FetchClient,
  data: SeriesEpisodesPayload,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return getSeriesEpisodes(fetchWithInterceptor, data, options);
};

export const scrapeEpisodesPaginated = async (
  fetchWithInterceptor: FetchClient,
  data: {
    title_no: string;
    max_episodes?: number;
    project_id?: string;
    job_id?: string;
  },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return getSeriesEpisodes(
    fetchWithInterceptor,
    { ...data, auto_paginate: true },
    options
  );
};

export const batchScrapeSeriesAPI = async (
  fetchWithInterceptor: FetchClient,
  data: {
    series: Array<{ url?: string; title_no?: string }>;
    max_episodes_per_series?: number;
    project_id?: string;
    job_id?: string;
  },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const job = await apiRequest<JobRecord>(
    fetchWithInterceptor,
    "/api/v1/scraper/series/batch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    }
  );
  const finished = await pollJobUntilComplete(fetchWithInterceptor, job.job_id);
  return finished.result || finished;
};

// ============================================================================
// 4. Batch Chapter Scraping Jobs
// ============================================================================

export const createBatchScrapeJob = async (
  fetchWithInterceptor: FetchClient,
  data: {
    urls: string[];
    project_id?: string;
    job_id?: string;
    limit?: number;
    proxy_images?: boolean;
    filter_banners?: boolean;
  },
  options?: RequestInit
): Promise<ApiResponse<JobRecord>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/scraper/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const getBatchScrapeStatus = async (
  fetchWithInterceptor: FetchClient,
  jobId: string,
  options?: RequestInit
): Promise<JobStatusResponse<any>> => {
  return getScraperJobStatus(fetchWithInterceptor, jobId, options);
};

// ============================================================================
// 5. Panel Splitting (PANEL_SPLIT Job)
// ============================================================================

export const createPanelSplitJob = async (
  fetchWithInterceptor: FetchClient,
  data: {
    url: string;
    project_id?: string;
    job_id?: string;
    min_panel_height?: number;
  },
  options?: RequestInit
): Promise<ApiResponse<JobRecord>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const splitVerticalStrip = async (
  fetchWithInterceptor: FetchClient,
  data: {
    url: string;
    project_id?: string;
    job_id?: string;
    min_panel_height?: number;
  },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const job = await createPanelSplitJob(fetchWithInterceptor, data, options);
  const finished = await pollJobUntilComplete(fetchWithInterceptor, job.job_id);
  return finished.result || finished;
};

// ============================================================================
// 6. Speech Bubble Dialogue OCR (OCR Job)
// ============================================================================

export const createOcrJob = async (
  fetchWithInterceptor: FetchClient,
  data: { url: string; project_id?: string; job_id?: string; limit?: number },
  options?: RequestInit
): Promise<ApiResponse<JobRecord>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/ocr/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const extractPanelDialogue = async (
  fetchWithInterceptor: FetchClient,
  data: { url: string; project_id?: string; job_id?: string; limit?: number },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const job = await createOcrJob(fetchWithInterceptor, data, options);
  const finished = await pollJobUntilComplete(fetchWithInterceptor, job.job_id);
  return finished.result || finished;
};

// ============================================================================
// 7. Archive Export (EXPORT_ARCHIVE Job)
// ============================================================================

export const createExportJob = async (
  fetchWithInterceptor: FetchClient,
  data: {
    url: string;
    project_id?: string;
    job_id?: string;
    format?: "cbz" | "zip";
    limit?: number;
  },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/export/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const exportComicArchive = createExportJob;

// Panel Tool Endpoints
export const detectPanelsBatch = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const detectPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const detectPanelsB64 = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const extractOcrB64 = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/ocr/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

// ============================================================================
// 8. AI Storyboard Jobs (GENERATE_STORYBOARD Job)
// ============================================================================

export const createStoryboardJob = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<JobRecord>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/storyboard/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const generateStoryboardScript = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const job = await createStoryboardJob(fetchWithInterceptor, data, options);
  const finished = await pollJobUntilComplete(fetchWithInterceptor, job.job_id);
  return finished.result || finished;
};

export const generateStoryboardVideo = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/video/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const generateStoryboard = generateStoryboardScript;

// ============================================================================
// 9. Cache Sync
// ============================================================================

export const updateScraperCache = async (
  fetchWithInterceptor: FetchClient,
  data: { url: string; images: string[]; project_id?: string; job_id?: string },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/scraper/session", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

// ============================================================================
// 10. Admin Domain Management
// ============================================================================

export interface DomainRecord {
  domain: string;
  status: "approved" | "pending" | "blocked";
  blueprint?: Record<string, any> | null;
  success_count: number;
  failure_count: number;
  requested_by?: string | null;
  sample_url?: string | null;
  notes?: string | null;
  last_success_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const listAdminDomains = async (
  fetchWithInterceptor: FetchClient,
  status?: string
): Promise<{ domains: DomainRecord[]; total: number }> => {
  const qs = status ? `?status=${status}` : "";
  return apiRequest(fetchWithInterceptor, `/api/v1/scraper/admin/domains${qs}`, {
    method: "GET",
  });
};

export const requestDomainOnboarding = async (
  fetchWithInterceptor: FetchClient,
  url: string,
  notes?: string
): Promise<{ success: boolean; domain: string; status: string; message: string }> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/scraper/admin/domains/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, notes }),
  });
};

export const updateDomainStatus = async (
  fetchWithInterceptor: FetchClient,
  domain: string,
  payload: { status?: string; blueprint?: Record<string, any>; notes?: string; sample_url?: string }
): Promise<{ success: boolean; domain: string; status: string; message: string }> => {
  return apiRequest(fetchWithInterceptor, `/api/v1/scraper/admin/domains/${domain}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const deleteAdminDomain = async (
  fetchWithInterceptor: FetchClient,
  domain: string
): Promise<{ success: boolean; domain: string; message: string }> => {
  return apiRequest(fetchWithInterceptor, `/api/v1/scraper/admin/domains/${domain}`, {
    method: "DELETE",
  });
};

