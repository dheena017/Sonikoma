import React from "react";
import { LogOut, Play, Tv, Film, Sparkles } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface CreativeSuiteDashboardActiveProjectProps {
  activeProject: any | null;
  panels?: any[];
  activePanelsCount: number;
  exitActiveProject: () => void;
  navigateTo: (path: string) => void;
}

const CreativeSuiteDashboardActiveProject: React.FC<
  CreativeSuiteDashboardActiveProjectProps
> = ({
  activeProject,
  panels = [],
  activePanelsCount,
  exitActiveProject,
  navigateTo,
}) => {
  const projectIdVal = activeProject?.project_id ?? null;
  const projectStatus = activeProject?.status
    ? activeProject.status.toString()
    : "Draft";
  const projectStatusClass = projectStatus.toLowerCase().includes("publish")
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
    : "bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#60A5FA]";
  const seriesTitleVal = activeProject?.title ?? "Untitled Series";
  const seriesCoverImageVal = activeProject?.cover_image ?? null;
  const chapterTitleVal = activeProject?.episode
    ? activeProject.episode.split(" - ").slice(1).join(" - ") ||
      "Untitled Chapter"
    : "Untitled Chapter";
  const projectIdLabel = projectIdVal ? `${projectIdVal.slice(0, 7)}…` : "—";
  const authorLabel = activeProject?.author || "Unknown Creator";
  const genreLabel = activeProject?.genre || "No genre";
  const synopsisText =
    activeProject?.synopsis ||
    activeProject?.description ||
    "No synopsis is available for this project yet.";

  const safePanels = panels || [];

  return (
    <div className="relative bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 shadow-md hover:border-[#3B82F6]/40 transition-all duration-200 text-left overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#3B82F6] to-[#3B82F6] opacity-90" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Tv className="w-4 h-4" /> Active Timeline
          </h3>
          <span className="text-[10px] font-mono font-bold bg-[#3B82F6] text-white px-2.5 py-1 rounded-full shadow-sm">
            Active
          </span>
        </div>

        {projectIdVal ? (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              {seriesCoverImageVal ? (
                <div className="w-16 h-20 rounded-xl overflow-hidden border border-neutral-800 shadow-inner">
                  <img
                    src={seriesCoverImageVal}
                    className="w-full h-full object-cover"
                    alt={seriesTitleVal}
                  />
                </div>
              ) : (
                <div className="w-16 h-20 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 text-xs font-bold font-mono">
                  Cover
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="text-base font-extrabold text-white truncate">
                    {seriesTitleVal}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${projectStatusClass}`}
                  >
                    {projectStatus}
                  </span>
                </div>

                <p className="text-xs text-[#60A5FA] truncate mt-0.5 font-mono">
                  {chapterTitleVal}
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="text-[#60A5FA] font-bold">
                      {activePanelsCount}
                    </span>
                    <span className="text-neutral-400">panels</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="text-[#60A5FA] font-bold">
                      {authorLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-2xl">
                <div className="text-[9px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                  Genre
                </div>
                <div className="text-[11px] font-bold text-white">
                  {genreLabel}
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-2xl">
                <div className="text-[9px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                  Project ID
                </div>
                <div className="text-[11px] font-bold text-white">
                  {projectIdLabel}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-neutral-950 border border-neutral-850 p-3 text-[11px] text-neutral-300 leading-relaxed min-h-[72px]">
              {synopsisText}
            </div>

            {/* ACTIVE TIMELINE PANELS FILMSTRIP */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#60A5FA] uppercase tracking-widest flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#3B82F6]" /> Active Panel
                  Frames ({safePanels.length})
                </span>
                {safePanels.length > 0 && (
                  <span className="text-[9px] font-mono text-neutral-400">
                    Scroll →
                  </span>
                )}
              </div>

              {safePanels.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                  {safePanels.map((p, idx) => {
                    const imgUrl =
                      p?.image_url ||
                      p?.url ||
                      p?.src ||
                      p?.image ||
                      p?.image_path ||
                      null;
                    return (
                      <div
                        key={p?.id || idx}
                        onClick={() => {
                          const seriesSlug =
                            activeProject?.series_slug ||
                            localStorage.getItem("active_series_slug") ||
                            "active";
                          const chapterSlug =
                            activeProject?.chapter_slug ||
                            localStorage.getItem("active_chapter_slug") ||
                            "active";
                          navigateTo(
                            `/scraper/editor/series/${seriesSlug}/chapters/${chapterSlug}?panel=${
                              idx + 1
                            }`
                          );
                        }}
                        className="relative flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-neutral-850 bg-neutral-950 hover:border-[#3B82F6]/60 transition-all cursor-pointer group shadow-md"
                        title={`Panel #${idx + 1}: ${
                          p?.speech_text || p?.visual_description || "Frame"
                        }`}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={`Frame ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-neutral-950 text-neutral-500">
                            <Sparkles className="w-4 h-4 text-[#3B82F6]/50 mb-1" />
                            <span className="text-[9px] font-mono">
                              Frame #{idx + 1}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-[#60A5FA] border border-[#3B82F6]/20 shadow-sm">
                          #{idx + 1}
                        </div>
                        {p?.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/85 px-1 py-0.5 rounded text-[7px] font-mono text-neutral-300 border border-neutral-800">
                            {p.duration}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-center">
                  <p className="text-[11px] text-neutral-400 font-mono">
                    No storyboard panels found in active timeline.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Tooltip text="Resume video editor for this active chapter" placement="top">
                <button
                  onClick={() => {
                    const seriesSlug =
                      activeProject?.series_slug ||
                      localStorage.getItem("active_series_slug") ||
                      "active";
                    const chapterSlug =
                      activeProject?.chapter_slug ||
                      localStorage.getItem("active_chapter_slug") ||
                      "active";
                    navigateTo(
                      `/scraper/editor/series/${seriesSlug}/chapters/${chapterSlug}`
                    );
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-black/50 cursor-pointer"
                  aria-label="Resume Editing"
                >
                  <Play className="w-4 h-4 fill-white" />{" "}
                  <span>Resume Editing</span>
                </button>
              </Tooltip>

              <Tooltip text="Unload current project and return to clean workspace" placement="bottom">
                <button
                  onClick={exitActiveProject}
                  className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-rose-400 hover:bg-rose-500/10 text-rose-300 text-xs font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  aria-label="Exit Active Project"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Active Project</span>
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center mx-auto text-neutral-500 mb-3">
              📁
            </div>
            <p className="text-xs text-neutral-400 font-mono leading-normal">
              No active project is selected. Choose a project from the Projects
              page to unlock full Creative features.
            </p>
            <Tooltip text="Go to projects catalog" placement="bottom">
              <button
                onClick={() => navigateTo("/projects")}
                className="mt-4 px-4 py-2 border border-[#3B82F6]/30 bg-[#3B82F6]/10 rounded-xl text-[10px] font-mono font-bold text-[#60A5FA] hover:bg-[#3B82F6]/20 transition-all active:scale-95 cursor-pointer"
                aria-label="Choose Project"
              >
                Choose Project
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardActiveProject;
