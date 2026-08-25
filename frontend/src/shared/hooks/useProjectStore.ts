import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    ""
  );
}

/** 3. Clear all active project session keys from localStorage */
export function clearStoredProjectSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("active_project_id");
  localStorage.removeItem("active_job_id");
  localStorage.removeItem("active_series_slug");
  localStorage.removeItem("active_chapter_slug");
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
  let importedCount = project?.imported_assets_count ?? scrapedImages.length;

  if (!importedCount && Array.isArray(project?.audio_settings?.scraped_images)) {
    importedCount = project.audio_settings.scraped_images.length;
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
    `/api/projects/${encodeURIComponent(projectId)}/settings${endpointSubpath}`,
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

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      // State
      activeProjectId: null,
      activeProjectData: null,
      selectedPanelIndex: 0,
      projectState: "idle",
      missingProjectInfo: null,
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
          set({
            activeProjectData: normalized,
            activeProjectId: normalized.project.project_id ?? null,
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
            ...snapshot,
          });
        } else {
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
        const idToHydrate = targetId ?? get().activeProjectId;
        const currentData = get().activeProjectData;

        if (!idToHydrate) {
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

        // 🌟 Temp projects exist only in localStorage -> Keep active immediately!
        if (isTempProject(idToHydrate)) {
          if (currentData && currentData.project) {
            set({
              activeProjectId: idToHydrate,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
            });
            return;
          }
        }

        // 🌟 Permanent saved projects -> Fetch latest server state
        set({ isHydrating: true, projectState: currentData ? "active" : "loading" });

        try {
          const fetcher = fetchClient || window.fetch;
          const token = getStoredAuthToken();

          const res = await fetcher(`/api/projects/${encodeURIComponent(idToHydrate)}`, {
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
      },

      // ── Save Entire Active Project to Backend ─────────────────────────────
      saveActiveProject: async (fetchClient) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId || !activeProjectData) return false;

        set({ isSaving: true });
        try {
          const fetcher = fetchClient || window.fetch;
          const token = getStoredAuthToken();

          const res = await fetcher(`/api/projects/${encodeURIComponent(activeProjectId)}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              title: activeProjectData.project.title,
              genre: activeProjectData.project.genre,
              author: activeProjectData.project.author,
              synopsis: activeProjectData.project.synopsis,
              cover_image: activeProjectData.project.cover_image,
              panels: activeProjectData.panels,
              audio_settings: activeProjectData.project.audio_settings,
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
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData || !activeProjectData.panels[index]) return;

        const updatedPanels = [...activeProjectData.panels];
        updatedPanels[index] = { ...updatedPanels[index], ...updates };

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
      updateProjectSettings: async (settings, fetchClient) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;

        if (isTempProject(activeProjectId)) {
          set({ activeProjectData: applyLocalSettings(activeProjectData, settings), isDirty: true });
          return true;
        }

        try {
          const data = await sendSettingsUpdate(activeProjectId, "", settings, fetchClient);
          if (data?.settings) {
            set({
              activeProjectData: applyLocalSettings(activeProjectData, {
                video_settings: data.settings.video_settings,
                audio_settings: data.settings.audio_settings,
                autocrop_settings: data.settings.autocrop_settings,
              }),
              isDirty: false,
            });
          }
          return true;
        } catch (err) {
          console.error("Error updating project settings:", err);
          return false;
        }
      },

      // ── Update Video Settings ─────────────────────────────────────────────
      updateVideoSettings: async (videoSettings, fetchClient) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;

        if (isTempProject(activeProjectId)) {
          set({ activeProjectData: applyLocalSettings(activeProjectData, { video_settings: videoSettings }), isDirty: true });
          return true;
        }

        try {
          const data = await sendSettingsUpdate(activeProjectId, "/video", { video_settings: videoSettings }, fetchClient);
          if (data?.video_settings) {
            set({
              activeProjectData: applyLocalSettings(activeProjectData, { video_settings: data.video_settings }),
              isDirty: false,
            });
          }
          return true;
        } catch (err) {
          console.error("Error updating video settings:", err);
          return false;
        }
      },

      // ── Update Audio Settings ─────────────────────────────────────────────
      updateAudioSettings: async (audioSettings, fetchClient) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;

        if (isTempProject(activeProjectId)) {
          set({ activeProjectData: applyLocalSettings(activeProjectData, { audio_settings: audioSettings }), isDirty: true });
          return true;
        }

        try {
          const data = await sendSettingsUpdate(activeProjectId, "/audio", { audio_settings: audioSettings }, fetchClient);
          if (data?.audio_settings) {
            set({
              activeProjectData: applyLocalSettings(activeProjectData, { audio_settings: data.audio_settings }),
              isDirty: false,
            });
          }
          return true;
        } catch (err) {
          console.error("Error updating audio settings:", err);
          return false;
        }
      },

      // ── Update AutoCrop Settings ──────────────────────────────────────────
      updateAutoCropSettings: async (autoCropSettings, fetchClient) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;

        if (isTempProject(activeProjectId)) {
          set({ activeProjectData: applyLocalSettings(activeProjectData, { autocrop_settings: autoCropSettings }), isDirty: true });
          return true;
        }

        try {
          const data = await sendSettingsUpdate(activeProjectId, "/autocrop", { autocrop_settings: autoCropSettings }, fetchClient);
          if (data?.autocrop_settings) {
            set({
              activeProjectData: applyLocalSettings(activeProjectData, { autocrop_settings: data.autocrop_settings }),
              isDirty: false,
            });
          }
          return true;
        } catch (err) {
          console.error("Error updating autocrop settings:", err);
          return false;
        }
      },

      // ── Reset Active Project ──────────────────────────────────────────────
      clearActiveProject: () => {
        clearStoredProjectSession();
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
        });
      },

      // ── UI States ─────────────────────────────────────────────────────────
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      setIsEpisodeCollapsed: (v) => set({ isEpisodeCollapsed: v }),
    }),
    {
      name: "sonikoma-active-project-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeProjectData: state.activeProjectData,
        selectedPanelIndex: state.selectedPanelIndex,
        projectState: state.activeProjectData ? "active" : "idle",
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeProjectData && state.activeProjectId) {
          state.projectState = "active";
          state.isHydrating = false;
        }
      },
    }
  )
);
