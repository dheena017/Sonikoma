import React from "react";
import {
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
        <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
          <div className="h-5 w-5 rounded bg-indigo-500 flex items-center justify-center text-white text-[10px] font-mono font-black">
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
              className="ml-1 p-0.5 rounded-md hover:bg-indigo-900/60 text-indigo-300 hover:text-white transition-colors cursor-pointer"
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
            <Square className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </button>

        {/* Busy / Progress Indicator */}
        {isBusy && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>
              {isBatchCropping && batchProgress
                ? `Cropping ${batchProgress.current}/${batchProgress.total}`
                : isCleaningBubbles && cleanProgress
                ? `Cleaning ${cleanProgress.current}/${cleanProgress.total}`
                : isBatchMerging
                ? "Stitching..."
                : "Processing..."}
            </span>
          </div>
        )}
      </div>
    );

    const selectionRightBlock = (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Analyze Selected */}
        {handleAnalyzeSelected &&
          (isAnalyzingAll ? (
            <button
              type="button"
              onClick={handleCancelAnalysis}
              className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-rose-500 bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAnalyzeSelected}
              className="px-3.5 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
              <span>Analyze Selected</span>
            </button>
          ))}

        {/* Auto-Crop */}
        {handleAutoCropSelected &&
          (isBatchCropping ? (
            <button
              type="button"
              onClick={handleCancelBatch}
              className="px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1.5 bg-rose-900/50 border border-rose-500 hover:bg-rose-900 text-white rounded-xl cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop Crop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAutoCropSelected}
              disabled={isBusy}
              className="px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto-Crop</span>
            </button>
          ))}

        {/* Clean Bubbles */}
        {handleCleanBubblesSelected &&
          (isCleaningBubbles ? (
            <button
              type="button"
              onClick={handleCancelBatch}
              className="px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1.5 bg-rose-900/50 border border-rose-500 hover:bg-rose-900 text-white rounded-xl cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop Clean</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCleanBubblesSelected}
              disabled={isBusy}
              className="px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clean Bubbles</span>
            </button>
          ))}

        {/* Stitch */}
        {handleBatchMergeSelected && (
          <button
            type="button"
            disabled={isBusy || selectedCount < 2}
            onClick={handleBatchMergeSelected}
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stitch</span>
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
        className="border-b-0 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-neutral-900/80 to-neutral-900/80 border border-indigo-500/40 p-2 shadow-lg"
      />
    );
  }

  // Standard Mode Left Title Block
  const titleBlock = (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shrink-0">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="w-px h-4 bg-neutral-800 shrink-0" />
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.9)] shrink-0" />
        <h4 className="font-mono font-black text-xs text-white uppercase tracking-wider truncate">
          Sequence Workspace
        </h4>
        <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
          {panelsLength} {panelsLength === 1 ? "scene card" : "scene cards"}
        </span>
      </div>
      <span className="hidden lg:inline text-neutral-600 text-xs">·</span>
      <p className="hidden lg:block text-[11px] text-neutral-400 font-mono truncate">
        Choreography, transcripts & timing
      </p>
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
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
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
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Grid</span>
      </button>
    </div>
  ) : null;

  const rightBlock =
    panelsLength > 0 ? (
      <div className="flex items-center gap-2">
        {handleAnalyzeAllPanels && (
          <button
            type="button"
            onClick={handleAnalyzeAllPanels}
            disabled={isAnalyzingAll}
            className="text-[11px] font-mono font-bold border border-indigo-500/40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:bg-neutral-800 disabled:border-neutral-750 disabled:text-neutral-500 text-white rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                isAnalyzingAll
                  ? "animate-spin text-amber-300"
                  : "text-indigo-200"
              }`}
            />
            <span>
              {isAnalyzingAll
                ? "Generating Narrative..."
                : "Analyze Full Sequence"}
            </span>
          </button>
        )}

        {handleDownloadZip && (
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

        {setShowBulkOps && (
          <button
            type="button"
            onClick={() => setShowBulkOps(!showBulkOps)}
            className={`text-[11px] font-mono font-bold border rounded-xl px-3 py-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              showBulkOps
                ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                : "border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white"
            }`}
          >
            <span>Bulk Actions</span>
          </button>
        )}
      </div>
    ) : null;

  return (
    <EditorHeaderFrame
      left={titleBlock}
      center={viewToggle}
      right={rightBlock}
      className="border-b-0 rounded-2xl bg-[#0c0d16]/70 backdrop-blur-xl border border-white/10 p-2 shadow-lg"
    />
  );
}
