import { useCallback, useEffect, useState } from "react";
import type { Project } from "./ProjectTypes.js";

export interface UseProjectsDataState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
}

export function useProjectsData(): UseProjectsDataState {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
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
      if (data.projects) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch projects", err);
      setError(
        err.message || "An unexpected error occurred while loading projects."
      );
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
