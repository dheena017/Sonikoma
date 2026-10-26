import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import type { Project, ViewMode, Series } from "@/features/platform/projects/types";
import { groupProjectsIntoSeries } from "@/features/platform/projects/utils/seriesGrouping";
import { useProjectsData } from "./useProjectsData";
import { useProjectsActions } from "./useProjectsActions";
import {
  aiSeriesApi,
  type AISeriesProject,
} from "@/features/intelligence/series/api/aiSeries";

export interface ProjectsPageState {
  // Data
  projects: Project[];
  loading: boolean;
  error: string | null;
  aiSeriesList: AISeriesProject[];
  loadingAiSeries: boolean;
  filteredAiSeries: AISeriesProject[];
  filteredSeries: Series[];
  filteredProjects: Project[];
  isAiTab: boolean;

  // Filter & Search
  searchQuery: string;
  statusFilter: string;
  genreFilter: string;
  sortBy: string;
  viewMode: ViewMode;
  uniqueGenres: string[];
  combinedGenres: string[];
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setGenreFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setViewMode: (value: ViewMode) => void;
  resetFilters: () => void;

  // Selection
  selectedProjects: Set<string>;
  toggleSelection: (e: MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;

  // Menu & Rename
  openMenuId: string | null;
  renamingProjectId: string | null;
  toggleMenu: (e: MouseEvent, projectId: string) => void;
  saveProjectName: (projectId: string, newName: string) => Promise<void>;

  // Actions
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleOpenSeries: (series: any) => void;
  handleOpenCreativeSuite: (e: MouseEvent, project: Project) => Promise<void>;
  handleExport: (e: MouseEvent, project: Project) => void;
  handleRename: (e: MouseEvent, project: Project) => void;
  handleOpenDetails: (e: MouseEvent, project: Project) => void;
  handleCopyLink: (e: MouseEvent, project: Project) => void;
  handleDeleteSingle: (e: MouseEvent, projectId: string) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleDeleteAiSeries: (seriesId: string) => Promise<void>;

  // Metrics & Demo
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
    aiSeriesCount: number;
  };
}

let cachedProjectsAiSeriesList: AISeriesProject[] = [];

