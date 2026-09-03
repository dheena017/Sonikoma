import React from "react";
import { createPortal } from "react-dom";
import {
  ListFilter,
  ChevronDown,
  FlipHorizontal,
  RotateCcw,
  ArrowUpDown,
  Copy,
  Brain,
  Image as ImageIcon,
  ClipboardCopy,
  CheckSquare,
  Square,
  Plus,
  Scissors,
  Sparkles,
  Link2,
  Trash2,
  X,
  Download,
  RefreshCw,
  Loader2,
  ChevronUp,
  RotateCw,
  Settings2,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

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
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
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
        top:
          activePlacement === "down"
            ? rect.bottom + window.scrollY + 8
            : rect.top + window.scrollY - 8,
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
          top:
            activePlacement === "down"
              ? rect.bottom + window.scrollY + 8
              : rect.top + window.scrollY - 8,
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

  const selectByAspectRatio = async (
    type: "Landscape" | "Portrait" | "Tall Strip" | "Too Tall Strip"
  ) => {
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
      const matches = results
        .filter((r) => r.label === type)
        .map((r) => r.imgUrl);
      setSelectedScraped(matches);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFilteringRatio(false);
      setIsOpen(false);
    }
  };

  const handleSelectInStoryboard = () => {
    if (!setSelectedScraped) return;
    const activePanels =
      useProjectStore.getState().activeProjectData?.panels || [];
    const matches = scrapedImages.filter((imgUrl) => {
      const proxiedUrl = imgUrl?.startsWith("/api/")
        ? imgUrl
        : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
      return activePanels.some(
        (p) =>
          p.image_url === imgUrl ||
          p.image_url === proxiedUrl ||
          p.original_url === imgUrl
      );
    });
    setSelectedScraped(matches);
    setIsOpen(false);
  };

  const handleSelectNotInStoryboard = () => {
    if (!setSelectedScraped) return;
    const activePanels =
      useProjectStore.getState().activeProjectData?.panels || [];
    const matches = scrapedImages.filter((imgUrl) => {
      const proxiedUrl = imgUrl?.startsWith("/api/")
        ? imgUrl
        : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
      return !activePanels.some(
        (p) =>
          p.image_url === imgUrl ||
          p.image_url === proxiedUrl ||
          p.original_url === imgUrl
      );
    });
    setSelectedScraped(matches);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-[#3B82F6]/30 rounded-xl text-[10px] font-bold text-neutral-300 hover:text-white transition-all shadow-md hover:shadow-purple-500/5 font-mono select-none cursor-pointer duration-200"
      >
        <ListFilter className="h-3 w-3 text-[#3B82F6]" />
        <span>Select Filter</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 text-neutral-500 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: placement === "up" ? "translateY(-100%)" : "none",
            }}
            className="w-64 rounded-2xl bg-neutral-950/95 border border-neutral-850 shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2.5 z-[99999] flex flex-col gap-1 backdrop-blur-xl max-h-[380px] overflow-y-auto custom-purple-scrollbar animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500 opacity-60 rounded-t-2xl pointer-events-none" />
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
              Storyboard Status Filters
            </div>
            <button
              type="button"
              onClick={handleSelectInStoryboard}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium flex items-center justify-between"
            >
              <span>Select Panels In Storyboard</span>
              <span className="text-[9px] bg-emerald-955 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/40">
                ✓ Added
              </span>
            </button>
            <button
              type="button"
              onClick={handleSelectNotInStoryboard}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-[#3B82F6] hover:text-[#93C5FD] hover:bg-neutral-900 transition-colors font-sans cursor-pointer font-medium flex items-center justify-between"
            >
              <span>Select Panels Not In Storyboard</span>
              <span className="text-[9px] bg-purple-955 text-[#3B82F6] px-1.5 py-0.5 rounded border border-purple-800/40">
                + Not Added
              </span>
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
              <span className="text-[10px] text-neutral-400 font-sans">
                Every
              </span>
              <input
                type="number"
                min="1"
                max="99"
                value={everyN}
                onChange={(e) =>
                  setEveryN(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-8 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-[#3B82F6] text-center"
              />
              <span className="text-[10px] text-neutral-400 font-sans">
                th panel
              </span>
              <button
                type="button"
                onClick={() => {
                  selectEveryNth(everyN);
                  setIsOpen(false);
                }}
                className="ml-auto px-2 py-0.5 rounded bg-purple-650 hover:bg-[#3B82F6] text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-[#3B82F6]/20 active:scale-95"
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
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-[#3B82F6] hover:text-[#93C5FD] font-mono transition-all font-semibold cursor-pointer text-center"
              >
                First 5
              </button>
              <button
                onClick={() => {
                  handleSelectFirstN(10);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-[#3B82F6] hover:text-[#93C5FD] font-mono transition-all font-semibold cursor-pointer text-center"
              >
                First 10
              </button>
              <button
                onClick={() => {
                  handleSelectLastN(5);
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-700 text-[10px] text-[#3B82F6] hover:text-[#93C5FD] font-mono transition-all font-semibold cursor-pointer text-center"
              >
                Last 5
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-neutral-900 mt-1.5">
              <span className="text-[10px] text-neutral-400 font-sans">
                Range
              </span>
              <input
                type="number"
                min="1"
                max={scrapedImages.length}
                value={rangeFrom}
                onChange={(e) =>
                  setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-[#3B82F6] text-center"
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
                className="w-10 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-[#3B82F6] text-center"
              />
              <button
                type="button"
                onClick={() => {
                  handleSelectRange(rangeFrom, rangeTo);
                  setIsOpen(false);
                }}
                className="ml-auto px-2.5 py-0.5 rounded bg-purple-650 hover:bg-[#3B82F6] text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-[#3B82F6]/20 active:scale-95"
              >
                Select
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default ScraperSelectionToolbar;
