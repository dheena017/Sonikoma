import React from "react";
import {
  Move,
  RefreshCw,
  Layers,
  Undo,
  Redo,
  Trash2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  CropCanvas,
  CanvasMultiLayer,
} from "@/features/editor_image/components";
import { GeneratedPanel } from "@/types";
import { ImageTool } from "@/features/editor_image/hooks/useImageEditorState";

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

  // Header Toolbar Props
  handleUndo?: () => void;
  historyLength?: number;
  handleRedo?: () => void;
  redoHistoryLength?: number;
  handleDeleteCurrentImage?: () => void;
  isPipMode?: boolean;
  setIsPipMode?: (val: boolean) => void;
  isToolsPanelOpen?: boolean;
  setIsToolsPanelOpen?: (val: boolean | ((prev: boolean) => boolean)) => void;
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

  // Header Toolbar Props
  handleUndo,
  historyLength = 0,
  handleRedo,
  redoHistoryLength = 0,
  handleDeleteCurrentImage,
  isPipMode,
  setIsPipMode,
  isToolsPanelOpen = true,
  setIsToolsPanelOpen,
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
      <div className="flex justify-between items-center bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/8 shadow-sm">
        {/* Left: Canvas Title */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-purple-500/10">
            <Move className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <span className="text-[11px] uppercase font-mono font-bold text-neutral-200 tracking-wider">
            Interactive Viewport Canvas
          </span>
        </div>

        {/* Center: Canvas Action & Status Toolbar */}
        <div className="flex items-center gap-1.5 bg-neutral-950/90 px-2.5 py-1 rounded-xl border border-white/10 shadow-inner">
          {handleUndo && (
            <button
              onClick={handleUndo}
              disabled={historyLength === 0}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                historyLength > 0
                  ? "text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95"
                  : "text-neutral-600 cursor-not-allowed opacity-35"
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
          )}
          {handleRedo && (
            <button
              onClick={handleRedo}
              disabled={redoHistoryLength === 0}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                redoHistoryLength > 0
                  ? "text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95"
                  : "text-neutral-600 cursor-not-allowed opacity-35"
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          {handleDeleteCurrentImage && (
            <button
              onClick={handleDeleteCurrentImage}
              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/15 transition-all cursor-pointer active:scale-95"
              title="Delete Current Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {setIsPipMode && (
            <button
              onClick={() => setIsPipMode(true)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              title="Picture-in-Picture Mode"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* Toggle properties panel */}
          {setIsToolsPanelOpen && (
            <button
              onClick={() => setIsToolsPanelOpen((prev) => !prev)}
              className="p-1.5 text-neutral-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/15 transition-all border border-transparent hover:border-purple-500/30 cursor-pointer active:scale-95"
              title={
                isToolsPanelOpen
                  ? "Close Properties Panel"
                  : "Open Properties Panel"
              }
            >
              {isToolsPanelOpen ? (
                <PanelRightClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Right: AI Smart Crop & Mode Badges */}
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
          className="relative border border-white/10 hover:border-purple-500/20 rounded-2xl bg-[#0a0b10] bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden flex-1 h-0 flex items-center justify-center select-none transition-colors"
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
            aspectRatio === "9:16"
              ? 9 / 16
              : aspectRatio === "16:9"
              ? 16 / 9
              : 0
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
