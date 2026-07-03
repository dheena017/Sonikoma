import React from "react";
import { FolderOpen, Plus } from "lucide-react";

interface ProjectsPageHeaderProps {
  onNewSeries: () => void;
}

export default function ProjectsPageHeader({ onNewSeries }: ProjectsPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3 flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-purple-400" />
          Projects
        </h1>
        <p className="text-neutral-400 text-sm font-mono max-w-xl">
          Browse and manage all of your Webtoon-to-Video series and storyboard
          projects.
        </p>
      </div>

      <div className="flex shrink-0">
        <button
          onClick={onNewSeries}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Series</span>
        </button>
      </div>
    </div>
  );
}
