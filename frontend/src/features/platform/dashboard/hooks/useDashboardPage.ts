import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";
import {
  getCachedProjects,
  setGlobalCachedProjects,
} from "@/features/platform/projects/hooks/useProjectsData";
import { aiSeriesApi, type AISeriesProject } from "@/features/intelligence/series/api/aiSeries";

import type { Project, OnboardingTask, DashboardStatsMetrics } from "../types";
import {
  getAuthHeaders,
  navigateToDashboardPath,
  buildProjectEditorUrl,
  fetchAndActivateProject,
  filterProjectsByQuery,
  countProjectsByStatus,
  calculateTotalPanels,
  computeOnboardingTasks,
  calculateEstimatedRuntimeMinutes,
  calculateHealthPercentage,
} from "../utils/dashboardHelpers";

export type { Project, OnboardingTask, AISeriesProject };

/* ─────────────────────────────────────────────────────────────
 * Initial State Constants & Module Cache
 * ───────────────────────────────────────────────────────────── */

const INITIAL_ONBOARDING_TASKS: OnboardingTask[] = [
  { id: 1, text: "Create your first project", completed: false },
  { id: 2, text: "Import or scrape panels", completed: false },
  { id: 3, text: "Generate AI voices and scenes", completed: false },
  { id: 4, text: "Render your first video", completed: false },
];

let cachedDashboardProjects: Project[] = [];

/* ─────────────────────────────────────────────────────────────
 * Main Controller Hook
 * ───────────────────────────────────────────────────────────── */

export default function useDashboardPage() {
  const { themeMode } = useThemeMode();

  // 1. Core State
  const [projects, setProjects] = useState<Project[]>(() => {
    if (cachedDashboardProjects.length > 0) return cachedDashboardProjects;
    const globalCached = getCachedProjects();
    return (globalCached && globalCached.length > 0) ? (globalCached as unknown as Project[]) : [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return cachedDashboardProjects.length === 0 && getCachedProjects().length === 0;
  });

  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(INITIAL_ONBOARDING_TASKS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);

  // Tab State & AI Series State
  const [activeTab, setActiveTab] = useState<"normal" | "ai">("normal");
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>([]);
  const [loadingAiSeries, setLoadingAiSeries] = useState<boolean>(false);

  // 2. Data Fetching: Standard Projects
  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/v1/projects", {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
      }

      const data = await res.json();
      const list: Project[] = data.projects || [];
      cachedDashboardProjects = list;
      setGlobalCachedProjects(list as any);
      setProjects(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred while loading projects.";
      console.error("Failed to fetch dashboard projects:", err);
      if (cachedDashboardProjects.length === 0) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Data Fetching: AI Series Projects
  const fetchAiSeries = useCallback(async () => {
    try {
      setLoadingAiSeries(true);
      const list = await aiSeriesApi.listSeries();
      setAiSeriesList(list || []);
    } catch (e) {
      console.warn("Failed to fetch AI series for dashboard:", e);
    } finally {
      setLoadingAiSeries(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchProjects();
    fetchAiSeries();
  }, [fetchProjects, fetchAiSeries]);

  // Click outside listener for action menus
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 4. User Actions & Handlers
  const handleRetry = useCallback(() => {
    setLoading(true);
    fetchProjects();
    fetchAiSeries();
  }, [fetchProjects, fetchAiSeries]);

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
    await fetchAndActivateProject(project.project_id);
    navigateToDashboardPath(buildProjectEditorUrl(project));
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      await fetchAndActivateProject(project.project_id);
      navigateToDashboardPath("/creative-suite");
    },
    []
  );

  const handleDeleteProject = useCallback(
    async (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      setOpenMenuId(null);

      const confirmAsync = (window as unknown as { confirmAsync?: (msg: string, title: string, tone: string) => Promise<boolean> }).confirmAsync;
      const shouldDelete = confirmAsync
        ? await confirmAsync("Are you sure you want to delete this project?", "Delete Project", "rose")
        : window.confirm("Are you sure you want to delete this project?");

      if (!shouldDelete) return;

      try {
        const res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
        }
      } catch (err) {
        console.error("Failed to delete project:", err);
      }
    },
    []
  );

  const handleDeleteAiSeries = useCallback(async (seriesId: string) => {
    const confirmAsync = (window as unknown as { confirmAsync?: (msg: string, title: string, tone: string) => Promise<boolean> }).confirmAsync;
    const shouldDelete = confirmAsync
      ? await confirmAsync("Are you sure you want to delete this AI Series?", "Delete AI Series", "rose")
      : window.confirm("Are you sure you want to delete this AI Series?");

    if (!shouldDelete) return;

    try {
      await aiSeriesApi.deleteSeries(seriesId);
      setAiSeriesList((prev) => prev.filter((s) => s.series_id !== seriesId));
    } catch (err) {
      console.error("Failed to delete AI Series:", err);
    }
  }, []);

  const handleExport = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    navigateToDashboardPath(`/workspace?id=${project.project_id}&action=export`);
  }, []);

  const handleRename = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingProjectId(project.project_id);
  }, []);

  const saveProjectName = useCallback((projectId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingProjectId(null);
      return;
    }
    console.log(`Renaming project ${projectId} to ${newName}`);
    setRenamingProjectId(null);
  }, []);

  const toggleMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  }, []);

  // 5. Derived Computations & Progress
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

  const filteredAiSeries = useMemo(() => {
    if (!searchQuery.trim()) return aiSeriesList;
    const q = searchQuery.toLowerCase().trim();
    return aiSeriesList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.logline && s.logline.toLowerCase().includes(q)) ||
        (s.genre && s.genre.toLowerCase().includes(q)) ||
        (s.format_type && s.format_type.toLowerCase().includes(q))
    );
  }, [aiSeriesList, searchQuery]);

  const totalPanels = useMemo(
    () => calculateTotalPanels(projects),
    [projects]
  );

  const estimatedRuntimeMinutes = useMemo(
    () => calculateEstimatedRuntimeMinutes(totalPanels),
    [totalPanels]
  );

  const healthPercentage = useMemo(
    () => calculateHealthPercentage(completedCount, projects.length),
    [completedCount, projects.length]
  );

  const stats: DashboardStatsMetrics = useMemo(
    () => ({
      projectsCount: projects.length,
      completedCount,
      totalPanels,
      estimatedRuntimeMinutes,
      healthPercentage,
    }),
    [projects.length, completedCount, totalPanels, estimatedRuntimeMinutes, healthPercentage]
  );

  // Sync checklist progress with current projects state
  useEffect(() => {
    setOnboardingTasks((prev) => computeOnboardingTasks(prev, projects, completedCount));
  }, [projects, completedCount]);

  // 6. Public Hook Contract
  return {
    themeMode,
    projects,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    onboardingTasks,
    openMenuId,
    renamingProjectId,
    filteredProjects,
    activeTab,
    setActiveTab,
    aiSeriesList,
    filteredAiSeries,
    loadingAiSeries,
    stats,
    completedCount,
    processingCount,
    totalPanels,
    estimatedRuntimeMinutes,
    healthPercentage,
    handleRetry,
    handleNewSeries,
    handleOpenProject,
    handleOpenCreativeSuite,
    handleDeleteProject,
    handleDeleteAiSeries,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  };
}
