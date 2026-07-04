import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemeMode } from "../../hooks/useThemeMode.js";
import * as api from "@/api";

export interface Project {
  project_id: string;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
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

export default function useDashboardPage() {
  const { themeMode } = useThemeMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    { id: 1, text: "Create your first series", completed: false },
    { id: 2, text: "Analyze panel storyboards", completed: false },
    { id: 3, text: "Generate AI character voices", completed: false },
    { id: 4, text: "Render your first video", completed: false },
  ]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);

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
        setProjects(data.projects || []);
      } catch (err: any) {
        console.error("Failed to fetch projects", err);
        setError(err.message || "An unexpected error occurred while loading projects.");
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

    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/auth/analytics", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
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
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
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
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav("/workspace");
    } else {
      window.history.pushState({}, "", "/workspace");
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    const nav = (window as any).navigateTo;
    const target =
      project.series_slug && project.chapter_slug
        ? `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
        : `/workspace?id=${project.project_id}`;

    if (typeof nav === "function") {
      nav(target);
    } else {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

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
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("sonikoma_token") || ""}`,
            },
          });
          if (res.ok) {
            setProjects((current) => current.filter((p) => p.project_id !== projectId));
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
    const nav = (window as any).navigateTo;
    const target = `/workspace?id=${project.project_id}&action=export`;
    if (typeof nav === "function") {
      nav(target);
    } else {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

  const handleRename = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingProjectId(project.project_id);
  }, []);

  const toggleMenu = useCallback(
    (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      setOpenMenuId((current) => (current === projectId ? null : projectId));
    },
    []
  );

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const completedCount = useMemo(
    () => projects.filter((p) => p.status?.toLowerCase() === "completed").length,
    [projects]
  );

  const processingCount = useMemo(
    () => projects.filter((p) => p.status?.toLowerCase() === "processing").length,
    [projects]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.url || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  const totalPanels = useMemo(
    () => projects.reduce((acc, p) => acc + (p.panels_count || 0), 0),
    [projects]
  );

  useEffect(() => {
    if (projects.length > 0) {
      setOnboardingTasks((prev) =>
        prev.map((t) => (t.id === 1 ? { ...t, completed: true } : t))
      );
    }
    const hasAnalyzed = projects.some((p) => p.panels_count > 0);
    if (hasAnalyzed) {
      setOnboardingTasks((prev) =>
        prev.map((t) => (t.id === 2 ? { ...t, completed: true } : t))
      );
    }
    if (completedCount > 0) {
      setOnboardingTasks((prev) =>
        prev.map((t) => (t.id === 4 ? { ...t, completed: true } : t))
      );
    }
  }, [projects, completedCount]);

  return {
    themeMode,
    projects,
    loading,
    error,
    latency,
    analytics,
    metrics,
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
    handleDeleteProject,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  };
}
