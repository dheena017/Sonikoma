import React, { useState } from "react";
import { Filter, ArrowUpDown, ChevronsLeft, ChevronsRight, Rows3, X } from "lucide-react";

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
}: ScraperSelectionToolbarProps) {
  const [firstNValue, setFirstNValue] = useState<string>("5");
  const [lastNValue, setLastNValue] = useState<string>("5");
  const [rangeFrom, setRangeFrom] = useState<string>("1");
  const [rangeTo, setRangeTo] = useState<string>("10");

  const total = scrapedImages.length;

  return (
    <>
      {/* Dynamic Asset Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          These live graphics are separated dynamically from the viewer URL.
        </p>
        {total > 0 && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">
              Selected
            </span>
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shadow-inner">
              {selectedScraped.length} / {total}
            </span>
            {selectedScraped.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  console.log("[ScraperSelectionToolbar] Clearing all selections");
                  handleClearAll();
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800/40 text-neutral-500 hover:text-red-400 rounded-full text-[9px] font-mono font-bold transition-all cursor-pointer"
                title="Clear all selections"
              >
                <X className="h-2.5 w-2.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selection Filters Row */}
      {total > 0 && (
        <div className="space-y-2">
          {/* Row 1: Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-950/40 border border-neutral-800 rounded-xl">
            <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase mr-1.5 flex items-center gap-1">
              <Filter className="h-3 w-3 text-purple-400" />
              <span>Quick Select:</span>
            </span>
            <button
              type="button"
              onClick={handleInvertSelection}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
            >
              Invert
            </button>
            <button
              type="button"
              onClick={handleSelectOdd}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
            >
              Odd Panels
            </button>
            <button
              type="button"
              onClick={handleSelectEven}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
            >
              Even Panels
            </button>
            <div className="h-4 w-px bg-neutral-800/80 mx-1.5" />
            <button
              type="button"
              onClick={handleReverseDeckOrder}
              className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 hover:border-purple-800/50 text-purple-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Flip chronological order of entire deck panels sequence"
            >
              <ArrowUpDown className="h-3 w-3 text-purple-400" />
              <span>Reverse Order</span>
            </button>
          </div>

          {/* Row 2: First N / Last N controls */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-950/40 border border-neutral-800 rounded-xl">
            <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase flex items-center gap-1 mr-1">
              <Rows3 className="h-3 w-3 text-indigo-400" />
              <span>Count Select:</span>
            </span>

            {/* First N */}
            <div className="flex items-center gap-1">
              <ChevronsLeft className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="text-[9px] font-mono text-neutral-500">First</span>
              <input
                type="number"
                min={1}
                max={total}
                value={firstNValue}
                onChange={(e) => setFirstNValue(e.target.value)}
                className="w-12 text-center text-[9px] font-bold font-mono bg-neutral-900 border border-neutral-800 text-white rounded-lg py-1 focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  const n = Math.min(Math.max(1, parseInt(firstNValue) || 1), total);
                  console.log(`[ScraperSelectionToolbar] Selecting first ${n} panels`);
                  handleSelectFirstN(n);
                }}
                className="px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 hover:border-indigo-600/50 text-indigo-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="h-4 w-px bg-neutral-800 mx-0.5" />

            {/* Last N */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-neutral-500">Last</span>
              <input
                type="number"
                min={1}
                max={total}
                value={lastNValue}
                onChange={(e) => setLastNValue(e.target.value)}
                className="w-12 text-center text-[9px] font-bold font-mono bg-neutral-900 border border-neutral-800 text-white rounded-lg py-1 focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <ChevronsRight className="h-3 w-3 text-indigo-400 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  const n = Math.min(Math.max(1, parseInt(lastNValue) || 1), total);
                  console.log(`[ScraperSelectionToolbar] Selecting last ${n} panels`);
                  handleSelectLastN(n);
                }}
                className="px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 hover:border-indigo-600/50 text-indigo-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Row 3: Custom Range */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-950/40 border border-neutral-800 rounded-xl">
            <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase flex items-center gap-1 mr-1 shrink-0">
              <Filter className="h-3 w-3 text-purple-400" />
              <span>Range:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono text-neutral-500">From</span>
              <input
                type="number"
                min={1}
                max={total}
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="w-14 text-center text-[9px] font-bold font-mono bg-neutral-900 border border-neutral-800 text-white rounded-lg py-1 focus:outline-none focus:border-purple-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1"
              />
              <span className="text-[9px] font-mono text-neutral-600">—</span>
              <span className="text-[9px] font-mono text-neutral-500">To</span>
              <input
                type="number"
                min={1}
                max={total}
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="w-14 text-center text-[9px] font-bold font-mono bg-neutral-900 border border-neutral-800 text-white rounded-lg py-1 focus:outline-none focus:border-purple-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="10"
              />
              <span className="text-[8px] text-neutral-600 font-mono">(1-indexed)</span>
              <button
                type="button"
                onClick={() => {
                  const a = Math.max(1, parseInt(rangeFrom) || 1);
                  const b = Math.min(total, parseInt(rangeTo) || total);
                  console.log(`[ScraperSelectionToolbar] Selecting range from ${a} to ${b}`);
                  handleSelectRange(a, b);
                }}
                className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 hover:border-purple-800/50 text-purple-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
              >
                Select Range
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
