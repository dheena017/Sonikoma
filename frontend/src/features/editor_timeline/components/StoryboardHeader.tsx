import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  LayoutGrid,
  Rows,
  Sparkles,
  CheckSquare,
  Square,
  Scissors,
  Trash2,
  Link2,
  X,
  RefreshCw,
  Download,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

interface StoryboardHeaderProps {
  panelsLength: number;
  filteredCount?: number;
  selectedCount?: number;
  totalCount?: number;
  showBulkOps?: boolean;
  setShowBulkOps?:
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((v: boolean) => void);
  isZipping?: boolean;
  handleDownloadZip?: () => void;
  isAnalyzingAll?: boolean;
  handleAnalyzeAllPanels?: () => void;
  handleAnalyzeSelected?: () => void;
  selectAllPanels?: () => void;
  clearSelection?: () => void;
  handleSelectOdd?: () => void;
  handleSelectEven?: () => void;
  handleInvertSelection?: () => void;
  handleDeleteSelected?: () => void;
  handleAutoCropSelected?: () => void;
  handleCleanBubblesSelected?: () => void;
  handleBatchMergeSelected?: () => void;
  batchProgress?: { current: number; total: number } | null;
  cleanProgress?: { current: number; total: number } | null;
  isBatchCropping?: boolean;
  isCleaningBubbles?: boolean;
  isBatchMerging?: boolean;
  handleCancelBatch?: () => void;
  handleCancelAnalysis?: () => void;
  viewLayout?: "scroll" | "grid";
  setViewLayout?: (layout: "scroll" | "grid") => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  filterStatus?: string;
  setFilterStatus?: (status: string) => void;
}

