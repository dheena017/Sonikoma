import React, { useState, useCallback, useEffect, useRef } from "react";
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

  // Phase 4 Props
  editMode?: "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices";
  detectedBubbles?: Array<{ box: [number, number, number, number]; text: string; category?: string }>;
  selectedBubbleIdx?: number | null;
  setSelectedBubbleIdx?: (idx: number | null) => void;
  brushSize?: number;
  brushAction?: "paint" | "erase";
  canvasMaskRef?: React.RefObject<HTMLCanvasElement | null>;
  onCleanSingleBubble?: (ymin: number, xmin: number, ymax: number, xmax: number, text: string) => Promise<void>;
  typesetText?: string;
  typesetFont?: string;
  typesetSize?: number;
  typesetAlign?: "left" | "center" | "right";
  typesetColor?: string;
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

  // Phase 4 Props
  editMode = "crop",
  detectedBubbles = [],
  selectedBubbleIdx = null,
  setSelectedBubbleIdx,
  brushSize = 20,
  brushAction = "paint",
  canvasMaskRef,
  onCleanSingleBubble,
  typesetText = "",
  typesetFont = "arial",
  typesetSize = -1,
  typesetAlign = "center",
  typesetColor = "#000000",
}: CropCanvasProps) {
  const hasCropSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  // Track mouse position for dynamic cursor
  const [hoverPct, setHoverPct] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // Initialize and resize manual mask canvas
  const initCanvas = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      // Create temporary canvas to preserve mask drawing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx && canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        }
      }
    }

    // Apply settings
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      if (brushAction === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"; // Semi-transparent red brush
      }
    }
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasMaskRef?.current;
    if (!canvas) return;
    initCanvas(canvas);
    setIsDrawing(true);
    
    const coords = getCanvasCoords(e, canvas);
    if (!coords) return;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasMaskRef?.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e, canvas);
    if (!coords) return;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Re-sync brush size & action whenever they change
  useEffect(() => {
    const canvas = canvasMaskRef?.current;
    if (canvas) {
      initCanvas(canvas);
    }
  }, [brushSize, brushAction, canvasMaskRef]);

  const getCursor = () => {
    if (editMode === "clean_manual") return "crosshair";
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
      className="relative border border-white/5 hover:border-purple-500/20 rounded-2xl bg-black overflow-auto flex-1 h-0 flex items-start justify-center select-none transition-colors"
      style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (editMode === "clean_manual") return;
          if (e.button !== 0) return;
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (editMode === "clean_manual") return;
          const pct = getClientPct(e.clientX, e.clientY);
          if (pct) setHoverPct(pct);
        }}
        onMouseLeave={() => {
          setHoverPct(null);
        }}
        onTouchStart={(e) => {
          if (editMode === "clean_manual") return;
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={() => {
          if (editMode === "clean_manual") return;
          handleEnd();
        }}
        className="relative inline-block w-full max-w-full h-full"
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
          className="w-full h-full object-contain pointer-events-none select-none block"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        {/* Manual Brush Painting Layer */}
        {editMode === "clean_manual" && (
          <canvas
            ref={canvasMaskRef}
            className="absolute inset-0 z-40 cursor-crosshair pointer-events-auto w-full h-full"
            style={{ touchAction: "none" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleCanvasMouseDown}
            onTouchMove={handleCanvasMouseMove}
            onTouchEnd={handleCanvasMouseUp}
          />
        )}

        {/* Interactive Speech Bubble Box Overlays */}
        {(editMode === "clean_auto" || editMode === "typeset") && detectedBubbles.length > 0 && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            {detectedBubbles.map((bubble, idx) => {
              const [ymin, xmin, ymax, xmax] = bubble.box;
              const top = ymin / 10;
              const left = xmin / 10;
              const width = (xmax - xmin) / 10;
              const height = (ymax - ymin) / 10;
              const isSelected = selectedBubbleIdx === idx;

              return (
                <div
                  key={`bubble-box-${idx}`}
                  className={`absolute border-2 pointer-events-auto cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-400/20 z-40 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      : "border-purple-400/40 bg-purple-500/5 hover:border-purple-300 hover:bg-purple-500/20"
                  }`}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (setSelectedBubbleIdx) setSelectedBubbleIdx(idx);
                    if (onCleanSingleBubble) {
                      onCleanSingleBubble(ymin, xmin, ymax, xmax, bubble.text);
                    }
                  }}
                  title={bubble.text ? `Bubble OCR: "${bubble.text}" (Click to Clean/Select)` : "Detected Bubble (Click to Clean/Select)"}
                >
                  <div className="absolute left-1 top-1 bg-black/85 text-[8px] text-purple-300 font-bold px-1 py-0.5 rounded border border-purple-500/20 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap opacity-75 group-hover:opacity-100 transition-opacity">
                    Bubble #{idx + 1}
                  </div>
                  {bubble.text && (
                    <div className="absolute bottom-1 left-1 max-w-[95%] bg-black/90 text-[9px] text-neutral-200 px-1.5 py-0.5 rounded border border-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap z-50">
                      {bubble.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Live Typeset Text Preview Overlay */}
        {editMode === "typeset" && selectedBubbleIdx !== null && detectedBubbles[selectedBubbleIdx] && (
          <div
            className="absolute z-40 pointer-events-none flex items-center justify-center p-2 text-center select-none"
            style={{
              top: `${detectedBubbles[selectedBubbleIdx].box[0] / 10}%`,
              left: `${detectedBubbles[selectedBubbleIdx].box[1] / 10}%`,
              width: `${(detectedBubbles[selectedBubbleIdx].box[3] - detectedBubbles[selectedBubbleIdx].box[1]) / 10}%`,
              height: `${(detectedBubbles[selectedBubbleIdx].box[2] - detectedBubbles[selectedBubbleIdx].box[0]) / 10}%`,
              color: typesetColor,
              fontFamily: typesetFont === "comic" ? "Comic Sans MS, cursive" : typesetFont === "cour" ? "Courier New, monospace" : typesetFont === "times" ? "Times New Roman, serif" : "Arial, sans-serif",
              fontSize: typesetSize && typesetSize > 0 ? `${typesetSize}px` : "14px",
              textAlign: typesetAlign,
              fontWeight: "bold",
              textShadow: "0 0 3px white, 0 0 3px white, 0 0 3px white"
            }}
          >
            {typesetText || "Preview Text"}
          </div>
        )}

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
        {hasCropSelection && editMode === "crop" && (
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
        {editMode === "slices" && slices.map((slice, index) => {
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
        {hasCropSelection && editMode === "crop" && (
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
