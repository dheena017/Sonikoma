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
 * Styled with sleek dark backdrop and clean status indicators (no harsh neon glows).
 */
export function PanelProcessingOverlay({ label, overlayId }: PanelProcessingOverlayProps) {
  const isAutoCrop = label.toLowerCase().includes("crop");

  return (
    <div
      className="absolute inset-0 z-20 bg-neutral-950/85 backdrop-blur-[3px] flex flex-col items-center justify-center p-2 text-center rounded-xl select-none animate-in fade-in duration-200 border border-neutral-800 shadow-xl"
      id={overlayId}
    >
      {/* Icon wrapper */}
      <div className="relative mb-2 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800">
        {isAutoCrop ? (
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
        ) : (
          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
        )}
      </div>

      {/* Primary Action Label */}
      <span className="text-[10px] font-semibold font-mono tracking-wider text-neutral-200 uppercase leading-tight">
        {label.toUpperCase()}...
      </span>

      {/* Sub-label */}
      <span className="text-[8px] font-mono tracking-normal text-neutral-500 font-medium uppercase mt-0.5">
        Processing...
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
