import React from "react";
import { Plus } from "lucide-react";

interface ProjectsPageHeaderProps {
  onNewSeries: () => void;
  stats?: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
}

export default function ProjectsPageHeader({
  onNewSeries,
}: ProjectsPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
          Projects &{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
            Series
          </span>
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-xl">
          Browse, organize, and manage your manga, webtoon, and video storyboard productions.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewSeries}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-purple-400/30"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Chapter</span>
        </button>
      </div>
    </div>
  );
}
