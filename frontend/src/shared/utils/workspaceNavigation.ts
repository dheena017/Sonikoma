export interface WorkspaceReturnPathOptions {
  projectId?: string | null;
  jobId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  seriesTitle?: string | null;
  chapterNumber?: string | number | null;
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

export function extractDraftHash(projectId?: string | null): string {
  if (!projectId) return "draft";
  const parts = projectId.split("_");
  return parts[parts.length - 1] || "draft";
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

export function getHumanEditorPath(
  options: WorkspaceReturnPathOptions = {}
): string {
  const {
    projectId,
    seriesSlug,
    chapterSlug,
    seriesTitle,
    chapterNumber,
    jobId,
  } = options;

  const activeSeries =
    seriesSlug || (seriesTitle ? slugify(seriesTitle) : null);
  const activeChapter =
    chapterSlug || (chapterNumber ? `chapter-${chapterNumber}` : null);

  const queryParams = new URLSearchParams();
  if (projectId) {
    queryParams.set("project_id", projectId);
  }
  if (jobId) {
    queryParams.set("job_id", jobId);
  }
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  if (activeSeries && activeChapter) {
    const cleanChapter =
      activeChapter.startsWith("chapter-") || activeChapter.startsWith("ch-")
        ? activeChapter
        : `chapter-${activeChapter}`;
    return `/scraper/editor/series/${activeSeries}/chapters/${cleanChapter}${queryString}`;
  }

  if (projectId) {
    if (projectId.startsWith("temp_") || projectId.startsWith("draft_")) {
      const jobQueryParam = jobId ? `&job_id=${encodeURIComponent(jobId)}` : "";
      return `/scraper/editor?id=${encodeURIComponent(
        projectId
      )}${jobQueryParam}`;
    }
    return `/scraper/editor${queryString}`;
  }

  return `/scraper/editor`;
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

  return getHumanEditorPath({
    projectId: activeProjectId,
    jobId: activeJobId,
    seriesSlug: activeSeriesSlug,
    chapterSlug: activeChapterSlug,
    storage,
  });
}

export function getImageEditorPath(options: {
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  seriesTitle?: string | null;
  chapterNumber?: string | number | null;
  projectId?: string | null;
  jobId?: string | null;
  idx?: number;
} = {}): string {
  const {
    seriesSlug,
    chapterSlug,
    seriesTitle,
    chapterNumber,
    projectId,
    jobId,
  } = options;

  let activeSeries = seriesSlug || (seriesTitle ? slugify(seriesTitle) : null);
  let activeChapter =
    chapterSlug || (chapterNumber ? `chapter-${chapterNumber}` : null);
  let activeProjectId = projectId;

  let activeIdx = options.idx;

  if (typeof window !== "undefined") {
    const urlMatch = window.location.pathname.match(
      /\/series\/([^/]+)\/chapters\/([^/]+)/
    );
    if (!activeSeries && urlMatch?.[1]) activeSeries = urlMatch[1];
    if (!activeChapter && urlMatch?.[2]) activeChapter = urlMatch[2];

    if (!activeSeries) {
      activeSeries = localStorage.getItem("active_series_slug") || null;
    }
    if (!activeChapter) {
      activeChapter = localStorage.getItem("active_chapter_slug") || null;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (!activeProjectId) {
      activeProjectId =
        searchParams.get("project_id") ||
        searchParams.get("projectId") ||
        searchParams.get("id") ||
        localStorage.getItem("active_project_id") ||
        null;
    }

    if (activeIdx === undefined || activeIdx === null) {
      const idxFromUrl = searchParams.get("idx");
      if (idxFromUrl !== null && !isNaN(Number(idxFromUrl))) {
        activeIdx = Number(idxFromUrl);
      } else {
        activeIdx = 0;
      }
    }
  }

  if (activeIdx === undefined || activeIdx === null) {
    activeIdx = 0;
  }

  const queryParams = new URLSearchParams();
  if (activeProjectId) {
    queryParams.set("project_id", activeProjectId);
  }
  if (jobId) {
    queryParams.set("job_id", jobId);
  }
  queryParams.set("idx", String(activeIdx));

  const queryString = `?${queryParams.toString()}`;

  if (
    activeSeries &&
    activeChapter &&
    activeSeries !== "null" &&
    activeChapter !== "null"
  ) {
    const cleanChapter =
      activeChapter.startsWith("chapter-") || activeChapter.startsWith("ch-")
        ? activeChapter
        : `chapter-${activeChapter}`;
    return `/scraper/editor/series/${activeSeries}/chapters/${cleanChapter}/image-editor${queryString}`;
  }

  if (activeProjectId) {
    return `/scraper/editor/image-editor${queryString}`;
  }

  return `/image-editor?idx=${activeIdx}`;
}
