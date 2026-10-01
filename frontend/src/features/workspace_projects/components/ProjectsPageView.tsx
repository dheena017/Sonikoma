import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FolderOpen, Layers, Zap, Clock, ArrowRight, Sparkles } from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import ProjectsPageHeader from "@/features/workspace_projects/components/ProjectsPageHeader";
import ProjectsFilters from "@/features/workspace_projects/components/ProjectsFilters";
import ProjectsStats from "@/features/workspace_projects/components/ProjectsStats";
import ProjectsPageResultView from "@/features/workspace_projects/components/ProjectsPageResultView";
import AISeriesGridCard from "@/features/ai_generated_series/components/AISeriesGridCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import { aiSeriesApi, type AISeriesProject } from "@/api/endpoints/aiSeries";
import type {
  Project,
  ViewMode,
} from "@/features/workspace_projects/hooks/ProjectTypes";
import type { Series } from "@/features/workspace_projects/utils/seriesGrouping";

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
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>([]);
  const [loadingAiSeries, setLoadingAiSeries] = useState(false);

  const fetchAiSeries = useCallback(async () => {
    try {
      setLoadingAiSeries(true);
      const list = await aiSeriesApi.listSeries();
      setAiSeriesList(list || []);
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

  return (
    <div className="w-full min-w-0 flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-6 sm:py-8 max-w-7xl mx-auto">
      <section className="w-full space-y-7 text-left" aria-label="Projects and series">
        <ProjectsPageHeader onNewSeries={handleNewSeries} stats={stats} />

        {!loading && hasContent && (
          <ProjectsStats
            stats={stats}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            showTabs={true}
            aiSeriesCount={aiSeriesList.length}
          />
        )}

        {!loading && hasContent && (
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
          />
        )}

        <div>
          {isAiTab ? (
            loadingAiSeries ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                <ProjectCardSkeleton count={6} />
              </div>
            ) : filteredAiSeries.length === 0 ? (
              <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-6">
                <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-amber-400 mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  No AI series found
                </h3>
                <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
                  {searchQuery
                    ? `No AI series match "${searchQuery}".`
                    : "You haven't created any AI generated series yet. Construct your first series in the studio!"}
                </p>
                <button
                  onClick={() => {
                    const nav = (window as any).navigateTo;
                    if (typeof nav === "function") {
                      nav("/scraper");
                    } else {
                      window.location.href = "/scraper";
                    }
                  }}
                  className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
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
            />
          )}
        </div>
      </section>
    </div>
  );
}
