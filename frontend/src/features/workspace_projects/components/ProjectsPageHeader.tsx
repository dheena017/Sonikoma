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
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F] text-left">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight">
          Projects &{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF]">
            Series
          </span>
        </h1>
        <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-xl">
          Browse, organize, and manage your manga, webtoon, and video storyboard productions.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewSeries}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Chapter</span>
        </button>
      </div>
    </div>
  );
}
