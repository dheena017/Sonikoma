import React from "react";

interface CanvasSplitLinesProps {
  isVisible?: boolean;
  splitPosition: number;
  splitLines: number[];
  hoverPct: { x: number; y: number } | null;
  handleRemoveSplitLine: (yVal: number) => void;
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  setShowSplitPosition: (v: boolean) => void;
}

export default function CanvasSplitLines({
  isVisible = true,
  splitPosition,
  splitLines,
  hoverPct,
  handleRemoveSplitLine,
  setSplitPosition,
  setShowSplitPosition,
}: CanvasSplitLinesProps) {
  return (
    <div
      className="absolute inset-0 z-40 pointer-events-none"
      style={{
        display: isVisible ? "block" : "none",
      }}
    >
      {/* Active sliding guideline */}
      <div
        className="absolute left-0 right-0 z-40 pointer-events-none"
        style={{ top: `${splitPosition}%` }}
      >
        <div className="absolute inset-x-0 border-t-2 border-dashed border-purple-400/80" />
        <div className="absolute right-2 -top-5 bg-purple-950/95 text-purple-300 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-purple-800/60 font-bold backdrop-blur shadow-lg">
          Split: {splitPosition}% (draft)
        </div>
      </div>

      {/* Saved split lines */}
      {splitLines.map((y, idx) => {
        const isHovered = hoverPct ? Math.abs(hoverPct.y - y) < 2.5 : false;
        return (
          <div
            key={`split-line-${y}-${idx}`}
            className="absolute left-0 right-0 z-40 h-3 -translate-y-1.5 flex items-center cursor-row-resize pointer-events-auto"
            style={{ top: `${y}%` }}
          >
            <div
              className={`w-full border-t-2 border-dashed ${
                isHovered
                  ? "border-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                  : "border-purple-500/70"
              }`}
            />
            <div className="absolute left-2 bg-purple-950/95 text-purple-300 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-purple-800/60 font-bold backdrop-blur shadow-lg flex items-center gap-1.5 pointer-events-auto select-none">
              <span>
                Cut #{idx + 1}: {y}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSplitLine(y);
                }}
                className="text-purple-400 hover:text-red-400 font-bold font-sans text-[11px] cursor-pointer pl-0.5"
                title="Remove this split line"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
