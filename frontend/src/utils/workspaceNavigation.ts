export interface WorkspaceReturnPathOptions {
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  searchParams?: URLSearchParams | string | null;
  storage?: Pick<Storage, "getItem"> | null;
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

  if (activeProjectId && activeSeriesSlug && activeChapterSlug) {
    return `/workspace/editor/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`;
  }

  if (activeProjectId) {
    return activeProjectId.startsWith("temp_")
      ? `/workspace/editor?id=${activeProjectId}`
      : `/workspace?id=${activeProjectId}`;
  }

  return "/workspace";
}
