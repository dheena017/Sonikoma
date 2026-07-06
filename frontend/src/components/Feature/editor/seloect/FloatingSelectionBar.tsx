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
  ListFilter,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  RotateCcw,
  RotateCw,
  Copy,
  ArrowUpDown,
  MoveRight,
  ClipboardCopy,
  Image as ImageIcon,
  Brain,
  Trash,
} from "lucide-react";
import * as api from "@/api";

// ── Types ────────────────────────────────────────────────────────────

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
  // Selection/filter controls
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
  // Optional Parent overrides
  handleFlipSelected?: () => void;
  handleRotateSelected?: () => void;
  handleDuplicateToTimeline?: () => void;
  handleAnalyzeAll?: () => void;
  isAnalyzingAll?: boolean;
  handleSortSelected?: (order: "asc" | "desc") => void;
  handleExportIndividual?: () => void;
  isExporting?: boolean;
  handleCopyMetadata?: () => void;
  handleMoveToPosition?: (position: number) => void;
  // State injection for direct inline operations
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type: any) => void;
}

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
  handleCancelAnalysis?: () => void;
  handleCancelBatch?: () => void;
  // Optional Parent overrides
  handleFlipSelected?: () => void;
  handleRotateSelected?: () => void;
  handleDuplicateSelected?: () => void;
  handleAnalyzeAll?: () => void;
  handleSortSelected?: (order: "asc" | "desc") => void;
  handleExportIndividual?: () => void;
  isExporting?: boolean;
  handleCopyMetadata?: () => void;
  handleMoveToPosition?: (position: number) => void;
  // State injection for direct inline operations
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedPanelIds?: Set<number>;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type: any) => void;
}

