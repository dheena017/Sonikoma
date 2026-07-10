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
  isTimeline?: boolean;
  selectedCount: number;
  totalCount: number;

  // Processing states
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  isBatchMerging: boolean;
  isAnalyzingAll?: boolean;
  isZipping?: boolean;
  isExporting?: boolean;

  // Handlers
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleBatchMergeSelected: () => void;
  handleDeleteSelected: () => void;
  handleClearAll?: () => void;
  handleSelectAllToggle?: () => void;
  handleDownloadZip?: () => void;
  handleCancelBatch?: () => void;
  handleCancelAnalysis?: () => void;

  // Assets mode specific handlers
  handleAddToStoryboard?: () => void;

  // Timeline mode specific handlers
  handleAnalyzeSelected?: () => void;
  selectAllPanels?: () => void;
  clearSelection?: () => void;

  // Scraped images data
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
  setShowAutoCropModal?: (show: boolean) => void;
  setShowBubbleModal?: (show: boolean) => void;

  // Timeline panels data
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedPanelIds?: Set<number>;

  // Common overrides
  handleFlipSelected?: () => void;
  handleRotateSelected?: () => void;
  handleDuplicateSelected?: () => void;
  handleDuplicateToTimeline?: () => void;
  handleAnalyzeAll?: () => void;
  handleSortSelected?: (order: "asc" | "desc") => void;
  handleExportIndividual?: () => void;
  handleCopyMetadata?: () => void;
  handleMoveToPosition?: (position: number) => void;

  // UI
  leftDock?: boolean;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type: any) => void;
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
}

// ── Shared Helper Utilities ──────────────────────────────────────────

interface ImageEditParams {
  url: string;
  flipHorizontal?: boolean;
  rotate?: number;
  autoTrim?: boolean;
}

async function editSelectedUrls(
  urls: string[],
  editParams: Partial<ImageEditParams>,
  fetchWithInterceptor: any,
  addNotification?: (msg: string, type: any) => void,
  progressMsg?: string,
  successMsg?: string,
  errorPrefix?: string
): Promise<Record<string, string>> {
  if (urls.length === 0 || !fetchWithInterceptor) return {};
  addNotification?.(progressMsg || "Processing images...", "info");
  const results: Record<string, string> = {};
  for (const url of urls) {
    try {
      const data = await api.submitImageEdits(fetchWithInterceptor, {
        url,
        autoTrim: false,
        ...editParams,
      });
      if (data.url) {
        results[url] = data.url;
      }
    } catch (err: any) {
      console.error(err);
      addNotification?.(`${errorPrefix || "Error"}: ${err.message}`, "error");
    }
  }
  if (Object.keys(results).length > 0) {
    addNotification?.(successMsg || "Processed successfully!", "success");
  }
  return results;
}

