import React from "react";
import { RefreshCw, Check, RotateCw, FlipHorizontal, Undo2, Loader2 } from "lucide-react";

interface PanelCardThumbnailProps {
  imgUrl: string;
  idx: number;
  isSelected: boolean;
  isProcessing: boolean;
  isBatchCropping: boolean;
  bubbleCroppingImgUrl: string | null;
  handleRotateClockwise: () => void;
  handleFlipHorizontal: () => void;
  handleUndo: () => void;
}

const processingLabel = (
  isBatchCropping: boolean,
  bubbleCroppingImgUrl: string | null,
  imgUrl: string
): string => {
  if (isBatchCropping) return "Auto-Cropping";
  if (bubbleCroppingImgUrl === imgUrl) return "Cleaning Bubbles";
  return "Processing";
};

export function PanelCardThumbnail({
  imgUrl,
  idx,
  isSelected,
  isProcessing,
  isBatchCropping,
  bubbleCroppingImgUrl,
  handleRotateClockwise,
  handleFlipHorizontal,
  handleUndo,
}: PanelCardThumbnailProps) {
  const label = processingLabel(isBatchCropping, bubbleCroppingImgUrl, imgUrl);

  return (
    <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center ring-1 ring-neutral-800/60 group-hover:ring-purple-800/30 transition-all duration-200">
      <img
        src={imgUrl}
        alt={`Panel #${idx + 1}`}
        className={`w-full h-full object-contain transition-all duration-300 ${
          isProcessing ? "opacity-20 scale-95 blur-[3px]" : "group-hover:scale-105"
        }`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
      />

      {/* Shimmer overlay while processing */}
      {isProcessing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gradient-to-b from-black/80 via-black/90 to-black/80 backdrop-blur-sm select-none"
          id={`loading_overlay_${idx}`}
        >
          <div className="relative mb-2">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <Loader2 className="relative h-5 w-5 text-purple-400 animate-spin drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-purple-300 uppercase">
            {label}
          </span>
          <span className="text-[8px] text-neutral-500 mt-0.5 font-sans">Please wait…</span>
        </div>
      )}

      {/* Index badge */}
      <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold text-purple-400 border border-purple-900/30 leading-none">
        #{idx + 1}
      </div>

      {/* Selection check badge */}
      <div
        className={`absolute top-1.5 right-1.5 rounded-full p-0.5 border transition-all duration-200 ${
          isSelected
            ? "bg-purple-600 border-purple-400 shadow-[0_0_8px_2px_rgba(168,85,247,0.45)] scale-110"
            : "bg-black/60 border-neutral-700 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      </div>

      {/* Quick-action toolbar (hover) */}
      {!isProcessing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex gap-0.5 bg-black/90 border border-neutral-700/80 px-1.5 py-0.5 rounded-full z-30 shadow-lg backdrop-blur-sm"
        >
          <button
            onClick={handleRotateClockwise}
            title="Rotate 90° Clockwise"
            className="p-1 rounded-full text-neutral-400 hover:text-purple-300 hover:bg-purple-950/60 transition-all duration-150 cursor-pointer"
          >
            <RotateCw className="h-3 w-3" />
          </button>
          <button
            onClick={handleFlipHorizontal}
            title="Flip Horizontally"
            className="p-1 rounded-full text-neutral-400 hover:text-purple-300 hover:bg-purple-950/60 transition-all duration-150 cursor-pointer"
          >
            <FlipHorizontal className="h-3 w-3" />
          </button>
          {imgUrl.includes("/cached/") && (
            <button
              onClick={handleUndo}
              title="Undo Last Edit"
              className="p-1 rounded-full text-neutral-400 hover:text-amber-300 hover:bg-amber-950/40 transition-all duration-150 cursor-pointer"
            >
              <Undo2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