export default function useProjectsPage(): ProjectsPageState {
  // 1. Core Data
  const {
    projects,
    setProjects,
    loading,
    error,
  } = useProjectsData();

  // 2. Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 3. Selection State
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );

  // 4. Menu & Renaming State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = useCallback((e: MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  const saveProjectName = useCallback(
    async (projectId: string, newName: string) => {
      if (!newName.trim()) {
        setRenamingProjectId(null);
        return;
      }
      setProjects(
        projects.map((p) =>
          p.project_id === projectId ? { ...p, title: newName.trim() } : p
        )
      );
      setRenamingProjectId(null);
    },
    [projects, setProjects]
  );

  // 5. Actions Handlers
  const actions = useProjectsActions();

  // 6. AI Series Data Management
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>(
    cachedProjectsAiSeriesList
  );
  const [loadingAiSeries, setLoadingAiSeries] = useState(
    cachedProjectsAiSeriesList.length === 0
  );

  const fetchAiSeries = useCallback(async () => {
    try {
      if (cachedProjectsAiSeriesList.length === 0) {
        setLoadingAiSeries(true);
      }
      const list = await aiSeriesApi.listSeries();
      const finalList = list || [];
      cachedProjectsAiSeriesList = finalList;
      setAiSeriesList(finalList);
    } catch (err) {
      console.warn("Failed to fetch AI series in Projects page:", err);
    } finally {
      setLoadingAiSeries(false);
    }
  }, []);

  useEffect(() => {
    fetchAiSeries();
  }, [fetchAiSeries]);

  const handleDeleteAiSeries = useCallback(async (seriesId: string) => {
    if (!window.confirm("Are you sure you want to delete this AI Series?"))
      return;
    try {
      await aiSeriesApi.deleteSeries(seriesId);
      setAiSeriesList((prev) => prev.filter((s) => s.series_id !== seriesId));
    } catch (err) {
      console.error("Failed to delete AI Series:", err);
    }
  }, []);

  const isAiTab = statusFilter.toLowerCase() === "ai series";

  // 7. Series Grouping & Computed
  const allSeries = useMemo(() => groupProjectsIntoSeries(projects), [projects]);

  const stats = useMemo(() => {
    const totalProjects = allSeries.length;
    const completedProjects = allSeries.filter(
      (s) => s.latestChapter?.status?.toLowerCase() === "completed"
    ).length;
    const totalPanels = projects.reduce(
      (acc, p) => acc + (p.panels_count || p.imported_assets_count || 0),
      0
    );
    return {
      totalProjects,
      completedProjects,
      totalPanels,
      aiSeriesCount: aiSeriesList.length,
    };
  }, [projects, allSeries, aiSeriesList.length]);

  const uniqueGenres = useMemo(() => {
    const genres = allSeries.map((s) => s.genre).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(genres))];
  }, [allSeries]);

  const combinedGenres = useMemo(() => {
    if (isAiTab) {
      const aiGenres = aiSeriesList
        .map((s) => s.genre)
        .filter(Boolean) as string[];
      return ["All", ...Array.from(new Set(aiGenres))];
    }
    return uniqueGenres;
  }, [isAiTab, aiSeriesList, uniqueGenres]);

  const filteredSeries = useMemo(() => {
    let result = [...allSeries];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (s.genre || "").toLowerCase().includes(q) ||
          (s.author || "").toLowerCase().includes(q)
      );
    }

    if (genreFilter && genreFilter !== "All") {
      result = result.filter(
        (s) => (s.genre || "").toLowerCase() === genreFilter.toLowerCase()
      );
    }

    if (statusFilter && statusFilter !== "All" && !isAiTab) {
      result = result.filter((s) => {
        const status = (s.latestChapter?.status || "").toLowerCase();
        if (statusFilter.toLowerCase() === "ready") return status === "completed";
        if (statusFilter.toLowerCase() === "draft") return status !== "completed";
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortBy === "Newest") {
        return (
          new Date(b.latestUpdatedAt || 0).getTime() -
          new Date(a.latestUpdatedAt || 0).getTime()
        );
      }
      if (sortBy === "Oldest") {
        return (
          new Date(a.latestUpdatedAt || 0).getTime() -
          new Date(b.latestUpdatedAt || 0).getTime()
        );
      }
      if (sortBy === "Panels") {
        const panelsA = a.chapters.reduce(
          (acc, c) => acc + (c.panels_count || 0),
          0
        );
        const panelsB = b.chapters.reduce(
          (acc, c) => acc + (c.panels_count || 0),
          0
        );
        return panelsB - panelsA;
      }
      if (sortBy === "Alphabetical" || sortBy === "A-Z") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return result;
  }, [allSeries, searchQuery, genreFilter, statusFilter, isAiTab, sortBy]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.genre || "").toLowerCase().includes(q) ||
          (p.series_slug || "").toLowerCase().includes(q)
      );
    }

    if (genreFilter && genreFilter !== "All") {
      result = result.filter(
        (p) => (p.genre || "").toLowerCase() === genreFilter.toLowerCase()
      );
    }

    if (statusFilter && statusFilter !== "All" && !isAiTab) {
      result = result.filter((p) => {
        const status = (p.status || "").toLowerCase();
        if (statusFilter.toLowerCase() === "ready") return status === "completed";
        if (statusFilter.toLowerCase() === "draft") return status !== "completed";
        return true;
      });
    }

    return result;
  }, [projects, searchQuery, genreFilter, statusFilter, isAiTab]);

  const filteredAiSeries = useMemo(() => {
    let result = [...aiSeriesList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.logline && s.logline.toLowerCase().includes(q)) ||
          (s.genre && s.genre.toLowerCase().includes(q)) ||
          (s.format_type && s.format_type.toLowerCase().includes(q))
      );
    }
    if (genreFilter && genreFilter !== "All") {
      result = result.filter(
        (s) =>
          (s.genre || "").toLowerCase() === genreFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      if (sortBy === "Newest")
        return (
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime()
        );
      if (sortBy === "Oldest")
        return (
          new Date(a.created_at || a.updated_at || 0).getTime() -
          new Date(b.created_at || b.updated_at || 0).getTime()
        );
      if (sortBy === "A-Z" || sortBy === "Alphabetical")
        return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [aiSeriesList, searchQuery, genreFilter, sortBy]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("All");
    setGenreFilter("All");
  }, []);

  // Selection Actions
  const toggleSelection = useCallback((e: MouseEvent, projectId: string) => {
    e.stopPropagation();
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedProjects((prev) => {
      if (prev.size === filteredProjects.length) {
        return new Set();
      }
      return new Set(filteredProjects.map((p) => p.project_id));
    });
  }, [filteredProjects]);

  const clearSelection = useCallback(() => {
    setSelectedProjects(new Set());
  }, []);

  // Wrapped actions with menu closing
  const handleExport = useCallback(
    (e: MouseEvent, project: Project) => {
      actions.handleExport(e, project);
      closeMenu();
    },
    [actions, closeMenu]
  );

  const handleOpenCreativeSuite = useCallback(
    async (e: MouseEvent, project: Project) => {
      await actions.handleOpenCreativeSuite(e, project);
      closeMenu();
    },
    [actions, closeMenu]
  );

  const handleRename = useCallback(
    (e: MouseEvent, project: Project) => {
      actions.handleRename(e, project, setRenamingProjectId);
      closeMenu();
    },
    [actions, closeMenu]
  );

  const handleOpenDetails = useCallback(
    (e: MouseEvent, project: Project) => {
      actions.handleOpenDetails(e, project);
      closeMenu();
    },
    [actions, closeMenu]
  );

  const handleCopyLink = useCallback(
    (e: MouseEvent, project: Project) => {
      actions.handleCopyLink(e, project);
      closeMenu();
    },
    [actions, closeMenu]
  );

  const handleDeleteSingle = useCallback(
    async (e: MouseEvent, projectId: string) => {
      await actions.handleDeleteSingle(
        e,
        projectId,
        (id: string) => {
          setProjects(projects.filter((p) => p.project_id !== id));
          setSelectedProjects((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
        closeMenu
      );
    },
    [actions, projects, setProjects, closeMenu]
  );

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedProjects);
    await actions.handleBulkDelete(selectedIds, (ids: string[]) => {
      setProjects(projects.filter((p) => !ids.includes(p.project_id)));
      setSelectedProjects(new Set());
    });
  }, [actions, selectedProjects, projects, setProjects]);

  return {
    projects,
    loading,
    error,
    aiSeriesList,
    loadingAiSeries,
    filteredAiSeries,
    filteredSeries,
    filteredProjects,
    isAiTab,

    searchQuery,
    statusFilter,
    genreFilter,
    sortBy,
    viewMode,
    uniqueGenres,
    combinedGenres,
    setSearchQuery,
    setStatusFilter,
    setGenreFilter,
    setSortBy,
    setViewMode,
    resetFilters,

    selectedProjects,
    openMenuId,
    renamingProjectId,
    saveProjectName,
    toggleSelection,
    toggleMenu,
    toggleSelectAll,
    clearSelection,

    handleNewSeries: actions.handleNewSeries,
    handleOpenProject: actions.handleOpenProject,
    handleOpenSeries: actions.handleOpenSeries,
    handleOpenCreativeSuite,
    handleExport,
    handleRename,
    handleOpenDetails,
    handleCopyLink,
    handleDeleteSingle,
    handleBulkDelete,
    handleDeleteAiSeries,
    stats,
  };
}
