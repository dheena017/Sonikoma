import type { StoryMemoryState } from "@/shared/types/models";

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
  speaker_gender?: "male" | "female" | "child" | "neutral" | string;
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
  setProjectMissing: (
    missingId: string,
    options?: { isJobId?: boolean }
  ) => void;
  setWorkspaceContext: (ctx: WorkspaceContext) => void;
  hydrateActiveProject: (
    id?: string | null,
    fetchClient?: any
  ) => Promise<void>;
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
  autoCalculateSpeechDurations: (
    wordsPerSec?: number,
    bufferSec?: number
  ) => void;

  // ── Import / Export Backup Actions ────────────────────────────────────────
  exportProjectAsJson: () => string | null;
  importProjectFromJson: (jsonString: string) => boolean;

  // ── Computed Statistics Helpers ───────────────────────────────────────────
  getTotalDuration: () => number;
  getTotalWordCount: () => number;

  // ── Settings Actions ──────────────────────────────────────────────────────
  updateProjectSettings: (
    settings: ProjectSettingsPayload,
    fetchClient?: any
  ) => Promise<boolean>;
  updateVideoSettings: (
    videoSettings: VideoSettings,
    fetchClient?: any
  ) => Promise<boolean>;
  updateAudioSettings: (
    audioSettings: AudioSettings,
    fetchClient?: any
  ) => Promise<boolean>;
  updateAutoCropSettings: (
    autoCropSettings: AutoCropSettings,
    fetchClient?: any
  ) => Promise<boolean>;

  // ── Cognitive Story Memory ───────────────────────────────────────────────
  storyMemory: StoryMemoryState | null;
  updateStoryMemory: (memory: Partial<StoryMemoryState>) => void;
  resetStoryMemory: () => void;

  // ── UI States ─────────────────────────────────────────────────────────────
  setDrawerOpen: (open: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsEpisodeCollapsed: (v: boolean) => void;
}
