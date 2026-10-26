import React, { useEffect, useState, useMemo, useRef } from "react";
import { groupProjectsIntoSeries } from "../utils/seriesGrouping";
import type { Project, ViewMode, Series } from "../types";
import { useProjectsActions } from "./useProjectsActions";
import { notify } from "@/features/platform/notifications";

const cachedSeriesMap = new Map<string, Series>();

interface UseSeriesDetailsOptions {
  navigateTo: (path: string) => void;
  fetchWithInterceptor: typeof fetch;
}

export function useSeriesDetails({
  navigateTo,
  fetchWithInterceptor,
}: UseSeriesDetailsOptions) {
  const seriesSlug =
    window.location.pathname.split("/projects/")[1]?.split("/")[0] ||
    window.location.pathname.split("/series/")[1]?.split("/")[0] ||
    "";

  const initialSeries = seriesSlug
    ? cachedSeriesMap.get(seriesSlug) || null
    : null;
  const [series, setSeries] = useState<Series | null>(initialSeries);
  const [loading, setLoading] = useState(!initialSeries);
  const [error, setError] = useState<string | null>(null);

  // Filter, Search, Sort & View states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "ready">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "panels" | "alphabetical"
  >("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isFavorite, setIsFavorite] = useState(false);

  // Multi-select batch mode
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Card menu and rename state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const actions = useProjectsActions();

  const handleToggleMenu = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  };

  const handleSaveRename = async (projectId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingProjectId(null);
      return;
    }
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: newName.trim() }),
      });
      setSeries((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((c) =>
                c.project_id === projectId ? { ...c, title: newName.trim() } : c
              ),
            }
          : null
      );
      notify.success(`Renamed chapter to "${newName.trim()}"`);
    } catch (err) {
      console.error("Failed to rename chapter:", err);
    }
    setRenamingProjectId(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchSeriesDetails() {
      if (!seriesSlug) {
        setError("Invalid series URL.");
        setLoading(false);
        return;
      }
      try {
        if (!cachedSeriesMap.has(seriesSlug)) {
          setLoading(true);
        }
        const seriesRes = await fetchWithInterceptor(
          `/api/v1/projects/series/${encodeURIComponent(seriesSlug)}`
        );
        if (!seriesRes.ok) {
          throw new Error(
            seriesRes.status === 404
              ? "Series not found."
              : "Failed to load series"
          );
        }
        const seriesData = await seriesRes.json();
        const seriesRecord = seriesData.series;
        const projectsRes = await fetchWithInterceptor(
          `/api/v1/projects?series_id=${encodeURIComponent(
            seriesRecord.id
          )}&limit=200`
        );
        if (!projectsRes.ok) {
          throw new Error("Failed to load series chapters");
        }
        const projectsData = await projectsRes.json();
        const allProjects: Project[] = projectsData.projects || [];
        const groupedSeries = groupProjectsIntoSeries(allProjects).find(
          (candidate) => candidate.id === seriesRecord.id
        );
        const foundSeries: Series = groupedSeries || {
          id: seriesRecord.id,
          slug: seriesRecord.slug || seriesSlug,
          title: seriesRecord.title || "Untitled Series",
          cover: seriesRecord.cover_image,
          chapters: [],
          chapterCount: 0,
          genre: seriesRecord.genre,
          author: seriesRecord.author,
          synopsis: seriesRecord.synopsis,
        };

        if (foundSeries) {
          cachedSeriesMap.set(seriesSlug, foundSeries);
          if (foundSeries.slug)
            cachedSeriesMap.set(foundSeries.slug, foundSeries);
          if (foundSeries.id) cachedSeriesMap.set(foundSeries.id, foundSeries);
          setSeries(foundSeries);
        } else {
          if (!cachedSeriesMap.has(seriesSlug)) {
            setError("Series not found.");
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch series details", err);
        if (!cachedSeriesMap.has(seriesSlug)) {
          setError(
            err.message || "An error occurred while loading series details."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSeriesDetails();
  }, [seriesSlug, fetchWithInterceptor]);

  // Aggregated analytics metrics
  const totalPanels = useMemo(() => {
    if (!series) return 0;
    return series.chapters.reduce((sum, c) => sum + (c.panels_count || 0), 0);
  }, [series]);

  const estimatedRuntimeMinutes = useMemo(() => {
    return Math.max(1, Math.round((totalPanels * 4) / 60));
  }, [totalPanels]);

  const readyChaptersCount = useMemo(() => {
    if (!series) return 0;
    return series.chapters.filter(
      (c) => c.status && c.status.toLowerCase() !== "draft"
    ).length;
  }, [series]);

  const draftChaptersCount = useMemo(() => {
    if (!series) return 0;
    return series.chapters.length - readyChaptersCount;
  }, [series, readyChaptersCount]);

  // Filter & sort chapters
  const filteredChapters = useMemo(() => {
    if (!series) return [];
    let list = [...series.chapters];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.chapter_slug && c.chapter_slug.toLowerCase().includes(q)) ||
          (c.episode && String(c.episode).includes(q))
      );
    }

    // Status filter
    if (statusFilter === "draft") {
      list = list.filter(
        (c) => !c.status || c.status.toLowerCase() === "draft"
      );
    } else if (statusFilter === "ready") {
      list = list.filter((c) => c.status && c.status.toLowerCase() !== "draft");
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sortBy === "panels") {
        return (b.panels_count || 0) - (a.panels_count || 0);
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [series, searchQuery, statusFilter, sortBy]);

  const handleNewChapter = () => {
    if (series) {
      navigateTo(`/scraper?series_slug=${encodeURIComponent(series.slug)}`);
    } else {
      navigateTo("/scraper");
    }
  };

  const handleSaveSeriesMetadata = async (updated: {
    title: string;
    author: string;
    genre: string;
    synopsis: string;
    cover: string;
  }) => {
    if (!series || series.chapters.length === 0) return;
    const firstChapterId = series.chapters[0].project_id;
    try {
      const res = await fetchWithInterceptor(
        `/api/v1/projects/${firstChapterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.title,
            author: updated.author,
            genre: updated.genre,
            synopsis: updated.synopsis,
            cover_image: updated.cover,
          }),
        }
      );
      if (res.ok) {
        setSeries((prev) =>
          prev
            ? {
                ...prev,
                title: updated.title,
                author: updated.author,
                genre: updated.genre,
                synopsis: updated.synopsis,
                cover: updated.cover || prev.cover,
              }
            : null
        );
        notify.success("Series metadata updated successfully!");
      } else {
        notify.error("Failed to update series metadata.");
      }
    } catch (err: any) {
      console.error("Failed to update series metadata on backend", err);
      notify.error(err.message || "Failed to update series metadata.");
    }
  };

  // Toggle selection for batch operations
  const toggleSelectChapter = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllChapters = () => {
    if (!series) return;
    if (selectedProjectIds.length === series.chapters.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(series.chapters.map((c) => c.project_id));
    }
  };

  return {
    seriesSlug,
    series,
    setSeries,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    isSortOpen,
    setIsSortOpen,
    sortRef,
    viewMode,
    setViewMode,
    isFavorite,
    setIsFavorite,
    selectedProjectIds,
    setSelectedProjectIds,
    isBatchMode,
    setIsBatchMode,
    openMenuId,
    renamingProjectId,
    setRenamingProjectId,
    isEditModalOpen,
    setIsEditModalOpen,
    actions,
    totalPanels,
    estimatedRuntimeMinutes,
    readyChaptersCount,
    draftChaptersCount,
    filteredChapters,
    handleToggleMenu,
    handleSaveRename,
    handleNewChapter,
    handleSaveSeriesMetadata,
    toggleSelectChapter,
    selectAllChapters,
  };
}

export default useSeriesDetails;
