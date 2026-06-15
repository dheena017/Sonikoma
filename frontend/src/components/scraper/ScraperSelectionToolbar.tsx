import React from "react";
import {
  RotateCcw,
  FlipHorizontal,
  LayoutGrid,
  CheckCircle2,
  ListFilter,
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
  const selectEveryNth = (n: number) => {
    if (!setSelectedScraped) return;
    const selected = scrapedImages.filter((_, idx) => idx % n === 0);
    setSelectedScraped(selected);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <ListFilter className="h-3 w-3 text-neutral-500" />
          <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono">
            Selection Filter
          </span>
        </div>
        <button
          onClick={handleSelectOdd}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
        >
          Odd
        </button>
        <button
          onClick={handleSelectEven}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
        >
          Even
        </button>
        <button
          onClick={() => selectEveryNth(3)}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
        >
          Every 3rd
        </button>
        <button
          onClick={handleInvertSelection}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5"
        >
          <FlipHorizontal className="h-3 w-3" />
          Invert
        </button>
        <button
          onClick={handleReverseDeckOrder}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          Reverse
        </button>
        <button
          onClick={handleClearAll}
          className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-950/30 bg-red-950/10 hover:bg-red-900/20 text-red-400/80 hover:text-red-400 transition-all ml-auto"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-neutral-900/30 border border-neutral-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">
            Range:
          </span>
          <button
            onClick={() => handleSelectFirstN(5)}
            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
          >
            First 5
          </button>
          <button
            onClick={() => handleSelectFirstN(10)}
            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
          >
            First 10
          </button>
          <button
            onClick={() => handleSelectLastN(5)}
            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
          >
            Last 5
          </button>
        </div>

        <div className="h-3 w-[1px] bg-neutral-800" />

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">
            Quick:
          </span>
          <button
            onClick={() => handleSelectRange(1, 5)}
            className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            1-5
          </button>
          <button
            onClick={() => handleSelectRange(6, 10)}
            className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            6-10
          </button>
        </div>
      </div>
    </div>
  );
}
