import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  activeTab: "adjust" | "edit" | "eraser" | "slice" | "crop" | "merge";

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
  aspectRatio?: number;
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
  aspectRatio = 0,
}: CropCanvasProps) {
  // Track mouse position for dynamic cursor
  const [hoverPct, setHoverPct] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isManualBrushActive = editMode === "clean_manual" && activeTab === "eraser";

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
      if (ctx && tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    }

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
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
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
    // Account for CSS transform scale to ensure accurate coordinates
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
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

  const handleCanvasMouseUp = () => setIsDrawing(false);

  useEffect(() => {
    const canvas = canvasMaskRef?.current;
    if (isManualBrushActive && canvas) initCanvas(canvas);
  }, [brushSize, brushAction, canvasMaskRef, isManualBrushActive]);

  // Hardened Global Event Listeners for Drag Robustness
  useEffect(() => {
    const handleGlobalUp = () => {
      if (dragType) handleEnd();
    };

    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, [dragType, handleEnd]);

  return (
    <div
      className="relative border border-white/5 hover:border-purple-500/20 rounded-2xl bg-black overflow-auto flex-1 h-0 flex items-start justify-center select-none transition-colors"
      style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (isManualBrushActive) return;
          if (e.button !== 0) return;
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (isManualBrushActive) return;

          const pct = getClientPct(e.clientX, e.clientY);
          if (!pct) return;

          // Skip hover state updates while dragging to reduce re-renders
          if (dragType !== null) {
            if (dragType) handleMove(pct.x, pct.y);
            return;
          }

          setHoverPct(pct);
        }}
        onMouseUp={() => {
          if (isManualBrushActive) return;
          handleEnd();
        }}
        onMouseLeave={() => {
          setHoverPct(null);
          if (dragType) handleEnd();
        }}
        onTouchStart={(e) => {
          if (isManualBrushActive) return;
          if (e.touches && e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (isManualBrushActive) return;
          if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const pct = getClientPct(touch.clientX, touch.clientY);
            if (!pct) return;

            if (dragType) {
              handleMove(pct.x, pct.y);
            } else {
              setHoverPct(pct);
            }
          }
        }}
        onTouchEnd={() => {
          if (isManualBrushActive) return;
          handleEnd();
        }}
        className={`relative inline-block w-full max-w-full h-full ${activeTab === 'crop' ? 'cursor-crosshair' : ''}`}
        style={{
          userSelect: "none",
          touchAction: "none",
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: "top center",
          transition: "transform 0.15s ease",
        }}
      >
        <img src={imgUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none select-none block" draggable={false} />

        {/* Brush Layer */}
        {isManualBrushActive && (
          <CanvasBrushLayer
            canvasMaskRef={canvasMaskRef}
            handleCanvasMouseDown={handleCanvasMouseDown}
            handleCanvasMouseMove={handleCanvasMouseMove}
            handleCanvasMouseUp={handleCanvasMouseUp}
          />
        )}

        {/* Bubble Layers */}
        {(editMode === "clean_auto" || editMode === "typeset") && (
          <CanvasBubbleBoxes
            detectedBubbles={detectedBubbles}
            selectedBubbleIdx={selectedBubbleIdx}
            setSelectedBubbleIdx={setSelectedBubbleIdx}
            onCleanSingleBubble={onCleanSingleBubble}
          />
        )}

        {/* Persistent UI Components (Visibility controlled by CSS inside components) */}
        <CanvasSplitLines
          isVisible={showSplitPosition && activeTab === "slice"}
          splitPosition={splitPosition}
          splitLines={splitLines}
          hoverPct={hoverPct}
          handleRemoveSplitLine={handleRemoveSplitLine}
          setSplitPosition={setSplitPosition}
          setShowSplitPosition={setShowSplitPosition}
        />

        {activeTab === 'crop' && (
          <CanvasCropSelection
            editCropTop={editCropTop}
            editCropBottom={editCropBottom}
            editCropLeft={editCropLeft}
            editCropRight={editCropRight}
            onResizeStart={onResizeStart}
            targetAspectRatio={aspectRatio}
            isDragging={dragType !== null}
          />
        )}

        {/* Slices Overlay */}
        {(editMode === "slices" || editMode === "crop") && slices.map((slice, index) => {
          const isSelected = slice.id === selectedSliceId;
          return (
            <div
              key={slice.id}
              onClick={(e) => { e.stopPropagation(); handleSelectSlice(slice); }}
              onMouseDown={(e) => { if (e.button === 0) { e.stopPropagation(); handleSelectAndDragSlice(slice, e.clientX, e.clientY); }}}
              className={`absolute border-2 pointer-events-auto cursor-grab active:cursor-grabbing transition-colors flex flex-col justify-between ${
                isSelected ? "border-purple-400 bg-purple-500/10 z-30 shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 z-20"
              }`}
              style={{ top: `${slice.cropTop}%`, bottom: `${slice.cropBottom}%`, left: `${slice.cropLeft}%`, right: `${slice.cropRight}%` }}
            >
              <div className="p-1">
                <span className={`inline-block font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-lg ${isSelected ? "bg-purple-950 text-purple-300 border border-purple-500/30" : "bg-purple-950/90 text-purple-300"}`}>
                  Cut #{index + 1}
                </span>
              </div>
              <div className="flex justify-end p-1">
                <button onClick={(e) => handleDeleteSlice(slice.id, e)} className="bg-red-950/90 text-red-300 p-0.5 rounded-lg"><Trash2 className="h-2.5 w-2.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
