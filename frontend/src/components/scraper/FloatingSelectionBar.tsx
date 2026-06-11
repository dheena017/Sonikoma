import React from "react";
import {
  Scissors,
  Sparkles,
  Link2,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  isBatchMerging: boolean;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleBatchMergeSelected: () => void;
  handleAddToCanvas: () => void;
  handleDeleteSelected: () => void;
  handleClearAll: () => void;
}

export function FloatingSelectionBar({
  selectedCount,
  isBatchCropping,
  batchProgress,
  isCleaningBubbles,
  cleanProgress,
  isBatchMerging,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  handleAddToCanvas,
  handleDeleteSelected,
  handleClearAll,
}: FloatingSelectionBarProps) {
  const isAnyBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300 ease-out",
        selectedCount > 0
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Glow line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap sm:flex-nowrap">

          {/* Selection Count Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative flex items-center justify-center">
              {/* Animated pulse ring */}
              <div className="absolute inset-0 rounded-full bg-purple-500/25 animate-ping" />
              <div className="relative h-8 w-8 rounded-full bg-purple-950/80 border border-purple-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <span className="text-[10px] font-bold text-purple-300 font-mono">
                  {selectedCount > 99 ? "99+" : selectedCount}
                </span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-bold text-white font-mono">
                {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                Choose a batch action below
              </span>
            </div>
          </div>

          {/* Progress indicator when busy */}
          {isAnyBusy && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-300 text-[9px] font-mono shrink-0">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>
                {isBatchCropping && batchProgress
                  ? `Cropping ${batchProgress.current}/${batchProgress.total}`
                  : isCleaningBubbles && cleanProgress
                  ? `Cleaning ${cleanProgress.current}/${cleanProgress.total}`
                  : isBatchMerging
                  ? "Stitching panels…"
                  : "Processing…"}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="h-8 w-px bg-neutral-800 shrink-0 hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {/* Auto-Crop */}
            <button
              type="button"
              onClick={handleAutoCropSelected}
              disabled={isAnyBusy}
              title="Auto-Crop selected panels"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-indigo-950/60 border border-neutral-800 hover:border-indigo-700/50 text-neutral-300 hover:text-indigo-300 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBatchCropping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Scissors className="h-3.5 w-3.5" />
              )}
              <span>Auto-Crop</span>
            </button>

            {/* Clean Bubbles */}
            <button
              type="button"
              onClick={handleCleanBubblesSelected}
              disabled={isAnyBusy}
              title="Clean speech bubbles from selected panels"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-violet-950/60 border border-neutral-800 hover:border-violet-700/50 text-neutral-300 hover:text-violet-300 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCleaningBubbles ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>Clean Bubbles</span>
            </button>

            {/* Stitch */}
            <button
              type="button"
              onClick={handleBatchMergeSelected}
              disabled={isAnyBusy || selectedCount < 2}
              title="Stitch selected panels into one vertical strip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-blue-950/60 border border-neutral-800 hover:border-blue-700/50 text-neutral-300 hover:text-blue-300 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBatchMerging ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              <span>Stitch</span>
            </button>

            {/* Add to Canvas */}
            <button
              type="button"
              onClick={handleAddToCanvas}
              disabled={isAnyBusy}
              title="Add selected panels to storyboard canvas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500/90 hover:to-indigo-500/90 border border-purple-500/30 text-white text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add to Canvas</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isAnyBusy}
              title="Delete selected panels from the deck"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-700/50 text-neutral-400 hover:text-red-400 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>

          {/* Clear all / dismiss */}
          <button
            type="button"
            onClick={handleClearAll}
            title="Deselect all panels"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-500 hover:text-white text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer shrink-0 ml-auto sm:ml-0"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
