import React from "react";
import {
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
  Images,
  Search,
  ArrowDownUp,
  CheckCircle2,
  Layers,
  CircleDashed,
  ChevronDown,
  Filter,
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";
import ImportedAssetsFilterBar, {
  AssetFilterStatus,
  AssetSortOrder,
} from "./ImportedAssetsFilterBar";

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
  handleReloadAssets?: () => void;
  isBatchCropping?: boolean;
  batchProgress?: { current: number; total: number } | null;
  isCleaningBubbles?: boolean;
  cleanProgress?: { current: number; total: number } | null;
  isBatchMerging?: boolean;
  isEpisodeCollapsed?: boolean;
  setIsEpisodeCollapsed?: (collapsed: boolean) => void;
  hasMultipleEpisodes?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  filterStatus?: AssetFilterStatus;
  setFilterStatus?: (status: AssetFilterStatus) => void;
  sortOrder?: "asc" | "desc";
  setSortOrder?: (order: "asc" | "desc") => void;
  filteredCount?: number;
  inStoryboardCount?: number;
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
  handleReloadAssets,
  isBatchCropping,
  batchProgress,
  isCleaningBubbles,
  cleanProgress,
  isBatchMerging,
  isEpisodeCollapsed,
  setIsEpisodeCollapsed,
  hasMultipleEpisodes = false,
  searchQuery = "",
  setSearchQuery,
  filterStatus = "all",
  setFilterStatus,
  sortOrder = "asc",
  setSortOrder,
  filteredCount,
  inStoryboardCount = 0,
}: ImportedAssetsHeaderProps) {
  const isAllSelected =
    selectedScrapedLength > 0 && selectedScrapedLength === scrapedImagesLength;
  const isBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterDropdownOpen]);

  // ──────────────────────────────────────────────────────────────────────────
  // Contextual Selection Toolbar Mode
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedScrapedLength > 0) {
    const selectionLeft = (
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-[#2A2A2A] border border-[#3B82F6]/40 rounded-xl px-3 py-1.5 ">
          <div className="h-5 w-5 rounded bg-[#2A2A2A] flex items-center justify-center text-white text-[10px] font-mono font-black">
            {selectedScrapedLength}
          </div>
          <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
            {selectedScrapedLength} of {scrapedImagesLength} Selected
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            title="Clear Selection"
            className="ml-1 p-0.5 rounded-md hover:bg-[#2A2A2A] text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bulk quick selectors */}
        <div className="flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-xl border border-neutral-800 text-[11px] font-mono">
          <button
            type="button"
            onClick={handleSelectAllToggle}
            className="px-2.5 py-1 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer font-bold"
          >
            {isAllSelected ? "Deselect All" : "All"}
          </button>
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A2A2A] border border-[#3B82F6]/40 text-[#60A5FA] text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" />
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
            className="relative overflow-hidden h-8 px-4 rounded-xl font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border border-[#60A5FA]/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer  active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add to Storyboard ({selectedScrapedLength})</span>
          </button>
        )}

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
              <Scissors className="w-3.5 h-3.5 text-[#3B82F6]" />
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
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Clean Bubbles</span>
            </button>
          ))}

        {/* Batch Stitch / Merge */}
        {handleBatchMergeSelected && (
          <button
            type="button"
            onClick={handleBatchMergeSelected}
            className="px-3 py-1.5 text-[11px] font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
          >
            <Link2 className="w-3.5 h-3.5 text-[#3B82F6]" />
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
        className="border-b-0 rounded-2xl bg-gradient-to-r from-[#2A2A2A] via-neutral-950/95 to-neutral-950/95 border border-[#3B82F6]/35 p-3 shadow-lg"
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Standard Deck Header Mode (Nothing Selected)
  // ──────────────────────────────────────────────────────────────────────────
  const titleBlock = (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] flex items-center justify-center  shrink-0">
        <Images className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            Imported Assets
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[10px] font-bold text-[#60A5FA] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] animate-pulse" />
            {filteredCount !== undefined
              ? `${filteredCount} / ${scrapedImagesLength}`
              : scrapedImagesLength}{" "}
            {scrapedImagesLength === 1 ? "Asset" : "Assets"}
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Source comic strips, extracted panels & raw scraped assets
        </p>
      </div>
    </div>
  );

  const centerBlock = (
    <ImportedAssetsFilterBar
      searchQuery={searchQuery || ""}
      setSearchQuery={setSearchQuery || (() => {})}
      filterStatus={(filterStatus as AssetFilterStatus) || "all"}
      setFilterStatus={(setFilterStatus as any) || (() => {})}
      sortOrder={sortOrder || "asc"}
      setSortOrder={setSortOrder || (() => {})}
      viewLayout={viewLayout}
      setViewLayout={setViewLayout}
      totalAssetsCount={scrapedImagesLength}
      filteredAssetsCount={filteredCount ?? scrapedImagesLength}
      selectedCount={selectedScrapedLength}
      inStoryboardCount={inStoryboardCount ?? 0}
    />
  );

  const rightBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {/* Shift+Click Range Selection Tip */}
      {scrapedImagesLength > 1 && (
        <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[10px] text-neutral-400 font-mono">
          <span className="text-amber-400">💡</span>
          <span>Hold</span>
          <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[9px] leading-none">
            Shift
          </kbd>
          <span>for range</span>
        </span>
      )}

      {/* Select All Quick Action */}
      {scrapedImagesLength > 0 && (
        <button
          type="button"
          onClick={handleSelectAllToggle}
          className="text-[11px] font-mono font-bold border border-[#3B82F6]/35 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-[#60A5FA] hover:text-[#3B82F6] rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all  active:scale-95 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Select All</span>
        </button>
      )}

      {scrapedImagesLength > 0 && handleReloadAssets && (
        <button
          type="button"
          onClick={handleReloadAssets}
          title="Reload all assets"
          className="h-8 px-3 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-[#3B82F6] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Assets</span>
        </button>
      )}

      {/* Episode sidebar toggle — only when multiple episodes loaded */}
      {hasMultipleEpisodes && setIsEpisodeCollapsed && (
        <button
          type="button"
          onClick={() => setIsEpisodeCollapsed(!isEpisodeCollapsed)}
          title={
            isEpisodeCollapsed
              ? "Show Episode Navigator"
              : "Hide Episode Navigator"
          }
          className={`h-8 px-3 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
            isEpisodeCollapsed
              ? "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-[#93C5FD] hover:border-[#2F2F2F]"
              : "bg-[#2A2A2A] border-[#2F2F2F] text-[#60A5FA] hover:bg-[#3B82F6]/30"
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
          className="relative overflow-hidden h-8 px-3.5 rounded-xl font-black text-[11px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border border-[#3B82F6]/30 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] active:scale-95"
        >
          <Save className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Save</span>
        </button>
      )}
    </div>
  );

  return (
    <EditorHeaderFrame
      left={titleBlock}
      center={centerBlock}
      right={rightBlock}
    />
  );
}
