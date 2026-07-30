import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export type ProcessingMode = "auto-cropping" | "cleaning-bubbles" | "processing";

interface PanelProcessingOverlayProps {
  /** The resolved label to display (e.g. "Auto-Cropping", "Cleaning Bubbles") */
  label: string;
  /** Optional id for the overlay div */
  overlayId?: string;
}

/**
 * In-panel overlay shown on top of a panel thumbnail card inside the panel container
 * during any background processing operation (Auto-Crop, Bubble Cleaning, Image Edit).
 * Styled with purple glow border + dark purple backdrop matching the reference image.
 */
export function PanelProcessingOverlay({ label, overlayId }: PanelProcessingOverlayProps) {
  const isAutoCrop = label.toLowerCase().includes("crop");

  return (
    <div
      className="absolute inset-0 z-20 bg-purple-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center rounded-2xl select-none animate-in fade-in duration-200 border-2 border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.6)] ring-1 ring-purple-500/40"
      id={overlayId}
    >
      {/* Icon with pulsing purple glow */}
      <div className="relative mb-2 flex items-center justify-center">
        {isAutoCrop ? (
          <Sparkles className="h-6 w-6 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-pulse" />
        ) : (
          <Loader2 className="h-6 w-6 text-purple-300 animate-spin drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
        )}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30 border border-purple-400" />
      </div>

      {/* Primary Action Label */}
      <span className="text-[10px] font-black font-mono tracking-[0.2em] text-purple-200 uppercase leading-tight">
        {label.toUpperCase()}...
      </span>

      {/* Sub-label */}
      <span className="text-[8px] font-mono tracking-wider text-purple-400/90 font-extrabold uppercase mt-1">
        PLEASE WAIT...
      </span>
    </div>
  );
}

/**
 * Helper to derive the processing label from context flags.
 */
export function getPanelProcessingLabel(
  isBatchCropping: boolean,
  bubbleCroppingImgUrl: string | null,
  imgUrl: string
): string {
  if (isBatchCropping) return "Auto-Cropping";
  if (bubbleCroppingImgUrl === imgUrl) return "Cleaning Bubbles";
  return "Processing";
}
