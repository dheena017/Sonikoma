import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
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

const SORT_OPTIONS = [
  { id: "Newest", label: "Newest First" },
  { id: "Oldest", label: "Oldest First" },
  { id: "Most Panels", label: "Most Panels" },
  { id: "A-Z", label: "Title (A-Z)" },
];

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
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const genreRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || sortBy;

  return (
    <div className="mb-6 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Search Input */}
      <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
        <input
          type="search"
          aria-label="Search projects by title, series, or author"
          placeholder="Search projects"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/10 bg-[#141414] py-2 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#71717A] hover:border-white/20 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/10"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {/* Custom Genre Dropdown */}
        <div className="relative" ref={genreRef}>
          <button
            type="button"
            onClick={() => {
              setIsGenreOpen((prev) => !prev);
              setIsSortOpen(false);
            }}
            className={`flex h-11 items-center gap-2 rounded-lg border bg-[#141414] px-3 text-xs transition-colors cursor-pointer select-none ${
              isGenreOpen
                ? "border-sky-300/50 text-white ring-2 ring-sky-300/10"
                : "border-white/10 text-neutral-300 hover:border-white/20"
            }`}
          >
            <Filter className="h-3.5 w-3.5 shrink-0 text-[#A1A1AA]" />
            <span className="font-semibold">
              {genreFilter === "All" ? "All Genres" : genreFilter}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                isGenreOpen ? "rotate-180 text-[#60A5FA]" : ""
              }`}
            />
          </button>

          {isGenreOpen && (
            <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border border-white/10 bg-[#171717] py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="max-h-60 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1">
                {genres.map((g) => {
                  const isSelected = genreFilter === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        onGenreChange(g);
                        setIsGenreOpen(false);
                      }}
                      className={`my-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-white/10 font-semibold text-white"
                          : "text-neutral-300 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <span>{g === "All" ? "All Genres" : g}</span>
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

        {/* Custom Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setIsSortOpen((prev) => !prev);
              setIsGenreOpen(false);
            }}
            className={`flex h-11 items-center gap-2 rounded-lg border bg-[#141414] px-3 text-xs transition-colors cursor-pointer select-none ${
              isSortOpen
                ? "border-sky-300/50 text-white ring-2 ring-sky-300/10"
                : "border-white/10 text-neutral-300 hover:border-white/20"
            }`}
          >
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
              Sort:
            </span>
            <span className="font-semibold text-white">{currentSortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                isSortOpen ? "rotate-180 text-[#60A5FA]" : ""
              }`}
            />
          </button>

          {isSortOpen && (
            <div className="absolute left-0 z-50 mt-2 w-44 rounded-lg border border-white/10 bg-[#171717] py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:left-auto sm:right-0">
              <div className="px-1">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`my-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-white/10 font-semibold text-white"
                          : "text-neutral-300 hover:bg-white/[0.07] hover:text-white"
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

        {/* View Mode Toggle */}
        <div className="ml-auto flex h-11 items-center rounded-lg border border-white/10 bg-[#141414] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            title="Grid view"
            className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            title="List view"
            className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
