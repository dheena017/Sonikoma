export interface WorkspaceReturnPathOptions {
  projectId?: string | null;
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

export function resolveWorkspaceReturnPath(
  options: WorkspaceReturnPathOptions = {}
): string {
  const params =
    options.searchParams instanceof URLSearchParams
      ? options.searchParams
      : new URLSearchParams(options.searchParams || "");

  const storage = options.storage ??
    (typeof window !== "undefined" ? window.localStorage : null);

  const activeProjectId =
    options.projectId ??
    params.get("id") ??
    params.get("project_id") ??
    storage?.getItem("active_project_id") ??
    null;

  const activeSeriesSlug =
    options.seriesSlug ??
    storage?.getItem("active_series_slug") ??
    null;

  const activeChapterSlug =
    options.chapterSlug ??
    storage?.getItem("active_chapter_slug") ??
    null;

  if (activeSeriesSlug && activeChapterSlug) {
    return `/scraper/editor/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`;
  }

  if (activeProjectId) {
    return activeProjectId.startsWith("temp_")
      ? `/scraper/editor?id=${activeProjectId}`
      : `/scraper?id=${activeProjectId}`;
  }

  return "/scraper";
}
