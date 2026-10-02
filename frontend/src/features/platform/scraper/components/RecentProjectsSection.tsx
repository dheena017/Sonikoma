import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  Search,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpenCheck,
  Plus,
  Sparkles,
  Folder,
  Tv,
  Swords,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import ProjectCard from "@/features/platform/projects/components/ProjectCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import type { Project } from "@/features/platform/projects/hooks/ProjectTypes";
import { aiSeriesApi, AISeriesProject } from "@/features/intelligence/series/api/aiSeries";

interface StoredProject {
  imported_assets_count: number;
  project_id: string;
  url?: string;
  series_slug?: string | null;
  chapter_slug?: string | null;
  title?: string;
  genre?: string;
  author?: string;
  cover_image?: string;
  episode?: string;
  status?: string;
  panels_count?: number;
  created_at?: string;
  updated_at?: string;
  video_url?: string | null;
  synopsis?: string | null;
}

interface RecentProjectsSectionProps {
  recentProjects: StoredProject[];
  loadingProjects: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showAll: boolean;
  setShowAll: (value: boolean | ((current: boolean) => boolean)) => void;
  filteredProjects: StoredProject[];
  displayedProjects: StoredProject[];
  fetchProjects: () => Promise<void> | void;
  navigateTo?: (path: string) => void;
  handleOpenProject: (project: Project) => void;
  handleRenameProject: (e: React.MouseEvent, project: Project) => void;
  handleDeleteProject: (e: React.MouseEvent, projectId: string) => void;
  handleExportProject: (e: React.MouseEvent, project: Project) => void;
  handleCopyLink: (e: React.MouseEvent, project: Project) => void;
  openMenuId: string | null;
  handleToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId: string | null;
  onSaveRename: (projectId: string, newName: string) => Promise<void>;
}

