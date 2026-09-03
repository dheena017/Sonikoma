import React from "react";
import { Search, Plus, X } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface DashboardHeaderProps {
  themeMode?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewSeries: () => void;
}

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  onNewSeries,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F]">
      <div className="space-y-3.5 max-w-2xl text-left">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight font-sans">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF]">
              Sonikoma Studio
            </span>
          </h1>
          <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-xl mt-1">
            Convert webtoons and manga into cinematic narrated anime videos with
            OCR speech bubbles and 2.5D camera motions.
          </p>
        </div>

        {/* Simple Clean Search Bar */}
        <div className="relative max-w-md pt-0.5 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] group-hover:text-[#3B82F6] transition-colors" />
          <input
            type="text"
            placeholder="Search projects, chapters, or series..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#18181E] border border-white/[0.08] hover:border-[#3B82F6]/50 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 rounded-xl py-2 pl-10 pr-9 text-xs sm:text-sm text-[#E5E5E5] outline-none font-sans transition-all placeholder:text-[#6B7280]"
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
      <div className="flex items-center gap-3 shrink-0">
        <Tooltip text="Scrape webtoon URL or start a new storyboard series" placement="bottom">
          <button
            type="button"
            onClick={onNewSeries}
            aria-label="Start new chapter"
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md border border-[#3B82F6]/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Chapter</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