// ── ScraperSelectionToolbar ──────────────────────────────────────────

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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-[10px] font-bold text-neutral-300 hover:text-white transition-all shadow-md font-mono select-none cursor-pointer"
      >
        <ListFilter className="h-3 w-3 text-purple-400" />
        <span>Select Filter</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 text-neutral-500 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl bg-neutral-950 border border-neutral-850 shadow-2xl p-2.5 z-[10000] flex flex-col gap-1">
          <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 mb-1 select-none">
            Bulk Operations
          </div>
          <button
            onClick={() => {
              if (setSelectedScraped) setSelectedScraped(scrapedImages);
              setIsOpen(false);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-450 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
          >
            Select All Panels ({scrapedImages.length})
          </button>
          <button
            onClick={() => {
              handleClearAll();
              setIsOpen(false);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
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
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
          >
            Select Odd Panels
          </button>
          <button
            onClick={() => {
              handleSelectEven();
              setIsOpen(false);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium"
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
              className="w-8 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-purple-500 text-center"
            />
            <span className="text-[10px] text-neutral-400 font-sans">th panel</span>
            <button
              type="button"
              onClick={() => {
                selectEveryNth(everyN);
                setIsOpen(false);
              }}
              className="ml-auto px-2 py-0.5 rounded bg-purple-650 hover:bg-purple-600 text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-purple-500/20 active:scale-95"
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
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer flex items-center justify-between font-medium"
          >
            <span>Invert Selection</span>
            <FlipHorizontal className="h-3 w-3 text-neutral-500" />
          </button>
          <button
            onClick={() => {
              handleReverseDeckOrder();
              setIsOpen(false);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer flex items-center justify-between font-medium"
          >
            <span>Reverse Deck Order</span>
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
              className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-purple-400 hover:text-purple-300 font-mono transition-all font-semibold cursor-pointer text-center"
            >
              First 5
            </button>
            <button
              onClick={() => {
                handleSelectFirstN(10);
                setIsOpen(false);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-purple-400 hover:text-purple-300 font-mono transition-all font-semibold cursor-pointer text-center"
            >
              First 10
            </button>
            <button
              onClick={() => {
                handleSelectLastN(5);
                setIsOpen(false);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-purple-400 hover:text-purple-300 font-mono transition-all font-semibold cursor-pointer text-center"
            >
              Last 5
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
              className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-purple-500 text-center"
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
              className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-purple-500 text-center"
            />
            <button
              type="button"
              onClick={() => {
                handleSelectRange(rangeFrom, rangeTo);
                setIsOpen(false);
              }}
              className="ml-auto px-2.5 py-0.5 rounded bg-purple-650 hover:bg-purple-600 text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-purple-500/20 active:scale-95"
            >
              Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FloatingSelectionBar (Imported Assets) ──────────────────────────

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
  scrapedImages = [],
  selectedScraped = [],
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
  handleFlipSelected,
  handleRotateSelected,
  handleDuplicateToTimeline,
  handleAnalyzeAll,
  isAnalyzingAll = false,
  handleSortSelected,
  handleExportIndividual,
  isExporting = false,
  handleCopyMetadata,
  handleMoveToPosition,
  setScrapedImages,
  fetchWithInterceptor,
  addNotification,
}: FloatingSelectionBarProps) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isAnyBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const [moveToPos, setMoveToPos] = React.useState<number>(1);
  const [timelineHeight, setTimelineHeight] = React.useState(0);
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [barHeight, setBarHeight] = React.useState(0);
  const barRef = React.useRef<HTMLDivElement>(null);

  // Track bar height for More-panel positioning
  React.useEffect(() => {
    if (!barRef.current) return;
    const ro = new ResizeObserver(() => {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);
    });
    ro.observe(barRef.current);
    setBarHeight(barRef.current.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // mutation observer to track timeline selection bar height
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const updateHeight = () => {
      const el = document.querySelector("#timeline-selection-bar-portal");
      if (el && el.classList.contains("opacity-100")) {
        const height = el.getBoundingClientRect().height;
        setTimelineHeight(height);
      } else {
        setTimelineHeight(0);
      }
    };

    updateHeight();
    const observer = new MutationObserver(updateHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  if (typeof document === "undefined") return null;

  const visible = totalCount > 0 && selectedCount > 0;

  // Full width z-[9999] transitions bottom-0
  const outerClass = leftDock
    ? `fixed left-24 top-16 bottom-4 z-[9999] transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "-translate-x-1/4 opacity-0 pointer-events-none"
      }`
    : `fixed left-0 right-0 z-[9999] transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`;

  // Stacking offset style when both bars are visible
  const stackStyle: React.CSSProperties =
    !leftDock && visible && timelineHeight > 0
      ? { bottom: `${timelineHeight}px` }
      : { bottom: 0 };

  // ── Default Operation Implementations ──────────────────────────────

  const flipSelected = handleFlipSelected || (async () => {
    if (selectedScraped.length === 0 || !setScrapedImages || !fetchWithInterceptor) return;
    setBusyLocal(true);
    addNotification?.(`Flipping ${selectedScraped.length} images...`, "info");
    try {
      const updatedList = [...scrapedImages];
      for (const url of selectedScraped) {
        const data = await api.editImage(fetchWithInterceptor, {
          url: url,
          flipHorizontal: true,
          autoTrim: false,
        });
        if (data.url) {
          const idx = updatedList.indexOf(url);
          if (idx !== -1) updatedList[idx] = data.url;
        }
      }
      setScrapedImages(updatedList);
      setSelectedScraped?.([]);
      addNotification?.("Flipped selected frames successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addNotification?.(`Flip failed: ${err.message}`, "error");
    } finally {
      setBusyLocal(false);
    }
  });

  const rotateSelected = handleRotateSelected || (async () => {
    if (selectedScraped.length === 0 || !setScrapedImages || !fetchWithInterceptor) return;
    setBusyLocal(true);
    addNotification?.(`Rotating ${selectedScraped.length} images...`, "info");
    try {
      const updatedList = [...scrapedImages];
      for (const url of selectedScraped) {
        const data = await api.editImage(fetchWithInterceptor, {
          url: url,
          rotate: 90,
          autoTrim: false,
        });
        if (data.url) {
          const idx = updatedList.indexOf(url);
          if (idx !== -1) updatedList[idx] = data.url;
        }
      }
      setScrapedImages(updatedList);
      setSelectedScraped?.([]);
      addNotification?.("Rotated selected frames successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addNotification?.(`Rotate failed: ${err.message}`, "error");
    } finally {
      setBusyLocal(false);
    }
  });

  const duplicateToTimeline = handleDuplicateToTimeline || (() => {
    handleAddToStoryboard();
  });

  const sortSelected = handleSortSelected || ((order: "asc" | "desc") => {
    if (!setSelectedScraped) return;
    const sorted = [...selectedScraped].sort((a, b) => {
      const idxA = scrapedImages.indexOf(a);
      const idxB = scrapedImages.indexOf(b);
      return order === "asc" ? idxA - idxB : idxB - idxA;
    });
    setSelectedScraped(sorted);
    addNotification?.(`Selection sorted in ${order}ending order`, "success");
  });

  const exportIndividual = handleExportIndividual || (() => {
    if (selectedScraped.length === 0) return;
    addNotification?.("Downloading individual assets...", "info");
    selectedScraped.forEach((url, i) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `imported-asset-${i + 1}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });

  const copyMetadata = handleCopyMetadata || (() => {
    if (selectedScraped.length === 0) return;
    const meta = selectedScraped.map((url, i) => ({
      index: scrapedImages.indexOf(url) + 1,
      source_url: url,
      type: "imported_asset",
    }));
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    addNotification?.("Copied metadata JSON to clipboard!", "success");
  });

  const moveToPosition = handleMoveToPosition || ((pos: number) => {
    if (selectedScraped.length === 0 || !setScrapedImages) return;
    const targetIdx = Math.min(scrapedImages.length, Math.max(0, pos - 1));
    const itemsToMove = scrapedImages.filter((img) => selectedScraped.includes(img));
    const remaining = scrapedImages.filter((img) => !selectedScraped.includes(img));
    
    const nextList = [...remaining];
    nextList.splice(targetIdx, 0, ...itemsToMove);
    setScrapedImages(nextList);
    addNotification?.(`Moved ${selectedScraped.length} assets to position #${pos}`, "success");
  });

  return createPortal(
    <>
      {/* More Actions Floating Panel — portal-rendered above the bar */}
      {showMoreActions && visible && createPortal(
        <div
          style={{ bottom: `${timelineHeight + barHeight}px` }}
          className="fixed left-0 right-0 z-[10001] bg-neutral-950/95 backdrop-blur-2xl border-t border-b border-neutral-800/80 px-6 py-4 shadow-2xl shadow-black/60 w-full animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <div className="w-full flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest font-mono">
                Extended Actions — Imported Assets
              </span>
              <div className="flex-1 h-px bg-neutral-800/60" />
              <button
                type="button"
                onClick={() => setShowMoreActions(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <button type="button" onClick={flipSelected} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-sky-300 hover:border-sky-500/40">
              <FlipHorizontal className="h-4 w-4 text-sky-400" /> Flip
            </button>

            <button type="button" onClick={rotateSelected} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40">
              <RotateCw className="h-4 w-4 text-amber-400" /> Rotate 90°
            </button>

            <button type="button" onClick={duplicateToTimeline} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-300 hover:border-emerald-500/40">
              <Copy className="h-4 w-4 text-emerald-400" /> Duplicate
            </button>

            {handleAnalyzeAll && (
              <button type="button" onClick={handleAnalyzeAll} disabled={isAnalyzingAll || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-purple-950/40 border-purple-800/50 hover:bg-purple-900/60 text-purple-300 hover:border-purple-500">
                <Brain className="h-4 w-4 text-purple-400" /> AI Analyze
              </button>
            )}

            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => sortSelected("asc")}
                className="px-3 py-2 text-xs rounded-l-xl border font-bold flex items-center gap-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300">
                <ArrowUpDown className="h-4 w-4 text-indigo-400" /> Sort ↑
              </button>
              <button type="button" onClick={() => sortSelected("desc")}
                className="px-3 py-2 text-xs rounded-r-xl border-t border-r border-b font-bold flex items-center gap-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300">
                Sort ↓
              </button>
            </div>

            <button type="button" onClick={exportIndividual}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 hover:border-cyan-500/40">
              <ImageIcon className="h-4 w-4 text-cyan-400" /> Export
            </button>

            <button type="button" onClick={copyMetadata}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-teal-300 hover:border-teal-500/40">
              <ClipboardCopy className="h-4 w-4 text-teal-400" /> Copy Metadata
            </button>

            <div className="flex items-center gap-1.5">
              <MoveRight className="h-4 w-4 text-orange-400 shrink-0" />
              <input type="number" min={1} max={totalCount} value={moveToPos}
                onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 px-1.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-[10px] font-mono focus:outline-none focus:border-orange-500/60 text-center" />
              <button type="button" onClick={() => moveToPosition(moveToPos)} disabled={isAnyBusy || busyLocal}
                className="px-3 py-1.5 text-xs rounded-lg bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/45 text-orange-300 font-bold transition-all cursor-pointer">
                Move
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div
        id="scraper-selection-bar-portal"
        className={outerClass}
        style={leftDock ? undefined : stackStyle}
      >
        <div
          ref={barRef}
          className={
            leftDock
              ? "h-full w-72 bg-neutral-950/90 backdrop-blur-2xl border border-neutral-800/80 px-3 py-4 shadow-2xl shadow-black/50 rounded-2xl"
              : "relative flex flex-col"
          }
        >
          {/* Gradient breathing space above the bar */}
          {!leftDock && (
            <div className="h-10 w-full bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />
          )}
          <div className={leftDock ? "h-full flex flex-col gap-3 overflow-auto custom-scrollbar pb-1" : "bg-neutral-950/95 backdrop-blur-2xl border-t border-neutral-700/50 px-6 py-4 shadow-2xl shadow-black/60 w-full"}>
          <div className={leftDock ? "" : "max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap md:flex-nowrap"}>
          {/* Left section: Header/Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3.5 py-2 shrink-0">
              <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
                {selectedCount}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                  Imported Assets Selected
                </p>
                <p className="text-[9px] text-purple-400 font-mono leading-tight whitespace-nowrap">
                  {selectedCount} of {totalCount} images
                </p>
              </div>
            </div>

            {/* Progress */}
            {(isAnyBusy || busyLocal) && (
              <div className="flex flex-col gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-300 text-xs font-mono shrink-0">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span className="font-bold tracking-tight whitespace-nowrap">
                    {isBatchCropping && batchProgress
                      ? `Cropping ${batchProgress.current}/${batchProgress.total}`
                      : isCleaningBubbles && cleanProgress
                      ? `Cleaning ${cleanProgress.current}/${cleanProgress.total}`
                      : isBatchMerging
                      ? "Stitching..."
                      : "Processing..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right section: Actions wrapper */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Filter toolbar */}
            {!leftDock && scrapedImages.length > 0 && (
              <ScraperSelectionToolbar
                scrapedImages={scrapedImages}
                selectedScraped={selectedScraped}
                handleInvertSelection={handleInvertSelection || (() => {})}
                handleSelectOdd={handleSelectOdd || (() => {})}
                handleSelectEven={handleSelectEven || (() => {})}
                handleReverseDeckOrder={handleReverseDeckOrder || (() => {})}
                handleSelectFirstN={handleSelectFirstN || (() => {})}
                handleSelectLastN={handleSelectLastN || (() => {})}
                handleSelectRange={handleSelectRange || (() => {})}
                handleClearAll={handleClearAll}
                setSelectedScraped={setSelectedScraped}
              />
            )}

            {/* Select/Deselect All */}
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            >
              {isAllSelected ? (
                <Square className="h-4 w-4 text-neutral-400" />
              ) : (
                <CheckSquare className="h-4 w-4 text-purple-400" />
              )}
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>

            {/* Add to Storyboard */}
            <button
              type="button"
              onClick={handleAddToStoryboard}
              disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-purple-650 border-purple-550 hover:bg-purple-600 text-white shadow-md hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add to Storyboard
            </button>

            {/* Zip Download */}
            {handleDownloadZip && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
              >
                {isZipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-purple-400" />
                )}
                Zip
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border border-rose-950/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-350 hover:text-rose-100 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              Delete
            </button>

            {/* More toggle */}
            <button
              type="button"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-neutral-900 border-neutral-700 hover:border-purple-500/40 hover:bg-purple-950/20 text-neutral-400 hover:text-purple-300"
            >
              {showMoreActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>More</span>
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}


// ── TimelineSelectionBar (Timeline & Text) ──────────────────────────

export function TimelineSelectionBar({
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
  handleCancelAnalysis,
  handleCancelBatch,
  handleFlipSelected,
  handleRotateSelected,
  handleDuplicateSelected,
  handleAnalyzeAll,
  handleSortSelected,
  handleExportIndividual,
  isExporting = false,
  handleCopyMetadata,
  handleMoveToPosition,
  panels = [],
  setPanels,
  selectedPanelIds = new Set(),
  fetchWithInterceptor,
  addNotification,
}: TimelineSelectionBarProps) {
  const isProcessing = isBatchCropping || isCleaningBubbles || isBatchMerging;
  const isVisible = selectedCount > 0 || isProcessing;
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const [moveToPos, setMoveToPos] = React.useState<number>(1);
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [barHeight, setBarHeight] = React.useState(0);
  const barRef = React.useRef<HTMLDivElement>(null);

  // Track bar height for More-panel positioning
  React.useEffect(() => {
    if (!barRef.current) return;
    const ro = new ResizeObserver(() => {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);
    });
    ro.observe(barRef.current);
    setBarHeight(barRef.current.offsetHeight);
    return () => ro.disconnect();
  }, []);

  if (typeof document === "undefined") return null;

  // Full width z-[9998] transition bottom-0
  const outerClass = `fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-300 ease-out ${
    isVisible
      ? "translate-y-0 opacity-100 pointer-events-auto"
      : "translate-y-full opacity-0 pointer-events-none"
  }`;

  // ── Default Operation Implementations ──────────────────────────────

  const flipSelected = handleFlipSelected || (async () => {
    if (selectedPanelIds.size === 0 || !setPanels || !fetchWithInterceptor) return;
    setBusyLocal(true);
    addNotification?.(`Flipping ${selectedPanelIds.size} panels...`, "info");
    try {
      const updatedPanels = [...panels];
      for (const p of updatedPanels) {
        if (selectedPanelIds.has(p.id)) {
          const data = await api.editImage(fetchWithInterceptor, {
            url: p.image_url,
            flipHorizontal: true,
            autoTrim: false,
          });
          if (data.url) p.image_url = data.url;
        }
      }
      setPanels(updatedPanels);
      clearSelection();
      addNotification?.("Flipped selected panels successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addNotification?.(`Flip failed: ${err.message}`, "error");
    } finally {
      setBusyLocal(false);
    }
  });

  const rotateSelected = handleRotateSelected || (async () => {
    if (selectedPanelIds.size === 0 || !setPanels || !fetchWithInterceptor) return;
    setBusyLocal(true);
    addNotification?.(`Rotating ${selectedPanelIds.size} panels...`, "info");
    try {
      const updatedPanels = [...panels];
      for (const p of updatedPanels) {
        if (selectedPanelIds.has(p.id)) {
          const data = await api.editImage(fetchWithInterceptor, {
            url: p.image_url,
            rotate: 90,
            autoTrim: false,
          });
          if (data.url) p.image_url = data.url;
        }
      }
      setPanels(updatedPanels);
      clearSelection();
      addNotification?.("Rotated selected panels successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addNotification?.(`Rotate failed: ${err.message}`, "error");
    } finally {
      setBusyLocal(false);
    }
  });

  const duplicateSelected = handleDuplicateSelected || (() => {
    if (selectedPanelIds.size === 0 || !setPanels) return;
    setPanels((prev) => {
      const nextList = [];
      let maxId = Math.max(...prev.map((p) => p.id), 0);
      for (const p of prev) {
        nextList.push(p);
        if (selectedPanelIds.has(p.id)) {
          maxId += 1;
          nextList.push({
            ...p,
            id: maxId,
          });
        }
      }
      return nextList;
    });
    clearSelection();
    addNotification?.(`Duplicated ${selectedPanelIds.size} panels successfully!`, "success");
  });

  const sortSelected = handleSortSelected || ((order: "asc" | "desc") => {
    if (selectedPanelIds.size < 2 || !setPanels) return;
    setPanels((prev) => {
      const selectedIndices = prev
        .map((p, idx) => (selectedPanelIds.has(p.id) ? idx : -1))
        .filter((idx) => idx !== -1);
      
      const selectedItems = selectedIndices.map((idx) => prev[idx]);
      selectedItems.sort((a, b) => {
        return order === "asc" ? a.id - b.id : b.id - a.id;
      });

      const nextList = [...prev];
      selectedIndices.forEach((origIdx, sortedIdx) => {
        nextList[origIdx] = selectedItems[sortedIdx];
      });
      return nextList;
    });
    addNotification?.(`Sorted timeline panels successfully!`, "success");
  });

  const exportIndividual = handleExportIndividual || (() => {
    if (selectedPanelIds.size === 0) return;
    addNotification?.("Downloading individual assets...", "info");
    panels
      .filter((p) => selectedPanelIds.has(p.id))
      .forEach((p, i) => {
        const link = document.createElement("a");
        link.href = p.image_url;
        link.download = `timeline-panel-${p.id}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  });

  const copyMetadata = handleCopyMetadata || (() => {
    if (selectedPanelIds.size === 0) return;
    const selected = panels.filter((p) => selectedPanelIds.has(p.id));
    navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
    addNotification?.("Copied metadata JSON to clipboard!", "success");
  });

  const moveToPosition = handleMoveToPosition || ((pos: number) => {
    if (selectedPanelIds.size === 0 || !setPanels) return;
    const targetIdx = Math.min(panels.length, Math.max(0, pos - 1));
    setPanels((prev) => {
      const itemsToMove = prev.filter((p) => selectedPanelIds.has(p.id));
      const remaining = prev.filter((p) => !selectedPanelIds.has(p.id));
      const nextList = [...remaining];
      nextList.splice(targetIdx, 0, ...itemsToMove);
      return nextList;
    });
    addNotification?.(`Moved panels to position #${pos}`, "success");
  });

  return createPortal(
    <div id="timeline-selection-bar-portal" className={outerClass}>
      {/* Gradient breathing space above the bar */}
      <div className="h-10 w-full bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />
      <div className="bg-neutral-950/95 backdrop-blur-2xl border-t border-neutral-700/50 px-6 py-4 shadow-2xl shadow-black/60 w-full" ref={barRef}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
          {/* Left section: Header/Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3.5 py-2 shrink-0">
              <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
                {selectedCount}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                  Timeline Panels Selected
                </p>
                <p className="text-[9px] text-purple-400 font-mono leading-tight whitespace-nowrap">
                  {selectedCount} of {totalCount} frames
                </p>
              </div>
            </div>

            {/* Progress */}
            {(isProcessing || busyLocal) && (
              <div className="flex flex-col gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-300 text-xs font-mono shrink-0">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span className="font-bold tracking-tight whitespace-nowrap">
                    {isBatchCropping && batchProgress
                      ? `Cropping ${batchProgress.current}/${batchProgress.total}`
                      : isCleaningBubbles && cleanProgress
                      ? `Cleaning ${cleanProgress.current}/${cleanProgress.total}`
                      : isBatchMerging
                      ? "Stitching..."
                      : "Processing..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right section: Actions wrapper */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Select/Deselect All */}
            <button
              type="button"
              onClick={selectAllPanels}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            >
              <CheckSquare className="h-4 w-4 text-purple-400" />
              Select All
            </button>

            {/* AI Analyze Selected */}
            {isAnalyzingAll ? (
              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-600 border-rose-500 hover:bg-rose-500 text-white shadow-md hover:shadow-rose-500/20"
              >
                <X className="h-4 w-4 text-white" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAnalyzeSelected}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-purple-650 border-purple-550 hover:bg-purple-600 text-white shadow-md hover:shadow-purple-500/20"
              >
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                Analyze Selected
              </button>
            )}

            {/* Auto-Crop */}
            {isBatchCropping ? (
              <button
                type="button"
                onClick={handleCancelBatch}
                className="px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-xl"
              >
                <X className="h-4 w-4" />
                Stop Crop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAutoCropSelected}
                disabled={isProcessing || busyLocal}
                className="px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 rounded-xl"
              >
                <Scissors className="h-4 w-4 text-purple-400" />
                Auto-Crop
              </button>
            )}

            {/* Clean Bubbles */}
            {isCleaningBubbles ? (
              <button
                type="button"
                onClick={handleCancelBatch}
                className="px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-xl"
              >
                <X className="h-4 w-4" />
                Stop Clean
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCleanBubblesSelected}
                disabled={isProcessing || busyLocal}
                className="px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 rounded-xl"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                Clean Bubbles
              </button>
            )}

            {/* Stitch */}
            <button
              type="button"
              disabled={isProcessing || busyLocal || selectedCount < 2}
              onClick={handleBatchMergeSelected}
              className="px-3.5 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
            >
              <Link2 className="h-4 w-4 text-purple-400" />
              Stitch
            </button>

            {/* Delete Selected */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isProcessing || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border border-rose-950/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-350 hover:text-rose-100 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
            >
              <Trash className="h-4 w-4 text-rose-400" />
              Delete
            </button>

            {/* More toggle */}
            <button
              type="button"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-neutral-900 border-neutral-700 hover:border-purple-500/40 hover:bg-purple-950/20 text-neutral-400 hover:text-purple-300"
            >
              {showMoreActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>More</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={clearSelection}
              className="p-2 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Extended Actions Panel */}
          {showMoreActions && (
            <div className="w-full flex flex-wrap items-center gap-2 border-t border-neutral-800/60 pt-3 mt-1.5">
              <div className="w-full flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest font-mono">
                  Extended Actions
                </span>
                <div className="flex-1 h-px bg-neutral-800/60" />
              </div>

              <button
                type="button"
                onClick={flipSelected}
                disabled={isProcessing || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-sky-300 hover:border-sky-500/40"
              >
                <FlipHorizontal className="h-4 w-4 text-sky-400" />
                Flip
              </button>

              <button
                type="button"
                onClick={rotateSelected}
                disabled={isProcessing || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40"
              >
                <RotateCw className="h-4 w-4 text-amber-400" />
                Rotate 90°
              </button>

              <button
                type="button"
                onClick={duplicateSelected}
                disabled={isProcessing || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-300 hover:border-emerald-500/40"
              >
                <Copy className="h-4 w-4 text-emerald-400" />
                Duplicate
              </button>

              {handleAnalyzeAll && (
                <button
                  type="button"
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzingAll || busyLocal}
                  className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-purple-950/40 border-purple-800/50 hover:bg-purple-900/60 text-purple-300 hover:border-purple-500"
                >
                  <Brain className="h-4 w-4 text-purple-400" />
                  AI Analyze All
                </button>
              )}

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => sortSelected("asc")}
                  className="px-3 py-2 text-xs rounded-l-xl border font-bold flex items-center justify-center gap-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300"
                >
                  <ArrowUpDown className="h-4 w-4 text-indigo-400" />
                  Sort ↑
                </button>
                <button
                  type="button"
                  onClick={() => sortSelected("desc")}
                  className="px-3 py-2 text-xs rounded-r-xl border-t border-r border-b font-bold flex items-center justify-center gap-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300"
                >
                  Sort ↓
                </button>
              </div>

              <button
                type="button"
                onClick={exportIndividual}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 hover:border-cyan-500/40"
              >
                <ImageIcon className="h-4 w-4 text-cyan-400" />
                Export
              </button>

              <button
                type="button"
                onClick={copyMetadata}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-teal-300 hover:border-teal-500/40"
              >
                <ClipboardCopy className="h-4 w-4 text-teal-400" />
                Copy Metadata
              </button>

              <div className="flex items-center gap-1.5">
                <MoveRight className="h-4 w-4 text-orange-400 shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={totalCount}
                  value={moveToPos}
                  onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 px-1.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-[10px] font-mono focus:outline-none focus:border-orange-500/60 text-center"
                />
                <button
                  type="button"
                  onClick={() => moveToPosition(moveToPos)}
                  disabled={isProcessing || busyLocal}
                  className="px-3 py-1.5 text-xs rounded-lg bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/45 text-orange-300 font-bold transition-all cursor-pointer"
                >
                  Move
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
