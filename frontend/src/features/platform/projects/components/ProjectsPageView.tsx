import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FolderOpen, Layers, Zap, Clock, ArrowRight, Sparkles } from "lucide-react";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";
import ProjectsPageHeader from "@/features/platform/projects/components/ProjectsPageHeader";
import ProjectsFilters from "@/features/platform/projects/components/ProjectsFilters";
import ProjectsStats from "@/features/platform/projects/components/ProjectsStats";
import ProjectsPageResultView from "@/features/platform/projects/components/ProjectsPageResultView";
import ProjectsQuickLauncher from "@/features/platform/projects/components/ProjectsQuickLauncher";
import AISeriesGridCard from "@/features/intelligence/series/components/AISeriesGridCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import { aiSeriesApi, type AISeriesProject } from "@/features/intelligence/series/api/aiSeries";
import type {
  Project,
  ViewMode,
} from "@/features/platform/projects/hooks/ProjectTypes";
import type { Series } from "@/features/platform/projects/utils/seriesGrouping";

export interface ProjectsPageViewProps {
  projectsLength: number;
  filteredProjects: Project[];
  filteredSeries: Series[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: string;
  genreFilter: string;
  sortBy: string;
  viewMode: ViewMode;
  selectedProjects: Set<string>;
  openMenuId: string | null;
  renamingProjectId: string | null;
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  uniqueGenres: string[];
  isDemoActive?: boolean;
  loadDemoProjects?: () => void;
  clearDemoProjects?: () => void;
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setGenreFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setViewMode: (value: ViewMode) => void;
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleOpenSeries: (series: Series) => void;
  handleOpenCreativeSuite: (e: React.MouseEvent, project: Project) => void;
  handleExport: (e: React.MouseEvent, project: Project) => void;
  handleRename: (e: React.MouseEvent, project: Project) => void;
  handleOpenDetails: (e: React.MouseEvent, project: Project) => void;
  handleCopyLink: (e: React.MouseEvent, project: Project) => void;
  handleDeleteSingle: (e: React.MouseEvent, projectId: string) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  toggleMenu: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  saveProjectName: (projectId: string, newName: string) => Promise<void>;
}

let cachedProjectsAiSeriesList: AISeriesProject[] = [];

export default function ProjectsPageView({
  projectsLength,
  filteredProjects,
  filteredSeries,
  loading,
  error,
  searchQuery,
  statusFilter,
  genreFilter,
  sortBy,
  viewMode,
  selectedProjects,
  openMenuId,
  renamingProjectId,
  stats,
  uniqueGenres,
  isDemoActive,
  loadDemoProjects,
  clearDemoProjects,
  setSearchQuery,
  setStatusFilter,
  setGenreFilter,
  setSortBy,
  setViewMode,
  handleNewSeries,
  handleOpenProject,
  handleOpenSeries,
  handleOpenCreativeSuite,
  handleExport,
  handleRename,
  handleOpenDetails,
  handleCopyLink,
  handleDeleteSingle,
  handleBulkDelete,
  toggleSelection,
  toggleMenu,
  toggleSelectAll,
  clearSelection,
  saveProjectName,
}: ProjectsPageViewProps) {
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>(cachedProjectsAiSeriesList);
  const [loadingAiSeries, setLoadingAiSeries] = useState(cachedProjectsAiSeriesList.length === 0);

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

  const handleDeleteAiSeries = async (seriesId: string) => {
    if (!window.confirm("Are you sure you want to delete this AI Series?")) return;
    try {
      await aiSeriesApi.deleteSeries(seriesId);
      setAiSeriesList((prev) => prev.filter((s) => s.series_id !== seriesId));
    } catch (err) {
      console.error("Failed to delete AI Series:", err);
    }
  };

  const isAiTab = statusFilter.toLowerCase() === "ai series";

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
        (s) => (s.genre || "").toLowerCase() === genreFilter.toLowerCase()
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
      if (sortBy === "A-Z")
        return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [aiSeriesList, searchQuery, genreFilter, sortBy]);

