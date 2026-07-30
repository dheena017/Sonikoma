import React from "react";
import { Loader2 } from "lucide-react";

export type ProcessingMode = "auto-cropping" | "cleaning-bubbles" | "processing";

interface PanelProcessingOverlayProps {
  /** The resolved label to display (e.g. "Auto-Cropping", "Cleaning Bubbles") */
  label: string;
  /** Optional id for the overlay div, used for targeting in tests or keyboard focus */
  overlayId?: string;
}

/**
 * Full-bleed overlay shown on top of a panel thumbnail image during any
 * background processing operation (Auto-Crop, Bubble Cleaning, Image Edit).
 */
export function PanelProcessingOverlay({ label, overlayId }: PanelProcessingOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-neutral-950/90 backdrop-blur-md select-none animate-in fade-in duration-200"
      id={overlayId}
    >
      {/* Pulsing spinner ring */}
      <div className="relative mb-2.5">
        <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        <Loader2 className="relative h-6 w-6 text-purple-400 animate-spin drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
      </div>

      {/* Action label */}
      <span className="text-[10px] font-mono font-extrabold tracking-widest text-purple-300 uppercase">
        {label}
      </span>

      {/* Sub-label */}
      <span className="text-[8px] text-neutral-500 mt-1 font-mono uppercase tracking-wider font-bold">
        Please wait…
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
