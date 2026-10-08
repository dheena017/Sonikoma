import React, { useEffect, useState, useMemo } from "react";
import {
  FolderOpen,
  ArrowLeft,
  Loader2,
  Plus,
  AlertCircle,
  Clock,
  Sparkles,
  Film,
  BookOpen,
  Edit3,
  Star,
  Search,
  Grid,
  List,
  Layers,
  Zap,
  Volume2,
  CheckCircle2,
  Trash2,
  Crop,
  Eraser,
  Download,
  Users,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { groupProjectsIntoSeries, Series } from "../utils/seriesGrouping";
import type { Project, ViewMode } from "../hooks/ProjectTypes";
import ProjectCard from "../components/ProjectCard";
import { useProjectsActions } from "../hooks";
import SeriesEditModal from "../components/SeriesEditModal";
import SeriesPublishModal from "../components/SeriesPublishModal";
import { SeriesDetailsSkeleton } from "@/features/platform/projects/components/SeriesDetailsSkeleton";
import { notify } from "@/features/platform/notifications";
import SeriesReaderModal from "../components/SeriesReaderModal";

interface SeriesDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: typeof fetch;
}

const cachedSeriesMap = new Map<string, Series>();

export default function SeriesDetailsPage({
  onNavigateHome,
  navigateTo,
  fetchWithInterceptor,
}: SeriesDetailsPageProps) {
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
  const sortRef = React.useRef<HTMLDivElement>(null);
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
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);

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
          `/api/v1/projects?series_id=${encodeURIComponent(seriesRecord.id)}&limit=200`
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
    // Approx 4 seconds per panel
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

  if (loading) {
    return <SeriesDetailsSkeleton />;
  }

  const isInvalidSeries =
    !series ||
    error ||
    Boolean(
      series.title && series.title.toLowerCase().includes("connect error")
    );

  if (isInvalidSeries) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Unable to load this series
        </h3>
        <p className="text-neutral-400 mb-6 font-mono max-w-md text-center text-xs">
          {error}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => navigateTo("/projects")}
            className="px-6 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-6 sm:py-8 max-w-7xl mx-auto text-left">
      <section className="w-full space-y-7 text-left" aria-label="Series details">
        {/* Top Back Nav & Quick Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <button
              type="button"
              onClick={() => navigateTo("/projects")}
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Projects</span>
            </button>
            <span className="text-neutral-600 font-bold">&rsaquo;</span>
            <span className="max-w-[min(60vw,28rem)] truncate rounded-md px-1.5 py-1 font-semibold text-[#D4D4D8]">
              {series.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-pressed={isFavorite}
              className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                isFavorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-850"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isFavorite ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
              <span>{isFavorite ? "Favorited" : "Favorite"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Edit Info</span>
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#151515] p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {/* Cover Poster */}
            <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-950 sm:w-40">
              {series.cover ? (
                <img
                  src={series.cover}
                  alt={series.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#101010]">
                  <FolderOpen className="h-10 w-10 text-neutral-600" />
                  <span className="text-[10px] font-semibold uppercase text-neutral-500">
                    No Cover
                  </span>
                </div>
              )}
              <div className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[9px] font-semibold uppercase text-white">
                SERIES COVER
              </div>
            </div>

            {/* Series Meta Info & Actions */}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-xs font-medium text-sky-200">
                    {series.genre || "Fantasy Action"}
                  </span>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-neutral-300">
                    By {series.author || "Unknown Author"}
                  </span>
                </div>

                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {series.title}
                </h1>

                {series.synopsis && (
                  <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                    {series.synopsis}
                  </p>
                )}
              </div>

              <p className="text-xs text-neutral-500">
                Updated {series.latestUpdatedAt
                  ? new Date(series.latestUpdatedAt).toLocaleDateString()
                  : "recently"}
              </p>

              <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-4 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <button
                  onClick={handleNewChapter}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300 px-4 text-sm font-semibold text-[#101510] transition-colors hover:bg-emerald-200 xl:justify-start"
                >
                  <Plus className="h-4 w-4" />
                  <span>New chapter</span>
                </button>

                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5 hover:text-white xl:justify-start"
                >
                  <Film className="h-4 w-4 text-[#3B82F6]" />
                  <span>Export series</span>
                </button>

                <button
                  onClick={() => setIsReaderModalOpen(true)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5 hover:text-white xl:justify-start"
                >
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <span>Read Series</span>
                </button>

                <button
                  onClick={() => navigateTo("/creative-suite")}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5 hover:text-white xl:justify-start"
                >
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  <span>Audio Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Deep Series Analytics Dashboard */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            <div className="shrink-0 rounded-lg border border-sky-400/20 bg-sky-400/10 p-2.5 text-sky-300">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {series.chapterCount}
              </div>
              <div className="text-xs text-neutral-400">
                Chapters · {readyChaptersCount} ready · {draftChaptersCount} draft
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            <div className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/10 p-2.5 text-amber-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {totalPanels.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400">
                Panels extracted
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            <div className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                ~{estimatedRuntimeMinutes}m
              </div>
              <div className="text-xs text-neutral-400">
                Estimated video runtime
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4">
            <div className="shrink-0 rounded-lg border border-indigo-400/20 bg-indigo-400/10 p-2.5 text-indigo-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Ready rate</span>
                <span className="text-xs font-semibold text-indigo-300">
                  {Math.round(
                    (readyChaptersCount / Math.max(1, series.chapterCount)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800"
                role="progressbar"
                aria-label="Ready chapter rate"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(
                  (readyChaptersCount / Math.max(1, series.chapterCount)) *
                    100
                )}
              >
                <div
                  className="h-full rounded-full bg-indigo-300"
                  style={{
                    width: `${Math.round(
                      (readyChaptersCount / Math.max(1, series.chapterCount)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Filter, Search & View Mode Controls Bar */}
        <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Title + Chapter Counter */}
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
              Chapters
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium leading-none text-neutral-300">
                {filteredChapters.length} of {series.chapterCount}
              </span>
            </h2>
          </div>

          {/* Controls Row */}
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-auto xl:flex-nowrap">
            {/* Search Box */}
            <div className="relative col-span-2 min-w-0 sm:col-span-1 sm:flex-1 sm:basis-52 xl:w-56 xl:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                aria-label="Search chapters"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters"
                className="h-11 w-full rounded-lg border border-white/10 bg-[#141414] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/10"
              />
            </div>

            {/* Status Filters */}
            <div className="col-span-2 grid h-11 grid-cols-3 items-center rounded-lg border border-white/10 bg-[#141414] p-1 text-xs sm:col-span-1 sm:flex">
              {(["all", "draft", "ready"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  aria-pressed={statusFilter === status}
                  className={`h-full rounded-md px-2 text-xs capitalize transition-colors cursor-pointer sm:px-3 ${
                    statusFilter === status
                      ? "bg-white/10 font-medium text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className={`flex h-11 min-w-0 items-center justify-between gap-2 rounded-lg border bg-[#141414] px-3 text-xs transition-colors cursor-pointer select-none sm:flex-none ${
                  isSortOpen
                    ? "border-sky-300/50 text-white ring-2 ring-sky-300/10"
                    : "border-white/10 text-neutral-300 hover:border-white/20"
                }`}
              >
                  <span className="hidden text-neutral-500 sm:inline">Sort:</span>
                <span className="font-semibold text-white">
                  {sortBy === "newest"
                    ? "Newest First"
                    : sortBy === "oldest"
                    ? "Oldest First"
                    : sortBy === "panels"
                    ? "Most Panels"
                    : "Alphabetical"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                    isSortOpen ? "rotate-180 text-[#60A5FA]" : ""
                  }`}
                />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-white/10 bg-[#171717] py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-1">
                    {[
                      { id: "newest", label: "Newest First" },
                      { id: "oldest", label: "Oldest First" },
                      { id: "panels", label: "Most Panels" },
                      { id: "alphabetical", label: "Alphabetical" },
                    ].map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id as any);
                            setIsSortOpen(false);
                          }}
                          className={`my-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-white/10 font-medium text-white"
                              : "text-neutral-300 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-[#141414] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-white"
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-white"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. Chapters Grid or List View */}
        {filteredChapters.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
              {filteredChapters.map((chapter) => (
                <div key={chapter.project_id} className="relative group">
                  {isBatchMode && (
                    <div className="absolute top-3 left-3 z-30">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(
                          chapter.project_id
                        )}
                        onChange={() => toggleSelectChapter(chapter.project_id)}
                        className="w-5 h-5 rounded border-neutral-700 text-[#3B82F6] focus:ring-neutral-700 bg-neutral-955 cursor-pointer"
                      />
                    </div>
                  )}
                  <ProjectCard
                    project={chapter}
                    openMenuId={openMenuId}
                    onToggleMenu={handleToggleMenu}
                    renamingProjectId={renamingProjectId}
                    onSaveRename={handleSaveRename}
                    onOpenProject={(p) => actions.handleOpenProject(p)}
                    onRename={(e, p) => setRenamingProjectId(p.project_id)}
                    onExport={(e, p) => actions.handleExport(e, p)}
                    onOpenDetails={(e, p) => actions.handleOpenDetails(e, p)}
                    onDelete={(e, pid) =>
                      actions.handleDeleteSingle(
                        e,
                        pid,
                        () => {
                          setSeries((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  chapters: prev.chapters.filter(
                                    (c) => c.project_id !== pid
                                  ),
                                }
                              : null
                          );
                        },
                        () => setOpenMenuId(null)
                      )
                    }
                    onCopyLink={(e, p) => actions.handleCopyLink(e, p)}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* List View Layout */
            <div className="space-y-3">
              {filteredChapters.map((chapter) => (
                <div
                  key={chapter.project_id}
                  onClick={() => actions.handleOpenProject(chapter)}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between gap-4 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {isBatchMode && (
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(
                          chapter.project_id
                        )}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectChapter(chapter.project_id);
                        }}
                        className="w-5 h-5 rounded border-neutral-700 text-[#3B82F6] focus:ring-neutral-700 bg-neutral-955 cursor-pointer shrink-0"
                      />
                    )}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-955 border border-neutral-800 shrink-0">
                      {chapter.cover_image ? (
                        <img
                          src={chapter.cover_image}
                          alt={chapter.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-[10px]">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#93C5FD] transition-colors">
                        {chapter.title}
                      </h4>
                      <p className="text-xs text-neutral-400 font-mono">
                        {chapter.panels_count || 0} Panels · Created{" "}
                        {new Date(chapter.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono border ${
                        chapter.status &&
                        chapter.status.toLowerCase() !== "draft"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-neutral-800 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {chapter.status || "Draft"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.handleOpenProject(chapter);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] border border-blue-400/40 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer"
                    >
                      Open Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              No chapters match criteria
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
              Try adjusting your search query or status filter.
            </p>
            <button
              onClick={handleNewChapter}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">New Chapter</span>
            </button>
          </div>
        )}

        {/* Modals */}
        <SeriesEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          series={{
            id: series.id,
            slug: series.slug,
            title: series.title,
            author: series.author,
            genre: series.genre,
            synopsis: series.synopsis,
            cover: series.cover,
          }}
          onSave={handleSaveSeriesMetadata}
        />

        <SeriesPublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          seriesTitle={series.title}
          chapterCount={series.chapterCount}
          totalPanels={totalPanels}
        />

        <SeriesReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          seriesTitle={series.title}
          chapters={series.chapters}
        />
      </section>
    </div>
  );
}
