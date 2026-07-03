import React from "react";
import { Settings2, ArrowUp, ArrowDown, Rows, Columns } from "lucide-react";

export interface MergeConfig {
  direction: "next" | "prev";
  layout: "vertical" | "horizontal";
  spacing: number;
  spacingColor: string;
  scaleToFit: boolean;
  alignMode: "center" | "start" | "end";
  padding: number;
}

interface MergePanelOptionsProps {
  direction: "next" | "prev";
  setDirection: (dir: "next" | "prev") => void;
  layout: "vertical" | "horizontal";
  setLayout: (layout: "vertical" | "horizontal") => void;
  spacing: number;
  setSpacing: (spacing: number) => void;
  spacingColor: string;
  setSpacingColor: (color: string) => void;
  padding: number;
  setPadding: (padding: number) => void;
  scaleToFit: boolean;
  setScaleToFit: (val: boolean) => void;
  alignMode: "center" | "start" | "end";
  setAlignMode: (mode: "center" | "start" | "end") => void;
  handleDirectionChange: (newDir: "next" | "prev") => void;
}

export default function MergePanelOptions({
  direction,
  layout,
  setLayout,
  spacing,
  setSpacing,
  spacingColor,
  setSpacingColor,
  padding,
  setPadding,
  scaleToFit,
  setScaleToFit,
  alignMode,
  setAlignMode,
  handleDirectionChange,
}: MergePanelOptionsProps) {
  return (
    <div className="space-y-3 bg-black/20 border border-white/5 p-3 rounded-xl">
      <div className="flex items-center gap-2">
        <Settings2 className="h-3 w-3 text-neutral-500" />
        <span className="text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-widest block">
          Stitch Options
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Direction toggle */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Direction
          </label>
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => handleDirectionChange("prev")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                direction === "prev"
                  ? "bg-teal-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <ArrowUp className="h-2.5 w-2.5" /> Prev
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange("next")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                direction === "next"
                  ? "bg-teal-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Next <ArrowDown className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Layout toggle */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Layout
          </label>
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setLayout("vertical")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                layout === "vertical"
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Rows className="h-2.5 w-2.5" /> Vert
            </button>
            <button
              type="button"
              onClick={() => setLayout("horizontal")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                layout === "horizontal"
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Columns className="h-2.5 w-2.5" /> Horz
            </button>
          </div>
        </div>
      </div>

      {/* Spacing & Color */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
              Gap Spacing
            </label>
            <span className="text-[8px] font-mono text-teal-400">
              {spacing}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Gap Color
          </label>
          <select
            value={spacingColor}
            onChange={(e) => setSpacingColor(e.target.value)}
            disabled={spacing === 0}
            className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="transparent">Transparent</option>
          </select>
        </div>
      </div>

      {/* Scale & Align */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Scale Mode
          </label>
          <select
            value={scaleToFit ? "fit" : "original"}
            onChange={(e) => setScaleToFit(e.target.value === "fit")}
            className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none"
          >
            <option value="fit">Scale to Fit</option>
            <option value="original">Keep Original Size</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Alignment
          </label>
          <select
            value={alignMode}
            onChange={(e) => setAlignMode(e.target.value as any)}
            disabled={scaleToFit}
            className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40"
          >
            <option value="center">Center</option>
            <option value="start">
              {layout === "vertical" ? "Left" : "Top"}
            </option>
            <option value="end">
              {layout === "vertical" ? "Right" : "Bottom"}
            </option>
          </select>
        </div>
      </div>

      {/* Global Padding */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between">
          <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
            Global Padding
          </label>
          <span className="text-[8px] font-mono text-teal-400">
            {padding}px
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