const RecentProjectsSection: React.FC<RecentProjectsSectionProps> = ({
  recentProjects,
  loadingProjects,
  searchQuery,
  setSearchQuery,
  showAll,
  setShowAll,
  filteredProjects,
  displayedProjects,
  fetchProjects,
  navigateTo,
  handleOpenProject,
  handleRenameProject,
  handleDeleteProject,
  handleExportProject,
  handleCopyLink,
  openMenuId,
  handleToggleMenu,
  renamingProjectId,
  onSaveRename,
}) => {
  const [activeTab, setActiveTab] = useState<"normal" | "ai">("normal");
  const [aiSeriesList, setAiSeriesList] = useState<AISeriesProject[]>([]);
  const [loadingAiSeries, setLoadingAiSeries] = useState<boolean>(false);
  const [showAllAi, setShowAllAi] = useState<boolean>(false);

  const fetchAiSeries = useCallback(async () => {
    try {
      setLoadingAiSeries(true);
      const list = await aiSeriesApi.listSeries();
      setAiSeriesList(list || []);
    } catch (e) {
      console.warn("Failed to fetch AI series for recent projects:", e);
    } finally {
      setLoadingAiSeries(false);
    }
  }, []);

  useEffect(() => {
    fetchAiSeries();
  }, [fetchAiSeries]);

  const handleRefresh = () => {
    if (activeTab === "normal") {
      fetchProjects();
    } else {
      fetchAiSeries();
    }
  };

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

  const displayedAiSeries = showAllAi
    ? filteredAiSeries
    : filteredAiSeries.slice(0, 6);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#2A2A2A] flex items-center justify-center border border-[#3B82F6]/30">
              <History className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Recent Projects
            </h3>
          </div>

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
              {!loadingProjects && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === "normal"
                      ? "bg-white/20 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {filteredProjects.length}
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder={activeTab === "normal" ? "Search projects..." : "Search AI series..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAll(false);
                setShowAllAi(false);
              }}
              className="pl-8 pr-3 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 w-44 transition-colors"
            />
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh projects"
            className="p-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-[#3B82F6]/10 transition-all cursor-pointer text-neutral-500 hover:text-[#60A5FA]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${(activeTab === "normal" ? loadingProjects : loadingAiSeries) ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigateTo?.(activeTab === "normal" ? "/projects" : "/ai-series")}
            className="text-xs font-bold text-[#3B82F6] hover:text-[#93C5FD] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {activeTab === "ai" ? (
        loadingAiSeries ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProjectCardSkeleton count={3} />
          </div>
        ) : filteredAiSeries.length === 0 ? (
          <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
            {searchQuery ? (
              <>
                <Search className="h-8 w-8 text-neutral-700" />
                <p className="text-sm font-bold text-neutral-400">
                  No AI series match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#3B82F6] hover:text-[#93C5FD] font-bold cursor-pointer"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Sparkles className="h-8 w-8 text-neutral-700" />
                <p className="text-sm font-bold text-neutral-400">
                  No AI series created yet
                </p>
                <p className="text-xs text-neutral-600 max-w-sm leading-relaxed">
                  Use the AI Series Constructor above to generate your first Manhwa, Manga, or Anime series with turbo script and diffusion art.
                </p>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5 text-white" /> Construct AI Series
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {displayedAiSeries.map((s) => {
                const fmt = (s.format_type || "manhwa").toLowerCase();
                const studioUrl = `/ai-series/${s.series_id}?format=${fmt}`;
                const isAnime = fmt === "anime";
                const isManga = fmt === "comic_manga";
                const Icon = isAnime ? Tv : isManga ? Swords : BookOpen;
                const chapterCount =
                  s.sessions?.[0]?.chapters?.length || s.chapters_per_session || 8;

                return (
                  <div
                    key={s.series_id}
                    onClick={() => navigateTo?.(studioUrl)}
                    className="p-5 rounded-2xl bg-[#121217] hover:bg-[#181D2A] border border-[#282834] hover:border-[#3B82F6]/60 transition-all duration-200 cursor-pointer space-y-4 group shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-[#60A5FA] capitalize flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-[#3B82F6]" />
                          {fmt.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono font-bold bg-[#181820] px-2.5 py-0.5 rounded-full border border-[#282834]">
                          {chapterCount} Chapters
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-[#E5E5E5] group-hover:text-[#60A5FA] transition-colors line-clamp-1">
                          {s.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                          <span>{s.genre || "Action Fantasy"}</span>
                          <span>•</span>
                          <span className="capitalize">{s.art_style?.replace(/_/g, " ") || "2D Cel"}</span>
                        </div>
                      </div>

                      {s.logline && (
                        <p className="text-xs text-neutral-400 line-clamp-2 font-sans leading-relaxed">
                          {s.logline}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#282834] flex items-center justify-between text-xs font-mono text-neutral-400 group-hover:text-white transition-colors">
                      <span className="text-[11px] font-bold text-[#3B82F6]">Launch Editor Studio</span>
                      <ExternalLink className="w-4 h-4 text-[#3B82F6] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAiSeries.length > 6 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAllAi((v) => !v)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-[#3B82F6]/5 rounded-xl text-xs font-bold text-neutral-400 hover:text-[#93C5FD] transition-all cursor-pointer"
                >
                  {showAllAi ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Show{" "}
                      {filteredAiSeries.length - 6} More AI Series
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )
      ) : loadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProjectCardSkeleton count={3} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          {searchQuery ? (
            <>
              <Search className="h-8 w-8 text-neutral-700" />
              <p className="text-sm font-bold text-neutral-400">
                No projects match "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#3B82F6] hover:text-[#93C5FD] font-bold cursor-pointer"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <BookOpenCheck className="h-8 w-8 text-neutral-700" />
              <p className="text-sm font-bold text-neutral-400">
                No projects yet
              </p>
              <p className="text-xs text-neutral-600 max-w-xs">
                Scrape a URL above or click Video Studio to create your first
                webtoon project.
              </p>
              <button
                onClick={() => {
                  const tempId = `temp_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 10)}`;
                  navigateTo?.(`/scraper/editor?id=${tempId}`);
                }}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 text-white" /> New Project
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {displayedProjects.map((project) => {
              const projectCardItem: Project = {
                project_id: project.project_id,
                title: project.title || "Untitled Series",
                url: project.url || "",
                created_at: project.created_at || "",
                status: project.status || "ready",
                panels_count: project.panels_count ?? 0,
                imported_assets_count: project.imported_assets_count,
                series_slug: project.series_slug || undefined,
                chapter_slug: project.chapter_slug || undefined,
                genre: project.genre || undefined,
                author: project.author || undefined,
                cover_image: project.cover_image || undefined,
                synopsis: project.synopsis || undefined,
                episode: project.episode || undefined,
              };
              return (
                <ProjectCard
                  key={project.project_id}
                  project={projectCardItem}
                  onOpenProject={handleOpenProject}
                  onRename={handleRenameProject}
                  onDelete={handleDeleteProject}
                  onExport={handleExportProject}
                  onCopyLink={handleCopyLink}
                  openMenuId={openMenuId}
                  onToggleMenu={handleToggleMenu}
                  renamingProjectId={renamingProjectId}
                  onSaveRename={onSaveRename}
                />
              );
            })}
          </div>
          {filteredProjects.length > 6 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-2 px-5 py-2.5 border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-[#3B82F6]/5 rounded-xl text-xs font-bold text-neutral-400 hover:text-[#93C5FD] transition-all cursor-pointer"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Show{" "}
                    {filteredProjects.length - 6} More Projects
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentProjectsSection;
