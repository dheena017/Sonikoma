import React from "react";
import { Search, Plus, X, Play, Globe, Sparkles } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface ProjectsPageHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewSeries: () => void;
  stats?: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  onOpenScraper?: () => void;
  onOpenAiStudio?: () => void;
  onLoadDemo?: () => void;
  isDemoActive?: boolean;
}

export default function ProjectsPageHeader({
  searchQuery,
  onSearchChange,
  onNewSeries,
  stats,
  onOpenScraper,
  onOpenAiStudio,
  onLoadDemo,
  isDemoActive,
}: ProjectsPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F] text-left">
      <div className="space-y-3.5 max-w-2xl text-left">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight font-sans">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]">
              Projects Studio
            </span>
          </h1>
          <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-xl mt-1">
            Browse and organize your webtoon series, chapters, and video projects with automated panel slicing and 2.5D camera motions.
          </p>
        </div>

        {/* Clean Integrated Search Bar */}
        <div className="relative max-w-md pt-0.5 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] group-hover:text-[#3B82F6] transition-colors" />
          <input
            type="text"
            placeholder="Search projects, chapters, or series..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#18181E] border border-white/[0.08] hover:border-neutral-700 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 rounded-xl py-2 pl-10 pr-9 text-xs sm:text-sm text-[#E5E5E5] outline-none font-sans transition-all placeholder:text-[#6B7280]"
          />
          {searchQuery && (
            <Tooltip text="Clear search" placement="top">
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Right CTA Actions */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onLoadDemo && (
          <button
            type="button"
            onClick={onLoadDemo}
            className="flex items-center gap-2 bg-[#1E1E1E] hover:bg-[#252525] border border-[#2F2F2F] text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
            title="Load or reset sample demo projects"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isDemoActive ? "Reset Demo" : "Sample Demo"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNewSeries}
          aria-label="Start new series"
          className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md border border-[#3B82F6]/30 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Series</span>
        </button>
      </div>
    </div>
  );
}
