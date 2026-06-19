import React from "react";
import { createPortal } from "react-dom";
import {
  Scissors,
  Sparkles,
  Link2,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Square,
  CheckSquare,
  Settings2,
} from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  isBatchMerging: boolean;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleBatchMergeSelected: () => void;
  handleAddToStoryboard: () => void;
  handleDeleteSelected: () => void;
  handleClearAll: () => void;
  handleSelectAllToggle: () => void;
  setShowAutoCropModal?: (v: boolean) => void;
  setShowBubbleModal?: (v: boolean) => void;
}

export function FloatingSelectionBar({
  selectedCount,
  totalCount,
  isBatchCropping,
  batchProgress,
  isCleaningBubbles,
  cleanProgress,
  isBatchMerging,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  handleAddToStoryboard,
  handleDeleteSelected,
  handleClearAll,
  handleSelectAllToggle,
  setShowAutoCropModal,
  setShowBubbleModal,
}: FloatingSelectionBarProps) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isAnyBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  // Safeguard: Ensure we are in a browser environment before using the DOM
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300 ease-out",
        selectedCount > 0
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Container with neutral border and standard dark shadow (no glow) */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Selection Count Badge */}
          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 shrink-0">
            <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
              {selectedCount > 99 ? "99+" : selectedCount}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-[9px] text-purple-400 font-mono leading-tight">
                of {totalCount} frames
              </p>
            </div>
          </div>

          {/* Progress indicator when busy */}
          {isAnyBusy && (
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
          <div className="h-6 w-px bg-neutral-800 shrink-0 hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Select All / Deselect All */}
            <button
              type="button"
              onClick={handleSelectAllToggle}
              disabled={totalCount === 0}
              title={
                isAllSelected ? "Deselect all panels" : "Select all panels"
              }
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isAllSelected ? (
                <Square className="h-4 w-4 text-neutral-400" />
              ) : (
                <CheckSquare className="h-4 w-4 text-purple-400" />
              )}
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>

            {/* Auto-Crop */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "[FloatingSelectionBar] Triggering auto-crop on",
                  selectedCount,
                  "panels"
                );
                handleAutoCropSelected();
              }}
              disabled={isAnyBusy}
              title="Auto-Crop selected panels"
              className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
            >
              {isBatchCropping ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              ) : (
                <Scissors className="h-4 w-4 text-purple-400" />
              )}
              Auto-Crop
            </button>

            {/* Clean Bubbles */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "[FloatingSelectionBar] Triggering clean bubbles on",
                  selectedCount,
                  "panels"
                );
                handleCleanBubblesSelected();
              }}
              disabled={isAnyBusy}
              title="Clean speech bubbles from selected panels"
              className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
            >
              {isCleaningBubbles ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-purple-400" />
              )}
              Clean Bubbles
            </button>

            {/* Stitch */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "[FloatingSelectionBar] Triggering stitch on",
                  selectedCount,
                  "panels"
                );
                handleBatchMergeSelected();
              }}
              disabled={isAnyBusy || selectedCount < 2}
              title="Stitch selected panels into one vertical strip"
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBatchMerging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 text-purple-400" />
              )}
              Stitch
            </button>

            {/* Add to Storyboard */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "[FloatingSelectionBar] Adding",
                  selectedCount,
                  "panels to storyboard"
                );
                handleAddToStoryboard();
              }}
              disabled={isAnyBusy}
              title="Add selected panels to storyboard"
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 text-white" />
              Add to Storyboard
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "[FloatingSelectionBar] Deleting",
                  selectedCount,
                  "panels"
                );
                handleDeleteSelected();
              }}
              disabled={isAnyBusy}
              title="Delete selected panels from the deck"
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-red-950/60 hover:border-red-700/50 text-neutral-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Clear all / dismiss */}
          <button
            type="button"
            onClick={handleClearAll}
            title="Deselect all panels"
            className="ml-auto px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 shrink-0"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
