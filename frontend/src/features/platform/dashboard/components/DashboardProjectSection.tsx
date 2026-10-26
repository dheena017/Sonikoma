import React, { useCallback } from "react";
import { Film, Activity, Sparkles, Folder } from "lucide-react";
import ProjectCard from "@/features/platform/projects/components/ProjectCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import type { Project, AISeriesProject } from "../types";
import AISeriesGridCard from "@/features/intelligence/series/components/AISeriesGridCard";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

interface DashboardProjectSectionProps {
  themeMode: string;
  loading: boolean;
  error: string | null;
  projects: Project[];
  hasProjects: boolean;
  searchQuery: string;
  activeTab: "normal" | "ai";
  setActiveTab: (tab: "normal" | "ai") => void;
  aiSeriesList: AISeriesProject[];
  filteredAiSeries: AISeriesProject[];
  loadingAiSeries: boolean;
  openMenuId: string | null;
  renamingProjectId: string | null;
  onRetry: () => void;
  onNewSeries: () => void;
  onOpenProject: (project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onOpenCreativeSuite?: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
  onDeleteAiSeries: (seriesId: string) => void;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  onSaveRename: (projectId: string, newName: string) => void;
}

export default function DashboardProjectSection({
  loading,
  error,
  projects,
  hasProjects,
  searchQuery,
  activeTab,
  setActiveTab,
  filteredAiSeries,
  loadingAiSeries,
  openMenuId,
  renamingProjectId,
  onRetry,
  onNewSeries,
  onOpenProject,
  onRename,
  onExport,
  onOpenCreativeSuite,
  onDelete,
  onDeleteAiSeries,
  onToggleMenu,
  onSaveRename,
}: DashboardProjectSectionProps) {
  // Copy project workspace link to clipboard
  const handleCopyLink = useCallback((e: React.MouseEvent, projectItem: Project) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/workspace?id=${projectItem.project_id}`;
      navigator.clipboard.writeText(link);
    }
  }, []);

  /* ─────────────────────────────────────────────────────────────
   * 1. AI Series Tab Content
   * ───────────────────────────────────────────────────────────── */
  const renderAiSeriesContent = () => {
    if (loadingAiSeries) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          <ProjectCardSkeleton count={3} />
        </div>
      );
    }

    if (filteredAiSeries.length === 0) {
      return (
        <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-amber-400 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No AI series yet</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            {searchQuery
              ? `No AI series match "${searchQuery}".`
              : "You haven't generated any AI series yet. Launch the AI Studio to construct one!"}
          </p>
          <button
            onClick={() => navigateToDashboardPath("/scraper")}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Construct AI Series</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {filteredAiSeries.slice(0, 6).map((series) => (
          <AISeriesGridCard
            key={series.series_id}
            series={series}
            onDelete={onDeleteAiSeries}
          />
        ))}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────
   * 2. Normal Projects Tab Content
   * ───────────────────────────────────────────────────────────── */
  const renderProjectsContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCardSkeleton count={3} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Failed to load projects</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">{error}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
            <Film className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {hasProjects ? "No matching projects" : "No series yet"}
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            {hasProjects
              ? `No projects found matching "${searchQuery}".`
              : "You haven't created any storyboard series yet. Start by scraping a webtoon URL!"}
          </p>
          <button
            onClick={onNewSeries}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
          >
            Start New Chapter
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {projects.slice(0, 6).map((project) => (
          <ProjectCard
            key={project.project_id}
            project={project}
            onOpenProject={onOpenProject}
            onRename={(e, projectItem) => onRename(e, projectItem)}
            onExport={(e, projectItem) => onExport(e, projectItem)}
            onOpenCreativeSuite={onOpenCreativeSuite}
            onCopyLink={(e, projectItem) => handleCopyLink(e, projectItem)}
            onDelete={(e, projectId) => onDelete(e, projectId)}
            openMenuId={openMenuId}
            onToggleMenu={(e, projectId) => onToggleMenu(e, projectId)}
            renamingProjectId={renamingProjectId}
            onSaveRename={onSaveRename}
          />
        ))}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────
   * 3. Main Return
   * ───────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Tab Switcher & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="h-5 w-5 text-neutral-400" />
            Recent Series
          </h2>

          {/* 2 Tabs: Normal Projects & AI Series */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 gap-1 ml-0 sm:ml-2">
            <button
              type="button"
              onClick={() => setActiveTab("normal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "normal"
                  ? "bg-[#3B82F6] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Normal Projects</span>
              {!loading && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === "normal"
                      ? "bg-white/20 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {projects.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "bg-[#3B82F6] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Series Projects</span>
              {!loadingAiSeries && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === "ai"
                      ? "bg-white/20 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {filteredAiSeries.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clean Tab Content Render */}
      {activeTab === "ai" ? renderAiSeriesContent() : renderProjectsContent()}
    </div>
  );
}
