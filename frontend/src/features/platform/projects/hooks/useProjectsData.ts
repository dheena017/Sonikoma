import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/features/platform/projects/hooks/ProjectTypes";
import { notify } from "@/features/platform/notifications";
import {
  DEMO_PROJECTS,
  getStoredDemoProjects,
  saveDemoProjectsToStorage,
  clearDemoProjectsFromStorage,
} from "@/features/platform/projects/utils/demoProjects";

export interface UseProjectsDataState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  isDemoActive: boolean;
  fetchProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
  loadDemoProjects: () => void;
  clearDemoProjects: () => void;
}

let cachedProjects: Project[] = [];
let lastFetchTime = 0;
let inFlightProjectsPromise: Promise<Project[]> | null = null;

export function getCachedProjects(): Project[] {
  return cachedProjects;
}

export function setGlobalCachedProjects(list: Project[]) {
  cachedProjects = list;
  lastFetchTime = Date.now();
}

export function invalidateProjectsCache() {
  cachedProjects = [];
  lastFetchTime = 0;
}

export function useProjectsData(): UseProjectsDataState {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (cachedProjects.length > 0) return cachedProjects;
    return getStoredDemoProjects();
  });
  const [loading, setLoading] = useState(cachedProjects.length === 0 && projects.length === 0);
  const [error, setError] = useState<string | null>(null);

  const isDemoActive = projects.some((p) => p.project_id.startsWith("demo-"));

  const loadDemoProjects = useCallback(() => {
    saveDemoProjectsToStorage(DEMO_PROJECTS);
    const existingNonDemo = projects.filter((p) => !p.project_id.startsWith("demo-"));
    const updated = [...DEMO_PROJECTS, ...existingNonDemo];
    setProjects(updated);
    setGlobalCachedProjects(updated);
    notify.success("Sample demo series loaded into workspace!");
  }, [projects]);

  const clearDemoProjects = useCallback(() => {
    clearDemoProjectsFromStorage();
    const remaining = projects.filter((p) => !p.project_id.startsWith("demo-"));
    setProjects(remaining);
    setGlobalCachedProjects(remaining);
    notify.info("Sample demo projects cleared.");
  }, [projects]);

  const fetchProjects = useCallback(async (force = false) => {
    const storedDemos = getStoredDemoProjects();

    if (!force && cachedProjects.length > 0 && Date.now() - lastFetchTime < 10000) {
      setProjects(cachedProjects);
      setLoading(false);
      return;
    }

    if (inFlightProjectsPromise) {
      try {
        const list = await inFlightProjectsPromise;
        const merged = storedDemos.length > 0
          ? [...storedDemos, ...list.filter((p) => !storedDemos.some((d) => d.project_id === p.project_id))]
          : list;
        setProjects(merged);
      } catch (e) {
        // Handled in root fetcher
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (cachedProjects.length === 0 && storedDemos.length === 0) {
        setLoading(true);
      }
      setError(null);

      inFlightProjectsPromise = (async () => {
        const res = await fetch("/api/v1/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
        }
        const data = await res.json();
        const list = data.projects || [];
        return list;
      })();

      const list = await inFlightProjectsPromise;
      const merged = storedDemos.length > 0
        ? [...storedDemos, ...list.filter((p) => !storedDemos.some((d) => d.project_id === p.project_id))]
        : list;

      cachedProjects = merged;
      lastFetchTime = Date.now();
      setProjects(merged);
      console.log(`[Projects Page] Loaded ${merged.length} studio projects.`);
    } catch (err: any) {
      console.warn("Failed to fetch remote projects, checking local state:", err);
      if (storedDemos.length > 0) {
        setProjects(storedDemos);
        cachedProjects = storedDemos;
        setError(null);
      } else {
        const errMsg =
          err.message || "An unexpected error occurred while loading projects.";
        if (cachedProjects.length === 0) {
          setError(errMsg);
        }
      }
    } finally {
      inFlightProjectsPromise = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    isDemoActive,
    fetchProjects,
    setProjects,
    loadDemoProjects,
    clearDemoProjects,
  };
}
