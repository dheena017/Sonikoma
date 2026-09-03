import React from "react";
import { Plus } from "lucide-react";

interface CutsRegistrySelectorProps {
  hasSelection: boolean;
  handlePushToSlices: () => void;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: (v: boolean) => void;
}

export function CutsRegistrySelector({
  hasSelection,
  handlePushToSlices,
  autoPushOnDraw,
  setAutoPushOnDraw,
}: CutsRegistrySelectorProps) {
  return (
    <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-3">
      <button
        type="button"
        onClick={handlePushToSlices}
        disabled={!hasSelection}
        className="w-full bg-[#2A2A2A] hover:bg-[#3B82F6] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-black/50"
        style={{
          boxShadow: !hasSelection
            ? undefined
            : "0 0 15px rgba(139,92,246,0.2)",
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Save Selection as Crop Tool</span>
      </button>

      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
        <span className="flex-1">Auto-save drawn boxes on drop</span>
        <div
          className={`relative w-8 h-4 rounded-full border flex-shrink-0 transition-all ${
            autoPushOnDraw
              ? "bg-[#2A2A2A] border-[#3B82F6]"
              : "bg-neutral-800 border-neutral-700"
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
              autoPushOnDraw ? "left-4.5" : "left-0.5"
            }`}
          />
          <input
            type="checkbox"
            checked={autoPushOnDraw}
            onChange={(e) => setAutoPushOnDraw(e.target.checked)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </label>
    </div>
  );
}
