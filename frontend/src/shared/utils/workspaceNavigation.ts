export interface WorkspaceReturnPathOptions {
  projectId?: string | null;
  jobId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  searchParams?: URLSearchParams | string | null;
  storage?: Pick<Storage, "getItem"> | null;
}

export function slugify(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createTempProjectId(titleOrSlug?: string): string {
  const hash = Math.random().toString(36).substring(2, 8);
  if (titleOrSlug) {
    const slug = slugify(titleOrSlug).substring(0, 24);
    if (slug) return `temp_${slug}_${hash}`;
  }
  return `temp_draft_${hash}`;
}

export function formatProjectIdDisplay(id?: string | null): string {
  if (!id) return "Draft Workspace";
  if (id.startsWith("temp_") || id.startsWith("draft_")) {
    return "Draft Workspace";
  }
  return id;
}

export interface ResolvedWorkspaceParams {
  projectId: string | null;
  jobId: string | null;
}

export function parseWorkspaceParams(
  searchParams?: URLSearchParams | string | null,
  options?: {
    projectId?: string | null;
    jobId?: string | null;
    storage?: Pick<Storage, "getItem"> | null;
  }
): ResolvedWorkspaceParams {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(searchParams || "");

  const storage =
    options?.storage ??
    (typeof window !== "undefined" ? window.localStorage : null);

  const explicitProjectId =
    options?.projectId ??
    params.get("project_id") ??
    params.get("projectId") ??
    params.get("id") ??
    null;

  const explicitJobId =
    options?.jobId ?? params.get("job_id") ?? params.get("jobId") ?? null;

  let projectId: string | null = null;
  let jobId: string | null = null;

  if (explicitProjectId !== null) {
    projectId = explicitProjectId;
    if (explicitJobId !== null) {
      jobId = explicitJobId;
    } else if (storage?.getItem("active_project_id") === explicitProjectId) {
      jobId = storage?.getItem("active_job_id") ?? null;
    } else {
      jobId = null;
    }
  } else {
    projectId = storage?.getItem("active_project_id") ?? null;
    jobId = explicitJobId ?? storage?.getItem("active_job_id") ?? null;
  }

  return { projectId, jobId };
}

export function resolveWorkspaceReturnPath(
  options: WorkspaceReturnPathOptions = {}
): string {
  const { projectId: activeProjectId, jobId: activeJobId } =
    parseWorkspaceParams(options.searchParams, {
      projectId: options.projectId,
      jobId: options.jobId,
      storage: options.storage,
    });

  const storage =
    options.storage ??
    (typeof window !== "undefined" ? window.localStorage : null);

  const activeSeriesSlug =
    options.seriesSlug ?? storage?.getItem("active_series_slug") ?? null;

  const activeChapterSlug =
    options.chapterSlug ?? storage?.getItem("active_chapter_slug") ?? null;

  if (activeSeriesSlug && activeChapterSlug) {
    const jobQuery = activeJobId
      ? `?job_id=${encodeURIComponent(activeJobId)}`
      : "";
    return `/scraper/editor/series/${activeSeriesSlug}/chapters/${activeChapterSlug}${jobQuery}`;
  }

  if (activeProjectId) {
    const query = activeJobId
      ? `project_id=${encodeURIComponent(
          activeProjectId
        )}&job_id=${encodeURIComponent(activeJobId)}`
      : `id=${encodeURIComponent(activeProjectId)}`;

    return activeProjectId.startsWith("temp_")
      ? `/scraper/editor?${query}`
      : `/scraper?${query}`;
  }

  return "/scraper";
}
