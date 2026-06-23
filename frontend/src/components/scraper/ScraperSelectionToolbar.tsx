import React from "react";
import {
  RotateCcw,
  FlipHorizontal,
  ListFilter,
  ChevronDown,
  Trash2,
} from "lucide-react";

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
      {/* Dropdown Container */}
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
            {/* Group: Bulk Operations */}
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

            {/* Group: Sequence Filters */}
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

            {/* Custom Every Nth */}
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
                className="w-8 px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500 text-center"
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
                className="ml-auto px-2 py-0.5 rounded bg-indigo-650 hover:bg-indigo-600 text-white text-[9px] font-mono font-bold transition-all cursor-pointer border border-indigo-500/20 active:scale-95"
              >
                Apply
              </button>
            </div>

            {/* Group: Actions */}
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

            {/* Group: Range Selection */}
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

            {/* Custom Range Input */}
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

      {/* Clear Button */}
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