export default function StoryboardHeader({
  panelsLength,
  selectedCount = 0,
  totalCount = 0,
  showBulkOps,
  setShowBulkOps,
  isZipping,
  handleDownloadZip,
  isAnalyzingAll,
  handleAnalyzeAllPanels,
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
  handleDeleteSelected,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  batchProgress,
  cleanProgress,
  isBatchCropping,
  isCleaningBubbles,
  isBatchMerging,
  handleCancelBatch,
  handleCancelAnalysis,
  viewLayout = "scroll",
  setViewLayout,
  filteredCount,
  searchQuery = "",
  setSearchQuery,
  filterStatus = "all",
  setFilterStatus,
}: StoryboardHeaderProps) {
  const isAllSelected =
    selectedCount > 0 && selectedCount === (totalCount || panelsLength);
  const isBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  // When items are selected, render the unified header selection action bar
  if (selectedCount > 0) {
    const selectionLeftBlock = (
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-1.5 shadow-sm">
          <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-mono font-black shadow-sm">
            {selectedCount}
          </div>
          <span className="text-xs font-mono font-bold text-blue-300 whitespace-nowrap">
            {selectedCount} of {totalCount || panelsLength} Selected
          </span>
          {clearSelection && (
            <button
              type="button"
              onClick={clearSelection}
              title="Clear Selection"
              className="ml-1 p-0.5 rounded-md hover:bg-blue-500/20 text-blue-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Select / Deselect All */}
        <button
          type="button"
          onClick={isAllSelected ? clearSelection : selectAllPanels}
          className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {isAllSelected ? (
            <Square className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </button>

        {/* Busy / Progress Indicator */}
        {isBusy && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>
              {isBatchCropping
                ? `Cropping ${batchProgress?.current || 0}/${
                    batchProgress?.total || selectedCount
                  }...`
                : isCleaningBubbles
                ? `Cleaning ${cleanProgress?.current || 0}/${
                    cleanProgress?.total || selectedCount
                  }...`
                : "Merging..."}
            </span>
          </div>
        )}
      </div>
    );

    const selectionRightBlock = (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Analyze Selected */}
        {handleAnalyzeSelected && (
          <button
            type="button"
            onClick={handleAnalyzeSelected}
            disabled={isBusy}
            title="Analyze selected scenes"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Analyze Selected</span>
          </button>
        )}

        {/* Auto-Crop Selected */}
        {handleAutoCropSelected && (
          <button
            type="button"
            onClick={handleAutoCropSelected}
            disabled={isBusy}
            title="Auto-crop selected scenes"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Scissors className="w-3.5 h-3.5 text-neutral-400" />
            <span>Auto Crop</span>
          </button>
        )}

        {/* Clean Bubbles */}
        {handleCleanBubblesSelected && (
          <button
            type="button"
            onClick={handleCleanBubblesSelected}
            disabled={isBusy}
            title="Clean text speech bubbles"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Clean Bubbles</span>
          </button>
        )}

        {/* Batch Vertical Merge */}
        {handleBatchMergeSelected && selectedCount >= 2 && (
          <button
            type="button"
            onClick={handleBatchMergeSelected}
            disabled={isBusy}
            title="Stitch selected scenes vertically"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Link2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Merge ({selectedCount})</span>
          </button>
        )}

        {/* Cancel Batch Operation */}
        {isBusy && handleCancelBatch && (
          <button
            type="button"
            onClick={handleCancelBatch}
            title="Cancel Operation"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Cancel</span>
          </button>
        )}

        {/* Delete Selected */}
        {handleDeleteSelected && (
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isBusy}
            title="Delete Selected Scenes"
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>
        )}
      </div>
    );

    return (
      <EditorHeaderFrame
        left={selectionLeftBlock}
        right={selectionRightBlock}
      />
    );
  }

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterDropdownOpen]);

  // Standard Mode Left Title Block
  const titleBlock = (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
        <Film className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            Storyboard
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-bold text-blue-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {filteredCount !== undefined && filteredCount !== panelsLength
              ? `${filteredCount} / ${panelsLength}`
              : panelsLength}{" "}
            {panelsLength === 1 ? "Scene" : "Scenes"}
          </span>
          {viewLayout === "scroll" && panelsLength > 1 && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-[10px] text-neutral-300 font-mono shadow-sm">
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded bg-neutral-800 text-neutral-300 text-[9px] font-bold">⇧</span>
              <span>Hold <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-white font-bold text-[9px] leading-none">Shift</kbd> + Scroll to move horizontally</span>
            </span>
          )}
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Motion sequence timeline, speech transcript alignment & audio-sync
        </p>
      </div>
    </div>
  );

  const getStatusLabel = () => {
    switch (filterStatus) {
      case "with_speech":
        return "Speech";
      case "with_motion":
        return "Motion";
      case "selected":
        return "Selected";
      default:
        return "ALL";
    }
  };

  const centerBlock = (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-1 w-full min-w-0 max-w-none sm:max-w-xl mx-0 font-mono text-xs select-none">
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-[80px] max-w-[240px] flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none shrink-0" />
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery?.(e.target.value)}
          placeholder="Search scene..."
          className="w-full h-8 pl-8 pr-6 bg-neutral-950/90 hover:bg-neutral-900 focus:bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-neutral-100 placeholder:text-neutral-500 text-[11px] font-mono focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery?.("")}
            title="Clear search"
            className="absolute right-1.5 p-0.5 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Status Dropdown Menu */}
      <div className="relative shrink-0" ref={filterDropdownRef}>
        <button
          type="button"
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          className={`h-8 px-2 sm:px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm ${
            filterStatus && filterStatus !== "all"
              ? "bg-[#2A2A2A] border-neutral-700 text-neutral-300"
              : "bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span>{getStatusLabel()}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isFilterDropdownOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {isFilterDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
              Scene Filter
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterStatus?.("all");
                setIsFilterDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                !filterStatus || filterStatus === "all"
                  ? "bg-[#2A2A2A] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <span>All Scenes</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                {totalCount || panelsLength}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus?.("with_speech");
                setIsFilterDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "with_speech"
                  ? "bg-[#2A2A2A] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <span>With Speech</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus?.("with_motion");
                setIsFilterDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "with_motion"
                  ? "bg-[#2A2A2A] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <span>With Motion</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus?.("selected");
                setIsFilterDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all text-left cursor-pointer ${
                filterStatus === "selected"
                  ? "bg-[#2A2A2A] text-neutral-300 border border-neutral-700"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <span>Selected Only</span>
              <span className="text-[10px] text-neutral-300 font-normal">
                {selectedCount}
              </span>
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
            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewLayout === "scroll"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
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
            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewLayout === "grid"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
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

  const rightBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {/* Select All Quick Action */}
      {panelsLength > 0 && selectAllPanels && (
        <button
          type="button"
          onClick={isAllSelected ? clearSelection : selectAllPanels}
          title={isAllSelected ? "Deselect all scenes" : "Select all scenes"}
          className="text-[11px] font-mono font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden 2xl:inline">Select All</span>
        </button>
      )}

      {panelsLength > 0 && handleAnalyzeAllPanels && (
        <button
          type="button"
          onClick={handleAnalyzeAllPanels}
          disabled={isAnalyzingAll}
          title="Analyze full sequence"
          className="h-8 px-3 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border border-blue-400/40 bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isAnalyzingAll ? "animate-spin text-white" : ""
            }`}
          />
          <span className="hidden 2xl:inline">Analyze Sequence</span>
        </button>
      )}

      {panelsLength > 0 && handleDownloadZip && (
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          title="Download ZIP"
          className="text-[11px] font-mono font-bold border border-neutral-700 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden 2xl:inline">
            {isZipping ? "Zipping..." : "ZIP"}
          </span>
        </button>
      )}

      {panelsLength > 0 && setShowBulkOps && (
        <button
          type="button"
          onClick={() => setShowBulkOps(!showBulkOps)}
          title="Bulk actions"
          className={`text-[11px] font-mono font-bold border rounded-xl px-3 py-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
            showBulkOps
              ? "border-blue-500/40 bg-blue-600/20 text-blue-300"
              : "border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white"
          }`}
        >
          <span className="hidden sm:inline">Bulk</span>
        </button>
      )}
    </div>
  );

  return (
    <EditorHeaderFrame
      left={titleBlock}
      center={centerBlock}
      right={rightBlock}
      centerClassName="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:min-w-0"
      className="flex-wrap sm:flex-nowrap"
    />
  );
}
