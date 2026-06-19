import React from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  CheckSquare,
  RefreshCw,
  X,
  Trash,
  Clock,
  Move,
  Scissors,
  Link2,
  Settings2,
} from "lucide-react";

interface TimelineSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isAnalyzingAll: boolean;
  handleAnalyzeSelected: () => void;
  selectAllPanels: () => void;
  clearSelection: () => void;
  handleDeleteSelected: () => void;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  isBatchMerging: boolean;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleBatchMergeSelected: () => void;
  batchProgress?: { current: number; total: number } | null;
  cleanProgress?: { current: number; total: number } | null;
}

export default function TimelineSelectionBar({
  selectedCount,
  totalCount,
  isAnalyzingAll,
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
  handleDeleteSelected,
  isBatchCropping,
  isCleaningBubbles,
  isBatchMerging,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  batchProgress,
  cleanProgress,
}: TimelineSelectionBarProps) {
  // Visible whenever there are panels in the storyboard
  const isVisible = totalCount > 0;

  // Safeguard: Ensure we are in a browser environment before using the DOM
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Container with neutral border and standard dark shadow */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* LEFT SECTION: Selection Actions or General Timeline Status */}
          <div className="flex items-center gap-3">
            {selectedCount > 0 ? (
              <>
                {/* Selection Count Badge */}
                <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 shrink-0">
                  <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
                    {selectedCount > 99 ? "99+" : selectedCount}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {selectedCount} panel{selectedCount !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <p className="text-[9px] text-purple-400 font-mono leading-tight">
                      of {totalCount} in storyboard
                    </p>
                  </div>
                </div>

                {/* Progress indicator when busy */}
                {(isBatchCropping || isCleaningBubbles || isBatchMerging) && (
                  <div className="flex flex-col gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-300 text-xs font-mono shrink-0 min-w-[170px]">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                      <span className="font-bold tracking-tight">
                        {isBatchCropping && batchProgress
                          ? `Cropping ${batchProgress.current}/${batchProgress.total}`
                          : isCleaningBubbles && cleanProgress
                          ? `Cleaning ${cleanProgress.current}/${cleanProgress.total}`
                          : isBatchMerging
                          ? "Stitching panels…"
                          : "Processing…"}
                      </span>
                    </div>

                    {/* Process Bar for Batch Operations */}
                    {((isBatchCropping && batchProgress) || (isCleaningBubbles && cleanProgress)) && (
                      (() => {
                        const prog = isBatchCropping ? batchProgress : cleanProgress;
                        if (!prog || prog.total === 0) return null;
                        const pct = Math.round((prog.current / prog.total) * 100);
                        return (
                          <div className="w-full space-y-1">
                            <div className="relative h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-purple-950 shadow-inner">
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-shimmer-sweep" />
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-bold text-purple-450 font-mono tracking-tighter">
                              <span>PROGRESS</span>
                              <span>{pct}%</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-neutral-800 shrink-0" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[TimelineSelectionBar] Select all panels");
                      selectAllPanels();
                    }}
                    className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  >
                    <CheckSquare className="h-4 w-4 text-purple-400" />
                    Select All
                  </button>

                  {/* AI Analyse Selected */}
                  <button
                    type="button"
                    disabled={isAnalyzingAll}
                    onClick={() => {
                      console.log(
                        `[TimelineSelectionBar] Analyze ${selectedCount} selected panels`
                      );
                      handleAnalyzeSelected();
                    }}
                    className={`px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isAnalyzingAll
                        ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-wait"
                        : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20"
                    }`}
                  >
                    {isAnalyzingAll ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    )}
                    {isAnalyzingAll
                      ? "Analyzing..."
                      : `AI Analyse Selected (${selectedCount})`}
                  </button>

                  {/* Auto-Crop */}
                  <button
                    type="button"
                    disabled={
                      isBatchCropping || isCleaningBubbles || isBatchMerging
                    }
                    onClick={handleAutoCropSelected}
                    className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                    title="Auto-Crop selected storyboard panels"
                  >
                    {isBatchCropping ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                    ) : (
                      <Scissors className="h-4 w-4 text-purple-400" />
                    )}
                    Auto-Crop
                  </button>

                  {/* Clean Bubbles */}
                  <button
                    type="button"
                    disabled={
                      isBatchCropping || isCleaningBubbles || isBatchMerging
                    }
                    onClick={handleCleanBubblesSelected}
                    className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                    title="Remove speech bubbles from selected storyboard panels"
                  >
                    {isCleaningBubbles ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                    )}
                    Clean Bubbles
                  </button>

                  {/* Stitch */}
                  <button
                    type="button"
                    disabled={
                      isBatchCropping ||
                      isCleaningBubbles ||
                      isBatchMerging ||
                      selectedCount < 2
                    }
                    onClick={handleBatchMergeSelected}
                    className="px-3 sm:px-4 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Stitch selected storyboard panels vertically into one panel"
                  >
                    {isBatchMerging ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                    ) : (
                      <Link2 className="h-4 w-4 text-purple-400" />
                    )}
                    Stitch
                  </button>

                  {/* Delete Selected */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log(
                        `[TimelineSelectionBar] Delete ${selectedCount} selected panels`
                      );
                      handleDeleteSelected();
                    }}
                    className="px-3 sm:px-4 py-2 text-xs rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-350 hover:text-rose-100 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Trash className="h-3.5 w-3.5 text-rose-400" />
                    Delete ({selectedCount})
                  </button>

                  {/* Clear / Dismiss */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[TimelineSelectionBar] Clearing selection");
                      clearSelection();
                    }}
                    className="p-2 text-xs rounded-xl border font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    title="Clear Selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* Right section empty / hidden */}
          <div className="shrink-0 ml-auto" />
        </div>
      </div>
    </div>,
    document.body
  );
}
