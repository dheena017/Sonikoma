import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StoryMemoryState } from "../../types/models";

// =============================================================================
// 0. Storage Quota-Safe localStorage Wrapper
// =============================================================================

const STORAGE_KEYS = {
  ACTIVE_PROJECT_ID: "active_project_id",
  ACTIVE_JOB_ID: "active_job_id",
  ACTIVE_SERIES_SLUG: "active_series_slug",
  ACTIVE_CHAPTER_SLUG: "active_chapter_slug",
  ZUSTAND_PROJECT_STORE: "sonikoma-active-project-store",
  PROJECT_SNAPSHOT: "sonikoma_project_snapshot",
  IMPORT_PROJECT: "sonikoma_import_project",
  AUTH_TOKEN: "sonikoma_token",
} as const;

/** Wraps localStorage and catches QuotaExceededError gracefully */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      // QuotaExceededError — storage is full
      if (
        e?.name === "QuotaExceededError" ||
        e?.code === 22 ||
        e?.code === 1014
      ) {
        console.warn(
          "[Storage] localStorage quota exceeded — project data could not be saved locally. " +
          "Use the Save button to persist to the server."
        );
        // Try to save only the minimal essential keys (project_id) to recover space
        try {
          const minimal = JSON.parse(value || "{}");
          if (minimal?.state?.activeProjectData) {
            minimal.state.activeProjectData.panels = [];
            minimal.state.activeProjectData.scrapedImages = [];
          }
          localStorage.setItem(key, JSON.stringify(minimal));
        } catch {
          // If even that fails, just skip — server save is the source of truth
        }
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

type PersistedProjectEnvelope = {
  state?: {
    activeProjectData?: ActiveProjectData | null;
  };
  activeProjectData?: ActiveProjectData | null;
};

function readJsonFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  const raw = safeLocalStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    safeLocalStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[useProjectStore] Failed to persist ${key}:`, error);
  }
}

function readStoredProjectStoreState(): ActiveProjectData | null {
  const parsed = readJsonFromStorage<PersistedProjectEnvelope>(STORAGE_KEYS.ZUSTAND_PROJECT_STORE);
  if (!parsed) return null;

  const stored = parsed?.state?.activeProjectData ?? parsed?.activeProjectData ?? null;
  if (!stored?.project?.project_id) return null;

  return normalizeProjectData(stored as ActiveProjectData);
}

function readStoredProjectImport(): Record<string, any> | null {
  const parsed = readJsonFromStorage<any>(STORAGE_KEYS.IMPORT_PROJECT);
  if (!parsed || !Array.isArray(parsed?.panels) || parsed.panels.length === 0) return null;

  return parsed;
}

// =============================================================================
// 0b. Debounced Auto-Save Scheduler
// =============================================================================

let _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Call this after any panel/data change to schedule a background save.
 * Resets the timer if called again before the delay expires.
 */
export function scheduleAutoSave(
  fetchClient?: any,
  delayMs = 2000
): void {
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    _autoSaveTimer = null;
    const store = useProjectStore.getState();
    if (store.isDirty && store.activeProjectId && !store.isSaving) {
      await store.saveActiveProject(fetchClient);
    }
  }, delayMs);
}

// =============================================================================
// 1. Strongly Typed Interfaces
// =============================================================================

export interface WorkspaceContext {
  projectId: string | null;
  seriesId?: string | null;
  chapterId?: string | null;
  jobId: string | null;
}

export interface PanelItem {
  panel_index?: number;
  image_url: string;
  original_url?: string | null;
  speech_text?: string;
  narrative?: string | null;
  sfx?: string;
  duration?: number;
  motion_type?: string;
  visual_description?: string | null;
  audio_url?: string | null;
  narrative_audio_url?: string | null;
  speech_audio_url?: string | null;
  bgm_track?: string | null;
  brightness?: number | null;
  contrast?: number | null;
  saturation?: number | null;
  grayscale?: boolean;
  filter_preset?: string | null;
  bubble_method?: string | null;
  bubble_sensitivity?: number | null;
  bubble_dilation?: number | null;
  inpaint_radius?: number | null;
  detection_style?: string | null;
  smart_crop?: boolean;
  crop_padding?: number | null;
  speaker_name?: string;
  speaker_gender?: 'male' | 'female' | 'child' | 'neutral' | string;
  emotion?: string;
  scene_context?: string;
  is_scene_transition?: boolean;
  is_internal_thought?: boolean;
  dialogue_turns?: any[];
  [key: string]: any;
}

export interface AudioSettings {
  volume?: number;
  narrationVolume?: number;
  bgmVolume?: number;
  sfxVolume?: number;
  speechRate?: number;
  speechPitch?: number;
  voiceActor?: string;
  narratorVoice?: string;
  musicTheme?: string;
  audioDucking?: boolean;
  scraped_images?: string[];
  [key: string]: any;
}

export interface VideoSettings {
  aspectRatio?: string;
  frameRate?: number;
  audioReactiveShake?: boolean;
  shakeIntensity?: any;
  videoFormat?: string;
  backgroundStyle?: string;
  subtitlesStyle?: string;
  activeTheme?: string;
  [key: string]: any;
}

export interface AutoCropSettings {
  sensitivity?: number;
  padding?: number;
  backgroundColorMode?: string;
  autoSplitTallStrips?: boolean;
  aspectRatioLock?: string;
  minPanelAreaPct?: number;
  overlapMergeThreshold?: number;
  useLocalCV?: boolean;
  cropModel?: string;
  cropMinHeightPx?: number;
  cropCannyLow?: number;
  cropCannyHigh?: number;
  cropCloseKernelSize?: number;
  [key: string]: any;
}

export interface ProjectMetadata {
  project_id: string;
  series_id?: string | null;
  chapter_id?: string | null;
  job_id?: string | null;
  title: string;
  url: string;
  video_url?: string | null;
  series_slug?: string | null;
  chapter_slug?: string | null;
  author?: string | null;
  cover_image?: string | null;
  first_panel_image?: string | null;
  synopsis?: string | null;
  genre?: string | null;
  episode?: string | null;
  audio_settings?: AudioSettings | null;
  video_settings?: VideoSettings | null;
  autocrop_settings?: AutoCropSettings | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  panels_count?: number;
  imported_assets_count?: number;
  [key: string]: any;
}

export interface ActiveProjectData {
  project: ProjectMetadata;
  panels: PanelItem[];
  scrapedImages?: string[];
  story_memory?: any;
}

export type ProjectStateMode = "idle" | "loading" | "active" | "missing";

export interface MissingProjectDetails {
  missingId: string;
  isJobId: boolean;
  attemptedAt: string;
}

export interface ProjectSettingsPayload {
  video_settings?: VideoSettings;
  audio_settings?: AudioSettings;
  autocrop_settings?: AutoCropSettings;
}

export interface ProjectStoreState {
  // ── State Variables ───────────────────────────────────────────────────────
  activeProjectId: string | null;
  activeProjectData: ActiveProjectData | null;
  selectedPanelIndex: number;
  projectState: ProjectStateMode;
  missingProjectInfo: MissingProjectDetails | null;
  isDrawerOpen: boolean;
  isDirty: boolean;
  isHydrating: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  isEpisodeCollapsed: boolean;

  // Search & Filter
  searchQuery: string;
  filterMotion: string | null;

  // ── Undo / Redo History ───────────────────────────────────────────────────
  history: ActiveProjectData[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // ── Project Lifecycle Actions ─────────────────────────────────────────────
  setActiveProjectId: (id: string | null) => void;
  setActiveProject: (data: ActiveProjectData | null) => void;
  setProjectLoading: () => void;
  setProjectMissing: (missingId: string, options?: { isJobId?: boolean }) => void;
  setWorkspaceContext: (ctx: WorkspaceContext) => void;
  hydrateActiveProject: (id?: string | null, fetchClient?: any) => Promise<void>;
  saveActiveProject: (fetchClient?: any) => Promise<boolean>;
  clearActiveProject: () => void;

  // ── Panel Direct Manipulation Actions ─────────────────────────────────────
  setSelectedPanelIndex: (index: number) => void;
  updatePanel: (index: number, updates: Partial<PanelItem>) => void;
  addPanel: (panel: PanelItem, atIndex?: number) => void;
  removePanel: (index: number) => void;
  duplicatePanel: (index: number) => void;
  reorderPanels: (startIndex: number, endIndex: number) => void;
  batchUpdatePanels: (indices: number[], updates: Partial<PanelItem>) => void;
  setPanels: (panels: PanelItem[]) => void;
  clearAllPanels: () => void;

  // ── Smart Automation & Studio Presets ─────────────────────────────────────
  setSearchQuery: (query: string) => void;
  setFilterMotion: (motion: string | null) => void;
  getFilteredPanels: () => PanelItem[];
  setGlobalPanelDuration: (duration: number) => void;
  applyMotionPresetToAll: (motionType: string) => void;
  applyStylePresetToAll: (presetName: string) => void;
  autoCalculateSpeechDurations: (wordsPerSec?: number, bufferSec?: number) => void;

  // ── Import / Export Backup Actions ────────────────────────────────────────
  exportProjectAsJson: () => string | null;
  importProjectFromJson: (jsonString: string) => boolean;

  // ── Computed Statistics Helpers ───────────────────────────────────────────
  getTotalDuration: () => number;
  getTotalWordCount: () => number;

  // ── Settings Actions ──────────────────────────────────────────────────────
  updateProjectSettings: (settings: ProjectSettingsPayload, fetchClient?: any) => Promise<boolean>;
  updateVideoSettings: (videoSettings: VideoSettings, fetchClient?: any) => Promise<boolean>;
  updateAudioSettings: (audioSettings: AudioSettings, fetchClient?: any) => Promise<boolean>;
  updateAutoCropSettings: (autoCropSettings: AutoCropSettings, fetchClient?: any) => Promise<boolean>;

  // ── Cognitive Story Memory ───────────────────────────────────────────────
  storyMemory: StoryMemoryState | null;
  updateStoryMemory: (memory: Partial<StoryMemoryState>) => void;
  resetStoryMemory: () => void;

  // ── UI States ─────────────────────────────────────────────────────────────
  setDrawerOpen: (open: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsEpisodeCollapsed: (v: boolean) => void;
}

// =============================================================================
// 2. Separate Pure Helper Functions (Modular Architecture)
// =============================================================================

const MAX_HISTORY_SNAPSHOTS = 25;

/** 1. Check if a project ID is a temporary preview or draft */
export function isTempProject(projectId: string | null): boolean {
  if (!projectId) return false;
  return (
    projectId.startsWith("temp_") ||
    projectId.startsWith("draft_") ||
    projectId.startsWith("preview_")
  );
}

/** 2. Retrieve user auth token safely from browser storage */
export function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    safeLocalStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    (() => {
      try {
        return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch {
        return null;
      }
    })() ||
    ""
  );
}

/** 3. Clear all active project session keys from localStorage */
export function clearStoredProjectSession(): void {
  if (typeof window === "undefined") return;
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_SERIES_SLUG);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAPTER_SLUG);
}

export function setActiveProjectSession(projectId: string | null, jobId?: string | null): void {
  if (typeof window === "undefined") return;

  if (projectId) {
    safeLocalStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, projectId);
    if (jobId) {
      safeLocalStorage.setItem(STORAGE_KEYS.ACTIVE_JOB_ID, String(jobId));
    } else {
      safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_ID);
    }
    return;
  }

  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_ID);
}

export function writeProjectSnapshot(snapshot: ActiveProjectData | null): void {
  if (typeof window === "undefined") return;

  if (!snapshot || !snapshot.project?.project_id) {
    safeLocalStorage.removeItem(STORAGE_KEYS.PROJECT_SNAPSHOT);
    return;
  }

  writeJsonToStorage(STORAGE_KEYS.PROJECT_SNAPSHOT, snapshot);
}

export function readPersistedProjectSnapshot(): ActiveProjectData | null {
  if (typeof window === "undefined") return null;

  try {
    const directSnapshot = readJsonFromStorage<ActiveProjectData>(STORAGE_KEYS.PROJECT_SNAPSHOT);
    if (directSnapshot?.project?.project_id) {
      return normalizeProjectData(directSnapshot);
    }

    return readStoredProjectStoreState();
  } catch (error) {
    console.warn("[useProjectStore] Failed to read persisted project snapshot:", error);
    return null;
  }
}

/** 4. Construct a structured MissingProjectDetails record */
export function buildMissingProjectInfo(
  missingId: string,
  isJobIdOverride?: boolean
): MissingProjectDetails {
  return {
    missingId,
    isJobId: isJobIdOverride ?? missingId.startsWith("job_"),
    attemptedAt: new Date().toISOString(),
  };
}

/** 5. Calculate panel and imported image count metrics */
export function calculateAssetCounts(
  project?: Partial<ProjectMetadata>,
  panels: PanelItem[] = [],
  scrapedImages: string[] = []
): { panelsCount: number; importedCount: number } {
  const panelsCount = project?.panels_count ?? panels.length;
  let importedCount = project?.imported_assets_count ?? (scrapedImages.length > 0 ? scrapedImages.length : 0);

  if (!importedCount && Array.isArray(project?.audio_settings?.scraped_images) && project.audio_settings.scraped_images.length > 0) {
    importedCount = project.audio_settings.scraped_images.length;
  }
  if (!importedCount && panelsCount > 0) {
    importedCount = panelsCount;
  }

  return { panelsCount, importedCount };
}

/** 6. Normalize project data with computed counts and defaults */
export function normalizeProjectData(data: ActiveProjectData | null): ActiveProjectData | null {
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

/** 7. Compute updated workspace context when switching projects */
export function applyWorkspaceContextChange(
  currentData: ActiveProjectData | null,
  ctx: WorkspaceContext
): { activeProjectId: string | null; activeProjectData: ActiveProjectData | null } {
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

/** 8. Apply local settings update to ActiveProjectData in memory */
export function applyLocalSettings(
  currentData: ActiveProjectData | null,
  settings: ProjectSettingsPayload
): ActiveProjectData | null {
  if (!currentData) return null;

  return {
    ...currentData,
    project: {
      ...currentData.project,
      video_settings: settings.video_settings !== undefined
        ? settings.video_settings
        : currentData.project.video_settings,
      audio_settings: settings.audio_settings !== undefined
        ? settings.audio_settings
        : currentData.project.audio_settings,
      autocrop_settings: settings.autocrop_settings !== undefined
        ? settings.autocrop_settings
        : currentData.project.autocrop_settings,
    },
  };
}

/** 9. Parse raw backend API JSON into structured ActiveProjectData */
export function parseHydratedProjectJson(
  json: any,
  fallbackId: string
): ActiveProjectData | null {
  const raw: Record<string, any> = json.project ?? json.data ?? json;
  if (!raw || (!raw.project_id && !raw.title)) {
    return null;
  }

  const panelsRaw: PanelItem[] = json.panels ?? raw.panels ?? [];
  const scrapedImagesRaw: string[] = json.scraped_images ?? json.scrapedImages ?? [];

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
    cover_image: raw.cover_image || raw.first_panel_image || panelsRaw[0]?.image_url || null,
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

/** 10. Reorder helper for Drag-and-Drop panels */
export function reorderPanelArray(list: PanelItem[], startIndex: number, endIndex: number): PanelItem[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((p, idx) => ({ ...p, panel_index: idx }));
}

/** 11. Helper to append a snapshot into the Undo/Redo history stack */
export function pushHistorySnapshot(
  history: ActiveProjectData[],
  currentIndex: number,
  newSnapshot: ActiveProjectData
): { history: ActiveProjectData[]; historyIndex: number; canUndo: boolean; canRedo: boolean } {
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

/** 12. Dynamic panel reading duration calculator */
export function computeSpeechDuration(text: string, wordsPerSec = 2.5, bufferSec = 1.5): number {
  const clean = text.trim();
  if (!clean) return 3.0;
  const words = clean.split(/\s+/).length;
  const calculated = Math.round((words / wordsPerSec + bufferSec) * 10) / 10;
  return Math.max(2.5, Math.min(calculated, 15.0)); // Between 2.5s and 15s
}

/** 13. HTTP PUT settings helper for backend communication */
async function sendSettingsUpdate(
  projectId: string,
  endpointSubpath: string,
  payload: Record<string, any>,
  fetchClient?: any
): Promise<any | null> {
  const fetchFn = fetchClient || window.fetch || fetch;
  const res = await fetchFn(
    `/api/v1/projects/${encodeURIComponent(projectId)}/settings${endpointSubpath}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed settings update: ${res.statusText}`);
  }
  return res.json();
}

// =============================================================================
// 3. Zustand Store Definition with Reload Resilience & History Stack
// =============================================================================

const inFlightHydrations = new Map<string, Promise<void>>();

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      // State
      activeProjectId: null,
      activeProjectData: null,
      selectedPanelIndex: 0,
      projectState: "idle",
      missingProjectInfo: null,
      storyMemory: null,
      isDrawerOpen: false,
      isDirty: false,
      isHydrating: false,
      isSaving: false,
      lastSavedAt: null,
      isEpisodeCollapsed: false,

      // Search & Filters
      searchQuery: "",
      filterMotion: null,

      // Undo / Redo State
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      // ── Select Active Project ID ──────────────────────────────────────────
      setActiveProjectId: (id) =>
        set((state) => {
          if (state.activeProjectId === id && state.projectState === "active") return state;
          if (!id) {
            setActiveProjectSession(null, null);
            return {
              activeProjectId: null,
              activeProjectData: null,
              selectedPanelIndex: 0,
              projectState: "idle",
              missingProjectInfo: null,
              history: [],
              historyIndex: -1,
              canUndo: false,
              canRedo: false,
            };
          }

          setActiveProjectSession(id, state.activeProjectData?.project?.job_id ?? null);
          const hasMatchingData = state.activeProjectData?.project?.project_id === id;
          return {
            activeProjectId: id,
            projectState: hasMatchingData ? "active" : "loading",
          };
        }),

      // ── Set Active Project Data ───────────────────────────────────────────
      setActiveProject: (data) => {
        const normalized = normalizeProjectData(data);
        if (normalized) {
          const snapshot = pushHistorySnapshot([], -1, normalized);
          setActiveProjectSession(normalized.project.project_id ?? null, normalized.project.job_id ?? null);
          writeProjectSnapshot(normalized);
          set({
            activeProjectData: normalized,
            activeProjectId: normalized.project.project_id ?? null,
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
            ...snapshot,
          });
        } else {
          setActiveProjectSession(null, null);
          writeProjectSnapshot(null);
          set({
            activeProjectData: null,
            activeProjectId: null,
            projectState: "idle",
            missingProjectInfo: null,
            isHydrating: false,
            history: [],
            historyIndex: -1,
            canUndo: false,
            canRedo: false,
          });
        }
      },

      // ── Undo / Redo Actions ───────────────────────────────────────────────
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const targetData = history[prevIndex];
          set({
            activeProjectData: targetData,
            historyIndex: prevIndex,
            canUndo: prevIndex > 0,
            canRedo: true,
            isDirty: true,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const targetData = history[nextIndex];
          set({
            activeProjectData: targetData,
            historyIndex: nextIndex,
            canUndo: true,
            canRedo: nextIndex < history.length - 1,
            isDirty: true,
          });
        }
      },

      // ── Loading & Missing State Handlers ──────────────────────────────────
      setProjectLoading: () =>
        set({
          projectState: "loading",
          isHydrating: true,
        }),

      setProjectMissing: (missingId, options) =>
        set({
          projectState: "missing",
          missingProjectInfo: buildMissingProjectInfo(missingId, options?.isJobId),
          isHydrating: false,
        }),

      // ── Workspace Context Switch ──────────────────────────────────────────
      setWorkspaceContext: (ctx) =>
        set((state) => applyWorkspaceContextChange(state.activeProjectData, ctx)),

      // ── Hydrate / Fetch From Backend (Preserves Temp & Saved Projects on Reload) ──
      hydrateActiveProject: async (targetId, fetchClient) => {
        const persistedSnapshot = readPersistedProjectSnapshot();
        const fallbackId = targetId ?? get().activeProjectId ?? persistedSnapshot?.project?.project_id ?? null;
        const idToHydrate = fallbackId;
        const currentData = get().activeProjectData;

        if (!idToHydrate) {
          const restoredFromPersist = persistedSnapshot;
          if (restoredFromPersist) {
            const favProjectId = restoredFromPersist.project.project_id;
            setActiveProjectSession(favProjectId, restoredFromPersist.project.job_id ?? null);
            set({
              activeProjectId: favProjectId,
              activeProjectData: restoredFromPersist,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
            });
            return;
          }
          if (currentData) {
            set({ projectState: "active", isHydrating: false });
            return;
          }
          set({
            activeProjectData: null,
            projectState: "idle",
            missingProjectInfo: null,
            isHydrating: false,
          });
          return;
        }

        // Deduplicate in-flight hydration requests for the same targetId
        if (inFlightHydrations.has(idToHydrate)) {
          return inFlightHydrations.get(idToHydrate)!;
        }

        const runHydration = async () => {

        // 🌟 Temp projects exist only in localStorage or backend transfer -> Keep active immediately!
        if (isTempProject(idToHydrate)) {
          // If current in-memory project matches this exact id, keep it
          if (
            currentData &&
            currentData.project &&
            currentData.project.project_id === idToHydrate &&
            (currentData.panels?.length > 0 || (currentData.scrapedImages && currentData.scrapedImages.length > 0))
          ) {
            set({
              activeProjectId: idToHydrate,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
            });
            return;
          }

          // 1. Check if this temp project has transferred storyboard panels/images from backend
          try {
            const transferRes = await fetch(`/api/v1/projects/transfer/${encodeURIComponent(idToHydrate)}`);
            if (transferRes.ok) {
              const transferData = await transferRes.json();
              if (transferData && transferData.success && Array.isArray(transferData.panels) && transferData.panels.length > 0) {
                const transferredPanels: PanelItem[] = transferData.panels.map((p: any, idx: number) => ({
                  id: p.id || idx + 1,
                  panel_index: p.panel_index ?? idx,
                  prompt: p.prompt || p.visual_description || p.speech_text || `Scene ${idx + 1}`,
                  image_url: p.image_url || p.imageUrl || "",
                  original_url: p.original_url || p.imageUrl || p.image_url || "",
                  speech_text: p.speech_text || p.dialogueText || "",
                  narrative: p.narrative || p.narrativeText || "",
                  sfx: p.sfx || "",
                  duration: p.duration || 3.0,
                  motion_type: p.motion_type || p.motionPreset || "zoom_in",
                  visual_description: p.visual_description || p.visualDescription || "",
                  audio_url: p.audio_url || p.audioUrl || "",
                  narrative_audio_url: p.narrative_audio_url || p.narrativeAudioUrl || "",
                  speech_audio_url: p.speech_audio_url || p.audioUrl || "",
                }));

                const transferredImages: string[] =
                  Array.isArray(transferData.scraped_images) && transferData.scraped_images.length > 0
                    ? transferData.scraped_images
                    : transferredPanels.map((p) => p.image_url).filter(Boolean);

                const title = transferData.title || transferData.series_title || "Imported Comic";

                const newActiveData: ActiveProjectData = {
                  project: {
                    project_id: idToHydrate,
                    title: title,
                    url: transferData.url || "",
                    chapter_title: transferData.chapter_title || "",
                    cover_image: transferredImages[0] || "",
                  },
                  panels: transferredPanels,
                  scrapedImages: transferredImages,
                };

                set({
                  activeProjectId: idToHydrate,
                  activeProjectData: newActiveData,
                  projectState: "active",
                  missingProjectInfo: null,
                  isHydrating: false,
                });
                return;
              }
            }
          } catch (e) {
            console.warn("[useProjectStore] Error checking transfer project:", e);
          }

          // 2. Check localStorage for sonikoma_import_project
          try {
            const importedProject = readStoredProjectImport();
            if (importedProject && (importedProject.project_id === idToHydrate || !importedProject.project_id)) {
              const parsed = importedProject;
              if (parsed && Array.isArray(parsed.panels) && parsed.panels.length > 0) {
                const transferredPanels: PanelItem[] = parsed.panels.map((p: any, idx: number) => ({
                  id: p.id || idx + 1,
                  panel_index: p.panel_index ?? idx,
                  prompt: p.prompt || p.visual_description || p.speech_text || `Scene ${idx + 1}`,
                  image_url: p.image_url || p.imageUrl || "",
                  original_url: p.original_url || p.imageUrl || p.image_url || "",
                  speech_text: p.speech_text || p.dialogueText || "",
                  narrative: p.narrative || p.narrativeText || "",
                  sfx: p.sfx || "",
                  duration: p.duration || 3.0,
                  motion_type: p.motion_type || p.motionPreset || "zoom_in",
                  visual_description: p.visual_description || p.visualDescription || "",
                }));

                const transferredImages: string[] =
                  Array.isArray(parsed.scraped_images) && parsed.scraped_images.length > 0
                    ? parsed.scraped_images
                    : transferredPanels.map((p) => p.image_url).filter(Boolean);

                const newActiveData: ActiveProjectData = {
                  project: {
                    project_id: idToHydrate,
                    title: parsed.title || parsed.series_title || "Imported Comic",
                    url: parsed.url || "",
                    chapter_title: parsed.chapter_title || "",
                    cover_image: transferredImages[0] || "",
                  },
                  panels: transferredPanels,
                  scrapedImages: transferredImages,
                };

                set({
                  activeProjectId: idToHydrate,
                  activeProjectData: newActiveData,
                  projectState: "active",
                  missingProjectInfo: null,
                  isHydrating: false,
                });
                return;
              }
            }
          } catch (e) {
            console.error("Error reading import project from local storage:", e);
          }

          // 3. Check localStorage active-project-store ONLY for this specific project_id
          try {
            const storeData = readStoredProjectStoreState();
            if (storeData?.project && storeData.project.project_id === idToHydrate) {
              set({
                activeProjectId: idToHydrate,
                activeProjectData: storeData,
                projectState: "active",
                missingProjectInfo: null,
                isHydrating: false,
              });
              return;
            }
          } catch (e) {
            console.error("Error reading temp project from local storage:", e);
          }

          // 4. Initialize fresh local draft if not present (never keep previous project's assets)
          const draftData: ActiveProjectData = {
            project: {
              project_id: idToHydrate,
              title: "Draft Project",
              url: "",
            },
            panels: [],
            scrapedImages: [],
          };
          set({
            activeProjectId: idToHydrate,
            activeProjectData: draftData,
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
          });
          return;
        }

        // 🌟 Permanent saved projects -> Fetch latest server state
        set({ isHydrating: true, projectState: currentData ? "active" : "loading" });

        try {
          const fetcher = fetchClient || window.fetch;
          const token = getStoredAuthToken();

          const res = await fetcher(`/api/v1/projects/${encodeURIComponent(idToHydrate)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!res.ok) {
            if (currentData && currentData.project?.project_id === idToHydrate) {
              set({ projectState: "active", isHydrating: false });
              return;
            }
            get().setProjectMissing(idToHydrate, { isJobId: idToHydrate.startsWith("job_") });
            return;
          }

          const json = await res.json();
          const parsed = parseHydratedProjectJson(json, idToHydrate);

          if (!parsed) {
            if (currentData && currentData.project?.project_id === idToHydrate) {
              set({ projectState: "active", isHydrating: false });
              return;
            }
            get().setProjectMissing(idToHydrate, { isJobId: idToHydrate.startsWith("job_") });
            return;
          }

          // Preserve in-memory scrapedImages if server response doesn't have them
          if ((!parsed.scrapedImages || parsed.scrapedImages.length === 0) && currentData?.project?.project_id === idToHydrate && currentData?.scrapedImages?.length) {
            parsed.scrapedImages = currentData.scrapedImages;
          }

          const snapshot = pushHistorySnapshot([], -1, parsed);

          set({
            activeProjectId: parsed.project.project_id,
            activeProjectData: parsed,
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
            ...snapshot,
          });
        } catch (err) {
          console.error("Error in hydrateActiveProject:", err);
          if (currentData && currentData.project?.project_id === idToHydrate) {
            set({ projectState: "active", isHydrating: false });
            return;
          }
          get().setProjectMissing(idToHydrate, { isJobId: idToHydrate.startsWith("job_") });
        }
      };

      const hydrationPromise = runHydration();
      inFlightHydrations.set(idToHydrate, hydrationPromise);
      try {
        await hydrationPromise;
      } finally {
        inFlightHydrations.delete(idToHydrate);
      }
    },

      // ── Save Entire Active Project to Backend ─────────────────────────────
      saveActiveProject: async (fetchClient) => {
        const { activeProjectId, activeProjectData, isSaving } = get();
        if (!activeProjectId || !activeProjectData) return false;
        if (isSaving) return true;

        set({ isSaving: true });
        try {
          const fetcher = fetchClient || window.fetch;
          const token = getStoredAuthToken();

          const currentAudioSettings = activeProjectData.project.audio_settings || {};
          const scrapedImgs = (activeProjectData.scrapedImages && activeProjectData.scrapedImages.length > 0)
            ? activeProjectData.scrapedImages
            : (currentAudioSettings.scraped_images || []);

          const panelsCount = (activeProjectData.panels && activeProjectData.panels.length > 0)
            ? activeProjectData.panels.length
            : (scrapedImgs.length > 0 ? scrapedImgs.length : (activeProjectData.project.panels_count || 0));

          const importedCount = scrapedImgs.length > 0
            ? scrapedImgs.length
            : (activeProjectData.project.imported_assets_count || panelsCount);

          const res = await fetcher(`/api/v1/projects/${encodeURIComponent(activeProjectId)}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              url: activeProjectData.project.url || activeProjectData.project.original_url || "",
              episode: activeProjectData.project.episode || (activeProjectData.project as any).chapterNumber || "Chapter 1",
              title: activeProjectData.project.title,
              genre: activeProjectData.project.genre,
              author: activeProjectData.project.author,
              synopsis: activeProjectData.project.synopsis,
              cover_image: activeProjectData.project.cover_image,
              status: activeProjectData.project.status || "ready",
              panels: activeProjectData.panels,
              panels_count: panelsCount,
              imported_assets_count: importedCount,
              scraped_images: scrapedImgs,
              audio_settings: {
                ...currentAudioSettings,
                scraped_images: scrapedImgs,
                imported_assets_count: importedCount,
              },
              video_settings: activeProjectData.project.video_settings,
              autocrop_settings: activeProjectData.project.autocrop_settings,
            }),
          });

          if (!res.ok) throw new Error("Save failed");

          set({ isSaving: false, isDirty: false, lastSavedAt: new Date().toLocaleTimeString() });
          return true;
        } catch (err) {
          console.error("Error saving active project:", err);
          set({ isSaving: false });
          return false;
        }
      },

      // ── Panel Direct Manipulation Actions (With Undo/Redo Snapshots) ──────
      setSelectedPanelIndex: (index) => set({ selectedPanelIndex: index }),

      updatePanel: (index, updates) => {
        const { activeProjectData, history, historyIndex, storyMemory } = get();
        if (!activeProjectData || !activeProjectData.panels[index]) return;

        const updatedPanels = [...activeProjectData.panels];
        updatedPanels[index] = { ...updatedPanels[index], ...updates };

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        let newStoryMemory = storyMemory;
        if (updates.speaker_name && typeof updates.speaker_name === "string" && updates.speaker_name.trim()) {
          const sName = updates.speaker_name.trim();
          const curChar = storyMemory?.characters?.[sName] || {
            gender: updates.speaker_gender || "neutral",
            voice: (updates.voice || updates.voiceActor || (updates.speaker_gender === "female" ? "en-US-JennyNeural" : updates.speaker_gender === "child" ? "en-US-AnaNeural" : "en-US-GuyNeural")),
          };
          newStoryMemory = {
            current_scene: storyMemory?.current_scene || "",
            characters: {
              ...(storyMemory?.characters || {}),
              [sName]: {
                ...curChar,
                ...(updates.speaker_gender ? { gender: updates.speaker_gender } : {}),
                ...(updates.voice || updates.voiceActor ? { voice: updates.voice || updates.voiceActor, is_user_locked: true } : {}),
              },
            },
            dialogue_history: storyMemory?.dialogue_history || [],
            scene_history: storyMemory?.scene_history || [],
            last_updated_at: new Date().toISOString(),
          };
        }

        set({
          activeProjectData: updatedData,
          storyMemory: newStoryMemory,
          isDirty: true,
          ...snapshot,
        });
      },

      addPanel: (panel, atIndex) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = [...activeProjectData.panels];
        if (atIndex !== undefined && atIndex >= 0 && atIndex <= updatedPanels.length) {
          updatedPanels.splice(atIndex, 0, panel);
        } else {
          updatedPanels.push(panel);
        }

        const reindexed = updatedPanels.map((p, idx) => ({ ...p, panel_index: idx }));

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: { ...activeProjectData.project, panels_count: reindexed.length },
          panels: reindexed,
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      duplicatePanel: (index) => {
        const { activeProjectData } = get();
        if (!activeProjectData || index < 0 || index >= activeProjectData.panels.length) return;

        const targetPanel = activeProjectData.panels[index];
        const duplicated: PanelItem = {
          ...targetPanel,
          speech_text: targetPanel.speech_text ? `${targetPanel.speech_text} (Copy)` : "",
        };

        get().addPanel(duplicated, index + 1);
        get().setSelectedPanelIndex(index + 1);
      },

      removePanel: (index) => {
        const { activeProjectData, selectedPanelIndex, history, historyIndex } = get();
        if (!activeProjectData || index < 0 || index >= activeProjectData.panels.length) return;

        const updatedPanels = activeProjectData.panels
          .filter((_, idx) => idx !== index)
          .map((p, idx) => ({ ...p, panel_index: idx }));

        const nextSelectedIndex = Math.min(selectedPanelIndex, Math.max(0, updatedPanels.length - 1));

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: { ...activeProjectData.project, panels_count: updatedPanels.length },
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: nextSelectedIndex,
          isDirty: true,
          ...snapshot,
        });
      },

      reorderPanels: (startIndex, endIndex) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const reordered = reorderPanelArray(activeProjectData.panels, startIndex, endIndex);
        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: reordered,
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: endIndex,
          isDirty: true,
          ...snapshot,
        });
      },

      batchUpdatePanels: (indices, updates) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData || indices.length === 0) return;

        const indexSet = new Set(indices);
        const updatedPanels = activeProjectData.panels.map((p, idx) =>
          indexSet.has(idx) ? { ...p, ...updates } : p
        );

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      setPanels: (panels) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const reindexed = panels.map((p, idx) => ({ ...p, panel_index: idx }));
        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: { ...activeProjectData.project, panels_count: reindexed.length },
          panels: reindexed,
        };

        // Avoid pushing heavy undo/redo history snapshots if only transient flags (e.g. isAnalyzing) changed
        const prevPanels = activeProjectData.panels || [];
        const isOnlyTransient =
          prevPanels.length === reindexed.length &&
          prevPanels.every((p, i) => {
            const nextP = reindexed[i];
            return (
              p.image_url === nextP.image_url &&
              p.speech_text === nextP.speech_text &&
              p.duration === nextP.duration &&
              p.motion_type === nextP.motion_type &&
              p.sfx === nextP.sfx &&
              p.narrative === nextP.narrative &&
              p.visual_description === nextP.visual_description &&
              p.audio_url === nextP.audio_url &&
              p.narrative_audio_url === nextP.narrative_audio_url
            );
          });

        if (isOnlyTransient) {
          set({
            activeProjectData: updatedData,
          });
          return;
        }

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      clearAllPanels: () => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: { ...activeProjectData.project, panels_count: 0 },
          panels: [],
        };

        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: 0,
          isDirty: true,
          ...snapshot,
        });
      },

      // ── Smart Automation & Studio Presets ─────────────────────────────────
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterMotion: (motion) => set({ filterMotion: motion }),

      getFilteredPanels: () => {
        const { activeProjectData, searchQuery, filterMotion } = get();
        if (!activeProjectData) return [];

        let result = activeProjectData.panels;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter(
            (p) =>
              (p.speech_text || "").toLowerCase().includes(q) ||
              (p.narrative || "").toLowerCase().includes(q) ||
              (p.sfx || "").toLowerCase().includes(q)
          );
        }
        if (filterMotion) {
          result = result.filter((p) => p.motion_type === filterMotion);
        }
        return result;
      },

      setGlobalPanelDuration: (duration) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({ ...p, duration }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      applyMotionPresetToAll: (motionType) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({ ...p, motion_type: motionType }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      applyStylePresetToAll: (presetName) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({ ...p, filter_preset: presetName }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      autoCalculateSpeechDurations: (wordsPerSec = 2.5, bufferSec = 1.5) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => {
          const text = `${p.speech_text || ""} ${p.narrative || ""}`;
          return {
            ...p,
            duration: computeSpeechDuration(text, wordsPerSec, bufferSec),
          };
        });

        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(history, historyIndex, updatedData);

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      // ── Import / Export Backup Actions ────────────────────────────────────
      exportProjectAsJson: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return null;
        return JSON.stringify(activeProjectData, null, 2);
      },

      importProjectFromJson: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!parsed.project || !Array.isArray(parsed.panels)) return false;
          get().setActiveProject(parsed);
          return true;
        } catch {
          return false;
        }
      },

      // ── Computed Statistics Helpers ───────────────────────────────────────
      getTotalDuration: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return 0;
        return activeProjectData.panels.reduce((sum, p) => sum + (p.duration || 3.0), 0);
      },

      getTotalWordCount: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return 0;
        return activeProjectData.panels.reduce((count, p) => {
          const text = `${p.speech_text || ""} ${p.narrative || ""}`.trim();
          return count + (text ? text.split(/\s+/).length : 0);
        }, 0);
      },

      // ── Update Project Settings ───────────────────────────────────────────
      updateProjectSettings: async (settings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({ activeProjectData: applyLocalSettings(activeProjectData, settings), isDirty: true });
        return true;
      },

      // ── Update Video Settings ─────────────────────────────────────────────
      updateVideoSettings: async (videoSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({ activeProjectData: applyLocalSettings(activeProjectData, { video_settings: videoSettings }), isDirty: true });
        return true;
      },

      // ── Update Audio Settings ─────────────────────────────────────────────
      updateAudioSettings: async (audioSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({ activeProjectData: applyLocalSettings(activeProjectData, { audio_settings: audioSettings }), isDirty: true });
        return true;
      },

      // ── Update AutoCrop Settings ──────────────────────────────────────────
      updateAutoCropSettings: async (autoCropSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({ activeProjectData: applyLocalSettings(activeProjectData, { autocrop_settings: autoCropSettings }), isDirty: true });
        return true;
      },

      // ── Story Memory Actions ──────────────────────────────────────────────
      updateStoryMemory: (memoryUpdates) =>
        set((state) => ({
          storyMemory: state.storyMemory
            ? {
                ...state.storyMemory,
                ...memoryUpdates,
                characters: {
                  ...state.storyMemory.characters,
                  ...(memoryUpdates.characters || {}),
                },
                dialogue_history: memoryUpdates.dialogue_history ?? state.storyMemory.dialogue_history,
                scene_history: memoryUpdates.scene_history ?? state.storyMemory.scene_history,
              }
            : ({
                current_scene: "",
                characters: {},
                dialogue_history: [],
                scene_history: [],
                ...memoryUpdates,
              } as StoryMemoryState),
          isDirty: true,
        })),

      resetStoryMemory: () => set({ storyMemory: null, isDirty: true }),

      // ── Reset Active Project ──────────────────────────────────────────────
      clearActiveProject: () => {
        clearStoredProjectSession();
        setActiveProjectSession(null, null);
        writeProjectSnapshot(null);
        set({
          activeProjectId: null,
          activeProjectData: null,
          selectedPanelIndex: 0,
          projectState: "idle",
          missingProjectInfo: null,
          searchQuery: "",
          filterMotion: null,
          isDirty: false,
          isHydrating: false,
          isSaving: false,
          history: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false,
          storyMemory: null,
        });
      },

      // ── UI States ─────────────────────────────────────────────────────────
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      setIsEpisodeCollapsed: (v) => set({ isEpisodeCollapsed: v }),
    }),
    {
      name: "sonikoma-active-project-store",
      // Use quota-safe localStorage wrapper to prevent silent data loss
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeProjectData: state.activeProjectData
          ? {
              ...state.activeProjectData,
              scrapedImages: (state.activeProjectData.scrapedImages ?? []).slice(0, 200),
            }
          : null,
        selectedPanelIndex: state.selectedPanelIndex,
        projectState: state.activeProjectData ? "active" : "idle",
        missingProjectInfo: state.missingProjectInfo,
        isEpisodeCollapsed: state.isEpisodeCollapsed,
        storyMemory: state.storyMemory,
        searchQuery: state.searchQuery,
        filterMotion: state.filterMotion,
        lastSavedAt: state.lastSavedAt,
        isDirty: state.isDirty,
      }),
      merge: (persisted, current) => {
        const merged = {
          ...current,
          ...(persisted as Partial<ProjectStoreState>),
        } as ProjectStoreState;

        if (merged.activeProjectData && merged.activeProjectId) {
          merged.projectState = "active";
        }

        merged.isHydrating = false;
        return merged;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.activeProjectData && state.activeProjectId) {
          state.projectState = "active";
          state.isHydrating = false;
          setActiveProjectSession(state.activeProjectId, state.activeProjectData.project.job_id ?? null);
          writeProjectSnapshot(state.activeProjectData);
        }
      },
    }
  )
);
