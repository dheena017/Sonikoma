import React from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
import type { ViewMode } from "./hooks/ProjectTypes.js";

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
    <div className="bg-[#0b0b0e] border border-neutral-800 rounded-xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-[59px] z-20">
      <div className="flex-1 w-full relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#111115] border border-neutral-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={genreFilter}
            onChange={(e) => onGenreChange(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none cursor-pointer w-full"
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? "All Genres" : g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
          <span className="text-neutral-500 text-sm">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none cursor-pointer w-full"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Most Panels">Most Panels</option>
            <option value="A-Z">Title (A-Z)</option>
          </select>
        </div>

        <div className="flex items-center bg-[#111115] border border-neutral-700 rounded-lg overflow-hidden ml-auto lg:ml-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-purple-500/20 text-purple-400"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-purple-500/20 text-purple-400"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
