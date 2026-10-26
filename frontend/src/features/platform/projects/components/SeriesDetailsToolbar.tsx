import React from "react";
import { Search, ChevronDown, Check, Grid, List } from "lucide-react";
import type { ViewMode, ProjectSortOption, ProjectStatusFilter } from "@/features/platform/projects/types";

interface SeriesDetailsToolbarProps {
  filteredCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ProjectStatusFilter;
  onStatusFilterChange: (status: ProjectStatusFilter) => void;
  sortBy: ProjectSortOption;
  onSortByChange: (sort: ProjectSortOption) => void;
  isSortOpen: boolean;
  onToggleSortOpen: () => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const SORT_OPTIONS: { id: ProjectSortOption; label: string }[] = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "panels", label: "Most Panels" },
  { id: "alphabetical", label: "Alphabetical" },
];

export default function SeriesDetailsToolbar({
  filteredCount,
  totalCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  isSortOpen,
  onToggleSortOpen,
  sortRef,
  viewMode,
  onViewModeChange,
}: SeriesDetailsToolbarProps) {
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Newest First";

  return (
    <div className="mb-5 flex flex-col gap-4 border-b border-[#2F2F2F] pb-5 xl:flex-row xl:items-center xl:justify-between">
      {/* Title + Chapter Counter */}
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="flex min-w-0 flex-wrap items-center gap-2.5 text-xl font-black text-white sm:text-2xl">
          Chapters
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#2F2F2F] bg-[#141414] px-2.5 py-0.5 text-xs font-mono font-bold leading-none text-[#9CA3AF]">
            {filteredCount} of {totalCount}
          </span>
        </h2>
      </div>

      {/* Controls Row */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-auto xl:flex-nowrap">
        {/* Search Box */}
        <div className="relative col-span-2 min-w-0 sm:col-span-1 sm:flex-1 sm:basis-52 xl:w-56 xl:flex-none">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            aria-label="Search chapters"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chapters"
            className="h-11 w-full rounded-xl border border-[#2F2F2F] bg-[#141414] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[#3B82F6]/60"
          />
        </div>

        {/* Status Filters */}
        <div className="col-span-2 grid h-11 grid-cols-3 items-center rounded-xl border border-[#2F2F2F] bg-[#141414] p-1 text-xs sm:col-span-1 sm:flex">
          {(["all", "draft", "ready"] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              aria-pressed={statusFilter === status}
              className={`h-full rounded-lg px-2 text-xs capitalize transition-colors cursor-pointer sm:px-3 ${
                statusFilter === status
                  ? "bg-[#252525] font-bold text-white border border-[#2F2F2F]"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Custom Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={onToggleSortOpen}
            className={`flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl border bg-[#141414] px-3 text-xs transition-colors cursor-pointer select-none sm:flex-none ${
              isSortOpen
                ? "border-[#3B82F6]/60 text-white"
                : "border-[#2F2F2F] text-neutral-300 hover:border-neutral-500"
            }`}
          >
            <span className="hidden text-neutral-500 sm:inline">Sort:</span>
            <span className="font-semibold text-white">{currentSortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                isSortOpen ? "rotate-180 text-[#3B82F6]" : ""
              }`}
            />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-[#2F2F2F] bg-[#1E1E1E] py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-1">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSortByChange(opt.id)}
                      className={`my-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#252525] font-bold text-white"
                          : "text-neutral-300 hover:bg-[#2A2A2A] hover:text-white"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex h-11 items-center justify-center rounded-xl border border-[#2F2F2F] bg-[#141414] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#252525] text-white"
                : "text-neutral-500 hover:text-white"
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-[#252525] text-white"
                : "text-neutral-500 hover:text-white"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
