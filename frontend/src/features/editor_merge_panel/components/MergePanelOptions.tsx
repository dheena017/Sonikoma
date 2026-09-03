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
    <div className="space-y-3 bg-[#1E1E1E] border border-[#2F2F2F] p-3.5 rounded-2xl shadow-md">
      <div className="flex items-center gap-2">
        <Settings2 className="h-3.5 w-3.5 text-[#3B82F6]" />
        <span className="text-[9px] font-bold text-neutral-300 uppercase font-mono tracking-widest block">
          Stitch Options
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Direction toggle */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Direction
          </label>
          <div className="flex gap-1 bg-[#121212] p-1 rounded-xl border border-[#2F2F2F]">
            <button
              type="button"
              onClick={() => handleDirectionChange("prev")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                direction === "prev"
                  ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40"
                  : "bg-[#2A2A2A] text-neutral-400 hover:text-white hover:border-[#3B82F6]"
              }`}
            >
              <ArrowUp className="h-2.5 w-2.5" /> Prev
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange("next")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                direction === "next"
                  ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40"
                  : "bg-[#2A2A2A] text-neutral-400 hover:text-white hover:border-[#3B82F6]"
              }`}
            >
              Next <ArrowDown className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Layout toggle */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Layout
          </label>
          <div className="flex gap-1 bg-[#121212] p-1 rounded-xl border border-[#2F2F2F]">
            <button
              type="button"
              onClick={() => setLayout("vertical")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                layout === "vertical"
                  ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40"
                  : "bg-[#2A2A2A] text-neutral-400 hover:text-white hover:border-[#3B82F6]"
              }`}
            >
              <Rows className="h-2.5 w-2.5" /> Vert
            </button>
            <button
              type="button"
              onClick={() => setLayout("horizontal")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                layout === "horizontal"
                  ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40"
                  : "bg-[#2A2A2A] text-neutral-400 hover:text-white hover:border-[#3B82F6]"
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
            <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
              Gap Spacing
            </label>
            <span className="text-[8px] font-mono text-[#3B82F6]">
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
            className="w-full accent-[#3B82F6] h-1.5 bg-[#121212] rounded-full appearance-none cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Gap Color
          </label>
          <select
            value={spacingColor}
            onChange={(e) => setSpacingColor(e.target.value)}
            disabled={spacing === 0}
            className="w-full bg-[#121212] border border-[#2F2F2F] text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40 focus:border-[#3B82F6]"
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
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Scale Mode
          </label>
          <select
            value={scaleToFit ? "fit" : "original"}
            onChange={(e) => setScaleToFit(e.target.value === "fit")}
            className="w-full bg-[#121212] border border-[#2F2F2F] text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="fit">Scale to Fit</option>
            <option value="original">Keep Original Size</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Alignment
          </label>
          <select
            value={alignMode}
            onChange={(e) => setAlignMode(e.target.value as any)}
            disabled={scaleToFit}
            className="w-full bg-[#121212] border border-[#2F2F2F] text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40 focus:border-[#3B82F6]"
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
          <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
            Global Padding
          </label>
          <span className="text-[8px] font-mono text-[#3B82F6]">
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
          className="w-full accent-[#3B82F6] h-1.5 bg-[#121212] rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
