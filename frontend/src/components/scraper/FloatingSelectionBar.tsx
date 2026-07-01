import React from "react";
import { createPortal } from "react-dom";
import {
  Scissors,
  Sparkles,
  Link2,
  Plus,
  Trash2,
  X,
  Download,
  RefreshCw,
  Loader2,
  Square,
  CheckSquare,
  Settings2,
  ListFilter,
  ChevronDown,
  FlipHorizontal,
  RotateCcw,
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
  handleDownloadZip?: () => void;
  isZipping?: boolean;
  // Selection/filter controls moved from header
  scrapedImages?: string[];
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  handleInvertSelection?: () => void;
  handleSelectOdd?: () => void;
  handleSelectEven?: () => void;
  handleReverseDeckOrder?: () => void;
  handleSelectFirstN?: (n: number) => void;
  handleSelectLastN?: (n: number) => void;
  handleSelectRange?: (a: number, b: number) => void;
  leftDock?: boolean;
  setShowAutoCropModal?: (v: boolean) => void;
  setShowBubbleModal?: (v: boolean) => void;
  handleCancelBatch?: () => void;
}

// --- ScraperSelectionToolbar (merged) ---------------------------------
interface ScraperSelectionToolbarProps {
  scrapedImages: string[];
  selectedScraped: string[];
  handleInvertSelection: () => void;
  handleSelectOdd: () => void;
  handleSelectEven: () => void;
  handleReverseDeckOrder: () => void;
  handleSelectFirstN: (n: number) => void;
  handleSelectLastN: (n: number) => void;
  handleSelectRange: (a: number, b: number) => void;
  handleClearAll: () => void;
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ScraperSelectionToolbar({
  scrapedImages,
  selectedScraped,
  handleInvertSelection,
  handleSelectOdd,
  handleSelectEven,
  handleReverseDeckOrder,
  handleSelectFirstN,
  handleSelectLastN,
  handleSelectRange,
  handleClearAll,
  setSelectedScraped,
}: ScraperSelectionToolbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [everyN, setEveryN] = React.useState<number>(3);
  const [rangeFrom, setRangeFrom] = React.useState<number>(1);
  const [rangeTo, setRangeTo] = React.useState<number>(5);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectEveryNth = (n: number) => {
    if (!setSelectedScraped) return;
    const selected = scrapedImages.filter((_, idx) => idx % n === 0);
    setSelectedScraped(selected);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="relative inline-block text-left shrink-0"
        ref={dropdownRef}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 rounded-xl text-[10px] font-bold text-neutral-300 hover:text-white transition-all duration-150 shadow-md font-mono select-none cursor-pointer shrink-0 whitespace-nowrap"
        >
          <ListFilter className="h-3 w-3 text-indigo-400" />
          <span>Selection Filter</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 text-neutral-500 ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-neutral-950 border border-neutral-850 shadow-2xl p-2.5 z-50 flex flex-col gap-1 animate-[fadeIn_0.1s_ease-out]">
            <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 mb-1 select-none">
              Bulk Operations
            </div>
            <button
              onClick={() => {
                if (setSelectedScraped) setSelectedScraped(scrapedImages);
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
            >
              Select All Panels ({scrapedImages.length})
            </button>
            <button
              onClick={() => {
                handleClearAll();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
            >
              Deselect All Panels
            </button>

            <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 my-1 select-none">
              Sequence Filters
            </div>
            <button
              onClick={() => {
                handleSelectOdd();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
            >
              Select Odd Panels
            </button>
            <button
              onClick={() => {
                handleSelectEven();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
            >
              Select Even Panels
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1">
              <span className="text-[10px] text-neutral-400 font-sans">Every</span>
              <input
                type="number"
                min="1"
                max="99"
                value={everyN}
                onChange={(e) =>
                  setEveryN(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-8 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500 text-center"
              />
              <span className="text-[10px] text-neutral-400 font-sans">th panel</span>
              <button
                type="button"
                onClick={() => {
                  selectEveryNth(everyN);
                  setIsOpen(false);
                }}
                className="ml-auto px-2 py-0.5 rounded bg-indigo-650 hover:bg-indigo-600 text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-indigo-500/20 active:scale-95"
              >
                Apply
              </button>
            </div>

            <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 my-1 select-none">
              Deck Actions
            </div>
            <button
              onClick={() => {
                handleInvertSelection();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer flex items-center justify-between font-medium"
            >
              <span>Invert Selection</span>
              <FlipHorizontal className="h-3 w-3 text-neutral-500" />
            </button>
            <button
              onClick={() => {
                handleReverseDeckOrder();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer flex items-center justify-between font-medium"
            >
              <span>Reverse Deck Sequence</span>
              <RotateCcw className="h-3 w-3 text-neutral-500" />
            </button>

            <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 my-1 select-none">
              Range Selection
            </div>
            <div className="grid grid-cols-3 gap-1 px-1 py-1">
              <button
                onClick={() => {
                  handleSelectFirstN(5);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-all font-semibold cursor-pointer text-center"
              >
                First 5
              </button>
              <button
                onClick={() => {
                  handleSelectFirstN(10);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-all font-semibold cursor-pointer text-center"
              >
                First 10
              </button>
              <button
                onClick={() => {
                  handleSelectLastN(5);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-all font-semibold cursor-pointer text-center"
              >
                Last 5
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 px-1 py-1">
              <button
                onClick={() => {
                  handleSelectRange(1, 5);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono transition-all font-semibold cursor-pointer text-center"
              >
                Range 1-5
              </button>
              <button
                onClick={() => {
                  handleSelectRange(6, 10);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono transition-all font-semibold cursor-pointer text-center"
              >
                Range 6-10
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-neutral-900 mt-1.5">
              <span className="text-[10px] text-neutral-400 font-sans">Range</span>
              <input
                type="number"
                min="1"
                max={scrapedImages.length}
                value={rangeFrom}
                onChange={(e) =>
                  setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500 text-center"
              />
              <span className="text-[10px] text-neutral-400 font-sans">to</span>
              <input
                type="number"
                min="1"
                max={scrapedImages.length}
                value={rangeTo}
                onChange={(e) =>
                  setRangeTo(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  handleSelectRange(rangeFrom, rangeTo);
                  setIsOpen(false);
                }}
                className="ml-auto px-2.5 py-0.5 rounded bg-emerald-650 hover:bg-emerald-600 text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-emerald-500/20 active:scale-95"
              >
                Select
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedScraped.length > 0 && (
        <button
          onClick={handleClearAll}
          className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-red-950/40 bg-red-950/15 hover:bg-red-900/25 text-red-400 hover:text-red-300 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)] transition-all duration-150 flex items-center gap-1.5 cursor-pointer ml-auto font-mono select-none shrink-0 whitespace-nowrap"
        >
          <Trash2 className="h-3 w-3 shrink-0" />
          <span>Clear Selection ({selectedScraped.length})</span>
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------

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
  handleDownloadZip,
  isZipping = false,
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  handleInvertSelection,
  handleSelectOdd,
  handleSelectEven,
  handleReverseDeckOrder,
  handleSelectFirstN,
  handleSelectLastN,
  handleSelectRange,
  setShowAutoCropModal,
  setShowBubbleModal,
  handleCancelBatch,
  leftDock = false,
}: FloatingSelectionBarProps) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isAnyBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;

  // Safeguard: Ensure we are in a browser environment before using the DOM
  if (typeof document === "undefined") return null;

  // Determine visibility: for left-dock show when there are images (totalCount>0),
  // for bottom floating bar show when at least one panel is selected.
  const visible = leftDock ? totalCount > 0 : selectedCount > 0;

  const outerClass = leftDock
    ? `fixed left-24 top-16 bottom-4 z-[9999] transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "-translate-x-1/4 opacity-0 pointer-events-none"
      }`
    : `fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`;

  return createPortal(
    <div className={outerClass}>
      {/* Container with neutral border and standard dark shadow (no glow) */}
      <div
        className={
          leftDock
            ? "h-full w-72 bg-neutral-950/90 backdrop-blur-2xl border border-neutral-800/80 px-3 py-4 shadow-2xl shadow-black/50 rounded-2xl"
            : "bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-2xl shadow-black/50"
        }
      >
        <div
          className={
            leftDock
              ? "h-full flex flex-col gap-3 overflow-auto custom-scrollbar pb-1"
              : "max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-0"
          }
        >
          {/* Selection Count / header */}
          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 shrink-0">
            <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
              {selectedCount > 99 ? "99+" : selectedCount}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-[9px] text-purple-400 font-mono leading-tight whitespace-nowrap">
                of {totalCount} images
              </p>
            </div>
          </div>

          {/* Progress indicator when busy */}
          {isAnyBusy && (
            <div className={leftDock ? "flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-300 text-xs font-mono shrink-0" : "flex flex-col gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-300 text-xs font-mono shrink-0 min-w-[170px]"}>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                <span className="font-bold tracking-tight whitespace-nowrap">
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
              {((isBatchCropping && batchProgress) ||
                (isCleaningBubbles && cleanProgress)) &&
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
                })()}
            </div>
          )}

          {/* Divider */}
          <div className={leftDock ? "h-px w-full bg-neutral-800/60 my-1" : "h-6 w-px bg-neutral-800 shrink-0 hidden sm:block"} />

          {/* Selection Filter toolbar (moved from header) */}
          <div className={leftDock ? "w-full" : "hidden sm:flex items-center ml-3 mr-1"}>
            {typeof window !== "undefined" && (
              <ScraperSelectionToolbar
                scrapedImages={scrapedImages || []}
                selectedScraped={selectedScraped || []}
                handleInvertSelection={handleInvertSelection || (() => {})}
                handleSelectOdd={handleSelectOdd || (() => {})}
                handleSelectEven={handleSelectEven || (() => {})}
                handleReverseDeckOrder={handleReverseDeckOrder || (() => {})}
                handleSelectFirstN={handleSelectFirstN || ((n: number) => {})}
                handleSelectLastN={handleSelectLastN || ((n: number) => {})}
                handleSelectRange={handleSelectRange || ((a: number, b: number) => {})}
                handleClearAll={handleClearAll}
                setSelectedScraped={setSelectedScraped}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className={leftDock ? "flex flex-col gap-2 mt-2" : "flex items-center gap-2 flex-nowrap shrink-0 ml-auto"}>
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
            {isBatchCropping ? (
              <button
                type="button"
                onClick={() => handleCancelBatch && handleCancelBatch()}
                className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-xl"
              >
                <X className="h-4 w-4" />
                Stop Auto-Crop
              </button>
            ) : (
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
                <Scissors className="h-4 w-4 text-purple-400" />
                Auto-Crop
              </button>
            )}

            {/* Clean Bubbles */}
            {isCleaningBubbles ? (
              <button
                type="button"
                onClick={() => handleCancelBatch && handleCancelBatch()}
                className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-xl"
              >
                <X className="h-4 w-4" />
                Stop Clean
              </button>
            ) : (
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
                <Sparkles className="h-4 w-4 text-purple-400" />
                Clean Bubbles
              </button>
            )}

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

            {/* Download ZIP (moved from header) */}
            <button
              type="button"
              onClick={() => {
                if (handleDownloadZip) handleDownloadZip();
              }}
              disabled={!handleDownloadZip || isZipping}
              title="Download selected or all images as ZIP"
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZipping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-purple-400" />
              )}
              {isZipping ? "Downloading..." : "Download ZIP"}
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
              title="Add selected panels to timeline"
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 text-white" />
              Add to Timeline
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
            {leftDock ? (
              <button
                type="button"
                onClick={handleClearAll}
                title="Deselect all panels"
                className="px-3 py-2 mt-auto rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
                <span className="ml-2 text-[12px]">Clear</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearAll}
                title="Deselect all panels"
                className="p-2 ml-auto rounded-full font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
}
