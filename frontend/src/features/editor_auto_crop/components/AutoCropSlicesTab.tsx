import React, { useState } from "react";
import { Scissors, AlertCircle, Search } from "lucide-react";
import * as api from "@/api";
import { AutoCropSliceCard } from "./AutoCropSliceCard";

export interface AutoCropSlicesTabProps {
  panelUrls: string[];
  boxes?: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  viewMode?: "grid" | "reel";
  onViewModeChange?: (mode: "grid" | "reel") => void;
  onSelectPanel: (idx: number) => void;
  onInspect: (url: string) => void;
  onDuplicate: (idx: number) => void;
  onRemove: (idx: number) => void;
  onMoveSlice: (fromIdx: number, direction: "left" | "right") => void;
  onSplitHalf: (idx: number) => void;
  onMergeNext: (idx: number) => void;
}

export function AutoCropSlicesTab({
  panelUrls,
  boxes,
  selectedPanelIndex,
  onSelectPanel,
  onInspect,
  onDuplicate,
  onRemove,
  onMoveSlice,
  onSplitHalf,
  onMergeNext,
}: AutoCropSlicesTabProps) {
  const [gridDensity, setGridDensity] = useState<
    "compact" | "normal" | "large"
  >(() => {
    try {
      const saved = localStorage.getItem("sonikoma_autocrop_grid_density");
      if (saved === "compact" || saved === "normal" || saved === "large")
        return saved;
    } catch {}
    return "compact";
  });
  const [jumpQuery, setJumpQuery] = useState<string>("");

  const handleSetGridDensity = (density: "compact" | "normal" | "large") => {
    setGridDensity(density);
    try {
      localStorage.setItem("sonikoma_autocrop_grid_density", density);
    } catch {}
  };

  const handleJumpToPanel = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpQuery.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 1 && num <= panelUrls.length) {
      onSelectPanel(num - 1);
      setJumpQuery("");
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* ── COMPACT SLICES CONTROLS BAR ── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/80 px-3 py-2 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Left: Icon & Title Info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Scissors className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Panels
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-emerald-400 text-[10px] sm:text-xs font-mono font-bold shadow-inner shrink-0">
                {panelUrls.length} Slices
              </span>
            </div>
          </div>

          {/* Right: Density Controls & Jump Tool */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Quick Panel # Jump */}
            {panelUrls.length > 5 && (
              <form
                onSubmit={handleJumpToPanel}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="Go to #..."
                  value={jumpQuery}
                  onChange={(e) => setJumpQuery(e.target.value)}
                  className="w-20 sm:w-24 px-2 py-1 pl-6 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Search className="absolute left-2 h-3 w-3 text-neutral-500 pointer-events-none" />
              </form>
            )}

            {/* Grid Density Switcher */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleSetGridDensity("compact")}
                className={`px-1.5 py-0.5 rounded transition-colors !cursor-pointer ${
                  gridDensity === "compact"
                    ? "bg-neutral-800 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Compact Grid"
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => handleSetGridDensity("normal")}
                className={`px-1.5 py-0.5 rounded transition-colors !cursor-pointer ${
                  gridDensity === "normal"
                    ? "bg-neutral-800 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Standard Grid"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleSetGridDensity("large")}
                className={`px-1.5 py-0.5 rounded transition-colors !cursor-pointer ${
                  gridDensity === "large"
                    ? "bg-neutral-800 text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Large Grid"
              >
                Large
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MULTI-COLUMN PANELS GRID ── */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border border-neutral-800/90 bg-neutral-950/80 max-h-[640px] overflow-y-auto scrollbar-thin grid shadow-2xl transition-all ${
          gridDensity === "compact"
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5"
            : gridDensity === "large"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
        }`}
      >
        {panelUrls.map((url, sliceIdx) => {
          const isSelected = selectedPanelIndex === sliceIdx;
          const box = boxes?.[sliceIdx];

          return (
            <AutoCropSliceCard
              key={`${url}_${sliceIdx}`}
              url={url}
              sliceIdx={sliceIdx}
              totalSlices={panelUrls.length}
              isSelected={isSelected}
              box={box}
              viewMode="grid"
              onSelect={onSelectPanel}
              onInspect={onInspect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onMoveSlice={onMoveSlice}
              onSplitHalf={onSplitHalf}
              onMergeNext={onMergeNext}
            />
          );
        })}

        {panelUrls.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-neutral-600" />
            <span>
              No panel boxes detected. Switch to "Compare" tab to draw or add
              boxes.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoCropSlicesTab;