function exportUrls(
  urls: { url: string; filename: string }[],
  addNotification?: (msg: string, type: any) => void
) {
  if (urls.length === 0) return;
  addNotification?.("Downloading individual assets...", "info");
  urls.forEach(({ url, filename }) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function copyTextToClipboard(
  text: string,
  addNotification?: (msg: string, type: any) => void,
  successMsg?: string
) {
  navigator.clipboard.writeText(text);
  addNotification?.(successMsg || "Copied to clipboard!", "success");
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
  align?: "up" | "down";
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
  align = "up",
}: ScraperSelectionToolbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const [placement, setPlacement] = React.useState<"up" | "down" | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [everyN, setEveryN] = React.useState<number>(3);
  const [rangeFrom, setRangeFrom] = React.useState<number>(1);
  const [rangeTo, setRangeTo] = React.useState<number>(5);
  const [isFilteringRatio, setIsFilteringRatio] = React.useState(false);

  const getSmartPlacement = (rect: DOMRect): "up" | "down" => {
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 350;

    if (align === "down") {
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        return "up";
      }
      return "down";
    } else {
      if (spaceAbove < estimatedHeight && spaceBelow > spaceAbove) {
        return "down";
      }
      return "up";
    }
  };

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const activePlacement = getSmartPlacement(rect);
      setPlacement(activePlacement);
      const isRightSide = rect.left + rect.width / 2 > window.innerWidth / 2;
      setCoords({
        top: activePlacement === "down" ? rect.bottom + window.scrollY + 8 : rect.top + window.scrollY - 8,
        left: isRightSide
          ? rect.right + window.scrollX - 256
          : rect.left + window.scrollX,
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleScrollOrResize = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        
        // Auto-close if the button scrolls off-screen in any direction
        const isOffscreen =
          rect.bottom < 0 ||
          rect.top > window.innerHeight ||
          rect.right < 0 ||
          rect.left > window.innerWidth;

        if (isOffscreen) {
          setIsOpen(false);
          return;
        }

        const activePlacement = getSmartPlacement(rect);
        setPlacement(activePlacement);
        const isRightSide = rect.left + rect.width / 2 > window.innerWidth / 2;
        setCoords({
          top: activePlacement === "down" ? rect.bottom + window.scrollY + 8 : rect.top + window.scrollY - 8,
          left: isRightSide
            ? rect.right + window.scrollX - 256
            : rect.left + window.scrollX,
        });
      }
    };
    if (isOpen) {
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, align]);

  const selectEveryNth = (n: number) => {
    if (!setSelectedScraped) return;
    const selected = scrapedImages.filter((_, idx) => idx % n === 0);
    setSelectedScraped(selected);
  };

  const selectByAspectRatio = async (type: "Landscape" | "Portrait" | "Tall Strip" | "Too Tall Strip") => {
    if (!setSelectedScraped) return;
    setIsFilteringRatio(true);

    const getRatioLabel = (url: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 1.25) resolve("Landscape");
          else if (ratio < 0.28) resolve("Too Tall Strip");
          else if (ratio < 0.6) resolve("Tall Strip");
          else resolve("Portrait");
        };
        img.onerror = () => resolve("Portrait");
      });
    };

    try {
      const results = await Promise.all(
        scrapedImages.map(async (imgUrl) => {
          const label = await getRatioLabel(imgUrl);
          return { imgUrl, label };
        })
      );
      const matches = results.filter((r) => r.label === type).map((r) => r.imgUrl);
      setSelectedScraped(matches);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFilteringRatio(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/30 rounded-xl text-[10px] font-bold text-neutral-300 hover:text-white transition-all shadow-md hover:shadow-purple-500/5 font-mono select-none cursor-pointer duration-200"
      >
        <ListFilter className="h-3 w-3 text-purple-400" />
        <span>Select Filter</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 text-neutral-500 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: placement === "up" ? "translateY(-100%)" : "none",
            }}
            className="w-64 rounded-2xl bg-neutral-950/95 border border-neutral-850 shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2.5 z-[99999] flex flex-col gap-1 backdrop-blur-xl max-h-[380px] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-60 rounded-t-2xl pointer-events-none" />
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

            <div className="px-2 py-1 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 my-1 select-none">
              Orientation Filters
            </div>
            <button
              type="button"
              disabled={isFilteringRatio}
              onClick={() => selectByAspectRatio("Landscape")}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium disabled:opacity-50"
            >
              Select Landscape Panels
            </button>
            <button
              type="button"
              disabled={isFilteringRatio}
              onClick={() => selectByAspectRatio("Portrait")}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium disabled:opacity-50"
            >
              Select Portrait Panels
            </button>
            <button
              type="button"
              disabled={isFilteringRatio}
              onClick={() => selectByAspectRatio("Tall Strip")}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium disabled:opacity-50"
            >
              Select Tall Strip Panels
            </button>
            <button
              type="button"
              disabled={isFilteringRatio}
              onClick={() => selectByAspectRatio("Too Tall Strip")}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-455 hover:text-white hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium disabled:opacity-50"
            >
              Select Too Tall Strip Panels
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
          </div>,
          document.body
        )
      }
    </div>
  );
}

