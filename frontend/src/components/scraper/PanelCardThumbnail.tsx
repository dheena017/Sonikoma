import React from "react";
import { RefreshCw, Check, RotateCw, FlipHorizontal, Undo2 } from "lucide-react";

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
  return (
    <div className="relative h-28 rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center">
      <img
        src={imgUrl}
        alt=""
        className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${
          isProcessing ? "opacity-30 blur-[4px]" : ""
        }`}
        referrerPolicy="no-referrer"
      />

      {isProcessing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/85 backdrop-blur-xs animate-fadeIn p-2 text-center select-none"
          id={`loading_overlay_${idx}`}
        >
          <RefreshCw className="h-6 w-6 text-purple-400 animate-spin drop-shadow-md mb-2" />
          <span className="text-[9px] font-mono font-bold tracking-wider text-purple-300 uppercase animate-pulse">
            {isBatchCropping
              ? "Auto-Cropping"
              : bubbleCroppingImgUrl === imgUrl
              ? "Cleaning Bubbles"
              : "Processing"}
          </span>
          <span className="text-[8px] font-sans text-neutral-400 mt-1">
            Processing panel...
          </span>
        </div>
      )}

      {/* Index badge */}
      <div className="absolute top-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-purple-400">
        #{idx + 1}
      </div>

      {/* Selection indicator */}
      <div
        className={`absolute top-1 right-1 rounded-full p-0.5 border transition-all ${
          isSelected
            ? "bg-purple-600 border-purple-400 text-white opacity-100"
            : "bg-black/60 border-neutral-700 text-transparent opacity-0 group-hover:opacity-100 hover:text-neutral-300"
        }`}
      >
        <Check className="h-2.5 w-2.5 font-bold text-white" />
      </div>

      {/* Quick action controls on hover */}
      {!isProcessing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1.5 bg-black/90 border border-neutral-800/90 px-2 py-0.5 rounded-full z-30 pointer-events-auto shadow-md"
        >
          <button
            onClick={handleRotateClockwise}
            title="Rotate 90° Clockwise"
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
          >
            <RotateCw className="h-3 w-3" />
          </button>
          <button
            onClick={handleFlipHorizontal}
            title="Flip Horizontally"
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
          >
            <FlipHorizontal className="h-3 w-3" />
          </button>
          {imgUrl.includes("/cached/") && (
            <button
              onClick={handleUndo}
              title="Undo Last Edit"
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
            >
              <Undo2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
