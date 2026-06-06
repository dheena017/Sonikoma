import React from "react";
import { Move, Trash2 } from "lucide-react";
import { Slice } from "./types";

interface CropCanvasProps {
  imgUrl: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  slices: Slice[];
  selectedSliceId: string | null;
  showSplitPosition: boolean;
  splitPosition: number;
  splitLines: number[];
  handleStart: (clientX: number, clientY: number) => void;
  handleMove: (clientX: number, clientY: number) => void;
  handleEnd: () => void;
  isPointInsideSelection: (x: number, y: number) => boolean;
  handleSelectSlice: (slice: Slice) => void;
  handleDeleteSlice: (id: string, e: React.MouseEvent) => void;
  handleRemoveSplitLine: (yVal: number) => void;
}

export default function CropCanvas({
  imgUrl,
  containerRef,
  editCropTop,
  editCropBottom,
  editCropLeft,
  editCropRight,
  slices,
  selectedSliceId,
  showSplitPosition,
  splitPosition,
  splitLines,
  handleStart,
  handleMove,
  handleEnd,
  isPointInsideSelection,
  handleSelectSlice,
  handleDeleteSlice,
  handleRemoveSplitLine,
}: CropCanvasProps) {
  const hasCropSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  return (
    <div
      className="relative border border-white/5 hover:border-purple-500/20 rounded-2xl bg-black overflow-hidden h-[480px] flex items-center justify-center select-none transition-colors"
      style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          handleMove(e.clientX, e.clientY);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handleEnd}
        className="relative inline-block max-h-full max-w-full"
        style={{ cursor: isPointInsideSelection(0, 0) ? "default" : "crosshair" }}
      >
        {/* The raw image source */}
        <img
          src={imgUrl}
          alt="Crop segment preview"
          className="max-h-[470px] max-w-full pointer-events-none select-none block"
          referrerPolicy="no-referrer"
        />

        {showSplitPosition && (
          <>
            {/* Active sliding guideline */}
            <div
              className="absolute left-0 right-0 z-40 pointer-events-none"
              style={{ top: `${splitPosition}%` }}
            >
              <div className="absolute inset-x-0 border-t-2 border-dashed border-red-400/80" />
              <div className="absolute right-2 -top-5 bg-red-950/95 text-red-300 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-red-800/60 font-bold backdrop-blur shadow-lg">
                Split: {splitPosition}% (draft)
              </div>
            </div>

            {/* Saved split lines */}
            {splitLines.map((y, idx) => (
              <div
                key={`split-line-${y}-${idx}`}
                className="absolute left-0 right-0 z-40 pointer-events-none"
                style={{ top: `${y}%` }}
              >
                <div className="absolute inset-x-0 border-t-2 border-dashed border-purple-500/70" />
                <div className="absolute left-2 -top-5 bg-purple-950/95 text-purple-300 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-purple-800/60 font-bold backdrop-blur shadow-lg flex items-center gap-1.5 pointer-events-auto select-none">
                  <span>Cut #{idx + 1}: {y}%</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSplitLine(y);
                    }}
                    className="text-purple-400 hover:text-red-400 font-bold font-sans text-[11px] cursor-pointer pl-0.5"
                    title="Remove this split line"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* CROP MASK SHADED AREAS */}
        {hasCropSelection && (
          <>
            <div
              className="absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
              style={{ height: `${editCropTop}%`, borderBottom: "1px solid rgba(139,92,246,0.35)" }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
              style={{ height: `${editCropBottom}%`, borderTop: "1px solid rgba(139,92,246,0.35)" }}
            />
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
              style={{ width: `${editCropLeft}%`, borderRight: "1px solid rgba(139,92,246,0.35)" }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
              style={{ width: `${editCropRight}%`, borderLeft: "1px solid rgba(139,92,246,0.35)" }}
            />
          </>
        )}

        {/* SLICES VISUAL OVERLAYS */}
        {slices.map((slice, index) => {
          const isSelected = slice.id === selectedSliceId;
          return (
            <div
              key={slice.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSlice(slice);
              }}
              className={`absolute border-2 pointer-events-auto cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-emerald-400 bg-emerald-500/10 z-30"
                  : "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-400/60 z-20"
              }`}
              style={{
                top: `${slice.cropTop}%`,
                bottom: `${slice.cropBottom}%`,
                left: `${slice.cropLeft}%`,
                right: `${slice.cropRight}%`,
                boxShadow: isSelected
                  ? "0 0 0 1px rgba(52,211,153,0.2), inset 0 0 20px rgba(52,211,153,0.05)"
                  : undefined,
              }}
            >
              <div className="p-1">
                <span
                  className={`inline-block font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-lg shadow ${
                    isSelected
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                      : "bg-purple-950/90 text-purple-300 border border-purple-800/60"
                  }`}
                >
                  Cut #{index + 1} {isSelected ? "★" : ""}
                </span>
              </div>

              <div className="flex justify-end p-1">
                <button
                  type="button"
                  onClick={(e) => handleDeleteSlice(slice.id, e)}
                  className="bg-red-950/90 hover:bg-red-900 border border-red-800/60 text-red-300 p-0.5 rounded-lg cursor-pointer transition-colors"
                  title="Delete this cut"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* ACTIVE CROP BOX BOUNDARY GUIDES */}
        {hasCropSelection && (
          <div
            className="absolute border-2 border-dashed border-emerald-400/80 pointer-events-none transition-all duration-75"
            style={{
              top: `${editCropTop}%`,
              bottom: `${editCropBottom}%`,
              left: `${editCropLeft}%`,
              right: `${editCropRight}%`,
              boxShadow: "0 0 0 1px rgba(52,211,153,0.1), 0 0 20px rgba(52,211,153,0.06)",
            }}
          >
            {/* Corner handles */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -translate-x-[2px] -translate-y-[2px]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white translate-x-[2px] -translate-y-[2px]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -translate-x-[2px] translate-y-[2px]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white translate-x-[2px] translate-y-[2px]" />

            {/* Move helper */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-[9px] font-bold tracking-wide text-neutral-200 border border-white/10 px-2.5 py-1 rounded-xl shadow-xl backdrop-blur-sm flex items-center gap-1.5">
              <Move className="h-3 w-3 text-purple-400" />
              <span>Drag to Move</span>
            </div>

            {/* Specs badge */}
            <div className="absolute top-1.5 left-1.5 bg-black/90 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded-lg shadow-lg backdrop-blur-sm">
              {parseFloat((100 - editCropLeft - editCropRight).toFixed(1))}%
              &times;{" "}
              {parseFloat((100 - editCropTop - editCropBottom).toFixed(1))}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
