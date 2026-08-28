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
        <div className="bg-[#1E1E1E] border border-[#2F2F2F] p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-[#F59E0B] font-bold font-mono flex items-center gap-1.5">
              <Magnet className="h-3.5 w-3.5 text-[#F59E0B] animate-pulse" />
              <span>Gutter Gaps Detected!</span>
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-[#9CA3AF] select-none">
              <span>Magnet Snap</span>
              <input
                type="checkbox"
                checked={magneticSnap}
                onChange={(e) => setMagneticSnap(e.target.checked)}
                className="rounded border-[#2F2F2F] bg-[#121212] text-[#3B82F6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAutoPlaceCuts}
            className="w-full btn-secondary text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/10 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 font-mono"
          >
            <Plus className="h-3 w-3" />
            <span>Auto-Place Cuts at Gaps ({detectedGutters.length})</span>
          </button>
        </div>
      )}

      {/* Slider & Precise Position Control */}
      <div className="space-y-3 bg-[#1E1E1E] p-3 rounded-xl border border-[#2F2F2F]">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-[#9CA3AF] flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Active draft line</span>
          </span>
          <div className="flex items-center gap-1 bg-[#121212] border border-[#2F2F2F] rounded-lg px-2 py-0.5">
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
              className="bg-transparent text-[#3B82F6] font-bold font-mono text-[10px] w-12 focus:outline-none text-center"
            />
            <span className="text-[9px] text-[#6B7280] font-mono">%</span>
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
              className="px-1.5 py-1 text-[#9CA3AF] hover:text-white bg-[#121212] hover:bg-[#262626] rounded-l-lg border border-[#2F2F2F] cursor-pointer text-[9px] font-bold font-mono transition-all"
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
              className="p-1.5 text-[#9CA3AF] hover:text-white bg-[#121212] hover:bg-[#262626] rounded-r-lg border border-[#2F2F2F] cursor-pointer transition-all"
              title="Nudge Up (-1%)"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          {/* Custom slider with gutter tick marks */}
          <div className="relative flex-1 h-2 rounded-full bg-[#121212] border border-[#2F2F2F] flex items-center">
            {/* Visual Gutter ticks */}
            {detectedGutters.map((g, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5 bg-[#F59E0B] z-10 pointer-events-none"
                style={{ left: `${g}%` }}
                title={`Detected Gutter Gap at ${g}%`}
              />
            ))}

            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#3B82F6]"
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
              className="p-1.5 text-[#9CA3AF] hover:text-white bg-[#121212] hover:bg-[#262626] rounded-l-lg border border-[#2F2F2F] cursor-pointer transition-all"
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
              className="px-1.5 py-1 text-[#9CA3AF] hover:text-white bg-[#121212] hover:bg-[#262626] rounded-r-lg border border-[#2F2F2F] cursor-pointer text-[9px] font-bold font-mono transition-all"
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
            className="btn-primary flex-1 text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Split Line</span>
          </button>
        </div>
      </div>
    </div>
  );
}
