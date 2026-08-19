/**
 * frontend/src/api/endpoints/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical Job Status Polling & Management API Client
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface JobExecutionInfo {
  provider?: string;
  model?: string;
  attempt?: number;
}

export interface JobErrorInfo {
  code: string;
  message: string;
  stage?: string;
  provider?: string;
  model?: string;
}

export interface JobStatusResponse<T = any> {
  job_id: string;
  job_type: string;
  capability?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  stage: string;
  project_id?: string | null;
  chapter_id?: string | null;
  execution?: JobExecutionInfo | null;
  result?: T | null;
  error?: JobErrorInfo | null;
}

/**
 * Retrieves the current execution state of a job from the canonical endpoint.
 */
export async function getJobStatus<T = any>(
  jobId: string
): Promise<JobStatusResponse<T>> {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    "";

  const res = await fetch(`/api/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch job status (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Cancels a running or queued job.
 */
export async function cancelJob<T = any>(
  jobId: string
): Promise<JobStatusResponse<T>> {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    "";

  const res = await fetch(`/api/jobs/${jobId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to cancel job (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Polls a job until completion or failure with callbacks.
 */
export async function pollJob<T = any>(
  jobId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (job: JobStatusResponse<T>) => void;
  } = {}
): Promise<JobStatusResponse<T>> {
  const intervalMs = options.intervalMs || 1000;
  const timeoutMs = options.timeoutMs || 300000; // 5 min timeout
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const job = await getJobStatus<T>(jobId);
    options.onProgress?.(job);

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      const err = new Error(
        job.error?.message || `Job ${jobId} failed at stage ${job.stage}`
      ) as any;
      err.job = job;
      throw err;
    }

    if (job.status === "cancelled") {
      const err = new Error(`Job ${jobId} was cancelled`) as any;
      err.job = job;
      throw err;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
}

export interface JobListResponse<T = any> {
  success: boolean;
  total: number;
  jobs: JobStatusResponse<T>[];
}

export interface ListJobsOptions {
  projectId?: string;
  chapterId?: string;
  status?: string;
  jobType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lists background execution jobs with optional filtering and pagination.
 */
export async function listJobs<T = any>(
  options: ListJobsOptions = {}
): Promise<JobListResponse<T>> {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    "";

  const params = new URLSearchParams();
  if (options.projectId) params.append("project_id", options.projectId);
  if (options.chapterId) params.append("chapter_id", options.chapterId);
  if (options.status) params.append("status", options.status);
  if (options.jobType) params.append("job_type", options.jobType);
  if (options.limit) params.append("limit", String(options.limit));
  if (options.offset) params.append("offset", String(options.offset));

  const qs = params.toString();
  const url = `/api/jobs/${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list jobs (HTTP ${res.status})`);
  }

  return res.json();
}
