import React from "react";
import { Split, ChevronUp, ChevronDown, Plus, X } from "lucide-react";

interface HorizontalSplitterProps {
  splitPosition: number;
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  splitLines: number[];
  setSplitLines: React.Dispatch<React.SetStateAction<number[]>>;
  showSplitPosition: boolean;
  setShowSplitPosition: (v: boolean) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setSelectedSliceId: (id: string | null) => void;
  handleAddSplitLine: () => void;
  handleRemoveSplitLine: (yVal: number) => void;
  handleExecuteHorizontalSplit: () => Promise<void>;
  isSavingEdit: boolean;
}

export default function HorizontalSplitter({
  splitPosition,
  setSplitPosition,
  splitLines,
  setSplitLines,
  showSplitPosition,
  setShowSplitPosition,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setSelectedSliceId,
  handleAddSplitLine,
  handleRemoveSplitLine,
  handleExecuteHorizontalSplit,
  isSavingEdit,
}: HorizontalSplitterProps) {
  const sliderPct = ((splitPosition - 5) / 90) * 100;

  return (
    <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
            <Split className="h-3 w-3 text-indigo-400 rotate-90" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Horizontal Splitter
          </span>
        </div>
        <label className="relative flex items-center gap-2 cursor-pointer select-none text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
          <span>Guideline</span>
          <div className={`relative w-8 h-4 rounded-full border transition-all ${showSplitPosition ? "bg-purple-600 border-purple-500" : "bg-neutral-800 border-neutral-700"}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${showSplitPosition ? "left-4.5" : "left-0.5"}`} />
            <input
              type="checkbox"
              checked={showSplitPosition}
              onChange={(e) => {
                setShowSplitPosition(e.target.checked);
                if (e.target.checked) {
                  setEditCropTop(0);
                  setEditCropBottom(0);
                  setEditCropLeft(0);
                  setEditCropRight(0);
                  setSelectedSliceId(null);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </label>
      </div>

      <p className="text-[10px] text-neutral-600 leading-relaxed">
        Slice this panel horizontally into multiple separate images. Add cut
        lines to split into N parts.{" "}
        <span className="text-purple-500 font-semibold">Tip:</span> Drag on canvas when guideline is on.
      </p>

      {/* Slider control */}
      <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-500">Active draft line</span>
          <span className="text-purple-400 font-bold">{splitPosition}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSplitPosition((prev) => Math.max(5, prev - 1));
              setShowSplitPosition(true);
            }}
            className="p-1.5 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-lg border border-white/5 cursor-pointer transition-all"
            title="Nudge Up (-1%)"
          >
            <ChevronUp className="h-3 w-3" />
          </button>

          {/* Custom slider */}
          <div className="relative flex-1 h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${sliderPct}%`,
                background: "linear-gradient(to right, #4f46e5, #7c3aed)",
              }}
            />
            <input
              type="range"
              min="5"
              max="95"
              step="0.5"
              value={splitPosition}
              onChange={(e) => {
                setSplitPosition(parseFloat(Number(e.target.value).toFixed(1)));
                setShowSplitPosition(true);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSplitPosition((prev) => Math.min(95, prev + 1));
              setShowSplitPosition(true);
            }}
            className="p-1.5 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800 rounded-lg border border-white/5 cursor-pointer transition-all"
            title="Nudge Down (+1%)"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
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

          {splitLines.length > 0 && (
            <button
              type="button"
              onClick={() => setSplitLines([])}
              className="bg-black/40 hover:bg-red-950/60 text-neutral-500 hover:text-red-400 border border-white/5 hover:border-red-800/40 text-[11px] px-3 py-1.5 rounded-xl cursor-pointer transition-all"
              title="Clear split lines"
            >
              Clear
            </button>
          )}
        </div>

        {/* Defined lines list */}
        {splitLines.length > 0 && (
          <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 max-h-24 overflow-y-auto space-y-1">
            <div className="text-[9px] uppercase font-mono text-neutral-600 pb-1 border-b border-white/5">
              Defined Split Lines ({splitLines.length}):
            </div>
            {splitLines.map((y, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-[10px] text-neutral-400 font-mono hover:bg-white/3 rounded-lg px-1 py-0.5 group"
              >
                <span>
                  Line #{idx + 1}: <span className="text-purple-400">{y}%</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSplitLine(y)}
                  className="text-neutral-700 hover:text-red-400 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 p-0.5 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleExecuteHorizontalSplit}
          disabled={isSavingEdit}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30"
          style={{ boxShadow: isSavingEdit ? undefined : "0 0 15px rgba(139,92,246,0.2)" }}
        >
          <Split className="h-3.5 w-3.5 rotate-90" />
          <span>
            {splitLines.length > 0
              ? `Split Panel into ${splitLines.length + 1} Parts`
              : "Split Panel in Two"}
          </span>
        </button>
      </div>
    </div>
  );
}
