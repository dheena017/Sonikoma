import React from "react";
import {
  RefreshCw,
  Check,
  RotateCw,
  FlipHorizontal,
  Undo2,
  Loader2,
} from "lucide-react";

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
  onCheckboxClick?: (e: React.MouseEvent) => void;
}

const getScrapedImageStatus = (url: string) => {
  if (!url) return null;
  if (url.includes("_cropped")) {
    return {
      text: "CROPPED",
      bg: "bg-gradient-to-r from-sky-600 to-blue-600 border-sky-400/50 text-sky-100 shadow-[0_4px_12px_rgba(56,189,248,0.25)]",
    };
  }
  if (url.includes("_cleaned")) {
    return {
      text: "CLEANED",
      bg: "bg-gradient-to-r from-fuchsia-600 to-purple-600 border-purple-400/50 text-purple-100 shadow-[0_4px_12px_rgba(168,85,247,0.25)]",
    };
  }

  if (url.includes("transform_")) {
    return {
      text: "EDITED",
      bg: "bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/50 text-amber-100 shadow-[0_4px_12px_rgba(245,158,11,0.25)]",
    };
  }
  return null;
};

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
  onCheckboxClick,
}: PanelCardThumbnailProps) {
  const label = processingLabel(isBatchCropping, bubbleCroppingImgUrl, imgUrl);
  const status = getScrapedImageStatus(imgUrl);

  return (
    <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-800 shadow-inner group-hover:border-purple-500/30 transition-all duration-300 ease-out select-none">
      {/* Decorative background glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 pointer-events-none" />

      <img
        src={imgUrl}
        alt={`Panel #${idx + 1}`}
        className={`w-full h-full object-contain transition-all duration-500 ease-out ${
          isProcessing
            ? "opacity-20 scale-95 blur-[3px]"
            : "group-hover:scale-108 group-hover:rotate-[0.5deg]"
        }`}
        loading="eager"
        decoding="async"
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget;
          // Only retry once — prevent infinite loop
          if (img.dataset.retried) return;
          img.dataset.retried = "1";
          const src = img.src;
          // If it's already going through the proxy or is a local API URL, show placeholder
          if (src.includes("/api/proxy-image") || src.includes("/api/image/")) {
            img.style.opacity = "0.15";
            img.style.filter = "grayscale(1)";
            return;
          }
          // Re-route raw CDN/external URLs through the backend proxy
          img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
        }}
      />

      {/* Shimmer overlay while processing */}
      {isProcessing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-neutral-950/90 backdrop-blur-md select-none animate-in fade-in duration-200"
          id={`loading_overlay_${idx}`}
        >
          <div className="relative mb-2.5">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <Loader2 className="relative h-6 w-6 text-purple-400 animate-spin drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
          </div>
          <span className="text-[10px] font-mono font-extrabold tracking-widest text-purple-300 uppercase">
            {label}
          </span>
          <span className="text-[8px] text-neutral-500 mt-1 font-mono uppercase tracking-wider font-bold">
            Please wait…
          </span>
        </div>
      )}

      {/* Index badge — glassmorphic purple gradient when selected, dark when not */}
      <div
        className={[
          "absolute top-2 left-2 z-20 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border transition-all duration-300",
          isSelected
            ? "bg-gradient-to-r from-purple-650 to-indigo-650 border-purple-400/50 text-white shadow-[0_4px_12px_rgba(168,85,247,0.35)]"
            : "bg-neutral-900 border-neutral-700 text-purple-400 shadow-inner",
        ].join(" ")}
      >
        #{idx + 1}
      </div>

      {/* Operation status badge */}
      {status && (
        <div
          className={[
            "absolute top-2 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border z-20 transition-all duration-300",
            "left-12",
            status.bg,
          ].join(" ")}
        >
          {status.text}
        </div>
      )}

      {/* Selection checkbox circle with animated pulse ring */}
      <div className="absolute top-2 right-2 z-20">
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-purple-500/35 animate-ping" />
        )}
        <div
          onClick={onCheckboxClick}
          className={[
            "relative rounded-full p-1 border transition-all duration-300 ease-out cursor-pointer active:scale-90",
            isSelected
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.4)] scale-110"
              : "bg-neutral-900/60 border-neutral-600/70 hover:border-neutral-450 opacity-0 group-hover:opacity-100",
          ].join(" ")}
        >
          <Check
            className={`h-2.5 w-2.5 ${
              isSelected ? "text-white" : "text-neutral-400"
            }`}
            strokeWidth={3.5}
          />
        </div>
      </div>

      {/* Shift-select hint on hover when not selected */}
      {!isSelected && (
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          <div className="bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent text-[8px] text-neutral-400 font-mono text-center pb-2 pt-4">
            Click · Shift+Click range
          </div>
        </div>
      )}

      {/* Floating Quick-action Dock (hover) */}
      {!isProcessing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out flex gap-1 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded-2xl z-30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <button
            onClick={handleRotateClockwise}
            title="Rotate 90° Clockwise"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-purple-300 hover:bg-purple-950/60 transition-all duration-150 cursor-pointer active:scale-90"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleFlipHorizontal}
            title="Flip Horizontally"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-purple-300 hover:bg-purple-950/60 transition-all duration-150 cursor-pointer active:scale-90"
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
          </button>
          {imgUrl.includes("/cached/") && (
            <button
              onClick={handleUndo}
              title="Undo Last Edit"
              className="p-1.5 rounded-xl text-neutral-450 hover:text-amber-300 hover:bg-amber-950/40 transition-all duration-150 cursor-pointer active:scale-90"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
