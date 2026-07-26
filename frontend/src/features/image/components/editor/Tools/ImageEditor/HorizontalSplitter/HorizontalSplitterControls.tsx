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
    <div className="space-y-3">
      {/* Smart Gutter Snap Actions */}
      {detectedGutters.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/20 p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-yellow-400 font-bold font-mono flex items-center gap-1.5">
              <Magnet className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
              <span>Gutter Gaps Detected!</span>
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 select-none">
              <span>Magnet Snap</span>
              <input
                type="checkbox"
                checked={magneticSnap}
                onChange={(e) => setMagneticSnap(e.target.checked)}
                className="rounded border-white/10 bg-neutral-900 text-purple-600 focus:ring-0 w-3 h-3"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAutoPlaceCuts}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-300 text-[10px] font-bold py-1 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Auto-Place Cuts at Gaps ({detectedGutters.length})</span>
          </button>
        </div>
      )}

      {/* Slider & Precise Position Control */}
      <div className="space-y-3 bg-black/30 p-3 rounded-xl border border-white/5">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-400 flex items-center gap-1">
            <Sliders className="h-3 w-3 text-purple-400" />
            <span>Active draft line</span>
          </span>
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 py-0.5">
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
              className="bg-transparent text-purple-400 font-bold font-mono text-[10px] w-12 focus:outline-none text-center"
            />
            <span className="text-[9px] text-neutral-500 font-mono">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nudge Up buttons */}
          <div className="flex gap-0.5">
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
              className="px-1.5 py-1 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-l-lg border border-white/5 cursor-pointer text-[9px] font-bold font-mono transition-all"
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
              className="p-1.5 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-r-lg border border-white/5 cursor-pointer transition-all"
              title="Nudge Up (-1%)"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          {/* Custom slider with gutter tick marks */}
          <div className="relative flex-1 h-2 rounded-full bg-neutral-800/80 flex items-center">
            {/* Visual Gutter ticks */}
            {detectedGutters.map((g, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/40 z-10 pointer-events-none"
                style={{ left: `${g}%` }}
                title={`Detected Gutter Gap at ${g}%`}
              />
            ))}

            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60"
              style={{
                width: `${sliderPct}%`,
              }}
            />

            <input
              type="range"
              min="5"
              max="95"
              step="0.5"
              value={splitPosition}
              onChange={(e) => {
                handleSetSplitPosition(
                  parseFloat(Number(e.target.value).toFixed(1))
                );
                setShowSplitPosition(true);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-20"
            />
          </div>

          {/* Nudge Down buttons */}
          <div className="flex gap-0.5">
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
              className="p-1.5 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-l-lg border border-white/5 cursor-pointer transition-all"
              title="Nudge Down (+1%)"
            >
              <ChevronDown className="h-3 w-3" />
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
              className="px-1.5 py-1 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-r-lg border border-white/5 cursor-pointer text-[9px] font-bold font-mono transition-all"
              title="Fast Nudge Down (+5%)"
            >
              +5%
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddSplitLine}
            className="flex-1 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-400 text-[11px] font-bold py-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            <span>Add Split Line</span>
          </button>
        </div>
      </div>
    </div>
  );
}
