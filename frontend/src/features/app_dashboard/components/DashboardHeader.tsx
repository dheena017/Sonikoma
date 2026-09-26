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
      <div className="mb-8 flex flex-col gap-6 border-b border-[#2F2F2F] pb-6 text-left lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-semibold uppercase text-emerald-300">
            Creator workspace
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[#F4F4F5] sm:text-4xl">
            Your studio
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#A1A1AA]">
            Pick up a series or start a new production.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_auto] lg:w-auto">
          <div className="group relative min-w-0">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A] transition-colors group-focus-within:text-emerald-300" />
            <input
              type="search"
              aria-label="Search projects, chapters, or series"
              placeholder="Search your projects"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-[#141414] py-2 pl-10 pr-10 text-sm text-[#F4F4F5] outline-none transition-colors placeholder:text-[#71717A] hover:border-white/20 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
            />
            {searchQuery && (
              <Tooltip text="Clear search" placement="top">
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA3AF] transition-colors hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            )}
          </div>

        <Tooltip
          text="Scrape webtoon URL or start a new storyboard series"
          placement="bottom"
        >
          <button
            type="button"
            onClick={onNewSeries}
            aria-label="Start a new series"
            className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-emerald-300/30 bg-emerald-300 px-5 text-sm font-semibold text-[#101510] transition-colors hover:bg-emerald-200 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New series</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
