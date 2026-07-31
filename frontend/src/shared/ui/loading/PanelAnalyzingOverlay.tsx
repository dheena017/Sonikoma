import React from "react";
import { Sparkles } from "lucide-react";

interface PanelAnalyzingOverlayProps {
  /** True when running a full-sequence batch analysis */
  isAnalyzingAll?: boolean;
}

/**
 * Full-bleed overlay shown on top of a Timeline panel thumbnail while
 * the AI is analyzing it (single panel or full sequence analysis).
 */
export function PanelAnalyzingOverlay({ isAnalyzingAll = false }: PanelAnalyzingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center z-10 rounded-lg">
      {/* Pulsing sparkles icon */}
      <div className="relative mb-2">
        <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping" />
        <Sparkles
          className="relative h-5 w-5 text-purple-300 animate-spin drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]"
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* Status label */}
      <span className="text-[9px] font-black font-mono text-purple-100 uppercase tracking-[0.2em]">
        {isAnalyzingAll ? "Analyzing Sequence..." : "Analyzing..."}
      </span>

      {/* Sub-label */}
      <span className="text-[8px] font-mono font-bold text-purple-400/80 uppercase tracking-wider mt-0.5">
        Please wait...
      </span>

      {/* CSS scanner-line animation (defined globally in index.css) */}
      <div className="scanner-line" />
    </div>
  );
}
