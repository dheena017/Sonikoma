import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface AutoSlicerProps {
  handleDetectPanels: () => Promise<void>;
  isDetecting: boolean;
}

export default function AutoSlicer({
  handleDetectPanels,
  isDetecting,
}: AutoSlicerProps) {
  return (
    <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
          <Sparkles className="h-3 w-3 text-emerald-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Contours-Detection Auto Slicer
        </span>
      </div>
      <p className="text-[10px] text-neutral-600 leading-relaxed">
        Contour scans look for white gutters to identify individual panel slices.
        Detected panels are instantly loaded into the Targets list for fine-tuning.
      </p>
      <button
        type="button"
        onClick={handleDetectPanels}
        disabled={isDetecting}
        className="relative w-full overflow-hidden bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-semibold py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/5 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isDetecting ? (
          <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        )}
        <span>
          {isDetecting ? "Executing Scan..." : "Detect & Populate Slices List"}
        </span>
      </button>
    </div>
  );
}
