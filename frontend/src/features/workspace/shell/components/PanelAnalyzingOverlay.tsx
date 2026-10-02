import React from "react";
import { Loader2 } from "lucide-react";

interface PanelAnalyzingOverlayProps {
  /** True when running a full-sequence batch analysis */
  isAnalyzingAll?: boolean;
}

/**
 * Lightweight, high-performance overlay shown on top of a Timeline panel
 * thumbnail while the AI is analyzing it. Clean, simple, and lag-free.
 */
export function PanelAnalyzingOverlay({
  isAnalyzingAll = false,
}: PanelAnalyzingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-[#0d0d12]/90 flex flex-col items-center justify-center p-2 text-center z-10 rounded-xl select-none border border-neutral-800 pointer-events-none">
      <div className="mb-2 flex items-center justify-center w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700">
        <Loader2 className="h-3.5 w-3.5 text-[#3B82F6] animate-spin" />
      </div>

      <span className="text-[10px] font-semibold font-mono text-neutral-200 uppercase tracking-wider">
        {isAnalyzingAll ? "Analyzing..." : "Processing..."}
      </span>
    </div>
  );
}
