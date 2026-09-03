import React, { useState, useRef, useEffect } from "react";
import { Filter, LayoutGrid, List, Search, ChevronDown, Check } from "lucide-react";
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
    <div className="bg-[#0c0d12]/95 border border-white/10 rounded-2xl p-3.5 sm:p-4 mb-8 flex flex-col lg:flex-row gap-3.5 items-center justify-between shadow-2xl backdrop-blur-2xl">
      {/* Search Input */}
      <div className="flex-1 w-full relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3B82F6]" />
        <input
          type="text"
          placeholder="Search projects by title, series, or author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#12131e]/80 border border-white/10 hover:border-[#3B82F6]/50 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-purple-500/20 font-sans transition-all placeholder:text-neutral-500 shadow-inner"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        {/* Custom Genre Dropdown */}
        <div className="relative" ref={genreRef}>
          <button
            type="button"
            onClick={() => {
              setIsGenreOpen((prev) => !prev);
              setIsSortOpen(false);
            }}
            className={`flex items-center gap-2 bg-[#12131e]/80 hover:bg-[#181926] border rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all cursor-pointer shadow-sm select-none ${
              isGenreOpen
                ? "border-[#3B82F6]/60 ring-2 ring-purple-500/20 text-white"
                : "border-white/10 text-neutral-300 hover:border-white/20"
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
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
            <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-[#0c0d16]/98 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left transition-all cursor-pointer my-0.5 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white font-bold shadow-md shadow-purple-900/30"
                          : "text-neutral-300 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      <span>{g === "All" ? "All Genres" : g}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
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
            className={`flex items-center gap-2 bg-[#12131e]/80 hover:bg-[#181926] border rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all cursor-pointer shadow-sm select-none ${
              isSortOpen
                ? "border-[#3B82F6]/60 ring-2 ring-purple-500/20 text-white"
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
            <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-44 rounded-2xl bg-[#0c0d16]/98 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left transition-all cursor-pointer my-0.5 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white font-bold shadow-md shadow-purple-900/30"
                          : "text-neutral-300 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#12131e]/80 border border-white/10 p-1 rounded-xl ml-auto lg:ml-2 shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
              viewMode === "grid"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            title="List View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
              viewMode === "list"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
