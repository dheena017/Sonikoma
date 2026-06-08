import React from "react";
import { Move, RefreshCw, Layers } from "lucide-react";
import CropCanvas from "./CropCanvas";

interface CropEditorCanvasContainerProps {
  handleAiCrop: () => void;
  isAiDetecting: boolean;
  editingImageIdx: number;
  scrapedImages: string[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  slices: any[];
  selectedSliceId: string | null;
  showSplitPosition: boolean;
  splitPosition: number;
  splitLines: number[];
  handleStart: (clientX: number, clientY: number) => void;
  handleMove: (clientX: number, clientY: number) => void;
  handleEnd: () => void;
  isPointInsideSelection: (x: number, y: number) => boolean;
  handleSelectSlice: (slice: any) => void;
  handleDeleteSlice: (id: string, e: React.MouseEvent) => void;
  handleRemoveSplitLine: (yVal: number) => void;
  dragType: any;
  onResizeStart: (handle: string, clientX: number, clientY: number) => void;
  handleSelectAndDragSlice: (slice: any, clientX: number, clientY: number) => void;
  zoom: number;
  editMode: any;
  detectedBubbles: any[];
  selectedBubbleIdx: number | null;
  setSelectedBubbleIdx: (idx: number | null) => void;
  brushSize: number;
  brushAction: any;
  canvasMaskRef: React.RefObject<HTMLCanvasElement | null>;
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  setShowSplitPosition: (v: boolean) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setSelectedSliceId: (id: string | null) => void;
}

export default function CropEditorCanvasContainer({
  handleAiCrop,
  isAiDetecting,
  editingImageIdx,
  scrapedImages,
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
  zoom,
  editMode,
  detectedBubbles,
  selectedBubbleIdx,
  setSelectedBubbleIdx,
  brushSize,
  brushAction,
  canvasMaskRef,
  setSplitPosition,
  setShowSplitPosition,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setSelectedSliceId,
}: CropEditorCanvasContainerProps) {
  return (
    <div className="lg:col-span-7 flex flex-col space-y-2 h-full min-h-0 overflow-hidden">
      <div className="flex justify-between items-center bg-white/[0.02] backdrop-blur-sm p-2.5 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-purple-500/10">
            <Move className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-widest">
            Interactive Viewport Canvas
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAiCrop}
            disabled={isAiDetecting}
            className="flex items-center gap-1.5 bg-purple-900/30 text-purple-300 hover:bg-purple-800/50 hover:text-purple-200 px-2.5 py-1 rounded-lg border border-purple-700/30 text-[9px] font-mono font-bold cursor-pointer transition-all"
          >
            {isAiDetecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Layers className="h-3 w-3" />
            )}
            <span>AI Smart Crop</span>
          </button>
          <span className="text-[9px] bg-purple-950/80 text-purple-400 font-mono font-bold px-2 py-1 rounded-lg border border-purple-800/30">
            Draw
          </span>
          <span className="text-[9px] bg-emerald-950/80 text-emerald-400 font-mono font-bold px-2 py-1 rounded-lg border border-emerald-800/30">
            Move
          </span>
        </div>
      </div>

      <CropCanvas
        imgUrl={scrapedImages[editingImageIdx]}
        containerRef={containerRef}
        editCropTop={editCropTop}
        editCropBottom={editCropBottom}
        editCropLeft={editCropLeft}
        editCropRight={editCropRight}
        slices={slices}
        selectedSliceId={selectedSliceId}
        showSplitPosition={showSplitPosition}
        splitPosition={splitPosition}
        splitLines={splitLines}
        handleStart={handleStart}
        handleMove={handleMove}
        handleEnd={handleEnd}
        isPointInsideSelection={isPointInsideSelection}
        handleSelectSlice={handleSelectSlice}
        handleDeleteSlice={handleDeleteSlice}
        handleRemoveSplitLine={handleRemoveSplitLine}
        dragType={dragType}
        onResizeStart={onResizeStart}
        handleSelectAndDragSlice={handleSelectAndDragSlice}
        zoom={zoom}
        editMode={editMode}
        detectedBubbles={detectedBubbles}
        selectedBubbleIdx={selectedBubbleIdx}
        setSelectedBubbleIdx={setSelectedBubbleIdx}
        brushSize={brushSize}
        brushAction={brushAction}
        canvasMaskRef={canvasMaskRef}
        setSplitPosition={setSplitPosition}
        setShowSplitPosition={setShowSplitPosition}
        setEditCropTop={setEditCropTop}
        setEditCropBottom={setEditCropBottom}
        setEditCropLeft={setEditCropLeft}
        setEditCropRight={setEditCropRight}
        setSelectedSliceId={setSelectedSliceId}
      />

      <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
        Draw to create panels · Drag to move · Drag corners/edges to resize · Drag split lines to reposition
      </span>
    </div>
  );
}
