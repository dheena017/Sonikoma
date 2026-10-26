import type {
  ActiveProjectData,
  PanelItem,
  ProjectMetadata,
  ProjectSettingsPayload,
  WorkspaceContext,
} from "./projectStoreTypes";
import {
  STORAGE_KEYS,
  readJsonFromStorage,
  getStoredAuthToken,
  type PersistedProjectEnvelope,
} from "./projectStoreStorage";

const MAX_HISTORY_SNAPSHOTS = 25;

export function calculateAssetCounts(
  project?: Partial<ProjectMetadata>,
  panels: PanelItem[] = [],
  scrapedImages: string[] = []
): { panelsCount: number; importedCount: number } {
  const panelsCount = project?.panels_count ?? panels.length;
  let importedCount =
    project?.imported_assets_count ??
    (scrapedImages.length > 0 ? scrapedImages.length : 0);

  if (
    !importedCount &&
    Array.isArray(project?.audio_settings?.scraped_images) &&
    project.audio_settings.scraped_images.length > 0
  ) {
    importedCount = project.audio_settings.scraped_images.length;
  }
  if (!importedCount && panelsCount > 0) {
    importedCount = panelsCount;
  }

  return { panelsCount, importedCount };
}

export function normalizeProjectData(
  data: ActiveProjectData | null
): ActiveProjectData | null {
  if (!data) return null;

  const { panelsCount, importedCount } = calculateAssetCounts(
    data.project,
    data.panels,
    data.scrapedImages
  );

  return {
    ...data,
    project: {
      ...data.project,
      panels_count: panelsCount,
      imported_assets_count: importedCount,
    },
  };
}

export function readStoredProjectStoreState(): ActiveProjectData | null {
  const parsed = readJsonFromStorage<PersistedProjectEnvelope>(
    STORAGE_KEYS.ZUSTAND_PROJECT_STORE
  );
  if (!parsed) return null;

  const stored =
    parsed?.state?.activeProjectData ?? parsed?.activeProjectData ?? null;
  if (!stored?.project?.project_id) return null;

  return normalizeProjectData(stored as ActiveProjectData);
}

export function readPersistedProjectSnapshot(): ActiveProjectData | null {
  if (typeof window === "undefined") return null;

  try {
    const directSnapshot = readJsonFromStorage<ActiveProjectData>(
      STORAGE_KEYS.PROJECT_SNAPSHOT
    );
    if (directSnapshot?.project?.project_id) {
      return normalizeProjectData(directSnapshot);
    }

    return readStoredProjectStoreState();
  } catch (error) {
    console.warn(
      "[useProjectStore] Failed to read persisted project snapshot:",
      error
    );
    return null;
  }
}

export function applyWorkspaceContextChange(
  currentData: ActiveProjectData | null,
  ctx: WorkspaceContext
): {
  activeProjectId: string | null;
  activeProjectData: ActiveProjectData | null;
} {
  if (!ctx.projectId) {
    return { activeProjectId: null, activeProjectData: null };
  }

  const projectChanged = currentData?.project?.project_id !== ctx.projectId;

  return {
    activeProjectId: ctx.projectId,
    activeProjectData: {
      project: {
        ...(currentData?.project ?? { title: "", url: "" }),
        project_id: ctx.projectId,
        series_id: ctx.seriesId ?? currentData?.project?.series_id ?? null,
        chapter_id: ctx.chapterId ?? currentData?.project?.chapter_id ?? null,
        job_id: ctx.jobId ?? null,
      },
      panels: projectChanged ? [] : currentData?.panels ?? [],
      scrapedImages: projectChanged ? [] : currentData?.scrapedImages ?? [],
    },
  };
}

export function applyLocalSettings(
  currentData: ActiveProjectData | null,
  settings: ProjectSettingsPayload
): ActiveProjectData | null {
  if (!currentData) return null;

  return {
    ...currentData,
    project: {
      ...currentData.project,
      video_settings:
        settings.video_settings !== undefined
          ? settings.video_settings
          : currentData.project.video_settings,
      audio_settings:
        settings.audio_settings !== undefined
          ? settings.audio_settings
          : currentData.project.audio_settings,
      autocrop_settings:
        settings.autocrop_settings !== undefined
          ? settings.autocrop_settings
          : currentData.project.autocrop_settings,
    },
  };
}

