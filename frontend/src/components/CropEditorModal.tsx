import React, { useEffect } from "react";
import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";
import { Slot } from "./crop/types";

import CropEditorHeader from "./crop/CropEditorHeader";
import CropEditorFooter from "./crop/CropEditorFooter";
import CropEditorCanvasContainer from "./crop/CropEditorCanvasContainer";
import CropEditorSidebar from "./crop/CropEditorSidebar";

import { useCropEditor } from "../hooks/useCropEditor.js";
import { useAppLogic } from "../hooks/useAppLogic.js";

interface CropEditorModalProps {
  appLogic: ReturnType<typeof useAppLogic>;
}

export default function CropEditorModal({ appLogic }: CropEditorModalProps) {
  const {
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
    aspectRatio,
  } = appLogic;

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
    appLogic,
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
      className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_42%),linear-gradient(180deg,rgba(3,3,8,0.84),rgba(3,3,8,0.94))] backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 animate-[fadeIn_0.2s_ease-out] overflow-hidden overscroll-contain"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div
        className="relative bg-neutral-950/95 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col w-full max-w-7xl h-[min(100dvh-1.5rem,980px)] sm:h-auto max-h-[calc(100vh-4rem)] my-auto"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 0 70px rgba(139,92,246,0.14), 0 30px 60px rgba(0,0,0,0.78)" }}
      >
        {/* Subtle top-edge glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

        <CropEditorHeader
          editingImageIdx={editingImageIdx}
          scrapedImages={scrapedImages}
          handlePrevImage={handlePrevImage}
          handleNextImage={handleNextImage}
          handleUndo={handleUndo}
          historyLength={history.length}
          handleRedo={handleRedo}
          redoHistoryLength={redoHistory.length}
          handleDeleteCurrentImage={handleDeleteCurrentImage}
          setEditingImageIdx={setEditingImageIdx}
        />

        {/* Main Content Pane */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 min-h-0 overflow-hidden select-none items-stretch">
          <CropEditorCanvasContainer
            handleAiCrop={handleAiCrop}
            isAiDetecting={isAiDetecting}
            editingImageIdx={editingImageIdx}
            scrapedImages={scrapedImages}
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
            activeTab={activeTab}
            aspectRatio={aspectRatio}
          />

          <CropEditorSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            slices={slices}
            setSlices={setSlices}
            editingImageIdx={editingImageIdx}
            scrapedImages={scrapedImages}
            isMerging={isMerging}
            handleMergeWithNext={handleMergeWithNext}
            editCropTop={editCropTop}
            editCropBottom={editCropBottom}
            editCropLeft={editCropLeft}
            editCropRight={editCropRight}
            setEditCropTop={setEditCropTop}
            setEditCropBottom={setEditCropBottom}
            setEditCropLeft={setEditCropLeft}
            setEditCropRight={setEditCropRight}
            zoom={zoom}
            setZoom={setZoom}
            isTransforming={isTransforming}
            handleTransform={(action, param) =>
              handleTransform(action as "rotate" | "flip", param)
            }
            handleResetCropBounds={handleResetCropBounds}
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
            splitPosition={splitPosition}
            setSplitPosition={setSplitPosition}
            splitLines={splitLines}
            setSplitLines={setSplitLines}
            showSplitPosition={showSplitPosition}
            setShowSplitPosition={setShowSplitPosition}
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
            selectedSliceId={selectedSliceId}
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
            handleDetectPanels={handleDetectPanels}
            isDetecting={isDetecting}
            handleCommitDetectedBoxes={handleCommitDetectedBoxes}
            detectedBoxes={detectedBoxes}
            handleClearDetectedBoxes={handleClearDetectedBoxes}
            handleExecuteSave={handleExecuteSave}
          />
        </div>

        <CropEditorFooter
          slices={slices}
          historyLength={history.length}
          handleUndo={handleUndo}
          isSavingEdit={isSavingEdit}
          setEditingImageIdx={setEditingImageIdx}
          handleDeleteCurrentImage={handleDeleteCurrentImage}
          activeTab={activeTab}
          isTransforming={isTransforming}
          addNotification={addNotification}
          handleExecuteHorizontalSplit={handleExecuteHorizontalSplit}
        />
      </div>
    </div>
  );
}
