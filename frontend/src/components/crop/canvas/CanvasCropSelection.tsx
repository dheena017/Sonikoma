import React from "react";
import { Move } from "lucide-react";

interface CanvasCropSelectionProps {
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  onResizeStart: (handle: string, clientX: number, clientY: number) => void;
}

export default function CanvasCropSelection({
  editCropTop,
  editCropBottom,
  editCropLeft,
  editCropRight,
  onResizeStart,
}: CanvasCropSelectionProps) {

  // 👇 REMOVED the early return so the lines stay mounted during drags

  return (
    <>
      {/* SHADED AREAS - Removed transition-all to fix lag and rendering bugs */}
      <div
        className="absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
        style={{ height: `${editCropTop}%`, borderBottom: "1px solid rgba(139,92,246,0.35)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
        style={{ height: `${editCropBottom}%`, borderTop: "1px solid rgba(139,92,246,0.35)" }}
      />
      <div
        className="absolute top-0 bottom-0 left-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
        style={{ width: `${editCropLeft}%`, borderRight: "1px solid rgba(139,92,246,0.35)" }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
        style={{ width: `${editCropRight}%`, borderLeft: "1px solid rgba(139,92,246,0.35)" }}
      />

      {/* SELECTION BOUNDARY GUIDES - Removed transition-all */}
      <div
        className="absolute border-2 border-dashed border-purple-500/80 pointer-events-none group"
        style={{
          top: `${editCropTop}%`,
          bottom: `${editCropBottom}%`,
          left: `${editCropLeft}%`,
          right: `${editCropRight}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.5)",
          zIndex: 40
        }}
      >
        {/* Corner handles */}
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("nw", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("nw", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-purple-500 rounded-full cursor-nwse-resize pointer-events-auto z-50"
        />
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("ne", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("ne", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-purple-500 rounded-full cursor-nesw-resize pointer-events-auto z-50"
        />
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("sw", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("sw", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-purple-500 rounded-full cursor-nesw-resize pointer-events-auto z-50"
        />
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("se", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("se", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-purple-500 rounded-full cursor-nwse-resize pointer-events-auto z-50"
        />

        {/* Edge handles */}
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("n", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("n", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -top-1.5 left-2 right-2 h-3 cursor-ns-resize pointer-events-auto group/edge z-40"
        >
          <div className="mx-auto w-12 h-1 bg-purple-500/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity mt-1 shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </div>
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("s", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("s", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute -bottom-1.5 left-2 right-2 h-3 cursor-ns-resize pointer-events-auto group/edge z-40"
        >
          <div className="mx-auto w-12 h-1 bg-purple-500/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity mt-1 shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </div>
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("w", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("w", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute top-2 bottom-2 -left-1.5 w-3 cursor-ew-resize pointer-events-auto group/edge flex items-center z-40"
        >
          <div className="my-auto h-12 w-1 bg-purple-500/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity ml-1 shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </div>
        <div 
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart("e", e.clientX, e.clientY); }}
          onTouchStart={(e) => { if (e.touches && e.touches[0]) { e.stopPropagation(); onResizeStart("e", e.touches[0].clientX, e.touches[0].clientY); } }}
          className="absolute top-2 bottom-2 -right-1.5 w-3 cursor-ew-resize pointer-events-auto group/edge flex items-center z-40"
        >
          <div className="my-auto h-12 w-1 bg-purple-500/50 rounded-full opacity-0 group-hover/edge:opacity-100 transition-opacity ml-1 shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </div>

        {/* Move helper */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <Move className="h-6 w-6 text-white/50 drop-shadow-md" />
        </div>

        {/* Specs badge */}
        <div className="absolute top-1.5 left-1.5 bg-black/90 text-[9px] font-mono font-bold text-purple-400 border border-purple-800/40 px-1.5 py-0.5 rounded-lg shadow-lg backdrop-blur-sm">
          {parseFloat((100 - editCropLeft - editCropRight).toFixed(1))}%
          &times;{" "}
          {parseFloat((100 - editCropTop - editCropBottom).toFixed(1))}%
        </div>
      </div>
    </>
  );
}
