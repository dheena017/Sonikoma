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
    <div className="flex flex-col gap-5 border-b border-white/10 pb-6 text-left sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase text-emerald-300">
          Library
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[#F4F4F5] sm:text-4xl">
          Projects
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#A1A1AA]">
          Browse and organize your series, chapters, and video projects.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewSeries}
          className="flex h-11 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300 px-5 text-sm font-semibold text-[#101510] transition-colors hover:bg-emerald-200 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New series</span>
        </button>
      </div>
    </div>
  );
}
