import React, { useEffect } from "react";
import { ErrorPopupDetail } from "@/components/confirmationmodels/ErrorPopupModal";
import { Slot } from "../../shared/index.js";

import EditorMiniSidebar from "../../EditorMiniSidebar.js";

import { useImageEditorStore } from "@/hooks/useImageEditorState";

import { useImageEditor } from "../../../../../hooks/useImageEditor.js";
import { useAppLogic } from "../../../../../hooks/useAppLogic.js";
import { ImageEditorHeader } from "./ImageEditorHeader.js";
import ImageEditorCanvasContainer from "./ImageEditorCanvasContainer.js";
import ImageEditorSidebar from "./ImageEditorSidebar.js";

interface ImageEditorModalProps {
  appLogic: ReturnType<typeof useAppLogic> & {
    isPipMode?: boolean;
    setIsPipMode?: (val: boolean) => void;
  };
  isPage?: boolean;
}

const ImageEditorModal = React.memo(
  ({ appLogic, isPage = false }: ImageEditorModalProps) => {
    const {
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

    // Read from Zustand store (source of truth for modal open/close)
    const editingImageIdx = useImageEditorStore((state) => state.editingImageIdx);
    const setEditingImageIdx = useImageEditorStore((state) => state.setEditingImageIdx);

    const handleCloseEditor = React.useCallback(() => {
      // 1) Clear the store
      setEditingImageIdx(null);

      // 2) Clean the URL (remove ?idx=...)
      const url = new URL(window.location.href);
      url.searchParams.delete("idx");
      window.history.replaceState({}, "", url.toString());

      // 3) Keep any listeners (route sync) up to date
      window.dispatchEvent(new Event("popstate"));
    }, [setEditingImageIdx]);


    // Sync store state back to appLogic so other components stay in sync
    useEffect(() => {
      if (appLogic.setEditingImageIdx && editingImageIdx !== appLogic.editingImageIdx) {
        appLogic.setEditingImageIdx(editingImageIdx);
      }
    }, [editingImageIdx, appLogic]);

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
    } = useImageEditor({
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
              handleCloseEditor();
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

    const activeStoryboardPanel =
      panels?.find(
        (p) => p.image_url === scrapedImages[editingImageIdx!]
      ) || null;

    const handleModifyBrightness = (panelId: number, val: number) => {
      console.log(`[ImageEditor] Modifying brightness for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, brightness: val } : p))
      );
    };
    const handleModifyContrast = (panelId: number, val: number) => {
      console.log(`[ImageEditor] Modifying contrast for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, contrast: val } : p))
      );
    };
    const handleModifySaturation = (panelId: number, val: number) => {
      console.log(`[ImageEditor] Modifying saturation for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, saturation: val } : p))
      );
    };
    const handleModifyFilterPreset = (panelId: number, preset: string) => {
      console.log(`[ImageEditor] Modifying filter preset for panel #${panelId}: ${preset}`);
      setPanels?.((prev) =>
        prev.map((p) =>
          p.id === panelId ? { ...p, filter_preset: preset } : p
        )
      );
    };
    const handleModifyGrayscale = (panelId: number, val: boolean) => {
      console.log(`[ImageEditor] Modifying grayscale for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, grayscale: val } : p))
      );
    };
    const handleModifyDuration = (panelId: number, val: number) => {
      console.log(`[ImageEditor] Modifying duration for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, duration: val } : p))
      );
    };
    const handleModifyMotionType = (panelId: number, val: string) => {
      console.log(`[ImageEditor] Modifying motion type for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, motion_type: val } : p))
      );
    };
    const handleModifySpeechText = (panelId: number, val: string) => {
      console.log(`[ImageEditor] Modifying speech text for panel #${panelId}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, speech_text: val } : p))
      );
    };
    const handleModifySfx = (panelId: number, val: string) => {
      console.log(`[ImageEditor] Modifying sfx for panel #${panelId}: ${val}`);
      setPanels?.((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, sfx: val } : p))
      );
    };
    const handleModifyCropPadding = (panelId: number, val: number) => {
      console.log(`[ImageEditor] Modifying crop padding for panel #${panelId}: ${val}`);
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
              <ImageEditorCanvasContainer
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

    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden z-[100]">
        
        {/* Full-width Header */}
        <ImageEditorHeader
          editingImageIdx={editingImageIdx}
          scrapedImages={scrapedImages}
          handlePrevImage={handlePrevImage}
          handleNextImage={handleNextImage}
          handleUndo={handleUndo}
          historyLength={history.length}
          handleRedo={handleRedo}
          redoHistoryLength={redoHistory.length}
          handleDeleteCurrentImage={handleDeleteCurrentImage}
          setEditingImageIdx={(idx) => {
            // Header's Cancel button only knows about the store;
            // we still must clean the URL.
            if (idx === null) handleCloseEditor();
            else setEditingImageIdx(idx);
          }}
          activeTab={activeTab}
          isPipMode={isPipMode}
          setIsPipMode={setIsPipMode}
          slices={slices}
          isToolsPanelOpen={isToolsPanelOpen}
          setIsToolsPanelOpen={setIsToolsPanelOpen}
        />


        {/* Main Body */}
        <div className="flex-1 flex flex-row overflow-hidden w-full">
          
          {/* Left Column: Mini Sidebar */}
          <aside className="w-[72px] h-full bg-[#121826] border-r border-gray-800 flex-shrink-0 z-20">
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
          </aside>

          {/* Center Column: The Interactive Canvas */}
          <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            
            <div className="relative w-full h-full z-10 flex items-center justify-center p-4">
              {React.useMemo(() => (
                <ImageEditorCanvasContainer
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
              ), [
                imageUrl,
                editingImageIdx,
                activeTab,
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
                zoom,
                editMode,
                detectedBubbles,
                selectedBubbleIdx,
                setSelectedBubbleIdx,
                brushSize,
                brushAction,
                canvasMaskRef,
                selectedSliceId,
                setSplitPosition,
                setShowSplitPosition,
                setEditCropTop,
                setEditCropBottom,
                setEditCropLeft,
                setEditCropRight,
                setSelectedSliceId,
                isAiDetecting,
                handleAiCrop,
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
                fillColor,
                textBgColor,
                aspectRatio,
              ])}
            </div>
          </main>

          {/* Right Column: Properties Panel (Collapsible) */}
          <aside
            className={`h-full bg-[#121826] border-l border-gray-800 flex-shrink-0 z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isToolsPanelOpen ? "w-[360px] lg:w-[420px] opacity-100" : "w-0 opacity-0 border-none"
            }`}
          >
            {/* Inner fixed-width container prevents content squishing during transition */}
            <div className="w-[360px] lg:w-[420px] h-full overflow-y-auto custom-scrollbar p-5">
              <ImageEditorSidebar
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
                handleTransform={(action, param) => handleTransform(action as "rotate" | "flip", param)}
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
                activeTab={"adjust"}              
              />
            </div>
          </aside>
        </div>
      </div>
    );
  }
);

export default ImageEditorModal;