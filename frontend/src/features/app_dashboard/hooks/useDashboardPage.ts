import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import * as api from "@/api";
import { useProjectStore } from "@/store/useProjectStore";

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
        setError(
          err.message || "An unexpected error occurred while loading projects."
        );
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
    useProjectStore.getState().clearActiveProject();
    localStorage.removeItem("active_project_id");
    localStorage.removeItem("active_job_id");
    localStorage.removeItem("active_series_slug");
    localStorage.removeItem("active_chapter_slug");
    localStorage.removeItem("auto_import_url");
    localStorage.removeItem("auto_import_batch");

    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav("/scraper");
    } else {
      window.history.pushState({}, "", "/scraper");
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

  const handleOpenProject = useCallback(async (project: Project) => {
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token") ||
        "";
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/projects/${project.project_id}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const loadedSettings = data.project.audio_settings || {};
        const savedScrapedImages =
          Array.isArray(data.scraped_images) && data.scraped_images.length > 0
            ? data.scraped_images
            : loadedSettings.scraped_images;
        const scrapedImages =
          Array.isArray(savedScrapedImages) && savedScrapedImages.length > 0
            ? savedScrapedImages
            : (data.panels || []).map((p: any) => p.image_url).filter(Boolean);

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

    const nav = (window as any).navigateTo;
    const jobId = project.job_id;
    const target =
      project.series_slug && project.chapter_slug
        ? `/scraper/editor/series/${project.series_slug}/chapters/${
            project.chapter_slug
          }${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`
        : `/scraper?project_id=${project.project_id}${
            jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
          }`;

    if (typeof nav === "function") {
      nav(target);
    } else {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      try {
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token") ||
          "";
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/${project.project_id}`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          const loadedSettings = data.project.audio_settings || {};
          const savedScrapedImages =
            Array.isArray(data.scraped_images) && data.scraped_images.length > 0
              ? data.scraped_images
              : loadedSettings.scraped_images;
          const scrapedImages =
            Array.isArray(savedScrapedImages) && savedScrapedImages.length > 0
              ? savedScrapedImages
              : (data.panels || [])
                  .map((p: any) => p.image_url)
                  .filter(Boolean);

          useProjectStore.getState().setActiveProject({
            project: data.project,
            panels: data.panels || [],
            scrapedImages,
          });
        }
      } catch (err) {
        console.error("Failed to load project for Creative Suite:", err);
      }

      const nav = (window as any).navigateTo;
      if (typeof nav === "function") {
        nav("/creative-suite");
      } else {
        window.history.pushState({}, "", "/creative-suite");
        window.dispatchEvent(new Event("popstate"));
      }
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
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token");
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    () =>
      projects.filter((p) => p.status?.toLowerCase() === "completed").length,
    [projects]
  );

  const processingCount = useMemo(
    () =>
      projects.filter((p) => p.status?.toLowerCase() === "processing").length,
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
    () =>
      projects.reduce(
        (acc, p) => acc + (p.panels_count || p.imported_assets_count || 0),
        0
      ),
    [projects]
  );

  useEffect(() => {
    if (projects.length > 0) {
      setOnboardingTasks((prev) =>
        prev.map((t) => (t.id === 1 ? { ...t, completed: true } : t))
      );
    }
    const hasAnalyzed = projects.some(
      (p) => (p.panels_count || p.imported_assets_count || 0) > 0
    );
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
    handleOpenCreativeSuite,
    handleDeleteProject,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  };
}
