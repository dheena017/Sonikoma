import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ArrowDownUp,
  CheckCircle2,
  Layers,
  CircleDashed,
  Sparkles,
  Filter,
  ChevronDown,
  Rows,
  LayoutGrid,
  Image as ImageIcon,
  Smartphone,
  Maximize2,
} from "lucide-react";

export type AssetFilterStatus =
  | "all"
  | "selected"
  | "in_storyboard"
  | "not_in_storyboard"
  | "portrait"
  | "landscape"
  | "tall_strip"
  | "too_tall_strip";

export type AssetSortOrder = "asc" | "desc";

export interface ImportedAssetsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: AssetFilterStatus;
  setFilterStatus: (status: AssetFilterStatus) => void;
  sortOrder: AssetSortOrder;
  setSortOrder: (order: AssetSortOrder) => void;
  viewLayout: "scroll" | "grid";
  setViewLayout: (layout: "scroll" | "grid") => void;
  totalAssetsCount: number;
  filteredAssetsCount: number;
  selectedCount: number;
  inStoryboardCount: number;
}

export const ImportedAssetsFilterBar: React.FC<ImportedAssetsFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  sortOrder,
  setSortOrder,
  viewLayout,
  setViewLayout,
  totalAssetsCount,
  filteredAssetsCount,
  selectedCount,
  inStoryboardCount,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const getStatusLabel = () => {
    switch (filterStatus) {
      case "in_storyboard":
        return "Placed";
      case "not_in_storyboard":
        return "Unused";
      case "selected":
        return "Selected";
      case "portrait":
        return "Portrait";
      case "landscape":
        return "Landscape";
      case "tall_strip":
        return "Tall Strip";
      case "too_tall_strip":
        return "Too Tall";
      default:
        return "All Assets";
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 max-w-xl mx-2 font-mono text-xs select-none">
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-[140px] max-w-[260px] flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search frame (#1, #77)..."
          className="w-full h-8 pl-8 pr-7 bg-neutral-950/90 hover:bg-neutral-900 focus:bg-neutral-900 border border-neutral-800 focus:border-[#3B82F6]/60 rounded-xl text-neutral-100 placeholder:text-neutral-500 text-[11px] font-mono focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            title="Clear search"
            className="absolute right-2 p-0.5 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Status Dropdown Menu (Opens to the right side) */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`h-8 px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            filterStatus !== "all"
              ? "bg-[#2A2A2A] border-[#3B82F6]/50 text-[#60A5FA] "
              : "bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>{getStatusLabel()}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-[#3B82F6]" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
            {/* Status Section */}
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
              Status Filter
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("all");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "all"
                  ? "bg-[#2A2A2A] text-[#60A5FA] border border-[#3B82F6]/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Assets</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-normal">
                {totalAssetsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("in_storyboard");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "in_storyboard"
                  ? "bg-[#2A2A2A] text-[#60A5FA] border border-[#3B82F6]/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>In Storyboard</span>
              </div>
              <span className="text-[10px] text-[#60A5FA] font-normal">
                {inStoryboardCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("not_in_storyboard");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "not_in_storyboard"
                  ? "bg-amber-600/25 text-amber-300 border border-amber-500/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CircleDashed className="w-3.5 h-3.5 text-amber-400" />
                <span>Unused Assets</span>
              </div>
              <span className="text-[10px] text-amber-300 font-normal">
                {Math.max(0, totalAssetsCount - inStoryboardCount)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("selected");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "selected"
                  ? "bg-cyan-600/25 text-blue-300 border border-blue-500/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Selected Only</span>
              </div>
              <span className="text-[10px] text-blue-300 font-normal">
                {selectedCount}
              </span>
            </button>

            {/* Orientation Section Divider */}
            <div className="my-1 border-t border-neutral-800" />
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
              Orientation
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("portrait");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "portrait"
                  ? "bg-[#2A2A2A] text-[#60A5FA] border border-[#3B82F6]/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Portrait</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("landscape");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "landscape"
                  ? "bg-sky-600/25 text-sky-300 border border-sky-500/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Landscape</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("tall_strip");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "tall_strip"
                  ? "bg-[#2A2A2A] text-[#60A5FA] border border-[#3B82F6]/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Tall Strip</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("too_tall_strip");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "too_tall_strip"
                  ? "bg-rose-600/25 text-rose-300 border border-rose-500/30"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">⚠️</span>
                <span>Too Tall Strip</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center bg-neutral-950/90 p-0.5 rounded-xl border border-neutral-800 shadow-inner shrink-0">
        <button
          type="button"
          onClick={() => setViewLayout("scroll")}
          title="Horizontal Scroll View"
          className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            viewLayout === "scroll"
              ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white "
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <Rows className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Scroll</span>
        </button>
        <button
          type="button"
          onClick={() => setViewLayout("grid")}
          title="Grid View"
          className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            viewLayout === "grid"
              ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white "
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Grid</span>
        </button>
      </div>
    </div>
  );
};

export default ImportedAssetsFilterBar;
