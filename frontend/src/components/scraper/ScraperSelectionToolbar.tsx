import React from "react";
import { Filter, ArrowUpDown } from "lucide-react";

interface ScraperSelectionToolbarProps {
  scrapedImages: string[];
  selectedScraped: string[];
  handleInvertSelection: () => void;
  handleSelectOdd: () => void;
  handleSelectEven: () => void;
  handleReverseDeckOrder: () => void;
}

export function ScraperSelectionToolbar({
  scrapedImages,
  selectedScraped,
  handleInvertSelection,
  handleSelectOdd,
  handleSelectEven,
  handleReverseDeckOrder,
}: ScraperSelectionToolbarProps) {
  return (
    <>
      {/* Dynamic Asset Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          These live graphics are separated dynamically from the viewer URL.
        </p>
        {scrapedImages.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">
              Selected
            </span>
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shadow-inner">
              {selectedScraped.length} / {scrapedImages.length}
            </span>
          </div>
        )}
      </div>

      {/* Selection Filters Row */}
      {scrapedImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-950/40 border border-neutral-900 rounded-xl animate-fadeIn">
          <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase mr-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3 text-purple-400" />
            <span>Select Filters:</span>
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
            Select Odd
          </button>
          <button
            type="button"
            onClick={handleSelectEven}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
          >
            Select Even
          </button>
          <div className="h-4 w-px bg-neutral-800/80 mx-1.5" />
          <button
            type="button"
            onClick={handleReverseDeckOrder}
            className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 hover:border-purple-800/50 text-purple-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
            title="Flipped chronological order of entire deck panels sequence"
          >
            <ArrowUpDown className="h-3 w-3 text-purple-400" />
            <span>Reverse Deck Sequence</span>
          </button>
        </div>
      )}
    </>
  );
}