export function parseHydratedProjectJson(
  json: any,
  fallbackId: string
): ActiveProjectData | null {
  const raw: Record<string, any> = json.project ?? json.data ?? json;
  if (!raw || (!raw.project_id && !raw.title)) {
    return null;
  }

  const panelsRaw: PanelItem[] = json.panels ?? raw.panels ?? [];
  const scrapedImagesRaw: string[] =
    json.scraped_images ?? json.scrapedImages ?? [];

  const { panelsCount, importedCount } = calculateAssetCounts(
    raw,
    panelsRaw,
    scrapedImagesRaw
  );

  const projectMeta: ProjectMetadata = {
    project_id: raw.project_id || fallbackId,
    series_id: raw.series_id || null,
    chapter_id: raw.chapter_id || raw.project_id || null,
    job_id: raw.job_id ?? null,
    title: raw.title || "Untitled Project",
    url: raw.url || "",
    video_url: raw.video_url || null,
    series_slug: raw.series_slug || null,
    chapter_slug: raw.chapter_slug || null,
    author: raw.author || null,
    cover_image:
      raw.cover_image ||
      raw.first_panel_image ||
      panelsRaw[0]?.image_url ||
      null,
    first_panel_image: raw.first_panel_image || panelsRaw[0]?.image_url || null,
    synopsis: raw.synopsis || null,
    genre: raw.genre || null,
    episode: raw.episode || null,
    audio_settings: raw.audio_settings || null,
    video_settings: raw.video_settings || null,
    autocrop_settings: raw.autocrop_settings || null,
    status: raw.status || "Ready",
    created_at: raw.created_at || raw.updated_at || undefined,
    panels_count: panelsCount,
    imported_assets_count: importedCount,
  };

  return {
    project: projectMeta,
    panels: panelsRaw,
    scrapedImages: scrapedImagesRaw,
  };
}

export async function fetchProjectFromServer(
  identifier: string,
  fetchClient?: any
): Promise<ActiveProjectData | null> {
  if (!identifier) return null;
  const fetcher =
    fetchClient || (typeof window !== "undefined" ? window.fetch : null);
  if (!fetcher) return null;
  const token = getStoredAuthToken();

  try {
    const res = await fetcher(
      `/api/v1/projects/${encodeURIComponent(identifier)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (res.ok) {
      const json = await res.json();
      const parsed = parseHydratedProjectJson(json, identifier);
      if (parsed) return parsed;
    }
  } catch (_) {}

  try {
    const res = await fetcher(
      `/api/v1/projects/public/${encodeURIComponent(identifier)}`
    );
    if (res.ok) {
      const json = await res.json();
      const parsed = parseHydratedProjectJson(json, identifier);
      if (parsed) return parsed;
    }
  } catch (_) {}

  return null;
}

export function reorderPanelArray(
  list: PanelItem[],
  startIndex: number,
  endIndex: number
): PanelItem[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((p, idx) => ({ ...p, panel_index: idx }));
}

export function pushHistorySnapshot(
  history: ActiveProjectData[],
  currentIndex: number,
  newSnapshot: ActiveProjectData
): {
  history: ActiveProjectData[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
} {
  const truncated = history.slice(0, currentIndex + 1);
  const updated = [...truncated, newSnapshot];
  if (updated.length > MAX_HISTORY_SNAPSHOTS) {
    updated.shift();
  }
  const nextIndex = updated.length - 1;
  return {
    history: updated,
    historyIndex: nextIndex,
    canUndo: nextIndex > 0,
    canRedo: false,
  };
}

export function computeSpeechDuration(
  text: string,
  wordsPerSec = 2.5,
  bufferSec = 1.5
): number {
  const clean = text.trim();
  if (!clean) return 3.0;
  const words = clean.split(/\s+/).length;
  const calculated = Math.round((words / wordsPerSec + bufferSec) * 10) / 10;
  return Math.max(2.5, Math.min(calculated, 15.0));
}