  const combinedGenres = useMemo(() => {
    if (isAiTab) {
      const aiGenres = aiSeriesList
        .map((s) => s.genre)
        .filter(Boolean) as string[];
      return ["All", ...Array.from(new Set(aiGenres))];
    }
    return uniqueGenres;
  }, [isAiTab, aiSeriesList, uniqueGenres]);

  const hasContent = projectsLength > 0 || aiSeriesList.length > 0;

  const navigateTo = (path: string) => {
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav(path);
    else window.location.href = path;
  };

  return (
    <div className="w-full min-w-0 flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD MATCHING IMAGE 1 ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* 1. Header with Search and CTAs Matching Image 1 */}
        <div className="relative z-10">
          <ProjectsPageHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewSeries={handleNewSeries}
            stats={stats}
            onOpenScraper={() => navigateTo("/scraper")}
            onOpenAiStudio={() => navigateTo("/ai-series")}
            onLoadDemo={loadDemoProjects}
            isDemoActive={isDemoActive}
          />
        </div>

        {/* 2. Top Metric Statistics Cards Matching Image 1 */}
        {!loading && (
          <div className="relative z-10">
            <ProjectsStats
              stats={stats}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              showTabs={true}
              aiSeriesCount={aiSeriesList.length}
            />
          </div>
        )}



        {/* Filters and Controls Bar (Rendered when content exists or in AI tab or searching) */}
        {!loading && (hasContent || isDemoActive || isAiTab || Boolean(searchQuery)) && (
          <ProjectsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            genreFilter={genreFilter}
            onGenreChange={setGenreFilter}
            genres={combinedGenres}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isDemoActive={isDemoActive}
            onClearDemo={clearDemoProjects}
            totalCount={isAiTab ? filteredAiSeries.length : filteredSeries.length}
          />
        )}

        <div>
          {isAiTab ? (
            loadingAiSeries ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                <ProjectCardSkeleton count={6} />
              </div>
            ) : filteredAiSeries.length === 0 ? (
              <div className="border border-white/10 bg-[#141416] rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-purple-400 mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  No AI series found
                </h3>
                <p className="text-sm text-neutral-400 max-w-sm mb-6">
                  {searchQuery
                    ? `No AI series match "${searchQuery}".`
                    : "You haven't created any AI generated series yet. Construct your first series in the studio!"}
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo("/ai-series")}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Construct AI Series</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 stagger-container">
                {filteredAiSeries.map((s) => (
                  <AISeriesGridCard
                    key={s.series_id}
                    series={s}
                    onDelete={handleDeleteAiSeries}
                  />
                ))}
              </div>
            )
          ) : (
            <ProjectsPageResultView
              projectsLength={projectsLength}
              filteredProjects={filteredProjects}
              filteredSeries={filteredSeries}
              loading={loading}
              error={error}
              viewMode={viewMode}
              selectedProjects={selectedProjects}
              openMenuId={openMenuId}
              onToggleMenu={toggleMenu}
              toggleSelection={toggleSelection}
              toggleSelectAll={toggleSelectAll}
              onOpenSeries={handleOpenSeries}
              onOpenProject={handleOpenProject}
              onOpenCreativeSuite={handleOpenCreativeSuite}
              onOpenDetails={handleOpenDetails}
              onRename={handleRename}
              onExport={handleExport}
              onCopyLink={handleCopyLink}
              onDelete={handleDeleteSingle}
              renamingProjectId={renamingProjectId}
              onSaveRename={saveProjectName}
              clearSelection={clearSelection}
              onBulkDelete={handleBulkDelete}
              onLoadDemo={loadDemoProjects}
              onOpenScraper={() => navigateTo("/scraper")}
              onOpenAiStudio={() => navigateTo("/ai-series")}
              onClearFilters={() => {
                setSearchQuery("");
                setGenreFilter("All");
                setStatusFilter("All");
              }}
            />
          )}
        </div>

        {/* Studio Creation Suite (6 Interactive Modules Launchpad) - Placed at the bottom */}
        <div className="relative z-10 pt-4 border-t border-[#2F2F2F]/60">
          <ProjectsQuickLauncher
            onOpenScraper={() => navigateTo("/scraper")}
            onOpenAiStudio={() => navigateTo("/ai-series")}
          />
        </div>
      </div>
    </div>
  );
}
