import React, { useState, useCallback, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Slice } from "../shared/types";
import CanvasBrushLayer from "./CanvasBrushLayer";
import CanvasBubbleBoxes from "./CanvasBubbleBoxes";
import CanvasSplitLines from "./CanvasSplitLines";
import CanvasCropSelection from "./CanvasCropSelection";

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
  activeTab: "adjust" | "edit" | "eraser" | "slice" | "cuts" | "merge";

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
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  setShowSplitPosition: (v: boolean) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setSelectedSliceId: (id: string | null) => void;
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
  activeTab,

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
  setSplitPosition,
  setShowSplitPosition,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setSelectedSliceId,
}: CropCanvasProps) {
  // Track mouse position for dynamic cursor
  const [hoverPct, setHoverPct] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getTabBaseCursor = () => {
    if (activeTab === "slice") return "crosshair";
    if (activeTab === "cuts") return "nwse-resize";
    return "default";
  };

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
    // Use tab-based cursor as the default fallback
    return getTabBaseCursor();
  };

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
          if (dragType) {
            handleMove(e.clientX, e.clientY);
          }
        }}
        onMouseUp={() => {
          if (editMode === "clean_manual") return;
          handleEnd();
        }}
        onMouseLeave={() => {
          setHoverPct(null);
          if (dragType) {
            handleEnd();
          }
        }}
        onTouchStart={(e) => {
          if (editMode === "clean_manual") return;
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (editMode === "clean_manual") return;
          if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const pct = getClientPct(touch.clientX, touch.clientY);
            if (pct) setHoverPct(pct);
            if (dragType) {
              handleMove(touch.clientX, touch.clientY);
            }
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
          touchAction: "none",
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
          <CanvasBrushLayer
            canvasMaskRef={canvasMaskRef}
            handleCanvasMouseDown={handleCanvasMouseDown}
            handleCanvasMouseMove={handleCanvasMouseMove}
            handleCanvasMouseUp={handleCanvasMouseUp}
          />
        )}

        {/* Interactive Speech Bubble Box Overlays */}
        {(editMode === "clean_auto" || editMode === "typeset") && (
          <CanvasBubbleBoxes
            detectedBubbles={detectedBubbles}
            selectedBubbleIdx={selectedBubbleIdx}
            setSelectedBubbleIdx={setSelectedBubbleIdx}
            onCleanSingleBubble={onCleanSingleBubble}
          />
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
          <CanvasSplitLines
            splitPosition={splitPosition}
            splitLines={splitLines}
            hoverPct={hoverPct}
            handleRemoveSplitLine={handleRemoveSplitLine}
            setSplitPosition={setSplitPosition}
            setShowSplitPosition={setShowSplitPosition}
          />
        )}

        {/* CROP MASK SHADED AREAS & SELECTION BOUNDS */}
        {editMode === "crop" && (
          <CanvasCropSelection
            editCropTop={editCropTop}
            editCropBottom={editCropBottom}
            editCropLeft={editCropLeft}
            editCropRight={editCropRight}
            onResizeStart={onResizeStart}
          />
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
      </div>
    </div>
  );
}
