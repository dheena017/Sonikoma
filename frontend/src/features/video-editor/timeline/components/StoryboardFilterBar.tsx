import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  Rows,
  LayoutGrid,
  Layers,
  MessageSquare,
  MessageSquareOff,
  BookOpen,
  BookX,
  Sparkles,
  MinusCircle,
  Zap,
  ZapOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";

export type StoryboardFilterStatus =
  | "all"
  | "selected"
  | "unselected"
  | "not_selected"
  | "with_speech"
  | "without_speech"
  | "with_narration"
  | "with_narrative"
  | "without_narration"
  | "without_narrative"
  | "with_sfx"
  | "without_sfx"
  | "with_motion"
  | "without_motion"
  | "with_audio"
  | "without_audio";

export interface StoryboardFilterCounts {
  speech?: number;
  withoutSpeech?: number;
  narration?: number;
  withoutNarration?: number;
  sfx?: number;
  withoutSfx?: number;
  motion?: number;
  withoutMotion?: number;
  audio?: number;
  withoutAudio?: number;
}

export interface StoryboardFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: StoryboardFilterStatus | string;
  setFilterStatus: (status: string) => void;
  viewLayout?: "scroll" | "grid";
  setViewLayout?: (layout: "scroll" | "grid") => void;
  totalCount: number;
  filteredCount?: number;
  selectedCount?: number;
  filterCounts?: StoryboardFilterCounts;
}

export const StoryboardFilterBar: React.FC<StoryboardFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  filterStatus = "all",
  setFilterStatus,
  viewLayout = "scroll",
  setViewLayout,
  totalCount,
  filteredCount,
  selectedCount = 0,
  filterCounts,
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
      case "selected":
        return "Selected";
      case "unselected":
      case "not_selected":
        return "Unselected";
      case "with_speech":
        return "Speech";
      case "without_speech":
        return "No Speech";
      case "with_narration":
      case "with_narrative":
        return "Narrator";
      case "without_narration":
      case "without_narrative":
        return "No Narrator";
      case "with_sfx":
        return "SFX";
      case "without_sfx":
        return "No SFX";
      case "with_motion":
        return "Motion";
      case "without_motion":
        return "Static";
      case "with_audio":
        return "Audio";
      case "without_audio":
        return "No Audio";
      default:
        return "ALL";
    }
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-1 w-full min-w-0 max-w-none sm:max-w-xl mx-0 font-mono text-xs select-none">
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-[80px] max-w-[240px] flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none shrink-0" />
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scene..."
          className="w-full h-8 pl-8 pr-6 bg-neutral-950/90 hover:bg-neutral-900 focus:bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-neutral-100 placeholder:text-neutral-500 text-[11px] font-mono focus:outline-none transition-colors duration-75 shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            title="Clear search"
            className="absolute right-1.5 p-0.5 rounded-md text-neutral-400 hover:text-white transition-colors duration-75 active:scale-90 active:duration-75 [touch-action:manipulation] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Status Dropdown Menu */}
      <div className="relative shrink-0 z-30" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`h-8 px-2 sm:px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 sm:gap-1.5 transition-colors duration-75 active:scale-95 active:duration-75 [touch-action:manipulation] cursor-pointer shadow-sm ${
            filterStatus && filterStatus !== "all"
              ? "bg-[#2A2A2A] hover:bg-[#333333] border-neutral-700 text-neutral-300"
              : "bg-neutral-950/80 hover:bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span>{getStatusLabel()}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-60 max-h-[420px] overflow-y-auto custom-purple-scrollbar bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
            {/* Content Filter Section */}
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
              Content Filter
            </div>

            {/* All Scenes */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("all");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                !filterStatus || filterStatus === "all"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Scenes</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-normal">
                {totalCount}
              </span>
            </button>

            {/* Selected Scenes */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("selected");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "selected"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Selected Scenes</span>
              </div>
              <span className="text-[10px] text-neutral-300 font-normal">
                {selectedCount}
              </span>
            </button>

            {/* Unselected Scenes */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("unselected");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "unselected" || filterStatus === "not_selected"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CircleDashed className="w-3.5 h-3.5 text-neutral-400" />
                <span>Unselected Scenes</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-normal">
                {Math.max(0, totalCount - selectedCount)}
              </span>
            </button>

            <div className="my-1 border-t border-neutral-800/80" />

            {/* Speech Filter Pair */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("with_speech");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "with_speech"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>With Speech</span>
              </div>
              {filterCounts?.speech !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.speech}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("without_speech");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "without_speech"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquareOff className="w-3.5 h-3.5 text-neutral-400" />
                <span>Without Speech</span>
              </div>
              {filterCounts?.withoutSpeech !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.withoutSpeech}
                </span>
              )}
            </button>

            {/* Narrator Filter Pair */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("with_narration");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "with_narration" ||
                filterStatus === "with_narrative"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>With Narrator</span>
              </div>
              {filterCounts?.narration !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.narration}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("without_narration");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "without_narration" ||
                filterStatus === "without_narrative"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookX className="w-3.5 h-3.5 text-neutral-400" />
                <span>Without Narrator</span>
              </div>
              {filterCounts?.withoutNarration !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.withoutNarration}
                </span>
              )}
            </button>

            {/* SFX Filter Pair */}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("with_sfx");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "with_sfx"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span>With SFX</span>
              </div>
              {filterCounts?.sfx !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.sfx}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("without_sfx");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "without_sfx"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <ZapOff className="w-3.5 h-3.5 text-neutral-400" />
                <span>Without SFX</span>
              </div>
              {filterCounts?.withoutSfx !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.withoutSfx}
                </span>
              )}
            </button>

            {/* Audio & Motion Section */}
            <div className="my-1 border-t border-neutral-800" />
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
              Audio & Motion
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("with_motion");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "with_motion"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>With Motion</span>
              </div>
              {filterCounts?.motion !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.motion}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("without_motion");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "without_motion"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>Without Motion (Static)</span>
              </div>
              {filterCounts?.withoutMotion !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.withoutMotion}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("with_audio");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "with_audio"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>With Audio Voice</span>
              </div>
              {filterCounts?.audio !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.audio}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus("without_audio");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-colors duration-75 active:scale-[0.98] active:duration-75 [touch-action:manipulation] text-left cursor-pointer ${
                filterStatus === "without_audio"
                  ? "bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                <span>Without Audio Voice</span>
              </div>
              {filterCounts?.withoutAudio !== undefined && (
                <span className="text-[10px] text-neutral-400 font-normal">
                  {filterCounts.withoutAudio}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* View Toggle */}
      {setViewLayout && (
        <div className="flex items-center bg-neutral-950/90 p-0.5 rounded-xl border border-neutral-800 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setViewLayout("scroll")}
            title="Horizontal Scroll View"
            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors duration-75 active:scale-95 active:duration-75 [touch-action:manipulation] cursor-pointer ${
              viewLayout === "scroll"
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Rows className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Scroll</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout("grid")}
            title="Grid View"
            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors duration-75 active:scale-95 active:duration-75 [touch-action:manipulation] cursor-pointer ${
              viewLayout === "grid"
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Grid</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryboardFilterBar;
