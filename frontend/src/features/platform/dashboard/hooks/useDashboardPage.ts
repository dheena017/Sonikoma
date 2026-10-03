import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import * as api from "@/shared/api";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";
import {
  getAuthHeaders,
  navigateToDashboardPath,
  buildProjectEditorUrl,
  extractProjectScrapedImages,
  filterProjectsByQuery,
  countProjectsByStatus,
  calculateTotalPanels,
  computeOnboardingTasks,
} from "../utils/dashboardHelpers";

export interface Project {
  project_id: string;
  job_id?: string | null;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  imported_assets_count?: number;
  series_slug?: string;
  chapter_slug?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
}

export interface OnboardingTask {
  id: number;
  text: string;
  completed: boolean;
}

let cachedDashboardProjects: Project[] = [];

export default function useDashboardPage() {
  const { themeMode } = useThemeMode();
  const [projects, setProjects] = useState<Project[]>(cachedDashboardProjects);
  const [loading, setLoading] = useState(cachedDashboardProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    { id: 1, text: "Create your first project", completed: false },
    { id: 2, text: "Import or scrape panels", completed: false },
    { id: 3, text: "Generate AI voices and scenes", completed: false },
    { id: 4, text: "Render your first video", completed: false },
  ]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );

  const saveProjectName = useCallback(
    async (projectId: string, newName: string) => {
      if (!newName.trim()) {
        setRenamingProjectId(null);
        return;
      }

      console.log(`Renaming project ${projectId} to ${newName}`);
      setRenamingProjectId(null);
    },
    []
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null);
        const res = await fetch("/api/v1/projects", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
        }
        const data = await res.json();
        const list = data.projects || [];
        cachedDashboardProjects = list;
        setProjects(list);
      } catch (err: any) {
        console.error("Failed to fetch projects", err);
        if (cachedDashboardProjects.length === 0) {
          setError(
            err.message ||
              "An unexpected error occurred while loading projects."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    const testLatency = async () => {
      const start = Date.now();
      try {
        await api.checkHealth();
        setLatency(Date.now() - start);
      } catch {
        setLatency(null);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/v1/auth/analytics", {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      }
    };

    fetchProjects();
    testLatency();
    fetchAnalytics();
    return undefined;
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/v1/projects", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to fetch (HTTP ${res.status})`);
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err: any) {
        setError(err.message || "Retry failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleNewSeries = useCallback(() => {
    useProjectStore.getState().clearActiveProject();
    localStorage.removeItem("active_project_id");
    localStorage.removeItem("active_job_id");
    localStorage.removeItem("active_series_slug");
    localStorage.removeItem("active_chapter_slug");
    localStorage.removeItem("auto_import_url");
    localStorage.removeItem("auto_import_batch");

    navigateToDashboardPath("/scraper");
  }, []);

  const handleOpenProject = useCallback(async (project: Project) => {
    try {
      const res = await fetch(`/api/v1/projects/${project.project_id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const scrapedImages = extractProjectScrapedImages(data);

        useProjectStore.getState().setActiveProject({
          project: data.project,
          panels: data.panels || [],
          scrapedImages,
        });
      }
    } catch (err) {
      console.error(
        "Failed to pre-fetch project data on dashboard click:",
        err
      );
    }

    navigateToDashboardPath(buildProjectEditorUrl(project));
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/v1/projects/${project.project_id}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const scrapedImages = extractProjectScrapedImages(data);

          useProjectStore.getState().setActiveProject({
            project: data.project,
            panels: data.panels || [],
            scrapedImages,
          });
        }
      } catch (err) {
        console.error("Failed to load project for Creative Suite:", err);
      }

      navigateToDashboardPath("/creative-suite");
    },
    []
  );

  const handleDeleteProject = useCallback(
    async (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      setOpenMenuId(null);
      if (
        await (window as any).confirmAsync?.(
          "Are you sure you want to delete this project?",
          "Delete Project",
          "rose"
        )
      ) {
        try {
          const res = await fetch(`/api/v1/projects/${projectId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            setProjects((current) =>
              current.filter((p) => p.project_id !== projectId)
            );
          }
        } catch (err) {
          console.error("Delete failed", err);
        }
      }
    },
    []
  );

  const handleExport = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    navigateToDashboardPath(
      `/workspace?id=${project.project_id}&action=export`
    );
  }, []);

  const handleRename = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingProjectId(project.project_id);
  }, []);

  const toggleMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const completedCount = useMemo(
    () => countProjectsByStatus(projects, "completed"),
    [projects]
  );

  const processingCount = useMemo(
    () => countProjectsByStatus(projects, "processing"),
    [projects]
  );

  const filteredProjects = useMemo(
    () => filterProjectsByQuery(projects, searchQuery),
    [projects, searchQuery]
  );

  const totalPanels = useMemo(
    () => calculateTotalPanels(projects),
    [projects]
  );

  useEffect(() => {
    setOnboardingTasks((prev) =>
      computeOnboardingTasks(prev, projects, completedCount)
    );
  }, [projects, completedCount]);

  return {
    themeMode,
    projects,
    loading,
    error,
    latency,
    analytics,
    searchQuery,
    setSearchQuery,
    onboardingTasks,
    openMenuId,
    renamingProjectId,
    filteredProjects,
    completedCount,
    processingCount,
    totalPanels,
    handleRetry,
    handleNewSeries,
    handleOpenProject,
    handleOpenCreativeSuite,
    handleDeleteProject,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  };
}
