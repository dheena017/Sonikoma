import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/features/platform/projects/hooks/ProjectTypes";
import { notify } from "@/features/platform/notifications";

export interface UseProjectsDataState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
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
  const [projects, setProjects] = useState<Project[]>(cachedProjects);
  const [loading, setLoading] = useState(cachedProjects.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (force = false) => {
    if (!force && cachedProjects.length > 0 && Date.now() - lastFetchTime < 10000) {
      setProjects(cachedProjects);
      setLoading(false);
      return;
    }

    if (inFlightProjectsPromise) {
      try {
        const list = await inFlightProjectsPromise;
        setProjects(list);
      } catch (e) {
        // Handled in root fetcher
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (cachedProjects.length === 0) {
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
        cachedProjects = list;
        lastFetchTime = Date.now();
        return list;
      })();

      const list = await inFlightProjectsPromise;
      setProjects(list);
    } catch (err: any) {
      console.error("Failed to fetch projects", err);
      const errMsg =
        err.message || "An unexpected error occurred while loading projects.";
      notify.error(errMsg);
      if (cachedProjects.length === 0) {
        setError(errMsg);
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
    fetchProjects,
    setProjects,
  };
}
