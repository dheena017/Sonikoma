import React from "react";
import {
  Film,
  Sparkles,
  CheckSquare,
  Square,
  Scissors,
  Trash2,
  Link2,
  RefreshCw,
  Download,
  X,
  Volume2,
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";
import StoryboardFilterBar, {
  StoryboardFilterCounts,
} from "./StoryboardFilterBar";

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
  isGeneratingAudio?: boolean;
  handleGenerateAllAudio?: () => void;
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
  filterCounts?: StoryboardFilterCounts;
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
  isGeneratingAudio,
  handleGenerateAllAudio,
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
  filterCounts,
}: StoryboardHeaderProps) {
  const isFiltered =
    Boolean(searchQuery?.trim()) ||
    (filterStatus !== "all" && filterStatus !== "");
  const targetCount =
    isFiltered && filteredCount !== undefined
      ? filteredCount
      : totalCount || panelsLength;
  const isAllSelected = targetCount > 0 && selectedCount >= targetCount;
  const isBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  const centerBlock = (
    <StoryboardFilterBar
      searchQuery={searchQuery || ""}
      setSearchQuery={setSearchQuery || (() => {})}
      filterStatus={filterStatus || "all"}
      setFilterStatus={setFilterStatus || (() => {})}
      viewLayout={viewLayout}
      setViewLayout={setViewLayout}
      totalCount={totalCount || panelsLength}
      filteredCount={filteredCount}
      selectedCount={selectedCount}
      filterCounts={filterCounts}
    />
  );

  // When items are selected, render the unified header selection action bar
  if (selectedCount > 0) {
    const selectionLeftBlock = (
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-1.5 shadow-sm">
          <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-mono font-black shadow-sm">
            {selectedCount}
          </div>
          <span className="text-xs font-mono font-bold text-blue-300 whitespace-nowrap">
            {selectedCount} of {targetCount} {isFiltered ? "Filtered" : ""}{" "}
            Selected
          </span>
          {clearSelection && (
            <button
              type="button"
              onClick={clearSelection}
              title="Clear Selection"
              className="ml-1 p-0.5 rounded-md hover:bg-blue-500/20 text-blue-300 hover:text-white transition-colors duration-75 cursor-pointer [touch-action:manipulation]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Select / Deselect All */}
        <button
          type="button"
          onClick={isAllSelected ? clearSelection : selectAllPanels}
          className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 [touch-action:manipulation]"
        >
          {isAllSelected ? (
            <Square className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>
            {isAllSelected
              ? "Deselect All"
              : isFiltered
              ? "Select All Filtered"
              : "Select All"}
          </span>
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 disabled:opacity-40 [touch-action:manipulation]"
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 disabled:opacity-40 [touch-action:manipulation]"
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 disabled:opacity-40 [touch-action:manipulation]"
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-700 bg-[#2A2A2A] hover:bg-[#333333] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 disabled:opacity-40 [touch-action:manipulation]"
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 [touch-action:manipulation]"
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 flex items-center gap-1.5 transition-colors duration-75 cursor-pointer shadow-sm active:scale-95 active:duration-75 disabled:opacity-40 [touch-action:manipulation]"
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
        center={centerBlock}
        right={selectionRightBlock}
        centerClassName="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:min-w-0"
        className="flex-wrap sm:flex-nowrap"
      />
    );
  }

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
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded bg-neutral-800 text-neutral-300 text-[9px] font-bold">
                ⇧
              </span>
              <span>
                Hold{" "}
                <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-white font-bold text-[9px] leading-none">
                  Shift
                </kbd>{" "}
                + Scroll to move horizontally
              </span>
            </span>
          )}
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Motion sequence timeline, speech transcript alignment & audio-sync
        </p>
      </div>
    </div>
  );

  const rightBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {/* Select All Quick Action */}
      {panelsLength > 0 && selectAllPanels && (
        <button
          type="button"
          onClick={isAllSelected ? clearSelection : selectAllPanels}
          title={
            isAllSelected
              ? "Deselect all scenes"
              : isFiltered
              ? "Select filtered scenes"
              : "Select all scenes"
          }
          className="text-[11px] font-mono font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-colors duration-75 active:scale-95 active:duration-75 cursor-pointer shadow-sm [touch-action:manipulation]"
        >
          {isAllSelected ? (
            <Square className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span className="hidden 2xl:inline">
            {isAllSelected
              ? "Deselect All"
              : isFiltered
              ? "Select Filtered"
              : "Select All"}
          </span>
        </button>
      )}

      {panelsLength > 0 && handleAnalyzeAllPanels && (
        <button
          type="button"
          onClick={handleAnalyzeAllPanels}
          disabled={isAnalyzingAll || isGeneratingAudio}
          title="Analyze full sequence (Vision & Script Extraction)"
          className="h-8 px-3 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border border-blue-400/40 bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-900/30 transition-colors duration-75 cursor-pointer active:scale-95 active:duration-75 disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isAnalyzingAll ? "animate-spin text-white" : ""
            }`}
          />
          <span className="hidden 2xl:inline">Analyze Sequence</span>
        </button>
      )}

      {panelsLength > 0 && handleGenerateAllAudio && (
        <button
          type="button"
          onClick={handleGenerateAllAudio}
          disabled={isGeneratingAudio || isAnalyzingAll}
          title="Generate voice narration & dialogue audio for all panels"
          className="h-8 px-3 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border border-purple-400/40 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-purple-900/30 transition-colors duration-75 cursor-pointer active:scale-95 active:duration-75 disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]"
        >
          <Volume2
            className={`w-3.5 h-3.5 ${
              isGeneratingAudio ? "animate-pulse text-purple-200" : ""
            }`}
          />
          <span className="hidden 2xl:inline">
            {isGeneratingAudio ? "Generating Audio..." : "Generate Audio"}
          </span>
        </button>
      )}

      {panelsLength > 0 && handleDownloadZip && (
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          title="Download ZIP"
          className="text-[11px] font-mono font-bold border border-neutral-700 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-colors duration-75 shadow-sm active:scale-95 active:duration-75 cursor-pointer [touch-action:manipulation]"
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
          className={`text-[11px] font-mono font-bold border rounded-xl px-3 py-1.5 transition-colors duration-75 shadow-sm active:scale-95 active:duration-75 cursor-pointer [touch-action:manipulation] ${
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
