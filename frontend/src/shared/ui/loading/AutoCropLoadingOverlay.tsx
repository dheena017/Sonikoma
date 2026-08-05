import React from "react";
import { Scissors, Sparkles, X, Loader2 } from "lucide-react";
import { getProxiedImageUrl } from "@/utils/url";

interface AutoCropLoadingOverlayProps {
  /** Current panel images being cropped — shows a live grid */
  images: string[];
  /** 0-100 progress percentage */
  progress?: number;
  /** The image currently being processed */
  croppingImgUrl?: string | null;
  /** Call to cancel the batch */
  onCancel?: () => void;
}

/**
 * Full-screen overlay shown while auto-crop batch is running.
 * Displays a live grid of imported images with the glowing purple border
 * and "AUTO-CROPPING... PLEASE WAIT..." overlay matching the timeline card loading style.
 */
export default function AutoCropLoadingOverlay({
  images,
  progress,
  croppingImgUrl,
  onCancel,
}: AutoCropLoadingOverlayProps) {
  const hasProgress = progress !== undefined && progress >= 0;
  const clampedProgress = hasProgress ? Math.min(100, Math.max(0, progress)) : 0;

  // Show up to 12 preview images in the grid
  const previewImages = images.slice(0, 12);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050507]/95 backdrop-blur-xl overflow-hidden p-4">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "15%",
          left: "25%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(168,85,247,0.12)",
          filter: "blur(100px)",
          animation: "acl-float 9s infinite alternate ease-in-out",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: "10%",
          right: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(147,51,234,0.1)",
          filter: "blur(90px)",
          animation: "acl-float 11s infinite alternate-reverse ease-in-out",
        }}
      />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col gap-5 p-6 sm:p-8 bg-neutral-950/90 border border-neutral-850 rounded-2xl shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
          <div className="flex items-center gap-3.5">
            {/* Gradient icon badge */}
            <div className="relative p-0.5 rounded-xl bg-gradient-to-br from-purple-500 via-cyan-500 to-purple-600 shadow-md">
              <div className="flex items-center justify-center h-10 w-10 rounded-[10px] bg-neutral-950">
                <Scissors className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Auto-Cropping Panels
                </h2>
                <span className="text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60 uppercase tracking-wider">
                  AI Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Detecting panel boundaries &amp; isolating frames...
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
              Processing Batch
            </span>
            {hasProgress && (
              <span className="text-[11px] font-bold font-mono text-cyan-400">
                {clampedProgress.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-850 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 transition-all duration-300"
              style={{
                width: hasProgress ? `${clampedProgress}%` : "100%",
                animation: hasProgress ? "none" : "acl-indeterminate 1.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Image Grid using exact purple-glow card loading style */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {previewImages.map((imgUrl, idx) => {
              const isCurrent = croppingImgUrl
                ? imgUrl === croppingImgUrl
                : !hasProgress && idx === 0;
              const isDone = hasProgress && (idx / previewImages.length) * 100 < clampedProgress;

              return (
                <div
                  key={imgUrl}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    isCurrent
                      ? "border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.6)] ring-2 ring-purple-500/40 scale-[1.02]"
                      : isDone
                      ? "border-emerald-500/40 opacity-70"
                      : "border-neutral-800 opacity-40"
                  }`}
                >
                  <img
                    src={getProxiedImageUrl(imgUrl)}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Currently Processing Overlay — matches Timeline card purple overlay style */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center z-10 gap-1.5">
                      <div className="relative flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
                        <span className="absolute inset-0 rounded-full animate-ping opacity-40 border border-purple-400" />
                      </div>
                      <span className="text-[9px] font-black font-mono tracking-[0.2em] text-purple-200 uppercase mt-0.5">
                        AUTO-CROPPING...
                      </span>
                      <span className="text-[7px] font-mono tracking-wider text-purple-400/90 font-extrabold uppercase">
                        PLEASE WAIT...
                      </span>
                    </div>
                  )}

                  {/* Completed Checkmark Overlay */}
                  {isDone && !isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/50 backdrop-blur-[1px]">
                      <span className="text-emerald-400 text-xl font-black drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">✓</span>
                    </div>
                  )}

                  {/* Frame Badge */}
                  <div className="absolute top-1.5 left-1.5 text-[8px] font-mono font-bold text-purple-300 bg-neutral-950/90 border border-purple-500/40 rounded px-1.5 py-0.5 z-20">
                    #{String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              );
            })}

            {/* +N more indicator */}
            {images.length > 12 && (
              <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-purple-500/40 flex items-center justify-center bg-purple-950/20">
                <span className="text-xs font-black font-mono text-purple-300">
                  +{images.length - 12} MORE
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty state fallback */}
        {previewImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 bg-purple-950/10 border-2 border-purple-500/30 rounded-2xl">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
            </div>
            <span className="text-[10px] font-black font-mono tracking-[0.2em] text-purple-200 uppercase">
              AUTO-CROPPING...
            </span>
            <span className="text-[8px] font-mono tracking-wider text-purple-400/80 font-extrabold uppercase">
              PLEASE WAIT...
            </span>
          </div>
        )}

        {/* Footer status text */}
        {croppingImgUrl && (
          <p className="text-[10px] font-mono text-purple-300/70 text-center truncate px-2">
            <span className="text-neutral-500">Processing image: </span>
            <span className="text-purple-200 font-bold">{croppingImgUrl.split("/").pop()}</span>
          </p>
        )}
      </div>

      <style>{`
        @keyframes acl-float {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(20px, -30px) scale(1.08); }
        }
        @keyframes acl-indeterminate {
          0%   { width: 0%; margin-left: 0%; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
