import React, { useRef, useEffect } from "react";
import { Scissors, X, RefreshCw, Crop, Layers, Move, Undo2, Redo2, Sparkles, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Slice, Slot } from "./crop/types";
import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";

import EnhancementsPanel from "./crop/EnhancementsPanel";
import CleanBubblesPanel from "./crop/CleanBubblesPanel";
import HorizontalSplitter from "./crop/HorizontalSplitter";
import CutsRegistry from "./crop/CutsRegistry";
import AutoSlicer from "./crop/AutoSlicer";
import CropCanvas from "./crop/CropCanvas";
import CropToolsPanel from "./crop/CropToolsPanel";
import MergePanel from "./crop/MergePanel";

import { useCropEditor } from "../hooks/useCropEditor";

interface CropEditorModalProps {
  key?: any;
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  setEditAutoTrim: (val: boolean) => void;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  isSavingEdit: boolean;
  handleSaveEditedImage: () => Promise<void>;
  handleSaveMultipleCuts: (cuts: Slot[]) => Promise<void>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchWithInterceptor?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  setErrorPopup?: React.Dispatch<React.SetStateAction<ErrorPopupDetail | null>>;
  imageEditStates?: Record<string, any>;
  setImageEditStates?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export default function CropEditorModal({
  editingImageIdx,
  setEditingImageIdx,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,
  setEditAutoTrim,
  scrapedImages,
  setScrapedImages,
  isSavingEdit,
  handleSaveEditedImage,
  handleSaveMultipleCuts,
  setConsoleLogs,
  addNotification,
  panels,
  setPanels,
  fetchWithInterceptor,
  imageEditStates,
  setImageEditStates,
  selectedScraped,
  setSelectedScraped,
  setErrorPopup,
}: CropEditorModalProps) {
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const {
    containerRef,
    dragType,
    editMode,
    setEditMode,
    detectedBubbles,
    selectedBubbleIdx,
    setSelectedBubbleIdx,
    brushSize,
    setBrushSize,
    brushAction,
    setBrushAction,
    canvasMaskRef,
    detectionStyle,
    setDetectionStyle,
    eraseMethod,
    setEraseMethod,
    sensitivity,
    setSensitivity,
    dilation,
    setDilation,
    inpaintRadius,
    setInpaintRadius,
    debugMode,
    setDebugMode,
    fillColor,
    setFillColor,
    ocrLang,
    setOcrLang,
    gpu,
    setGpu,
    morphKernelSize,
    setMorphKernelSize,
    morphShape,
    setMorphShape,
    useCustomColorTarget,
    setUseCustomColorTarget,
    customColorTarget,
    setCustomColorTarget,
    customColorTolerance,
    setCustomColorTolerance,
    isCleaning,
    detectedBoxes,
    isDetecting,
    isAiDetecting,
    activeTab,
    setActiveTab,
    zoom,
    setZoom,
    isTransforming,
    isMerging,
    slices,
    setSlices,
    selectedSliceId,
    setSelectedSliceId,
    autoPushOnDraw,
    setAutoPushOnDraw,
    splitPosition,
    setSplitPosition,
    splitLines,
    setSplitLines,
    showSplitPosition,
    setShowSplitPosition,
    magneticSnap,
    setMagneticSnap,
    detectedGutters,
    setDetectedGutters,
    isCroppingSlice,
    slicesCroppedCount,
    history,
    redoHistory,
    pushHistory,
    handleUndo,
    handleRedo,
    handleTransform,
    handleResetCropBounds,
    handleMergeWithNext,
    handlePrevImage,
    handleNextImage,
    handleCleanSingleBubble,
    handleDeleteCurrentImage,
    handleSelectSlice,
    handleDeleteSlice,
    handleCropSingleSlice,
    handleAiCrop,
    handleCommitDetectedBoxes,
    handleClearDetectedBoxes,
    handleDetectPanels,
    isPointInsideSelection,
    onResizeStart,
    handleSelectAndDragSlice,
    handleStart,
    handleMove,
    handleEnd,
    handlePushToSlices,
    handleApplyEqualSplits,
    handleClearAllSlices,
    handleNudge,
    handleAddSplitLine,
    handleRemoveSplitLine,
    handleExecuteHorizontalSplit,
    handleExecuteSave,
    imageUrl,
    handleClearBrushMask,
  } = useCropEditor({
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    setEditAutoTrim,
    scrapedImages,
    setScrapedImages,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    setConsoleLogs,
    addNotification,
    panels,
    setPanels,
    fetchWithInterceptor,
    imageEditStates,
    setImageEditStates,
  });

  const activeStoryboardPanel = panels?.find(
    (p) => p.image_url === scrapedImages[editingImageIdx!]
  );

  const handleModifyBrightness = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, brightness: val } : p))
    );
  };
  const handleModifyContrast = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, contrast: val } : p))
    );
  };
  const handleModifySaturation = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, saturation: val } : p))
    );
  };
  const handleModifyFilterPreset = (panelId: number, preset: string) => {
    setPanels?.((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, filter_preset: preset } : p
      )
    );
  };

  const handleModifyGrayscale = (panelId: number, val: boolean) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, grayscale: val } : p))
    );
  };

  const handleModifyDuration = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, duration: val } : p))
    );
  };

  const handleModifyMotionType = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, motion_type: val } : p))
    );
  };

  const handleModifySpeechText = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, speech_text: val } : p))
    );
  };

  const handleModifySfx = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, sfx: val } : p))
    );
  };

  const handleModifyCropPadding = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, crop_padding: val } : p))
    );
  };

  if (editingImageIdx === null) return null;


  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-[fadeIn_0.2s_ease-out] overflow-hidden overscroll-contain"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div
        className="relative bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full max-w-7xl h-auto max-h-[calc(100vh-4rem)] my-auto"
        style={{ boxShadow: "0 0 60px rgba(139,92,246,0.12), 0 30px 60px rgba(0,0,0,0.7)" }}
      >
        {/* Subtle top-edge glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-neutral-950 via-neutral-950/95 to-purple-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
            <div className="p-2 rounded-xl bg-purple-600/15 border border-purple-500/20">
              <Scissors className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-5">
                Advanced Drag & Drop Crop Generator
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 leading-4">
                Crop and trim frame #{editingImageIdx + 1} with drag-and-drop controls
              </p>
            </div>
          </div>
          
          {/* Panel Navigation Group */}
          <div className="w-full sm:w-auto flex items-center justify-between gap-2 bg-neutral-900/80 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.35)] rounded-3xl p-1.5 select-none">
            <button
              onClick={handlePrevImage}
              disabled={editingImageIdx === 0}
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:text-white hover:bg-purple-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous Panel (ArrowLeft or [)"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="min-w-[120px] px-3 py-2 text-[11px] font-semibold font-mono text-purple-200 bg-white/5 ring-1 ring-white/10 rounded-2xl backdrop-blur-sm text-center">
              Panel {editingImageIdx + 1} of {scrapedImages.length}
            </div>

            <button
              onClick={handleNextImage}
              disabled={editingImageIdx === scrapedImages.length - 1}
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:text-white hover:bg-purple-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next Panel (ArrowRight or ])"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
             {/* Undo Button in header */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo last action (Ctrl+Z)"
              className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
              {history.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {history.length}
                </span>
              )}
            </button>
            {/* Redo Button in header */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoHistory.length === 0}
              title="Redo last action (Ctrl+Y)"
              className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Redo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Redo</span>
              {redoHistory.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {redoHistory.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentImage}
              title="Delete Panel from deck"
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-red-200 bg-red-500/10 hover:bg-red-500/15 hover:text-red-100 border border-red-500/10 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={() => setEditingImageIdx(null)}
              className="inline-flex items-center justify-center rounded-2xl p-2 bg-neutral-950/60 hover:bg-neutral-800/90 text-neutral-300 hover:text-white transition-all"
              title="Close crop editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden select-none items-stretch">
          {/* Left side: Visual Preview Area (Canvas) */}
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
              dragType={dragType as any}
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
            />

            <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
              Draw to create panels · Drag to move · Drag corners/edges to resize · Drag split lines to reposition
            </span>
          </div>

          {/* Right side: Tabbed controls sidebar */}
          <div className="lg:col-span-5 flex flex-col space-y-3 h-full min-h-0 overflow-hidden pr-1.5 scrollbar-thin overscroll-contain">
            {/* Sidebar Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-3xl border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.35)] sm:flex sm:items-center sm:gap-1">
              {([
                { key: "adjust", label: "Adjust", emoji: "✨" },
                { key: "edit", label: "Edit", emoji: "✏️" },
                { key: "eraser", label: "Erase", emoji: "🧼" },
                { key: "slice", label: "Cut", emoji: "✂️" },
                { key: "cuts", label: `Cuts (${slices.length})`, emoji: "🎯" },
                { key: "merge", label: "Merge", emoji: "🔗" },
              ] as { key: "adjust" | "edit" | "eraser" | "slice" | "cuts" | "merge"; label: string; emoji: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl text-[10px] font-bold font-mono transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/10"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 scrollbar-thin pr-1">
              {activeTab === "merge" && editingImageIdx !== null && (
                <div className="animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <MergePanel
                    editingImageIdx={editingImageIdx}
                    scrapedImages={scrapedImages}
                    isMerging={isMerging}
                    onMerge={handleMergeWithNext}
                  />
                </div>
              )}

              {activeTab === "edit" && (
                <div className="animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <CropToolsPanel
                    editCropTop={editCropTop}
                    editCropBottom={editCropBottom}
                    editCropLeft={editCropLeft}
                    editCropRight={editCropRight}
                    setEditCropTop={(v) => { pushHistory(); setEditCropTop(v); }}
                    setEditCropBottom={(v) => { pushHistory(); setEditCropBottom(v); }}
                    setEditCropLeft={(v) => { pushHistory(); setEditCropLeft(v); }}
                    setEditCropRight={(v) => { pushHistory(); setEditCropRight(v); }}
                    zoom={zoom}
                    setZoom={setZoom}
                    isTransforming={isTransforming}
                    onRotate={(deg) => handleTransform("rotate", String(deg))}
                    onFlip={(axis) => handleTransform("flip", axis)}
                    onReset={handleResetCropBounds}
                  />
                </div>
              )}

              {activeTab === "adjust" && (
                <div className="space-y-4 animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <EnhancementsPanel
                    activeStoryboardPanel={activeStoryboardPanel}
                    handleModifyBrightness={handleModifyBrightness}
                    handleModifyContrast={handleModifyContrast}
                    handleModifySaturation={handleModifySaturation}
                    handleModifyFilterPreset={handleModifyFilterPreset}
                    handleModifyGrayscale={handleModifyGrayscale}
                    handleModifyDuration={handleModifyDuration}
                    handleModifyMotionType={handleModifyMotionType}
                    handleModifySpeechText={handleModifySpeechText}
                    handleModifySfx={handleModifySfx}
                    handleModifyCropPadding={handleModifyCropPadding}
                  />
                </div>
              )}

              {activeTab === "eraser" && (
                <div className="space-y-4 animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <CleanBubblesPanel
                    imgUrl={scrapedImages[editingImageIdx]}
                    editingImageIdx={editingImageIdx}
                    setScrapedImages={setScrapedImages}
                    setPanels={setPanels}
                    addNotification={addNotification}
                    fetchWithInterceptor={fetchWithInterceptor}
                    setConsoleLogs={setConsoleLogs}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    brushAction={brushAction}
                    setBrushAction={setBrushAction}
                    handleClearBrushMask={handleClearBrushMask}
                    detectionStyle={detectionStyle}
                    setDetectionStyle={setDetectionStyle}
                    eraseMethod={eraseMethod}
                    setEraseMethod={setEraseMethod}
                    sensitivity={sensitivity}
                    setSensitivity={setSensitivity}
                    dilation={dilation}
                    setDilation={setDilation}
                    inpaintRadius={inpaintRadius}
                    setInpaintRadius={setInpaintRadius}
                    debugMode={debugMode}
                    setDebugMode={setDebugMode}
                    fillColor={fillColor}
                    setFillColor={setFillColor}
                    ocrLang={ocrLang}
                    setOcrLang={setOcrLang}
                    gpu={gpu}
                    setGpu={setGpu}
                    morphKernelSize={morphKernelSize}
                    setMorphKernelSize={setMorphKernelSize}
                    morphShape={morphShape}
                    setMorphShape={setMorphShape}
                    useCustomColorTarget={useCustomColorTarget}
                    setUseCustomColorTarget={setUseCustomColorTarget}
                    customColorTarget={customColorTarget}
                    setCustomColorTarget={setCustomColorTarget}
                    customColorTolerance={customColorTolerance}
                    setCustomColorTolerance={setCustomColorTolerance}
                  />
                </div>
              )}

              {activeTab === "slice" && (
                <div className="space-y-4 animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <HorizontalSplitter
                    splitPosition={splitPosition}
                    setSplitPosition={setSplitPosition}
                    splitLines={splitLines}
                    setSplitLines={setSplitLines}
                    showSplitPosition={showSplitPosition}
                    setShowSplitPosition={setShowSplitPosition}
                    setEditCropTop={setEditCropTop}
                    setEditCropBottom={setEditCropBottom}
                    setEditCropLeft={setEditCropLeft}
                    setEditCropRight={setEditCropRight}
                    setSelectedSliceId={setSelectedSliceId}
                    handleAddSplitLine={handleAddSplitLine}
                    handleRemoveSplitLine={handleRemoveSplitLine}
                    handleExecuteHorizontalSplit={handleExecuteHorizontalSplit}
                    isSavingEdit={isSavingEdit}
                    imageUrl={imageUrl}
                    magneticSnap={magneticSnap}
                    setMagneticSnap={setMagneticSnap}
                    detectedGutters={detectedGutters}
                    setDetectedGutters={setDetectedGutters}
                  />
                </div>
              )}

              {activeTab === "cuts" && (
                <div className="space-y-4 animate-fadeIn rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <CutsRegistry
                    slices={slices}
                    setSlices={setSlices}
                    selectedSliceId={selectedSliceId}
                    setSelectedSliceId={setSelectedSliceId}
                    editCropTop={editCropTop}
                    setEditCropTop={setEditCropTop}
                    editCropBottom={editCropBottom}
                    setEditCropBottom={setEditCropBottom}
                    editCropLeft={editCropLeft}
                    setEditCropLeft={setEditCropLeft}
                    editCropRight={editCropRight}
                    setEditCropRight={setEditCropRight}
                    editAutoTrim={editAutoTrim}
                    handlePushToSlices={handlePushToSlices}
                    autoPushOnDraw={autoPushOnDraw}
                    setAutoPushOnDraw={setAutoPushOnDraw}
                    handleClearAllSlices={handleClearAllSlices}
                    handleNudge={handleNudge}
                    handleSelectSlice={handleSelectSlice}
                    handleDeleteSlice={handleDeleteSlice}
                    handleCropSingleSlice={handleCropSingleSlice}
                    isCroppingSlice={isCroppingSlice}
                    isSavingEdit={isSavingEdit}
                  />
                  <AutoSlicer
                    handleDetectPanels={handleDetectPanels}
                    isDetecting={isDetecting}
                    onCommitCuts={handleCommitDetectedBoxes}
                    hasDetectedBoxes={detectedBoxes && detectedBoxes.length > 0}
                    detectedCount={detectedBoxes.length}
                    clearDetectedBoxes={handleClearDetectedBoxes}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-950/95 via-neutral-950 to-purple-950/10 border-t border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-left sm:max-w-[45%]">
            <span className="text-[10px] text-neutral-500 font-mono italic break-words">
              {slices.length > 0
                ? `Multi-cut: ${slices.length} new scenes will be created on your deck`
                : "Single-frame crop mode — drag to set crop bounds"}
            </span>
            {history.length > 0 && (
              <span className="text-[9px] text-purple-500/80 font-mono">
                {history.length} undo step{history.length !== 1 ? "s" : ""} available · Ctrl+Z
              </span>
            )}
            <span className="text-[9px] text-neutral-600 font-mono mt-0.5 hidden sm:block">
              Hotkeys: [ Prev · ] Next · Esc Close · Enter Save · Ctrl+Z Undo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
            {/* Undo Button in footer */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || isSavingEdit}
              title="Undo last action (Ctrl+Z)"
              className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-600/50 disabled:opacity-25 disabled:cursor-not-allowed px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Undo</span>
              {history.length > 0 && (
                <span className="bg-purple-900/60 text-purple-300 text-[9px] font-bold px-1.5 rounded">
                  {history.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditingImageIdx(null)}
              disabled={isSavingEdit}
              className="inline-flex items-center justify-center bg-neutral-900/80 border border-white/5 text-neutral-400 hover:text-white px-3.5 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-colors hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentImage}
              disabled={isSavingEdit}
              className="inline-flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 hover:border-red-900/50 text-red-400 px-3.5 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
              <span>Delete</span>
            </button>
            {activeTab === "edit" && (
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingEdit || isTransforming}
                className="relative inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-2xl text-[11px] font-bold cursor-pointer transition-all gap-2 shadow-lg shadow-cyan-900/40 active:scale-95"
              >
                {isSavingEdit || isTransforming ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <Crop className="h-3.5 w-3.5" />
                    <span>Apply Edit</span>
                  </>
                )}
              </button>
            )}
            {activeTab === "adjust" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    addNotification("Style adjustments applied successfully!", "success");
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 hover:text-white px-4 py-2 rounded-2xl text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Apply Styles</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSave}
                  disabled={isSavingEdit}
                  className="relative inline-flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-2xl text-[11px] font-bold cursor-pointer transition-all gap-2 shadow-lg shadow-purple-900/50"
                  style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing Crop...</span>
                    </>
                  ) : (
                    <>
                      <Crop className="h-3.5 w-3.5" />
                      <span>Crop Image</span>
                    </>
                  )}
                </button>
              </>
            )}

            {activeTab === "slice" && (
              <button
                type="button"
                onClick={handleExecuteHorizontalSplit}
                disabled={isSavingEdit}
                className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
                style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Split...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-3.5 w-3.5 text-purple-200" />
                    <span>Apply Split</span>
                  </>
                )}
              </button>
            )}

            {activeTab === "cuts" && (
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingEdit}
                className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
                style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Crops...</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 text-purple-200" />
                    <span>Execute {slices.length} Crops</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

