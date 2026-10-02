import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Film, Activity, ExternalLink, Sparkles, Folder } from "lucide-react";
import { getSourceIcon } from "@/shared/utils";
import ProjectCard from "@/features/platform/projects/components/ProjectCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import type { Project } from "@/features/platform/projects/hooks/ProjectTypes";
import { aiSeriesApi, type AISeriesProject } from "@/features/intelligence/series/api/aiSeries";
import AISeriesGridCard from "@/features/intelligence/series/components/AISeriesGridCard";

interface DashboardProjectSectionProps {
  themeMode: string;
  loading: boolean;
  error: string | null;
  projects: Project[];
  searchQuery: string;
  filteredProjects: Project[];
  openMenuId: string | null;
  renamingProjectId: string | null;
  onRetry: () => void;
  onNewSeries: () => void;
  onOpenProject: (project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onOpenCreativeSuite?: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  onSaveRename: (projectId: string, newName: string) => void;
}

export default function DashboardProjectSection({
  themeMode,
  loading,
  error,
  projects,
  searchQuery,
  filteredProjects,
  openMenuId,
  renamingProjectId,
  onRetry,
  onNewSeries,
  onOpenProject,
  onRename,
  onExport,
  onOpenCreativeSuite,
  onDelete,
  onToggleMenu,
  onSaveRename,
}: DashboardProjectSectionProps) {
  const [activeTab, setActiveTab] = useState<"normal" | "ai">("normal");
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>([]);
  const [loadingAiSeries, setLoadingAiSeries] = useState(false);

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

  const projectList = searchQuery ? filteredProjects : projects;

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="h-5 w-5 text-neutral-400" />
            Recent Series
          </h2>

          {/* ── 2 TABS: NORMAL PROJECTS & AI SERIES ── */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 gap-1 ml-0 sm:ml-2">
            <button
              type="button"
              onClick={() => setActiveTab("normal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "normal"
                  ? "bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]"
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
                  {projectList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]"
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

      {activeTab === "ai" ? (
        loadingAiSeries ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            <ProjectCardSkeleton count={3} />
          </div>
        ) : filteredAiSeries.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredAiSeries.slice(0, 6).map((series) => (
              <AISeriesGridCard
                key={series.series_id}
                series={series}
                onDelete={handleDeleteAiSeries}
              />
            ))}
          </div>
        )
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCardSkeleton count={3} />
        </div>
      ) : error ? (
        <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Failed to load projects
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
            <Film className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No series yet</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            You haven't created any storyboard series yet. Start by scraping a
            webtoon URL!
          </p>
          <button
            onClick={onNewSeries}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
          >
            Start New Chapter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {projectList.slice(0, 6).map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onOpenProject={onOpenProject}
              onRename={(e, projectItem) => onRename(e, projectItem)}
              onExport={(e, projectItem) => onExport(e, projectItem)}
              onOpenCreativeSuite={onOpenCreativeSuite}
              onCopyLink={(e, projectItem) => {
                e.stopPropagation();
                const link = `${window.location.origin}/workspace?id=${projectItem.project_id}`;
                navigator.clipboard.writeText(link);
              }}
              onDelete={(e, projectId) => onDelete(e, projectId)}
              openMenuId={openMenuId}
              onToggleMenu={(e, projectId) => onToggleMenu(e, projectId)}
              renamingProjectId={renamingProjectId}
              onSaveRename={onSaveRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
