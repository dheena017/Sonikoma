import React from "react";
import { LayoutGrid, Trash2 } from "lucide-react";
import { Slice } from "../shared/types";

interface CutsRegistryHeaderProps {
  slices: Slice[];
  handleClearAllSlices: () => void;
}

export function CutsRegistryHeader({
  slices,
  handleClearAllSlices,
}: CutsRegistryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
          <LayoutGrid className="h-3 w-3 text-purple-400" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Target Crop Tools Registry
          </span>
          <p className="text-[9px] text-neutral-600 font-mono mt-0.5">
            {slices.length} Crop Tools Defined
          </p>
        </div>
      </div>
      {slices.length > 0 && (
        <button
          type="button"
          onClick={handleClearAllSlices}
          className="flex items-center gap-1 text-[9px] bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/40 hover:border-red-700/60 px-2 py-1 rounded-lg cursor-pointer transition-all"
          title="Clear all defined crop tools from list"
        >
          <Trash2 className="h-2.5 w-2.5" />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
}
