import React from "react";
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
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

interface StoryboardHeaderProps {
  panelsLength: number;
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
}: StoryboardHeaderProps) {
  const isAllSelected =
    selectedCount > 0 && selectedCount === (totalCount || panelsLength);
  const isBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  // When items are selected, render the unified header selection action bar
  if (selectedCount > 0) {
    const selectionLeftBlock = (
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-purple-950/80 border border-[#3B82F6]/40 rounded-xl px-3 py-1.5 ">
          <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[10px] font-mono font-black">
            {selectedCount}
          </div>
          <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
            {selectedCount} of {totalCount || panelsLength} Selected
          </span>
          {clearSelection && (
            <button
              type="button"
              onClick={clearSelection}
              title="Clear Selection"
              className="ml-1 p-0.5 rounded-md hover:bg-purple-900/60 text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Select / Deselect All */}
        <button
          type="button"
          onClick={isAllSelected ? clearSelection : selectAllPanels}
          className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {isAllSelected ? (
            <Square className="w-3.5 h-3.5 text-[#3B82F6]" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
          )}
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </button>

        {/* Busy / Progress Indicator */}
        {isBusy && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/60 border border-[#3B82F6]/40 rounded-xl text-[#60A5FA] text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" />
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-[#3B82F6]/40 bg-purple-950/40 hover:bg-purple-900/60 text-[#60A5FA] hover:text-purple-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-[#3B82F6]/40 bg-purple-950/40 hover:bg-purple-900/60 text-[#60A5FA] hover:text-purple-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Scissors className="w-3.5 h-3.5 text-[#3B82F6]" />
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-[#3B82F6]/40 bg-purple-950/40 hover:bg-purple-900/60 text-[#60A5FA] hover:text-purple-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
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
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-[#3B82F6]/40 bg-purple-950/40 hover:bg-purple-900/60 text-[#60A5FA] hover:text-purple-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Link2 className="w-3.5 h-3.5 text-[#3B82F6]" />
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

  // Standard Mode Left Title Block
  const titleBlock = (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] flex items-center justify-center  shrink-0">
        <Film className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            Storyboard
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[10px] font-bold text-[#60A5FA] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            {panelsLength} {panelsLength === 1 ? "Scene" : "Scenes"}
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Motion sequence timeline, speech transcript alignment & audio-sync
        </p>
      </div>
    </div>
  );

  const viewToggle = setViewLayout ? (
    <div className="flex items-center bg-neutral-950/90 p-0.5 rounded-xl border border-neutral-800 shadow-inner">
      <button
        type="button"
        onClick={() => setViewLayout("scroll")}
        title="Horizontal Scroll View"
        className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          viewLayout === "scroll"
            ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white "
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <Rows className="w-3.5 h-3.5" />
        <span>Scroll</span>
      </button>
      <button
        type="button"
        onClick={() => setViewLayout("grid")}
        title="Grid View"
        className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          viewLayout === "grid"
            ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white "
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Grid</span>
      </button>
    </div>
  ) : null;

  const rightBlock = (
    <div className="flex items-center gap-2">
      {panelsLength > 0 && handleAnalyzeAllPanels && (
        <button
          type="button"
          onClick={handleAnalyzeAllPanels}
          disabled={isAnalyzingAll}
          className="text-[11px] font-mono font-bold border border-[#3B82F6]/40 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 disabled:bg-neutral-800 disabled:border-neutral-750 disabled:text-neutral-500 text-white rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 transition-all  hover: active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              isAnalyzingAll
                ? "animate-spin text-amber-300"
                : "text-purple-200"
            }`}
          />
          <span>
            {isAnalyzingAll
              ? "Generating Narrative..."
              : "Analyze Full Sequence"}
          </span>
        </button>
      )}

      {panelsLength > 0 && handleDownloadZip && (
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="text-[11px] font-mono font-bold border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 hover:text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span>{isZipping ? "Zipping..." : "Download ZIP"}</span>
        </button>
      )}

      {panelsLength > 0 && setShowBulkOps && (
        <button
          type="button"
          onClick={() => setShowBulkOps(!showBulkOps)}
          className={`text-[11px] font-mono font-bold border rounded-xl px-3 py-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
            showBulkOps
              ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#60A5FA] "
              : "border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white"
          }`}
        >
          <span>Bulk Actions</span>
        </button>
      )}

      {/* Timeline Sequencer Badge */}
      <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-[#3B82F6]/25 text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider font-mono shadow-inner">
        Timeline Sequencer
      </span>
    </div>
  );

  return (
    <EditorHeaderFrame
      left={titleBlock}
      center={viewToggle}
      right={rightBlock}
    />
  );
}
