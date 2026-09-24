import React from "react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";
import {
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
  aspectRatioLabel?: string | null;
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
      bg: "bg-gradient-to-r from-fuchsia-600 to-blue-600 border-blue-400/50 text-white shadow-[0_4px_12px_rgba(59,130,246,0.25)]",
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
  aspectRatioLabel,
}: PanelCardThumbnailProps) {
  const status = getScrapedImageStatus(imgUrl);

  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [imgUrl]);

  const resolvedImgSrc = getProxiedImageUrl(imgUrl);

  // Check if image is already cached/loaded when mounted or src changes
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      const dims = {
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      };
      if (onLoadDimensions) {
        onLoadDimensions(dims);
      }
    }
  }, [resolvedImgSrc, onLoadDimensions]);

  React.useEffect(() => {
    const handleReloadAll = () => {
      setHasError(false);
      setIsLoaded(false);
      setRetryKey((prev) => prev + 1);
    };
    window.addEventListener("scraped-assets-reload", handleReloadAll);
    return () => window.removeEventListener("scraped-assets-reload", handleReloadAll);
  }, []);

  const resolvedDisplayIdx = displayIdx ?? idx;

  return (
    <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-800/80 shadow-inner group-hover:border-neutral-700 transition-all duration-300 ease-out select-none">
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
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
            Use Reload Assets above
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          key={`${imgUrl}-${retryKey}`}
          src={resolvedImgSrc}
          alt={`Panel #${resolvedDisplayIdx + 1}`}
          className={`w-full h-full object-contain transition-all duration-300 ease-out z-10 ${
            !isLoaded ? "opacity-90 scale-98" : "opacity-100 scale-100"
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
              const dims = {
                width: img.naturalWidth,
                height: img.naturalHeight,
              };
              onLoadDimensions?.(dims);
            }
          }}
          onError={(e) => {
            const img = e.currentTarget;
            const currentSrc = img.src;

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

            if (
              currentSrc.includes("/api/v1/proxy/image") ||
              currentSrc.includes("/api/") ||
              currentSrc.includes("/media/") ||
              currentSrc.includes("/videos/")
            ) {
              setHasError(true);
              return;
            }

            img.src = `/api/v1/proxy/image?url=${encodeURIComponent(currentSrc)}`;
          }}
        />
      )}

      {/* Processing overlay */}
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

      {/* Index badge */}
      <div
        className={[
          "absolute top-2 left-2 z-20 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border transition-all duration-300",
          isSelected
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-md shadow-blue-500/30"
            : "bg-neutral-900 border-neutral-700 text-blue-400 shadow-inner",
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

      {/* Selection checkbox circle */}
      <div className="absolute top-2 right-2 z-20">
        <div
          onClick={onCheckboxClick}
          className={[
            "relative rounded-full p-1 border transition-all duration-300 ease-out cursor-pointer active:scale-90",
            isSelected
              ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30 scale-105"
              : "bg-neutral-900/60 border-neutral-700 hover:border-neutral-500 opacity-0 group-hover:opacity-100",
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

      {/* Persistent bottom shadow fade */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-20" />

      {/* Floating Quick-action Dock */}
      {!isProcessing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out flex gap-1 bg-neutral-950/95 border border-neutral-700/80 px-2 py-1 rounded-2xl z-30 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={handleRotateClockwise}
            title="Rotate 90° Clockwise"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-[#93C5FD] hover:bg-[#2A2A2A] transition-all duration-150 cursor-pointer active:scale-90"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFlipHorizontal}
            title="Flip Horizontally"
            className="p-1.5 rounded-xl text-neutral-450 hover:text-[#93C5FD] hover:bg-[#2A2A2A] transition-all duration-150 cursor-pointer active:scale-90"
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
          </button>
          {imgUrl.includes("/cached/") && (
            <button
              type="button"
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

export default React.memo(PanelCardThumbnail);
