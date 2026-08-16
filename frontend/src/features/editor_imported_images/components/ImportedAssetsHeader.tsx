import React from "react";
import {
  Image as ImageIcon,
  LayoutGrid,
  Rows,
  Save,
  PanelLeft,
  PanelLeftClose,
  CheckSquare,
  Square,
  Scissors,
  Sparkles,
  Link2,
  Plus,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

export interface ImportedAssetsHeaderProps {
  scrapedImagesLength: number;
  selectedScrapedLength: number;
  viewLayout: "scroll" | "grid";
  setViewLayout: (layout: "scroll" | "grid") => void;
  handleSelectAllToggle: () => void;
  handleClearAll: () => void;
  handleSelectOdd?: () => void;
  handleSelectEven?: () => void;
  handleInvertSelection?: () => void;
  handleAddToStoryboard?: () => void;
  handleAutoCropSelected?: () => void;
  handleCleanBubblesSelected?: () => void;
  handleBatchMergeSelected?: () => void;
  handleDeleteSelected?: () => void;
  handleCancelBatch?: () => void;
  handleSaveAssets?: () => void;
  isBatchCropping?: boolean;
  batchProgress?: { current: number; total: number } | null;
  isCleaningBubbles?: boolean;
  cleanProgress?: { current: number; total: number } | null;
  isBatchMerging?: boolean;
  isEpisodeCollapsed?: boolean;
  setIsEpisodeCollapsed?: (collapsed: boolean) => void;
  hasMultipleEpisodes?: boolean;
}

export default function ImportedAssetsHeader({
  scrapedImagesLength,
  selectedScrapedLength,
  viewLayout,
  setViewLayout,
  handleSelectAllToggle,
  handleClearAll,
  handleSelectOdd,
  handleSelectEven,
  handleInvertSelection,
  handleAddToStoryboard,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  handleDeleteSelected,
  handleCancelBatch,
  handleSaveAssets,
  isBatchCropping,
  batchProgress,
  isCleaningBubbles,
  cleanProgress,
  isBatchMerging,
  isEpisodeCollapsed,
  setIsEpisodeCollapsed,
  hasMultipleEpisodes = false,
}: ImportedAssetsHeaderProps) {
  const isAllSelected = selectedScrapedLength > 0 && selectedScrapedLength === scrapedImagesLength;
  const isBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  // ──────────────────────────────────────────────────────────────────────────
  // Contextual Selection Toolbar Mode
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedScrapedLength > 0) {
    const selectionLeft = (
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
          <div className="h-5 w-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px] font-mono font-black">
            {selectedScrapedLength}
          </div>
          <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
            {selectedScrapedLength} of {scrapedImagesLength} Selected
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            title="Clear Selection"
            className="ml-1 p-0.5 rounded-md hover:bg-emerald-900/60 text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Select / Deselect All */}
        <button
          type="button"
          onClick={handleSelectAllToggle}
          className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {isAllSelected ? (
            <Square className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </button>

        {/* Filter Quick Actions */}
        <div className="hidden sm:flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-xl border border-neutral-800 text-[10px] font-mono">
          {handleSelectOdd && (
            <button
              type="button"
              onClick={handleSelectOdd}
              className="px-2 py-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Odd
            </button>
          )}
          {handleSelectEven && (
            <button
              type="button"
              onClick={handleSelectEven}
              className="px-2 py-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Even
            </button>
          )}
          {handleInvertSelection && (
            <button
              type="button"
              onClick={handleInvertSelection}
              className="px-2 py-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Invert
            </button>
          )}
        </div>

        {/* Busy / Progress Indicator */}
        {isBusy && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
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

    const selectionRight = (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Insert / Add to Storyboard Primary Action Button */}
        {handleAddToStoryboard && (
          <button
            type="button"
            onClick={handleAddToStoryboard}
            disabled={isBusy}
            className="relative overflow-hidden h-8 px-4 rounded-xl font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border border-emerald-400/40 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add to Storyboard ({selectedScrapedLength})</span>
          </button>
        )}

        {/* Auto-Crop */}
        {handleAutoCropSelected && (
          isBatchCropping ? (
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
              <Scissors className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Crop</span>
            </button>
          )
        )}

        {/* Clean Bubbles */}
        {handleCleanBubblesSelected && (
          isCleaningBubbles ? (
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Bubbles</span>
            </button>
          )
        )}

        {/* Stitch */}
        {handleBatchMergeSelected && (
          <button
            type="button"
            disabled={isBusy || selectedScrapedLength < 2}
            onClick={handleBatchMergeSelected}
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stitch</span>
          </button>
        )}

        {/* Delete */}
        {handleDeleteSelected && (
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isBusy}
            title="Delete Selected Assets"
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
        left={selectionLeft}
        right={selectionRight}
        className="border-b-0 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-neutral-950/95 to-neutral-950/95 border border-emerald-500/35 p-2 shadow-lg"
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Standard Deck Header Mode (Nothing Selected)
  // ──────────────────────────────────────────────────────────────────────────
  const titleBlock = (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <ImageIcon className="h-4 w-4" />
      </div>
      <div className="w-px h-4 bg-neutral-800" />
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
        <h3 className="font-black text-[10px] sm:text-[11px] text-white uppercase tracking-widest font-mono truncate" title="Imported Assets Pool">
          Asset Pool Deck
        </h3>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
          {scrapedImagesLength} {scrapedImagesLength === 1 ? "asset" : "assets"}
        </span>
      </div>
    </div>
  );

  const viewToggle = (
    <div className="flex items-center bg-neutral-950/80 p-0.5 rounded-xl border border-neutral-800/80 shrink-0">
      <button
        type="button"
        onClick={() => setViewLayout("scroll")}
        title="Horizontal Scroll View"
        className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
          viewLayout === "scroll"
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(52,211,153,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <Rows className="w-3 h-3" />
        <span>Scroll</span>
      </button>
      <button
        type="button"
        onClick={() => setViewLayout("grid")}
        title="Grid View"
        className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
          viewLayout === "grid"
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(52,211,153,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <LayoutGrid className="w-3 h-3" />
        <span>Grid</span>
      </button>
    </div>
  );

  const rightBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {/* Episode sidebar toggle — only when multiple episodes loaded */}
      {hasMultipleEpisodes && setIsEpisodeCollapsed && (
        <button
          type="button"
          onClick={() => setIsEpisodeCollapsed(!isEpisodeCollapsed)}
          title={isEpisodeCollapsed ? "Show Episode Navigator" : "Hide Episode Navigator"}
          className={`h-7 px-2.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
            isEpisodeCollapsed
              ? "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-emerald-300 hover:border-emerald-700"
              : "bg-emerald-600/20 border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/30"
          }`}
        >
          {isEpisodeCollapsed ? (
            <>
              <PanelLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Episodes</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Episodes</span>
            </>
          )}
        </button>
      )}

      {handleSaveAssets && scrapedImagesLength > 0 && (
        <button
          type="button"
          onClick={handleSaveAssets}
          className="relative overflow-hidden h-7 px-3.5 rounded-lg font-black text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] active:scale-95"
        >
          <Save className="w-3 h-3 text-purple-200" />
          <span>Save</span>
        </button>
      )}
    </div>
  );

  return (
    <EditorHeaderFrame
      left={titleBlock}
      center={viewToggle}
      right={rightBlock}
      className="border-b-0 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 p-2"
    />
  );
}
