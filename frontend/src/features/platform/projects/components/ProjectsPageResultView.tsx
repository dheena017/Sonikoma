import React, { useState } from "react";
import {
  FolderOpen,
  Loader2,
  Search,
  Activity,
  Globe,
  Sparkles,
  Play,
  Scissors,
  Film,
  ArrowRight,
  Layers,
  Trash2,
} from "lucide-react";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import ProjectsTableSkeleton from "@/features/platform/projects/components/ProjectsTableSkeleton";
import type { Project, Series } from "@/features/platform/projects/types";
import SeriesCard from "@/features/platform/projects/components/SeriesCard";
import ProjectsTable from "@/features/platform/projects/components/ProjectsTable";

interface ProjectsPageResultViewProps {
  projectsLength: number;
  filteredProjects: Project[];
  filteredSeries: Series[];
  loading: boolean;
  error: string | null;
  viewMode: "grid" | "list";
  selectedProjects: Set<string>;
  openMenuId: string | null;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  onOpenSeries: (series: Series) => void;
  onOpenProject?: (project: Project) => void;
  onOpenCreativeSuite: (e: React.MouseEvent, project: Project) => void;
  onOpenDetails: (e: React.MouseEvent, project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onCopyLink: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId: string | null;
  onSaveRename: (projectId: string, newName: string) => Promise<void>;
  clearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onOpenScraper?: () => void;
  onOpenAiStudio?: () => void;
  onClearFilters?: () => void;
}

export default function ProjectsPageResultView({
  projectsLength,
  filteredProjects,
  filteredSeries,
  loading,
  error,
  viewMode,
  selectedProjects,
  openMenuId,
  onToggleMenu,
  toggleSelection,
  toggleSelectAll,
  onOpenSeries,
  onOpenProject,
  onOpenCreativeSuite,
  onOpenDetails,
  onRename,
  onExport,
  onCopyLink,
  onDelete,
  renamingProjectId,
  onSaveRename,
  clearSelection,
  onBulkDelete,
  onOpenScraper,
  onOpenAiStudio,
  onClearFilters,
}: ProjectsPageResultViewProps) {
  const [quickUrl, setQuickUrl] = useState("");

  const handleLaunchScraper = (urlToScrape?: string) => {
    const target = urlToScrape
      ? `/scraper?url=${encodeURIComponent(urlToScrape.trim())}`
      : "/scraper";
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav(target);
    else window.location.href = target;
  };

  const handleLaunchAiStudio = () => {
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav("/ai-series");
    else window.location.href = "/ai-series";
  };

  if (loading) {
    return viewMode === "list" ? (
      <ProjectsTableSkeleton rows={6} columns={5} />
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ProjectCardSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
        <div className="w-14 h-14 rounded-2xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <Activity className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Failed to load projects
        </h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (projectsLength === 0) {
    return (
      <div className="w-full space-y-8 text-left">
        {/* Getting Started Guide Matching Image 1 */}
        <div className="rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-5 sm:p-6 shadow-md transition-all text-left">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-[#E5E5E5] tracking-tight">
                    Getting Started: Produce Your First Anime Video
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF] font-mono text-[10px] font-bold">
                    0 of 4 Completed
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
                  Follow these 4 simple steps to turn static manga into a cinematic animated reel.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 relative z-10">
            <div className="w-full bg-[#121212] rounded-full h-1.5 overflow-hidden border border-[#2F2F2F]">
              <div
                className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
                style={{ width: "25%" }}
              />
            </div>
          </div>

          {/* 4 Interactive Step Cards Matching Image 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
            {/* Step 1: Ingest URL */}
            <div
              onClick={() => handleLaunchScraper(quickUrl)}
              className="p-3.5 rounded-xl bg-[#141414] border border-[#282828] hover:border-blue-500/40 hover:bg-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-white/5 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-blue-400 transition-colors">
                    Pending
                  </span>
                </div>

                <h4 className="text-xs font-bold mb-1 text-[#E5E5E5] group-hover:text-white">
                  1. Scrape or Import Manga Strips
                </h4>

                <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed mb-3">
                  Paste a Webtoon URL, MangaDex link, or upload local images to extract panels.
                </p>

                {/* Quick URL Ingest input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLaunchScraper(quickUrl);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mb-2"
                >
                  <input
                    type="url"
                    placeholder="Paste URL..."
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className="w-full h-7 rounded-lg border border-white/[0.08] bg-[#18181E] px-2 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-neutral-600"
                  />
                </form>
              </div>

              <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#6B7280]">Step 01</span>
                <span className="text-[#3B82F6] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Open Scraper <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Step 2: Detect Gutters */}
            <div
              onClick={() => {
                const nav = (window as any).navigateTo;
                if (typeof nav === "function") nav("/image-editor");
                else window.location.href = "/image-editor";
              }}
              className="p-3.5 rounded-xl bg-[#141414] border border-[#282828] hover:border-emerald-500/40 hover:bg-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-white/5 shrink-0">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-emerald-400 transition-colors">
                    Pending
                  </span>
                </div>

                <h4 className="text-xs font-bold mb-1 text-[#E5E5E5] group-hover:text-white">
                  2. Detect Gutters &amp; Inpaint Bubbles
                </h4>

                <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                  Let computer vision segment frames and erase speech bubbles automatically.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#6B7280]">Step 02</span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Open Slicer <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Step 3: Voice Studio */}
            <div
              onClick={() => {
                const nav = (window as any).navigateTo;
                if (typeof nav === "function") nav("/characters");
                else window.location.href = "/characters";
              }}
              className="p-3.5 rounded-xl bg-[#141414] border border-[#282828] hover:border-amber-500/40 hover:bg-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-white/5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-amber-400 transition-colors">
                    Pending
                  </span>
                </div>

                <h4 className="text-xs font-bold mb-1 text-[#E5E5E5] group-hover:text-white">
                  3. Autonomous AI Series Studio
                </h4>

                <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                  Generate episodic comic series and narrative scripts with generative AI.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#6B7280]">Step 03</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  AI Studio <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Step 4: 2.5D Motion Reel */}
            <div
              onClick={() => {
                const nav = (window as any).navigateTo;
                if (typeof nav === "function") nav("/video-editor");
                else window.location.href = "/video-editor";
              }}
              className="p-3.5 rounded-xl bg-[#141414] border border-[#282828] hover:border-purple-500/40 hover:bg-[#1A1A1A] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-white/5 shrink-0">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-purple-400 transition-colors">
                    Pending
                  </span>
                </div>

                <h4 className="text-xs font-bold mb-1 text-[#E5E5E5] group-hover:text-white">
                  4. Composite 2.5D Motion Reel
                </h4>

                <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                  Keyframe camera zooms, add layered parallax anime motion, and export MP4 video.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#6B7280]">Step 04</span>
                <span className="text-purple-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Video Editor <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  if (filteredSeries.length === 0) {
    return (
      <div className="border border-white/10 bg-[#141416] rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
        <div className="w-14 h-14 mx-auto bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center text-neutral-500 mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No series found</h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          No projects matched your current search query or filter tags.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters &amp; Search
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 stagger-container">
          {filteredSeries.map((series) => {
            const isSelected = selectedProjects.has(series.id);
            return (
              <SeriesCard
                key={series.id}
                series={series}
                onOpenSeries={onOpenSeries}
                onOpenCreativeSuite={(e, seriesItem) =>
                  seriesItem.latestChapter
                    ? onOpenCreativeSuite(e, seriesItem.latestChapter)
                    : null
                }
                onRename={(e, seriesItem) =>
                  seriesItem.latestChapter
                    ? onRename(e, seriesItem.latestChapter)
                    : null
                }
                onExport={(e, seriesItem) =>
                  seriesItem.latestChapter
                    ? onExport(e, seriesItem.latestChapter)
                    : null
                }
                onOpenDetails={(e, seriesItem) =>
                  seriesItem.latestChapter
                    ? onOpenDetails(e, seriesItem.latestChapter)
                    : null
                }
                onDelete={(e, seriesId) => onDelete(e, seriesId)}
                onCopyLink={(e, seriesItem) =>
                  seriesItem.latestChapter
                    ? onCopyLink(e, seriesItem.latestChapter)
                    : null
                }
                isSelected={isSelected}
                onToggleSelect={(e, seriesId) => toggleSelection(e, seriesId)}
                showSelection
                openMenuId={openMenuId}
                onToggleMenu={(e, seriesId) => onToggleMenu(e, seriesId)}
                renamingProjectId={renamingProjectId}
                onSaveRename={(seriesId, newName) =>
                  onSaveRename(seriesId, newName)
                }
              />
            );
          })}
        </div>
      ) : (
        <ProjectsTable
          projects={filteredProjects}
          selectedProjects={selectedProjects}
          openMenuId={openMenuId}
          onToggleMenu={onToggleMenu}
          toggleSelectAll={toggleSelectAll}
          toggleSelection={toggleSelection}
          onOpenProject={(p) => {
            if (onOpenProject) {
              onOpenProject(p);
            } else {
              const series = filteredSeries.find((s) =>
                s.chapters.some((c) => c.project_id === p.project_id)
              );
              if (series) onOpenSeries(series);
            }
          }}
          onOpenDetails={onOpenDetails}
          onRename={onRename}
          onExport={onExport}
          onCopyLink={onCopyLink}
          onDelete={onDelete}
        />
      )}

      {selectedProjects.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 z-50 animate-fade-in">
          <div className="max-w-4xl mx-auto bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-[#141414] text-[#3B82F6] border border-[#2F2F2F] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono">
                {selectedProjects.size}
              </div>
              <div className="text-[#E5E5E5] text-sm font-medium">projects selected</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearSelection}
                className="px-4 py-2 text-xs font-mono font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={onBulkDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
