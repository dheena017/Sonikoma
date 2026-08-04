import React from "react";
import { LogOut, Play, Tv } from "lucide-react";

interface CreativeSuiteDashboardActiveProjectProps {
  activeProject: any | null;
  activePanelsCount: number;
  exitActiveProject: () => void;
  navigateTo: (path: string) => void;
}

const CreativeSuiteDashboardActiveProject: React.FC<CreativeSuiteDashboardActiveProjectProps> = ({
  activeProject,
  activePanelsCount,
  exitActiveProject,
  navigateTo,
}) => {
  const projectIdVal = activeProject?.project_id ?? null;
  const projectStatus = activeProject?.status ? activeProject.status.toString() : "Draft";
  const projectStatusClass = projectStatus.toLowerCase().includes("publish")
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
    : "bg-purple-500/10 border-purple-500/20 text-purple-300";
  const seriesTitleVal = activeProject?.title ?? "Untitled Series";
  const seriesCoverImageVal = activeProject?.cover_image ?? null;
  const chapterTitleVal = activeProject?.episode ? (activeProject.episode.split(" - ").slice(1).join(" - ") || "Untitled Chapter") : "Untitled Chapter";
  const projectIdLabel = projectIdVal ? `${projectIdVal.slice(0, 7)}…` : "—";
  const authorLabel = activeProject?.author || "Unknown Creator";
  const genreLabel = activeProject?.genre || "No genre";
  const synopsisText =
    activeProject?.synopsis ||
    activeProject?.description ||
    "No synopsis is available for this project yet.";

  return (
    <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Tv className="w-4 h-4" /> Active Timeline
          </h3>
          <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-1 rounded-full shadow-sm">
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
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${projectStatusClass}`}>
                    {projectStatus}
                  </span>
                </div>

                <p className="text-xs text-purple-300 truncate mt-0.5 font-mono">
                  {chapterTitleVal}
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="text-purple-300 font-bold">{activePanelsCount}</span>
                    <span className="text-neutral-400">panels</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="text-purple-300 font-bold">{authorLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-2xl">
                <div className="text-[9px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                  Genre
                </div>
                <div className="text-[11px] font-bold text-white">{genreLabel}</div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-2xl">
                <div className="text-[9px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                  Project ID
                </div>
                <div className="text-[11px] font-bold text-white">{projectIdLabel}</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-neutral-950 border border-neutral-850 p-3 text-[11px] text-neutral-300 leading-relaxed min-h-[72px]">
              {synopsisText}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const seriesSlug = activeProject?.series_slug || localStorage.getItem("active_series_slug") || "active";
                  const chapterSlug = activeProject?.chapter_slug || localStorage.getItem("active_chapter_slug") || "active";
                  navigateTo(`/workspace/editor/series/${seriesSlug}/chapters/${chapterSlug}`);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> <span>Resume Editing</span>
              </button>

              <button
                onClick={exitActiveProject}
                className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-rose-400 hover:bg-rose-500/10 text-rose-300 text-xs font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Active Project
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center mx-auto text-neutral-500 mb-3">
              📁
            </div>
            <p className="text-xs text-neutral-400 font-mono leading-normal">
              No active project is selected. Choose a project from the Projects page to unlock full Creative features.
            </p>
            <button
              onClick={() => navigateTo("/projects")}
              className="mt-4 px-4 py-2 border border-purple-500/30 bg-purple-500/10 rounded-xl text-[10px] font-mono font-bold text-purple-300 hover:bg-purple-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Choose Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardActiveProject;
