import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import { notify } from "@/features/app_notification";

export interface UseProjectsDataState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
}

let cachedProjects: Project[] = [];

export function useProjectsData(): UseProjectsDataState {
  const [projects, setProjects] = useState<Project[]>(cachedProjects);
  const [loading, setLoading] = useState(cachedProjects.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      if (cachedProjects.length === 0) {
        setLoading(true);
      }
      setError(null);
      const res = await fetch("/api/projects", {
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
