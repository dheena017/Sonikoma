import React, { useState, useCallback } from "react";
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
  dragType: "draw" | "move" | "split" | "drag-split-line" | `resize-${string}` | null;
  onResizeStart: (handle: string, clientX: number, clientY: number) => void;
  handleSelectAndDragSlice: (slice: Slice, clientX: number, clientY: number) => void;
  zoom?: number;
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
  dragType,
  onResizeStart,
  handleSelectAndDragSlice,
  zoom = 1,
}: CropCanvasProps) {
  const hasCropSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  // Track mouse position for dynamic cursor
  const [hoverPct, setHoverPct] = useState<{ x: number; y: number } | null>(null);

  const getClientPct = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      return { x, y };
    },
    [containerRef]
  );

  const getCursor = () => {
    if (showSplitPosition) {
      if (hoverPct) {
        const nearLine = splitLines.some(lineY => Math.abs(lineY - hoverPct.y) < 2.5);
        if (nearLine) return "row-resize";
      }
      return "ns-resize";
    }
    if (dragType === "move") return "grabbing";
    if (dragType === "draw") return "crosshair";
    if (dragType && dragType.startsWith("resize-")) {
      const handle = dragType.replace("resize-", "");
      if (handle === "nw" || handle === "se") return "nwse-resize";
      if (handle === "ne" || handle === "sw") return "nesw-resize";
      if (handle === "n" || handle === "s") return "ns-resize";
      if (handle === "w" || handle === "e") return "ew-resize";
    }
    if (hoverPct && isPointInsideSelection(hoverPct.x, hoverPct.y)) return "grab";
    return "crosshair";
  };

  return (
    <div
      className="relative border border-white/5 hover:border-purple-500/20 rounded-2xl bg-black overflow-y-auto flex-1 h-0 flex items-start justify-center select-none transition-colors"
      style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          // Update hover position for cursor
          const pct = getClientPct(e.clientX, e.clientY);
          if (pct) setHoverPct(pct);
          // NOTE: actual move tracking is done via global listeners in the parent
        }}
        onMouseLeave={() => {
          setHoverPct(null);
          // Do NOT call handleEnd here — global window listeners handle mouseup
          // so the drag continues even when the mouse leaves the image
        }}
        onTouchStart={(e) => {
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handleEnd}
        className="relative inline-block w-full max-w-full"
        style={{
          cursor: getCursor(),
          userSelect: "none",
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: "top center",
          transition: "transform 0.15s ease",
        }}
      >
        {/* Raw image */}
        <img
          src={imgUrl}
          alt="Crop segment preview"
          className="w-full max-w-full pointer-events-none select-none block"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        {/* Split guidelines */}
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
            {splitLines.map((y, idx) => {
              const isHovered = hoverPct ? Math.abs(hoverPct.y - y) < 2.5 : false;
              return (
                <div
                  key={`split-line-${y}-${idx}`}
                  className="absolute left-0 right-0 z-40 h-3 -translate-y-1.5 flex items-center cursor-row-resize pointer-events-auto"
                  style={{ top: `${y}%` }}
                >
                  <div className={`w-full border-t-2 border-dashed transition-all ${
                    isHovered ? "border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] scale-y-110" : "border-purple-500/70"
                  }`} />
                  <div className="absolute left-2 bg-purple-950/95 text-purple-300 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-purple-800/60 font-bold backdrop-blur shadow-lg flex items-center gap-1.5 pointer-events-auto select-none">
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
              );
            })}
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
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                handleSelectAndDragSlice(slice, e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches && e.touches[0]) {
                  e.stopPropagation();
                  handleSelectAndDragSlice(slice, e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className={`absolute border-2 pointer-events-auto cursor-grab active:cursor-grabbing transition-all flex flex-col justify-between ${
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
            {/* Corner handles (visible glowing handles) */}
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("nw", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("nw", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute top-0 left-0 w-3.5 h-3.5 bg-emerald-400 border border-neutral-900 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize pointer-events-auto hover:scale-125 active:scale-95 transition-transform shadow-[0_0_8px_rgba(52,211,153,0.8)] z-50" 
            />
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("ne", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("ne", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border border-neutral-900 rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize pointer-events-auto hover:scale-125 active:scale-95 transition-transform shadow-[0_0_8px_rgba(52,211,153,0.8)] z-50" 
            />
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("sw", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("sw", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-emerald-400 border border-neutral-900 rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize pointer-events-auto hover:scale-125 active:scale-95 transition-transform shadow-[0_0_8px_rgba(52,211,153,0.8)] z-50" 
            />
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("se", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("se", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border border-neutral-900 rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize pointer-events-auto hover:scale-125 active:scale-95 transition-transform shadow-[0_0_8px_rgba(52,211,153,0.8)] z-50" 
            />

            {/* Edge handles (invisible wide bars for easy grabbing) */}
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("n", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("n", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute -top-1.5 left-2 right-2 h-3 cursor-ns-resize pointer-events-auto group/edge z-40"
            >
              <div className="mx-auto w-12 h-1 bg-emerald-400/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity mt-1 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </div>
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("s", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("s", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute -bottom-1.5 left-2 right-2 h-3 cursor-ns-resize pointer-events-auto group/edge z-40"
            >
              <div className="mx-auto w-12 h-1 bg-emerald-400/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity mt-1 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </div>
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("w", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("w", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute top-2 bottom-2 -left-1.5 w-3 cursor-ew-resize pointer-events-auto group/edge flex items-center z-40"
            >
              <div className="my-auto h-12 w-1 bg-emerald-400/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity ml-1 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </div>
            <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart("e", e.clientX, e.clientY); }}
              onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("e", e.touches[0].clientX, e.touches[0].clientY); } }}
              className="absolute top-2 bottom-2 -right-1.5 w-3 cursor-ew-resize pointer-events-auto group/edge flex items-center z-40"
            >
              <div className="my-auto h-12 w-1 bg-emerald-400/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity ml-1 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            </div>

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
