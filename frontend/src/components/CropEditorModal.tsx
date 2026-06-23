import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, Link2, Loader2 } from "lucide-react";
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
  appLogic: ReturnType<typeof useAppLogic> & {
    isPipMode?: boolean;
    setIsPipMode?: (val: boolean) => void;
  };
  isPage?: boolean;
}

export default function CropEditorModal({
  appLogic,
  isPage = false,
}: CropEditorModalProps) {
  const [isDeckExpanded, setIsDeckExpanded] = React.useState<boolean>(true);
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
    isPipMode = false,
    setIsPipMode,
    mergingIndices,
    handleStitchWithNext,
  } = appLogic;

  useEffect(() => {
    if (isPipMode || isPage) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isPipMode, isPage]);

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

  useEffect(() => {
    (window as any).editorHasUnsavedChanges = () => {
      return history.length > 0 || slices.length > 0;
    };
    return () => {
      delete (window as any).editorHasUnsavedChanges;
    };
  }, [history.length, slices.length]);

  const activeStoryboardPanel = panels?.find(
    (p) => p.image_url === scrapedImages[editingImageIdx!]
  );

  const handleModifyBrightness = (panelId: number, val: number) => {
    console.log(
      `[CropEditor] Modifying brightness for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, brightness: val } : p))
    );
  };
  const handleModifyContrast = (panelId: number, val: number) => {
    console.log(
      `[CropEditor] Modifying contrast for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, contrast: val } : p))
    );
  };
  const handleModifySaturation = (panelId: number, val: number) => {
    console.log(
      `[CropEditor] Modifying saturation for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, saturation: val } : p))
    );
  };
  const handleModifyFilterPreset = (panelId: number, preset: string) => {
    console.log(
      `[CropEditor] Modifying filter preset for panel #${panelId}: ${preset}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, filter_preset: preset } : p))
    );
  };
  const handleModifyGrayscale = (panelId: number, val: boolean) => {
    console.log(
      `[CropEditor] Modifying grayscale for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, grayscale: val } : p))
    );
  };
  const handleModifyDuration = (panelId: number, val: number) => {
    console.log(
      `[CropEditor] Modifying duration for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, duration: val } : p))
    );
  };
  const handleModifyMotionType = (panelId: number, val: string) => {
    console.log(
      `[CropEditor] Modifying motion type for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, motion_type: val } : p))
    );
  };
  const handleModifySpeechText = (panelId: number, val: string) => {
    console.log(`[CropEditor] Modifying speech text for panel #${panelId}`);
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, speech_text: val } : p))
    );
  };
  const handleModifySfx = (panelId: number, val: string) => {
    console.log(`[CropEditor] Modifying sfx for panel #${panelId}: ${val}`);
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, sfx: val } : p))
    );
  };
  const handleModifyCropPadding = (panelId: number, val: number) => {
    console.log(
      `[CropEditor] Modifying crop padding for panel #${panelId}: ${val}`
    );
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, crop_padding: val } : p))
    );
  };

  if (editingImageIdx === null) return null;

  if (isPipMode) {
    return (
      <div
        className="w-full h-full relative group select-none overflow-hidden bg-neutral-950 flex flex-col justify-center items-center pointer-events-none"
        title="Click to restore Editor"
      >
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-md shadow-md z-50">
          PIP ACTIVE
        </div>
        <CropEditorCanvasContainer
          key={imageUrl || undefined}
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
          zoom={0.4}
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
      </div>
    );
  }

  const mainCard = (
    <div
      className={`relative bg-neutral-950/95 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col w-full ${
        isPage
          ? "h-[750px] lg:h-[820px] min-h-[650px]"
          : "max-w-7xl h-[min(100dvh-1.5rem,980px)] max-h-[calc(100vh-4rem)] my-auto"
      }`}
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.02), 0 0 70px rgba(139,92,246,0.14), 0 30px 60px rgba(0,0,0,0.78)",
      }}
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
        activeTab={activeTab}
        isPipMode={isPipMode}
        setIsPipMode={setIsPipMode}
        slices={slices}
      />

      {/* Main Content Pane */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden select-none items-stretch p-4 sm:p-5 gap-4 sm:gap-5">
        {/* Collapsible Preview Ribbon */}
        {scrapedImages.length > 0 && (
          <div
            className={[
              "flex border border-white/5 bg-neutral-950/40 rounded-2xl shrink-0 transition-all duration-300 ease-in-out overflow-hidden select-none",
              isDeckExpanded 
                ? "flex-col lg:flex-col w-full lg:w-36 xl:w-44 h-32 lg:h-auto" 
                : "flex-row lg:flex-col h-11 lg:h-auto w-full lg:w-11 sm:lg:w-12",
            ].join(" ")}
          >
            {/* Header / Toggle button */}
            <div
              onClick={() => setIsDeckExpanded(!isDeckExpanded)}
              className={[
                "flex items-center justify-between p-2 lg:border-b lg:border-r-0 border-r border-white/5 cursor-pointer bg-neutral-900/40 hover:bg-neutral-900 transition-colors duration-150 select-none",
                !isDeckExpanded && "lg:flex-col gap-3 py-2 px-3 lg:py-3 lg:px-2",
              ].join(" ")}
              title={isDeckExpanded ? "Collapse Deck" : "Expand Deck"}
            >
              {isDeckExpanded ? (
                <>
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider pl-1">
                    Deck ({scrapedImages.length})
                  </span>
                  <div className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors duration-150">
                    <ChevronLeft className="h-4.5 w-4.5 hidden lg:block" />
                    <ChevronLeft className="h-4.5 w-4.5 block lg:hidden rotate-90" />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors duration-150 shrink-0">
                    <ChevronRight className="h-4.5 w-4.5 hidden lg:block" />
                    <ChevronRight className="h-4.5 w-4.5 block lg:hidden -rotate-90" />
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest select-none origin-center hidden lg:block"
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                    }}
                  >
                    PANELS ({scrapedImages.length})
                  </span>
                  <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest select-none lg:hidden pl-1">
                    PANELS ({scrapedImages.length})
                  </span>
                </>
              )}
            </div>

            {/* Scrollable List of thumbnails */}
            {isDeckExpanded && (
              <div className="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto p-2.5 flex flex-row lg:flex-col gap-3 scrollbar-thin">
                {scrapedImages.map((imgUrl, idx) => {
                  const isCurrent = idx === editingImageIdx;
                  const isStitching = mergingIndices?.includes(idx) || false;
                  return (
                    <React.Fragment key={imgUrl}>
                      <div
                        onClick={() => {
                          console.log(
                            `[CropEditor] Switching to image idx: ${idx}`
                          );
                          const activeTabVal =
                            window.location.pathname.split("/")[2] || "adjust";
                          window.history.pushState(
                            {},
                            "",
                            `/editor/${activeTabVal}?idx=${idx}`
                          );
                          window.dispatchEvent(new Event("popstate"));
                        }}
                        className={[
                          "relative h-full lg:w-full aspect-square rounded-xl overflow-hidden bg-neutral-900 border shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105",
                          isCurrent
                            ? "border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/30"
                            : "border-neutral-800 hover:border-neutral-700",
                        ].join(" ")}
                      >
                        <img
                          src={imgUrl}
                          alt={`Panel #${idx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div
                          className={[
                            "absolute bottom-1 right-1 backdrop-blur-sm px-1 py-0.5 rounded text-[8px] font-mono font-bold leading-none border transition-all duration-200",
                            isCurrent
                              ? "bg-purple-600/90 border-purple-400/60 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                              : "bg-black/80 border-purple-900/30 text-purple-400",
                          ].join(" ")}
                        >
                          #{idx + 1}
                        </div>
                      </div>

                      {idx < scrapedImages.length - 1 && (
                        <div className="flex justify-center -my-1.5 h-6 items-center">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log(
                                `[CropEditor] Stitching idx ${idx} with next`
                              );
                              const stitched = await handleStitchWithNext(idx);
                              if (stitched && editingImageIdx !== null) {
                                let newIdx = editingImageIdx;
                                if (
                                  editingImageIdx === idx ||
                                  editingImageIdx === idx + 1
                                ) {
                                  newIdx = idx;
                                } else if (editingImageIdx > idx + 1) {
                                  newIdx = editingImageIdx - 1;
                                }
                                if (newIdx !== editingImageIdx) {
                                  const activeTabVal =
                                    window.location.pathname.split("/")[2] ||
                                    "adjust";
                                  window.history.pushState(
                                    {},
                                    "",
                                    `/editor/${activeTabVal}?idx=${newIdx}`
                                  );
                                  window.dispatchEvent(new Event("popstate"));
                                }
                              }
                            }}
                            disabled={isStitching}
                            className={`w-6 h-6 rounded-full bg-neutral-900 border flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer hover:scale-110 active:scale-95 z-10 opacity-60 hover:opacity-100 ${
                              isStitching
                                ? "border-purple-500/40 text-purple-400 bg-purple-950/20 cursor-wait"
                                : "border-neutral-800 hover:border-purple-500/50 hover:bg-purple-600/90 text-neutral-400 hover:text-white"
                            }`}
                            title="Stitch with next panel"
                          >
                            {isStitching ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Link2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Center Canvas & Right Sidebar Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-5 flex-1 min-h-0 items-stretch">
          <CropEditorCanvasContainer
            key={imageUrl || undefined}
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
        handleExecuteSave={handleExecuteSave}
      />
    </div>
  );

  if (isPage) {
    return (
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
        <div className="flex-grow min-h-0">{mainCard}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_42%),linear-gradient(180deg,rgba(3,3,8,0.84),rgba(3,3,8,0.94))] backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 animate-[fadeIn_0.2s_ease-out] overflow-hidden overscroll-contain"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      {mainCard}
    </div>
  );
}
