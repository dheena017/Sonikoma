import React from "react";
import { Sparkles } from "lucide-react";

interface PanelAnalyzingOverlayProps {
  /** True when running a full-sequence batch analysis */
  isAnalyzingAll?: boolean;
}

/**
 * Full-bleed overlay shown on top of a Timeline panel thumbnail while
 * the AI is analyzing it (single panel or full sequence analysis).
 * Styled with sleek dark glass and clean typography.
 */
export function PanelAnalyzingOverlay({
  isAnalyzingAll = false,
}: PanelAnalyzingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-neutral-955/85 backdrop-blur-[3px] flex flex-col items-center justify-center p-2 text-center z-10 rounded-xl select-none border border-neutral-800 shadow-xl">
      {/* Icon Badge */}
      <div className="relative mb-2 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 shadow-sm">
        <Sparkles className="h-4 w-4 text-[#3B82F6] animate-pulse" />
      </div>

      {/* Status label */}
      <span className="text-[10px] font-semibold font-mono text-neutral-200 uppercase tracking-wider">
        {isAnalyzingAll ? "Analyzing Sequence..." : "Analyzing..."}
      </span>

      {/* Sub-label */}
      <span className="text-[8px] font-mono text-neutral-500 font-medium uppercase tracking-normal mt-0.5">
        Processing...
      </span>

      {/* CSS scanner-line animation */}
      <div className="scanner-line" />
    </div>
  );
}
