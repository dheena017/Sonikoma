import React from "react";
import { Move } from "lucide-react";

interface CanvasCropSelectionProps {
  isVisible: boolean;
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  onResizeStart: (handle: string, clientX: number, clientY: number) => void;
}

export default function CanvasCropSelection({
  isVisible,
  editCropTop,
  editCropBottom,
  editCropLeft,
  editCropRight,
  onResizeStart,
}: CanvasCropSelectionProps) {
  if (!isVisible) return null;

  const hasCropSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  if (!hasCropSelection) return null;

  return (
    <>
      {/* SHADED AREAS */}
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

      {/* SELECTION BOUNDARY GUIDES */}
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

        {/* Edge handles */}
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
    </>
  );
}
