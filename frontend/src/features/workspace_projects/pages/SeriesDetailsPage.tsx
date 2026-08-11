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
} from "lucide-react";
import { groupProjectsIntoSeries, Series } from "../utils/seriesGrouping";
import type { Project, ViewMode } from "../hooks/ProjectTypes";
import ProjectCard from "../components/ProjectCard";
import { useProjectsActions } from "../hooks";
import SeriesEditModal from "../components/SeriesEditModal";
import SeriesPublishModal from "../components/SeriesPublishModal";
import SeriesReaderModal from "../components/SeriesReaderModal";

interface SeriesDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: typeof fetch;
}

export default function SeriesDetailsPage({
  onNavigateHome,
  navigateTo,
  fetchWithInterceptor,
}: SeriesDetailsPageProps) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter, Search, Sort & View states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "ready">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "panels" | "alphabetical">("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isFavorite, setIsFavorite] = useState(false);

  // Multi-select batch mode
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);

  const seriesSlug = window.location.pathname.split("/projects/")[1]?.split("/")[0] || "";

  const actions = useProjectsActions();

  useEffect(() => {
    async function fetchSeriesDetails() {
      if (!seriesSlug) {
        setError("Invalid series URL.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetchWithInterceptor("/api/projects");
        if (!res.ok) {
          throw new Error("Failed to load projects");
        }
        const data = await res.json();
        const allProjects: Project[] = data.projects || [];
        const allSeries = groupProjectsIntoSeries(allProjects);

        const foundSeries = allSeries.find(
          (s) => s.slug === seriesSlug || s.id === seriesSlug || s.slug.toLowerCase() === seriesSlug.toLowerCase()
        );

        if (foundSeries) {
          setSeries(foundSeries);
        } else {
          setError("Series not found.");
        }
      } catch (err: any) {
        console.error("Failed to fetch series details", err);
        setError(err.message || "An error occurred while loading series details.");
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
    return series.chapters.filter((c) => c.status && c.status.toLowerCase() !== "draft").length;
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
      list = list.filter((c) => !c.status || c.status.toLowerCase() === "draft");
    } else if (statusFilter === "ready") {
      list = list.filter((c) => c.status && c.status.toLowerCase() !== "draft");
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
      const res = await fetchWithInterceptor(`/api/projects/${firstChapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          author: updated.author,
          genre: updated.genre,
          synopsis: updated.synopsis,
          cover_image: updated.cover,
        }),
      });
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
      }
    } catch (err) {
      console.error("Failed to update series metadata on backend", err);
    }
  };

  // Toggle selection for batch operations
  const toggleSelectChapter = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
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
    return (
      <div className="flex flex-col justify-center items-center h-full pt-32 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-400" />
        <p className="font-mono text-sm">Loading series dashboard & chapters...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Unable to load this series</h3>
        <p className="text-neutral-400 mb-6 font-mono max-w-md text-center text-xs">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => navigateTo("/projects")}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-[#07070a] text-neutral-100 flex flex-col pt-6 px-4 md:px-8 lg:px-12 pb-32 animate-fade-in relative z-10 selection:bg-purple-500/30">
      {/* Top Back Nav & Quick Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateTo("/projects")}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider">Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isFavorite
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Info</span>
          </button>
        </div>
      </div>

      {/* 1. Ambient Glassmorphic Hero Banner */}
      <div className="relative mb-10 rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/80 backdrop-blur-2xl shadow-2xl p-6 md:p-8">
        {/* Cover Background Blur Glow */}
        {series.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-125 pointer-events-none"
            style={{ backgroundImage: `url(${series.cover})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
          {/* Cover Poster */}
          <div className="w-48 h-64 md:w-56 md:h-76 shrink-0 rounded-2xl overflow-hidden border border-white/15 bg-neutral-950 shadow-2xl relative group">
            {series.cover ? (
              <img
                src={series.cover}
                alt={series.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-950/40 via-neutral-900 to-neutral-955">
                <FolderOpen className="w-12 h-12 text-purple-400/50" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">No Cover</span>
              </div>
            )}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-extrabold font-mono text-purple-300 uppercase tracking-wider">
              WEBTOON
            </div>
          </div>

          {/* Series Meta Info & Actions */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold font-mono">
                  {series.genre || "Fantasy Action"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs font-mono">
                  By {series.author || "Unknown Author"}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white line-clamp-2 font-sans">
                {series.title}
              </h1>

              {series.synopsis && (
                <p className="text-neutral-300 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3 font-sans opacity-90">
                  {series.synopsis}
                </p>
              )}
            </div>

            {/* Metadata Chips Row */}
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>{series.chapterCount} Chapters</span>
              </div>

              <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalPanels} Sliced Panels</span>
              </div>

              <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>~{estimatedRuntimeMinutes} Min Video</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono ml-auto">
                <span>
                  Updated:{" "}
                  {series.latestUpdatedAt
                    ? new Date(series.latestUpdatedAt).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
            </div>

            {/* Hero Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-white/10">
              <button
                onClick={handleNewChapter}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>New Chapter</span>
              </button>

              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-purple-500/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <Film className="h-4 w-4 text-purple-400" />
                <span>Export Full Series</span>
              </button>

              <button
                onClick={() => setIsReaderModalOpen(true)}
                className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-purple-500/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span>Read Series</span>
              </button>

              <button
                onClick={() => navigateTo("/creative-suite/ai-voice")}
                className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-purple-500/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <Volume2 className="h-4 w-4 text-amber-400" />
                <span>Audio Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Deep Series Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">{series.chapterCount}</div>
            <div className="text-xs text-neutral-400 font-mono">
              Total Chapters ({readyChaptersCount} Ready · {draftChaptersCount} Draft)
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">{totalPanels}</div>
            <div className="text-xs text-neutral-400 font-mono">Comic Panels Extracted</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">~{estimatedRuntimeMinutes}m</div>
            <div className="text-xs text-neutral-400 font-mono">Estimated Reel Duration</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-neutral-400 font-mono">Health Score</span>
              <span className="text-xs font-bold text-indigo-400 font-mono">
                {Math.round((readyChaptersCount / Math.max(1, series.chapterCount)) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-955 overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                style={{
                  width: `${Math.round(
                    (readyChaptersCount / Math.max(1, series.chapterCount)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter, Search & View Mode Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        {/* Title + Chapter Counter */}
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white font-sans flex items-center gap-3">
            Chapters
            <span className="text-xs font-mono bg-neutral-800 border border-neutral-750 px-3 py-1 rounded-full text-purple-400 font-bold">
              {filteredChapters.length} of {series.chapterCount}
            </span>
          </h2>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapter..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors font-sans"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl text-xs font-mono">
            {(["all", "draft", "ready"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-purple-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="panels">Most Panels</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

          {/* View Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Chapters Grid or List View */}
      {filteredChapters.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredChapters.map((chapter) => (
              <div key={chapter.project_id} className="relative group">
                {isBatchMode && (
                  <div className="absolute top-3 left-3 z-30">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(chapter.project_id)}
                      onChange={() => toggleSelectChapter(chapter.project_id)}
                      className="w-5 h-5 rounded border-neutral-700 text-purple-600 focus:ring-purple-500 bg-neutral-955 cursor-pointer"
                    />
                  </div>
                )}
                <ProjectCard
                  project={chapter}
                  onOpenProject={(p) => actions.handleOpenProject(p)}
                  onRename={(e, p) => actions.handleRename(e, p, () => {})}
                  onExport={(e, p) => actions.handleExport(e, p)}
                  onOpenDetails={(e, p) => actions.handleOpenDetails(e, p)}
                  onDelete={(e, pid) =>
                    actions.handleDeleteSingle(
                      e,
                      pid,
                      () => {
                        setSeries((prev) =>
                          prev
                            ? { ...prev, chapters: prev.chapters.filter((c) => c.project_id !== pid) }
                            : null
                        );
                      },
                      () => {}
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
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 flex items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {isBatchMode && (
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(chapter.project_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectChapter(chapter.project_id);
                      }}
                      className="w-5 h-5 rounded border-neutral-700 text-purple-600 focus:ring-purple-500 bg-neutral-955 cursor-pointer shrink-0"
                    />
                  )}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-955 border border-neutral-800 shrink-0">
                    {chapter.cover_image ? (
                      <img src={chapter.cover_image} alt={chapter.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-[10px]">
                        N/A
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
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
                      chapter.status && chapter.status.toLowerCase() !== "draft"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-neutral-800 border-neutral-750 text-neutral-400"
                    }`}
                  >
                    {chapter.status || "Draft"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.handleOpenProject(chapter);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
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
          <h3 className="text-lg font-bold text-white mb-2">No chapters match criteria</h3>
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
    </div>
  );
}