export function FloatingSelectionBar({
  isTimeline = false,
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
  handleDuplicateSelected,
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
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
  handleCancelAnalysis,
  panels = [],
  setPanels,
  selectedPanelIds = new Set(),
}: FloatingSelectionBarProps) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isAnyBusy = isBatchCropping || isCleaningBubbles || isBatchMerging;
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const [moveToPos, setMoveToPos] = React.useState<number>(1);
  const [assetsHeight, setAssetsHeight] = React.useState(0);
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [barHeight, setBarHeight] = React.useState(0);
  const barRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!barRef.current) return;
    const ro = new ResizeObserver(() => {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);
    });
    ro.observe(barRef.current);
    setBarHeight(barRef.current.offsetHeight);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const updateHeight = () => {
      const el = document.querySelector("#scraper-selection-bar-portal");
      if (el && el.classList.contains("opacity-100")) {
        const height = el.getBoundingClientRect().height;
        setAssetsHeight(height);
      } else {
        setAssetsHeight(0);
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

  const visible = (totalCount > 0 && selectedCount > 0) || isAnyBusy;

  const zIndexClass = isTimeline ? "z-[9998]" : "z-[9999]";
  const outerClass = leftDock
    ? `fixed left-24 top-16 bottom-4 ${zIndexClass} transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "-translate-x-1/4 opacity-0 pointer-events-none"
      }`
    : `fixed left-0 right-0 ${zIndexClass} transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`;

  const stackStyle: React.CSSProperties =
    !leftDock && visible && isTimeline && assetsHeight > 0
      ? { bottom: `${assetsHeight}px` }
      : { bottom: 0 };

  const flipSelected = handleFlipSelected || (async () => {
    setBusyLocal(true);
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0 && setPanels && fetchWithInterceptor) {
        const selectedPanels = panels.filter((p) => selectedPanelIds.has(p.id));
        const urls = selectedPanels.map((p) => p.image_url);
        const results = await editSelectedUrls(
          urls,
          { flipHorizontal: true },
          fetchWithInterceptor,
          addNotification,
          `Flipping ${selectedPanelIds.size} panels...`,
          "Flipped selected panels successfully!",
          "Flip failed"
        );
        if (Object.keys(results).length > 0) {
          setPanels((prev) =>
            prev.map((p) =>
              selectedPanelIds.has(p.id) && results[p.image_url]
                ? { ...p, image_url: results[p.image_url] }
                : p
            )
          );
        }
        clearSelection?.();
      }
    } else {
      if (selectedScraped && selectedScraped.length > 0 && setScrapedImages && fetchWithInterceptor) {
        const results = await editSelectedUrls(
          selectedScraped,
          { flipHorizontal: true },
          fetchWithInterceptor,
          addNotification,
          `Flipping ${selectedScraped.length} images...`,
          "Flipped selected frames successfully!",
          "Flip failed"
        );
        if (Object.keys(results).length > 0) {
          setScrapedImages((prev) => prev.map((img) => results[img] ?? img));
        }
        setSelectedScraped?.([]);
      }
    }
    setBusyLocal(false);
  });

  const rotateSelected = handleRotateSelected || (async () => {
    setBusyLocal(true);
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0 && setPanels && fetchWithInterceptor) {
        const selectedPanels = panels.filter((p) => selectedPanelIds.has(p.id));
        const urls = selectedPanels.map((p) => p.image_url);
        const results = await editSelectedUrls(
          urls,
          { rotate: 90 },
          fetchWithInterceptor,
          addNotification,
          `Rotating ${selectedPanelIds.size} panels...`,
          "Rotated selected panels successfully!",
          "Rotate failed"
        );
        if (Object.keys(results).length > 0) {
          setPanels((prev) =>
            prev.map((p) =>
              selectedPanelIds.has(p.id) && results[p.image_url]
                ? { ...p, image_url: results[p.image_url] }
                : p
            )
          );
        }
        clearSelection?.();
      }
    } else {
      if (selectedScraped && selectedScraped.length > 0 && setScrapedImages && fetchWithInterceptor) {
        const results = await editSelectedUrls(
          selectedScraped,
          { rotate: 90 },
          fetchWithInterceptor,
          addNotification,
          `Rotating ${selectedScraped.length} images...`,
          "Rotated selected frames successfully!",
          "Rotate failed"
        );
        if (Object.keys(results).length > 0) {
          setScrapedImages((prev) => prev.map((img) => results[img] ?? img));
        }
        setSelectedScraped?.([]);
      }
    }
    setBusyLocal(false);
  });

  const duplicateSelected = handleDuplicateSelected || handleDuplicateToTimeline || (() => {
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0 && setPanels) {
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
        clearSelection?.();
        addNotification?.(`Duplicated ${selectedPanelIds.size} panels successfully!`, "success");
      }
    } else {
      handleAddToStoryboard?.();
    }
  });

  const sortSelected = handleSortSelected || ((order: "asc" | "desc") => {
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size >= 2 && setPanels) {
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
      }
    } else {
      if (selectedScraped && setSelectedScraped) {
        const sorted = [...selectedScraped].sort((a, b) => {
          const idxA = scrapedImages.indexOf(a);
          const idxB = scrapedImages.indexOf(b);
          return order === "asc" ? idxA - idxB : idxB - idxA;
        });
        setSelectedScraped(sorted);
        addNotification?.(`Selection sorted in ${order}ending order`, "success");
      }
    }
  });

  const exportIndividual = handleExportIndividual || (() => {
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0) {
        const items = panels
          .filter((p) => selectedPanelIds.has(p.id))
          .map((p) => ({
            url: p.image_url,
            filename: `timeline-panel-${p.id}.png`,
          }));
        exportUrls(items, addNotification);
      }
    } else {
      if (selectedScraped && selectedScraped.length > 0) {
        const items = selectedScraped.map((url, i) => ({
          url,
          filename: `imported-asset-${i + 1}.png`,
        }));
        exportUrls(items, addNotification);
      }
    }
  });

  const copyMetadata = handleCopyMetadata || (() => {
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0) {
        const selected = panels.filter((p) => selectedPanelIds.has(p.id));
        copyTextToClipboard(
          JSON.stringify(selected, null, 2),
          addNotification,
          "Copied metadata JSON to clipboard!"
        );
      }
    } else {
      if (selectedScraped && selectedScraped.length > 0) {
        const meta = selectedScraped.map((url) => ({
          index: scrapedImages.indexOf(url) + 1,
          source_url: url,
          type: "imported_asset",
        }));
        copyTextToClipboard(
          JSON.stringify(meta, null, 2),
          addNotification,
          "Copied metadata JSON to clipboard!"
        );
      }
    }
  });

  const moveToPosition = handleMoveToPosition || ((pos: number) => {
    if (isTimeline) {
      if (selectedPanelIds && selectedPanelIds.size > 0 && setPanels) {
        const targetIdx = Math.min(panels.length, Math.max(0, pos - 1));
        setPanels((prev) => {
          const itemsToMove = prev.filter((p) => selectedPanelIds.has(p.id));
          const remaining = prev.filter((p) => !selectedPanelIds.has(p.id));
          const nextList = [...remaining];
          nextList.splice(targetIdx, 0, ...itemsToMove);
          return nextList;
        });
        addNotification?.(`Moved panels to position #${pos}`, "success");
      }
    } else {
      if (selectedScraped && selectedScraped.length > 0 && setScrapedImages) {
        const targetIdx = Math.min(scrapedImages.length, Math.max(0, pos - 1));
        const itemsToMove = scrapedImages.filter((img) => selectedScraped.includes(img));
        const remaining = scrapedImages.filter((img) => !selectedScraped.includes(img));
        const nextList = [...remaining];
        nextList.splice(targetIdx, 0, ...itemsToMove);
        setScrapedImages(nextList);
        addNotification?.(`Moved ${selectedScraped.length} assets to position #${pos}`, "success");
      }
    }
  });

  return createPortal(
    <>
      {/* More Actions Floating Panel — portal-rendered above the bar */}
      {showMoreActions && visible && createPortal(
        <div
          style={{ bottom: `${(typeof stackStyle.bottom === "number" ? stackStyle.bottom : parseInt(stackStyle.bottom || "0", 10) || 0) + barHeight}px` }}
          className="fixed left-0 right-0 z-[10001] bg-neutral-950/90 backdrop-blur-2xl border-t border-b border-neutral-800/40 px-6 py-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] w-full animate-in slide-in-from-bottom-2 duration-200"
        >
          {/* Glowing Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-purple-500/10 via-fuchsia-500/40 to-purple-500/10 blur-[0.5px]" />

          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <div className="w-full flex items-center justify-between gap-2 mb-1.5 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono">
                  Extended Actions
                </span>
                <span className="text-[9px] text-neutral-400 font-bold font-mono px-2 py-0.5 bg-neutral-900 border border-neutral-800/80 rounded-lg shadow-inner">
                  {isTimeline ? "Storyboard Timeline" : "Imported Assets"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreActions(false)}
                className="p-1 rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button type="button" onClick={flipSelected} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-sky-500/10 hover:border-sky-500/30 text-neutral-450 hover:text-sky-300 transition-all active:scale-95 disabled:opacity-40">
              <FlipHorizontal className="h-4 w-4 text-sky-400" /> Flip
            </button>

            <button type="button" onClick={rotateSelected} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-amber-500/10 hover:border-amber-500/30 text-neutral-450 hover:text-amber-300 transition-all active:scale-95 disabled:opacity-40">
              <RotateCw className="h-4 w-4 text-amber-400" /> Rotate 90°
            </button>

            <button type="button" onClick={duplicateSelected} disabled={isAnyBusy || busyLocal}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-neutral-450 hover:text-emerald-300 transition-all active:scale-95 disabled:opacity-40">
              <Copy className="h-4 w-4 text-emerald-400" /> Duplicate
            </button>

            {handleAnalyzeAll && (
              <button type="button" onClick={handleAnalyzeAll} disabled={isAnalyzingAll || busyLocal}
                className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-purple-950/20 border-purple-800/40 hover:bg-purple-600 hover:border-purple-550 text-purple-300 hover:text-white transition-all active:scale-95 disabled:opacity-40">
                <Brain className="h-4 w-4 text-purple-400 group-hover:text-white" /> AI Analyze
              </button>
            )}

            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <button type="button" onClick={() => sortSelected("asc")}
                className="px-3 py-2 text-xs font-bold flex items-center gap-1 hover:bg-indigo-500/10 text-neutral-455 hover:text-indigo-300 transition-all cursor-pointer">
                <ArrowUpDown className="h-4 w-4 text-indigo-400" /> Sort ↑
              </button>
              <div className="w-px h-4 bg-neutral-800" />
              <button type="button" onClick={() => sortSelected("desc")}
                className="px-3 py-2 text-xs font-bold flex items-center gap-1 hover:bg-indigo-500/10 text-neutral-455 hover:text-indigo-300 transition-all cursor-pointer">
                Sort ↓
              </button>
            </div>

            <button type="button" onClick={exportIndividual}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-neutral-455 hover:text-cyan-300 transition-all active:scale-95">
              <ImageIcon className="h-4 w-4 text-cyan-400" /> Export
            </button>

            <button type="button" onClick={copyMetadata}
              className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-900 border-neutral-800 hover:bg-teal-500/10 hover:border-teal-500/30 text-neutral-455 hover:text-teal-300 transition-all active:scale-95">
              <ClipboardCopy className="h-4 w-4 text-teal-400" /> Copy Metadata
            </button>

            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-neutral-450 font-mono font-medium">Move to</span>
              <input type="number" min={1} max={totalCount} value={moveToPos}
                onChange={(e) => setMoveToPos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 px-1 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-orange-500 text-center" />
              <button type="button" onClick={() => moveToPosition(moveToPos)} disabled={isAnyBusy || busyLocal}
                className="px-2.5 py-0.5 text-[10px] rounded bg-orange-600/20 border border-orange-500/30 hover:bg-orange-600 text-orange-300 hover:text-white font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40">
                Go
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div
        id={isTimeline ? "timeline-selection-bar-portal" : "scraper-selection-bar-portal"}
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
          <div className={leftDock ? "h-full flex flex-col gap-3 overflow-auto custom-scrollbar pb-1" : "bg-neutral-950/95 backdrop-blur-2xl border-t border-neutral-700/50 px-6 py-4 shadow-2xl shadow-black/60 w-full"}>
            <div className={leftDock ? "" : "max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap md:flex-nowrap"}>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3.5 py-2 shrink-0">
                  <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
                    {selectedCount}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                      {isTimeline ? "Timeline Panels Selected" : "Imported Assets Selected"}
                    </p>
                    <p className="text-[9px] text-purple-400 font-mono leading-tight whitespace-nowrap">
                      {selectedCount} of {totalCount} {isTimeline ? "frames" : "images"}
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
                {!isTimeline && !leftDock && scrapedImages && scrapedImages.length > 0 && (
                  <ScraperSelectionToolbar
                    scrapedImages={scrapedImages}
                    selectedScraped={selectedScraped || []}
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
                  onClick={isTimeline ? (isAllSelected ? (clearSelection || handleClearAll) : (selectAllPanels || handleSelectAllToggle)) : handleSelectAllToggle}
                  className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                >
                  {isAllSelected ? (
                    <Square className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <CheckSquare className="h-4 w-4 text-purple-400" />
                  )}
                  {isAllSelected ? "Deselect All" : "Select All"}
                </button>

                {/* AI Analyze Selected */}
                {handleAnalyzeSelected && (
                  isAnalyzingAll ? (
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
                  )
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
                    disabled={isAnyBusy || busyLocal}
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
                    disabled={isAnyBusy || busyLocal}
                    className="px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 rounded-xl"
                  >
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Clean Bubbles
                  </button>
                )}

                {/* Stitch */}
                <button
                  type="button"
                  disabled={isAnyBusy || busyLocal || selectedCount < 2}
                  onClick={handleBatchMergeSelected}
                  className="px-3.5 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
                >
                  <Link2 className="h-4 w-4 text-purple-400" />
                  Stitch
                </button>

                {/* Add to Storyboard */}
                {!isTimeline && handleAddToStoryboard && (
                  <button
                    type="button"
                    onClick={handleAddToStoryboard}
                    disabled={isAnyBusy || busyLocal}
                    className="px-3.5 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-purple-650 border-purple-550 hover:bg-purple-600 text-white shadow-md hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Storyboard
                  </button>
                )}

                {/* Zip Download */}
                {!isTimeline && handleDownloadZip && (
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
                  onClick={isTimeline ? (clearSelection || handleClearAll) : handleClearAll}
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

export function TimelineSelectionBar(props: FloatingSelectionBarProps) {
  return <FloatingSelectionBar {...props} isTimeline={true} />;
}
