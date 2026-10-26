import type {
  ActiveProjectData,
  MissingProjectDetails,
} from "./projectStoreTypes";

export const STORAGE_KEYS = {
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
export const safeLocalStorage = {
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
      if (
        e?.name === "QuotaExceededError" ||
        e?.code === 22 ||
        e?.code === 1014
      ) {
        console.warn(
          "[Storage] localStorage quota exceeded — project data could not be saved locally. " +
            "Use the Save button to persist to the server."
        );
        try {
          const minimal = JSON.parse(value || "{}");
          if (minimal?.state?.activeProjectData) {
            minimal.state.activeProjectData.panels = [];
            minimal.state.activeProjectData.scrapedImages = [];
          }
          localStorage.setItem(key, JSON.stringify(minimal));
        } catch {
          // Ignore fallback failure
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

export type PersistedProjectEnvelope = {
  state?: {
    activeProjectData?: ActiveProjectData | null;
  };
  activeProjectData?: ActiveProjectData | null;
};

export function readJsonFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  const raw = safeLocalStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    safeLocalStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[useProjectStore] Failed to persist ${key}:`, error);
  }
}

export function readStoredProjectImport(): Record<string, any> | null {
  const parsed = readJsonFromStorage<any>(STORAGE_KEYS.IMPORT_PROJECT);
  if (!parsed || !Array.isArray(parsed?.panels) || parsed.panels.length === 0)
    return null;

  return parsed;
}

export function isTempProject(projectId: string | null): boolean {
  if (!projectId) return false;
  return (
    projectId.startsWith("temp_") ||
    projectId.startsWith("draft_") ||
    projectId.startsWith("preview_")
  );
}

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

export function clearStoredProjectSession(): void {
  if (typeof window === "undefined") return;
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_ID);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_SERIES_SLUG);
  safeLocalStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAPTER_SLUG);
}

export function setActiveProjectSession(
  projectId: string | null,
  jobId?: string | null
): void {
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
