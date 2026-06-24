import React from "react";
import { Pen, Eraser, Trash2, Save } from "lucide-react";

interface FreehandPanelProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushAction: "paint" | "erase";
  setBrushAction: (action: "paint" | "erase") => void;
  fillColor: string;
  setFillColor: (color: string) => void;
}

export default function FreehandPanel({
  brushSize,
  setBrushSize,
  brushAction,
  setBrushAction,
  fillColor,
  setFillColor,
}: FreehandPanelProps) {
  return (
    <div className="space-y-4">
      {/* Tool Selection */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
          Tool Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setBrushAction("paint")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              brushAction === "paint"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800"
            }`}
          >
            <Pen className="h-3.5 w-3.5" />
            Draw
          </button>
          <button
            onClick={() => setBrushAction("erase")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              brushAction === "erase"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            Erase
          </button>
        </div>
      </div>

      {/* Brush Settings */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
            <span>Brush Size</span>
            <span className="text-purple-400">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="2"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {brushAction === "paint" && (
          <div className="space-y-1 pt-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
              Brush Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="h-8 w-14 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs font-mono text-neutral-400">
                {fillColor.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-white/10 flex gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event("FABRIC_CLEAR_REQUEST"))}
          className="flex-1 py-2 bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event("FABRIC_SAVE_REQUEST"))}
          className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all shadow-lg shadow-emerald-900/40 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          Save Drawing
        </button>
      </div>
    </div>
  );
}
