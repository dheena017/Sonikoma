import React from "react";
import { Move, RefreshCw, Layers } from "lucide-react";
import { CropCanvas, CanvasMultiLayer } from "../../Workspace";
import { GeneratedPanel } from "@/types";
import { ImageTool } from "@/hooks/useImageEditorState";

interface ImageEditorCanvasContainerProps {
  activeStoryboardPanel?: GeneratedPanel | null;
  handleAiCrop: () => void;
  isAiDetecting: boolean;
  editingImageIdx: number;
  scrapedImages: string[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
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
  handleSelectAndDragSlice: (
    slice: any,
    clientX: number,
    clientY: number
  ) => void;
  zoom: number;
  editMode: any;
  detectedBubbles: any[];
  selectedBubbleIdx: number | null;
  setSelectedBubbleIdx: (idx: number | null) => void;
  brushSize: number;
  brushAction: any;
  fillColor: string;
  textBgColor?: string;
  canvasMaskRef: React.RefObject<HTMLCanvasElement | null>;
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  setShowSplitPosition: (v: boolean) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setSelectedSliceId: (id: string | null) => void;
  activeTab: ImageTool;

  aspectRatio?: any;
}

export default function ImageEditorCanvasContainer({
  activeStoryboardPanel,
  handleAiCrop,
  isAiDetecting,
  editingImageIdx,
  scrapedImages,
  containerRef,
  setPanels,
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
  fillColor,
  textBgColor,
  canvasMaskRef,
  setSplitPosition,
  setShowSplitPosition,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setSelectedSliceId,
  activeTab,
  aspectRatio,
}: ImageEditorCanvasContainerProps) {
  // Safe handlers that only allow crop drawing when in the correct tabs
  const safeHandleStart = (clientX: number, clientY: number) => {
    if (!["slice", "crop"].includes(activeTab)) return;
    handleStart(clientX, clientY);
  };

  const safeHandleMove = (x: number, y: number) => {
    if (!["slice", "crop"].includes(activeTab)) return;
    handleMove(x, y);
  };

  const safeHandleEnd = () => {
    if (!["slice", "crop"].includes(activeTab)) return;
    handleEnd();
  };

  return (
    <div
      className="flex flex-col space-y-2 lg:h-full flex-1 min-h-[350px] lg:min-h-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        pointerEvents: "auto",
      }}
    >
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

      {activeStoryboardPanel?.layers && activeTab === "separate" ? (
        <div
          className="relative border border-white/5 hover:border-purple-500/20 rounded-2xl bg-black overflow-hidden flex-1 h-0 flex items-center justify-center select-none transition-colors"
          style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
        >
          <div className="relative w-full h-full max-h-full max-w-full z-10 flex items-center justify-center p-4">
            <CanvasMultiLayer
              layers={activeStoryboardPanel.layers}
              syncMap={activeStoryboardPanel.syncMap}
              isActive={true}
              panelId={activeStoryboardPanel.id}
              setPanels={setPanels}
            />
          </div>
        </div>
      ) : (
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
          handleStart={safeHandleStart}
          handleMove={safeHandleMove}
          handleEnd={safeHandleEnd}
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
          fillColor={fillColor}
          textBgColor={textBgColor}
          canvasMaskRef={canvasMaskRef}
          setSplitPosition={setSplitPosition}
          setShowSplitPosition={setShowSplitPosition}
          setEditCropTop={setEditCropTop}
          setEditCropBottom={setEditCropBottom}
          setEditCropLeft={setEditCropLeft}
          setEditCropRight={setEditCropRight}
          setSelectedSliceId={setSelectedSliceId}
          activeTab={activeTab}
          aspectRatio={
            aspectRatio === "9:16" ? 9 / 16 : aspectRatio === "16:9" ? 16 / 9 : 0
          }
        />
      )}

      <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
        Draw to create panels · Drag to move · Drag corners/edges to resize ·
        Drag split lines to reposition
      </span>
    </div>
  );
}
