import React from "react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";
import {
  RefreshCw,
  Check,
  RotateCw,
  FlipHorizontal,
  Undo2,
} from "lucide-react";
import {
  PanelProcessingOverlay,
  getPanelProcessingLabel,
} from "@/shared/ui/loading/PanelProcessingOverlay";

interface PanelCardThumbnailProps {
  imgUrl: string;
  idx: number;
  displayIdx?: number;
  isSelected: boolean;
  isProcessing: boolean;
  isBatchCropping: boolean;
  bubbleCroppingImgUrl: string | null;
  isInTimeline?: boolean;
  handleRotateClockwise: () => void;
  handleFlipHorizontal: () => void;
  handleUndo: () => void;
  onCheckboxClick?: (e: React.MouseEvent) => void;
  onLoadDimensions?: (dimensions: { width: number; height: number }) => void;
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
      bg: "bg-gradient-to-r from-fuchsia-600 to-blue-600 border-[#60A5FA]/50 text-purple-100 shadow-[0_4px_12px_rgba(59,130,246,0.25)]",
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

export function PanelCardThumbnail({
  imgUrl,
  idx,
  displayIdx,
  isSelected,
  isProcessing,
  isBatchCropping,
  bubbleCroppingImgUrl,
  isInTimeline,
  handleRotateClockwise,
  handleFlipHorizontal,
  handleUndo,
  onCheckboxClick,
  onLoadDimensions,
}: PanelCardThumbnailProps) {
  const status = getScrapedImageStatus(imgUrl);

  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [imgUrl]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryKey((prev) => prev + 1);
  };

  const resolvedImgSrc = getProxiedImageUrl(imgUrl);

  const resolvedDisplayIdx = displayIdx ?? idx;

  return (
    <div className="relative h-44 sm:h-48 rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-800/80 shadow-inner group-hover:border-[#3B82F6]/30 transition-all duration-300 ease-out select-none">
      {/* Decorative background glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 animate-pulse z-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#3B82F6]/30 border-t-purple-500 animate-spin" />
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md rounded-2xl p-4 text-center z-20 animate-in fade-in duration-200">
          <span className="text-rose-500 text-base mb-1.5">⚠️</span>
          <span className="text-[9px] font-mono font-extrabold text-rose-350 uppercase tracking-widest mb-3">
            Load Failed
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-mono uppercase bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-[#93C5FD] border border-neutral-800 hover:border-[#3B82F6]/40 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="h-3 w-3 animate-spin-reverse-once" />
            Reload Frame
          </button>
        </div>
      ) : (
        <img
          key={`${imgUrl}-${retryKey}`}
          src={resolvedImgSrc}
          alt={`Panel #${resolvedDisplayIdx + 1}`}
          loading="lazy"
          className={`w-full h-full object-contain transition-all duration-300 ease-out z-10 ${
            !isLoaded ? "opacity-0 scale-98" : "opacity-100 scale-100"
          } ${
            isProcessing
              ? "opacity-20 scale-95 blur-[3px]"
              : "group-hover:scale-105"
          }`}
          decoding="async"
          draggable={false}
          onLoad={(e) => {
            setIsLoaded(true);
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              onLoadDimensions?.({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }
          }}
          onError={(e) => {
            const img = e.currentTarget;
            const currentSrc = img.src;

            // Never proxy local data or blob URIs
            if (
              !currentSrc ||
              currentSrc.startsWith("data:") ||
              currentSrc.startsWith("blob:")
            ) {
              setHasError(true);
              return;
            }

            if (img.dataset.retried) {
              setHasError(true);
              return;
            }
            img.dataset.retried = "1";

            // If already using the proxy or internal API path, don't wrap again
            if (
              currentSrc.includes("/api/proxy-image") ||
              currentSrc.includes("/api/") ||
              currentSrc.includes("/media/") ||
              currentSrc.includes("/videos/")
            ) {
              setHasError(true);
              return;
            }

            // Otherwise, last resort: proxy external URL.
            img.src = `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
          }}
        />
      )}

      {/* Processing overlay — imported from shared/ui/loading */}
      {isProcessing && (
        <PanelProcessingOverlay
          label={getPanelProcessingLabel(
            isBatchCropping,
            bubbleCroppingImgUrl,
            imgUrl
          )}
          overlayId={`loading_overlay_${idx}`}
        />
      )}

      {/* Index badge — glassmorphic purple gradient when selected, dark when not */}
      <div
        className={[
          "absolute top-2 left-2 z-20 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border transition-all duration-300",
          isSelected
            ? "bg-gradient-to-r from-purple-650 to-indigo-650 border-[#60A5FA]/50 text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)]"
            : "bg-neutral-900 border-neutral-700 text-[#3B82F6] shadow-inner",
        ].join(" ")}
      >
        #{resolvedDisplayIdx + 1}
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

      {/* In Timeline Badge */}
      {isInTimeline && (
        <div
          className={`absolute top-2 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border z-20 transition-all duration-300 border-emerald-400/60 bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.35)] flex items-center gap-1 ${
            status ? "left-28" : "left-12"
          }`}
        >
          <span>✓</span>
          <span>TIMELINE</span>
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
              ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] border-[#60A5FA] shadow-[0_4px_12px_rgba(59,130,246,0.4)] scale-110"
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

      {/* Persistent bottom shadow fade — gives depth to the dock area */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-20" />

      {/* Floating Quick-action Dock (hover) */}
      {!isProcessing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out flex gap-1 bg-neutral-950/95 border border-neutral-700/80 px-2 py-1 rounded-2xl z-30 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <button
            onClick={handleRotateClockwise}
            title="Rotate 90° Clockwise"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-[#93C5FD] hover:bg-purple-950/60 transition-all duration-150 cursor-pointer active:scale-90"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleFlipHorizontal}
            title="Flip Horizontally"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-[#93C5FD] hover:bg-purple-950/60 transition-all duration-150 cursor-pointer active:scale-90"
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
