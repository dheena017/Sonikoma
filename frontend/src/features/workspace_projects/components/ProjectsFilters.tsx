import React from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import type { ViewMode } from "@/features/workspace_projects/hooks/ProjectTypes";

interface ProjectsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  genres: string[];
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ProjectsFilters({
  searchQuery,
  onSearchChange,
  genreFilter,
  onGenreChange,
  genres,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ProjectsFiltersProps) {
  return (
    <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-3 sm:p-4 mb-8 flex flex-col lg:flex-row gap-3.5 items-center justify-between shadow-xl backdrop-blur-xl">
      {/* Search Input */}
      <div className="flex-1 w-full relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
        <input
          type="text"
          placeholder="Search projects by title, series, or author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-black/40 border border-neutral-800 hover:border-neutral-700 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-sans transition-all placeholder:text-neutral-500"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        {/* Genre Selector */}
        <div className="flex items-center gap-2 bg-black/40 border border-neutral-800 hover:border-neutral-700 rounded-xl px-3 py-2 transition-colors">
          <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <select
            value={genreFilter}
            onChange={(e) => onGenreChange(e.target.value)}
            className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer w-full"
          >
            {genres.map((g) => (
              <option key={g} value={g} className="bg-neutral-900 text-neutral-200">
                {g === "All" ? "All Genres" : g}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 bg-black/40 border border-neutral-800 hover:border-neutral-700 rounded-xl px-3 py-2 transition-colors">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer w-full"
          >
            <option value="Newest" className="bg-neutral-900 text-neutral-200">Newest First</option>
            <option value="Oldest" className="bg-neutral-900 text-neutral-200">Oldest First</option>
            <option value="Most Panels" className="bg-neutral-900 text-neutral-200">Most Panels</option>
            <option value="A-Z" className="bg-neutral-900 text-neutral-200">Title (A-Z)</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-black/40 border border-neutral-800 p-0.5 rounded-xl ml-auto lg:ml-2">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            title="List View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
