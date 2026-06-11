import React from "react";
import { Cpu } from "lucide-react";

interface CleanBubblesManualProps {
  editMode: string;
  setEditMode?: (mode: "crop" | "clean_auto" | "clean_manual" | "typeset" | "cuts") => void;
  brushAction: "paint" | "erase";
  setBrushAction?: (action: "paint" | "erase") => void;
  brushSize: number;
  setBrushSize?: (size: number) => void;
  handleClearBrushMask?: () => void;
}

export default function CleanBubblesManual({
  editMode,
  setEditMode,
  brushAction,
  setBrushAction,
  brushSize,
  setBrushSize,
  handleClearBrushMask,
}: CleanBubblesManualProps) {
  return (
    <div className="border-t border-white/5 pt-2 mt-1">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
        <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
          <span>Manual Spot-Healing Brush</span>
        </span>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={editMode === "clean_manual"}
            onChange={(e) => {
              if (setEditMode) {
                setEditMode(e.target.checked ? "clean_manual" : "crop");
              }
            }}
            className="sr-only peer"
          />
          <div className="w-7 h-4 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-450 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-650 peer-checked:after:bg-white border border-neutral-700"></div>
        </label>
      </div>

      {editMode === "clean_manual" && (
        <div className="space-y-3 pt-2.5 pl-2.5 border-l-2 border-purple-500/30 animate-fadeIn mt-2">
          {/* Paint / Erase selection */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBrushAction && setBrushAction("paint")}
              className={`flex-1 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                brushAction === "paint"
                  ? "bg-purple-600/20 border-purple-500/50 text-white"
                  : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Paint Mask (Red)
            </button>
            <button
              type="button"
              onClick={() => setBrushAction && setBrushAction("erase")}
              className={`flex-1 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                brushAction === "erase"
                  ? "bg-purple-600/10 border-purple-500/30 text-purple-305"
                  : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Erase Mask
            </button>
          </div>

          {/* Brush Size Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-neutral-500">Brush Size</span>
              <span className="text-purple-400 font-bold">{brushSize}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize && setBrushSize(Number(e.target.value))}
              className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Clear Mask Button */}
          <button
            type="button"
            onClick={handleClearBrushMask}
            className="w-full py-1 bg-red-950/10 hover:bg-red-950/20 border border-red-900/20 text-red-400 rounded-lg text-[9px] font-mono font-bold transition-all"
          >
            Clear Drawing Mask
          </button>
        </div>
      )}
    </div>
  );
}
