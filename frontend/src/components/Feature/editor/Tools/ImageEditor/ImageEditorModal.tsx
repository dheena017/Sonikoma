import React, { useEffect } from "react";
import { NotificationType } from "@/components/notification/NotificationStack";
import { ErrorPopupDetail } from "@/components/confirmationmodels/ErrorPopupModal";
import { Slot } from "../../shared/index.js";

import {
  CropEditorHeader,
  CropEditorFooter,
  CropEditorCanvasContainer,
  CropEditorSidebar,
} from "./index";
import EditorMiniSidebar from "../../EditorMiniSidebar.js";

import { useCropEditor } from "../../../../../hooks/useCropEditor.js";
import { useAppLogic } from "../../../../../hooks/useAppLogic.js";

interface CropEditorModalProps {
  appLogic: ReturnType<typeof useAppLogic> & {
    isPipMode?: boolean;
    setIsPipMode?: (val: boolean) => void;
  };
  isPage?: boolean;
}

const CropEditorModal = React.memo(
  ({ appLogic, isPage = false }: CropEditorModalProps) => {
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

    const [textBgColor, setTextBgColor] = React.useState("#ffffff");
    const [isToolsPanelOpen, setIsToolsPanelOpen] = React.useState(true);

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
      const container = document.getElementById("main-scroll-container");
      const originalContainerOverflow = container
        ? container.style.overflow
        : "";
      if (container) container.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        if (container) container.style.overflow = originalContainerOverflow;
      };
    }, [isPipMode, isPage]);

    useEffect(() => {
      const handleFabricSave = (e: any) => {
        const { dataUrl } = e.detail;
        if (appLogic.editingImageIdx !== null && appLogic.setScrapedImages) {
          appLogic.setScrapedImages((prev) => {
            const nw = [...prev];
            nw[appLogic.editingImageIdx!] = dataUrl;
            return nw;
          });
          if (appLogic.addNotification) {
            appLogic.addNotification("Drawing saved successfully", "success");
          }
        }
      };
      window.addEventListener("FABRIC_SAVE_COMPLETE", handleFabricSave);
      return () =>
        window.removeEventListener("FABRIC_SAVE_COMPLETE", handleFabricSave);
    }, [
      appLogic.editingImageIdx,
      appLogic.setScrapedImages,
      appLogic.addNotification,
    ]);

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
      handleCancelDetect,
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
      (window as any).dispatchEditorAction = (action: any) => {
        switch (action.type) {
          case "SWITCH_TAB":
            setActiveTab(action.tab);
            break;
          case "PREV_IMAGE":
            handlePrevImage();
            break;
          case "NEXT_IMAGE":
            handleNextImage();
            break;
          case "UNDO":
            handleUndo();
            break;
          case "REDO":
            handleRedo();
            break;
          case "SAVE":
            handleExecuteSave();
            break;
          case "CLOSE":
            if (editingImageIdx !== null) {
              setEditingImageIdx(null);
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new Event("popstate"));
            }
            break;
          case "ZOOM_IN":
            setZoom((z) => Math.min(5, z + 0.1));
            break;
          case "ZOOM_OUT":
            setZoom((z) => Math.max(0.1, z - 0.1));
            break;
          case "BRUSH_INC":
            setBrushSize((s) => Math.min(200, s + 5));
            break;
          case "BRUSH_DEC":
            setBrushSize((s) => Math.max(1, s - 5));
            break;
        }
      };
      return () => {
        delete (window as any).editorHasUnsavedChanges;
        delete (window as any).dispatchEditorAction;
      };
    }, [
      history.length,
      slices.length,
      setActiveTab,
      setZoom,
      setBrushSize,
      handlePrevImage,
      handleNextImage,
      handleUndo,
      handleRedo,
      handleExecuteSave,
      editingImageIdx,
      setEditingImageIdx,
    ]);

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
        prev.map((p) =>
          p.id === panelId ? { ...p, filter_preset: preset } : p
        )
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
            fillColor={""}
            textBgColor={textBgColor}
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
          isToolsPanelOpen={isToolsPanelOpen}
          setIsToolsPanelOpen={setIsToolsPanelOpen}
        />

        {/* Main Content Pane */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden select-none items-stretch p-4 sm:p-5 gap-4 sm:gap-5">
          {/* Left thumbnail deck removed per request */}

          {/* Center Canvas & Right Sidebar Container */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 items-stretch overflow-hidden relative transition-all duration-300">
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
              fillColor={fillColor}
              textBgColor={textBgColor}
            />

            <div
              className={`flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                isToolsPanelOpen
                  ? "w-full lg:w-[420px] opacity-100 mt-4 lg:mt-0 lg:ml-5 pointer-events-auto"
                  : "w-0 lg:w-0 h-0 lg:h-full opacity-0 pointer-events-none overflow-hidden"
              }`}
            >
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
                textBgColor={textBgColor}
                setTextBgColor={setTextBgColor}
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
                handleCancelDetect={handleCancelDetect}
                isDetecting={isDetecting}
                handleCommitDetectedBoxes={handleCommitDetectedBoxes}
                detectedBoxes={detectedBoxes}
                handleClearDetectedBoxes={handleClearDetectedBoxes}
                handleExecuteSave={handleExecuteSave}
              />
            </div>
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
        <>
          <EditorMiniSidebar
            isCollapsed={true}
            setIsCollapsed={() => {}}
            currentSection="autocrop"
            setCurrentSection={() => {}}
            scrapedCount={scrapedImages.length}
            panelsCount={panels?.length || 0}
            isBatchCropping={false}
            isCleaningBubbles={false}
            topOffsetPx={0}
          />
          <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
            <div className="flex-grow min-h-0">{mainCard}</div>
          </div>
        </>
      );
    }

    return (
      <div
        className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_42%),linear-gradient(180deg,rgba(3,3,8,0.84),rgba(3,3,8,0.94))] backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 animate-[fadeIn_0.2s_ease-out] overflow-hidden overscroll-contain"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <EditorMiniSidebar
          isCollapsed={true}
          setIsCollapsed={() => {}}
          currentSection="autocrop"
          setCurrentSection={() => {}}
          scrapedCount={scrapedImages.length}
          panelsCount={panels?.length || 0}
          isBatchCropping={false}
          isCleaningBubbles={false}
          topOffsetPx={0}
        />
        {mainCard}
      </div>
    );
  }
);

export default CropEditorModal;
