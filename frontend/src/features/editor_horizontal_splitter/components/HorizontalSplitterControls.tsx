import React from "react";
import { Sliders, ChevronUp, ChevronDown, Plus, Magnet } from "lucide-react";

interface HorizontalSplitterControlsProps {
  splitPosition: number;
  handleSetSplitPosition: (val: number) => void;
  setShowSplitPosition: (v: boolean) => void;
  detectedGutters: number[];
  magneticSnap: boolean;
  setMagneticSnap: (v: boolean) => void;
  handleAutoPlaceCuts: () => void;
  handleAddSplitLine: () => void;
  sliderPct: number;
}

export default function HorizontalSplitterControls({
  splitPosition,
  handleSetSplitPosition,
  setShowSplitPosition,
  detectedGutters,
  magneticSnap,
  setMagneticSnap,
  handleAutoPlaceCuts,
  handleAddSplitLine,
  sliderPct,
}: HorizontalSplitterControlsProps) {
  return (
    <div className="space-y-3.5">
      {/* Smart Gutter Snap Actions */}
      {detectedGutters.length > 0 && (
        <div className="bg-[#181924]/60 border border-white/10 p-3.5 rounded-2xl shadow-xl space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#F59E0B] font-bold font-mono flex items-center gap-1.5">
              <Magnet className="h-3.5 w-3.5 text-[#F59E0B] animate-pulse" />
              <span>Gutter Gaps Detected!</span>
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[9.5px] font-mono text-neutral-400 select-none">
              <span>Magnet Snap</span>
              <input
                type="checkbox"
                checked={magneticSnap}
                onChange={(e) => setMagneticSnap(e.target.checked)}
                className="rounded border-white/10 bg-[#10111a]/80 text-[#3B82F6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAutoPlaceCuts}
            className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 font-mono transition-all cursor-pointer active:scale-98"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Auto-Place Cuts at Gaps ({detectedGutters.length})</span>
          </button>
        </div>
      )}

      {/* Slider & Precise Position Control */}
      <div className="space-y-3.5 bg-[#181924]/60 p-4 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Active draft line</span>
          </span>
          <div className="flex items-center gap-1 bg-[#10111a]/80 border border-white/10 rounded-xl px-2.5 py-1">
            <input
              type="number"
              min="5"
              max="95"
              step="0.1"
              value={splitPosition}
              onChange={(e) => {
                let val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                val = Math.max(5, Math.min(95, val));
                handleSetSplitPosition(val);
                setShowSplitPosition(true);
              }}
              className="bg-transparent text-[#3B82F6] font-bold font-mono text-xs w-12 focus:outline-none text-center"
            />
            <span className="text-[9.5px] text-neutral-400 font-mono">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nudge Up buttons */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const target = Math.max(
                  5,
                  parseFloat((splitPosition - 5).toFixed(1))
                );
                handleSetSplitPosition(target);
                setShowSplitPosition(true);
              }}
              className="px-2 py-1.5 text-neutral-300 hover:text-white bg-[#10111a]/80 hover:bg-[#1f202e] rounded-xl border border-white/10 cursor-pointer text-[9.5px] font-bold font-mono transition-all active:scale-95"
              title="Fast Nudge Up (-5%)"
            >
              -5%
            </button>
            <button
              type="button"
              onClick={() => {
                const target = Math.max(
                  5,
                  parseFloat((splitPosition - 1).toFixed(1))
                );
                handleSetSplitPosition(target);
                setShowSplitPosition(true);
              }}
              className="p-1.5 text-neutral-300 hover:text-white bg-[#10111a]/80 hover:bg-[#1f202e] rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
              title="Nudge Up (-1%)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Custom slider with gutter tick marks */}
          <div className="relative flex-1 flex items-center">
            {/* Gutter snap tick markers */}
            {detectedGutters.map((g, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5 bg-[#F59E0B]/60 pointer-events-none rounded-full"
                style={{ left: `${g}%` }}
                title={`Detected Gutter: ${g.toFixed(1)}%`}
              />
            ))}
            <input
              type="range"
              min="5"
              max="95"
              step="0.1"
              value={splitPosition}
              onChange={(e) => {
                handleSetSplitPosition(parseFloat(e.target.value));
                setShowSplitPosition(true);
              }}
              className="w-full accent-[#3B82F6] bg-[#10111a]/80 rounded-full h-1.5 cursor-pointer"
            />
          </div>

          {/* Nudge Down buttons */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const target = Math.min(
                  95,
                  parseFloat((splitPosition + 1).toFixed(1))
                );
                handleSetSplitPosition(target);
                setShowSplitPosition(true);
              }}
              className="p-1.5 text-neutral-300 hover:text-white bg-[#10111a]/80 hover:bg-[#1f202e] rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
              title="Nudge Down (+1%)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const target = Math.min(
                  95,
                  parseFloat((splitPosition + 5).toFixed(1))
                );
                handleSetSplitPosition(target);
                setShowSplitPosition(true);
              }}
              className="px-2 py-1.5 text-neutral-300 hover:text-white bg-[#10111a]/80 hover:bg-[#1f202e] rounded-xl border border-white/10 cursor-pointer text-[9.5px] font-bold font-mono transition-all active:scale-95"
              title="Fast Nudge Down (+5%)"
            >
              +5%
            </button>
          </div>
        </div>

        {/* Add guideline button */}
        <button
          type="button"
          onClick={handleAddSplitLine}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-mono  transition-all cursor-pointer active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Add Split Line</span>
        </button>
      </div>
    </div>
  );
}
