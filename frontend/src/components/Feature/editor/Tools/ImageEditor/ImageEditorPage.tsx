import React, { useEffect, useMemo, useState } from "react";
import { useCropEditorStore } from "@/hooks/useImageEditorState";
import { useImageEditor } from "../../../../../hooks/useImageEditor";
import { useAppLogic } from "../../../../../hooks/useAppLogic";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import ImageEditorCanvasContainer from "./ImageEditorCanvasContainer";
import ImageEditorSidebar from "./ImageEditorSidebar";

interface ImageEditorPageProps {
  appLogic: ReturnType<typeof useAppLogic>;
}

const ImageEditorPage = React.memo(({ appLogic }: ImageEditorPageProps) => {
  const { editingImageIdx, setEditingImageIdx } = useCropEditorStore();
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);

  // Auto-select the first image if the user opens the editor but hasn't picked one yet
  useEffect(() => {
    if (editingImageIdx === null && appLogic.scrapedImages?.length > 0) {
      setEditingImageIdx(0);
    }
  }, [editingImageIdx, appLogic.scrapedImages, setEditingImageIdx]);

  // Load the editor logic
  const editorProps = useImageEditor({ appLogic });

  // Memoize the Heavy Canvas to prevent lag
  const canvasSubtree = useMemo(() => {
    if (editingImageIdx === null) return null;
    return (
      <ImageEditorCanvasContainer
        key={editorProps.imageUrl || undefined}
        handleAiCrop={editorProps.handleAiCrop}
        isAiDetecting={editorProps.isAiDetecting}
        editingImageIdx={editingImageIdx}
        scrapedImages={appLogic.scrapedImages}
        containerRef={editorProps.containerRef}
        editCropTop={appLogic.editCropTop}
        editCropBottom={appLogic.editCropBottom}
        editCropLeft={appLogic.editCropLeft}
        editCropRight={appLogic.editCropRight}
        slices={editorProps.slices}
        selectedSliceId={editorProps.selectedSliceId}
        showSplitPosition={editorProps.showSplitPosition}
        splitPosition={editorProps.splitPosition}
        splitLines={editorProps.splitLines}
        handleStart={editorProps.handleStart}
        handleMove={editorProps.handleMove}
        handleEnd={editorProps.handleEnd}
        isPointInsideSelection={editorProps.isPointInsideSelection}
        handleSelectSlice={editorProps.handleSelectSlice}
        handleDeleteSlice={editorProps.handleDeleteSlice}
        handleRemoveSplitLine={editorProps.handleRemoveSplitLine}
        dragType={editorProps.dragType}
        onResizeStart={editorProps.onResizeStart}
        handleSelectAndDragSlice={editorProps.handleSelectAndDragSlice}
        zoom={editorProps.zoom}
        editMode={editorProps.editMode}
        detectedBubbles={editorProps.detectedBubbles}
        selectedBubbleIdx={editorProps.selectedBubbleIdx}
        setSelectedBubbleIdx={editorProps.setSelectedBubbleIdx}
        brushSize={editorProps.brushSize}
        brushAction={editorProps.brushAction}
        canvasMaskRef={editorProps.canvasMaskRef}
        setSplitPosition={editorProps.setSplitPosition}
        setShowSplitPosition={editorProps.setShowSplitPosition}
        setEditCropTop={appLogic.setEditCropTop}
        setEditCropBottom={appLogic.setEditCropBottom}
        setEditCropLeft={appLogic.setEditCropLeft}
        setEditCropRight={appLogic.setEditCropRight}
        setSelectedSliceId={editorProps.setSelectedSliceId}
        activeTab={editorProps.activeTab}
        aspectRatio={appLogic.aspectRatio}
        fillColor={editorProps.fillColor}
        textBgColor="#ffffff"
      />
    );
  }, [
    editorProps.imageUrl, editingImageIdx, editorProps.activeTab, appLogic.scrapedImages,
    editorProps.slices, editorProps.selectedSliceId, editorProps.showSplitPosition,
    editorProps.splitPosition, editorProps.splitLines, editorProps.zoom, editorProps.editMode,
    editorProps.detectedBubbles, editorProps.selectedBubbleIdx, editorProps.brushSize,
    editorProps.brushAction, editorProps.fillColor, appLogic.aspectRatio,
    appLogic.editCropTop, appLogic.editCropBottom, appLogic.editCropLeft, appLogic.editCropRight
  ]);

  // Empty State if no images exist in the project yet
  if (!appLogic.scrapedImages || appLogic.scrapedImages.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B0F19] text-neutral-400 font-mono text-sm">
        <p>No images available to edit.</p>
        <p className="text-xs text-neutral-600 mt-2">Please import assets first.</p>
      </div>
    );
  }

  // Render standard inline layout (No Modal/Fixed overlays!)
  return (
    <div className="w-full h-full bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">
      <ImageEditorHeader
        editingImageIdx={editingImageIdx ?? 0}
        scrapedImages={appLogic.scrapedImages}
        handlePrevImage={editorProps.handlePrevImage}
        handleNextImage={editorProps.handleNextImage}
        handleUndo={editorProps.handleUndo}
        historyLength={editorProps.history.length}
        handleRedo={editorProps.handleRedo}
        redoHistoryLength={editorProps.redoHistory.length}
        handleDeleteCurrentImage={editorProps.handleDeleteCurrentImage}
        setEditingImageIdx={setEditingImageIdx}
        activeTab={editorProps.activeTab}
        isPipMode={false}
        setIsPipMode={() => {}}
        slices={editorProps.slices}
        isToolsPanelOpen={isToolsPanelOpen}
        setIsToolsPanelOpen={setIsToolsPanelOpen}
      />

      <div className="flex-1 flex flex-row overflow-hidden w-full relative">

        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-[#121826] border-r border-gray-800 flex-shrink-0 z-10">
          <ImageEditorMiniSidebar />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }}
          />
          <div className="relative w-full h-full z-10 flex items-center justify-center p-4">
            {canvasSubtree}
          </div>
        </main>

        {/* Right Tools Sidebar */}
        <aside
          className={`h-full bg-[#121826] border-l border-gray-800 flex-shrink-0 z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isToolsPanelOpen ? "w-[360px] lg:w-[420px] opacity-100" : "w-0 opacity-0 border-none"
          }`}
        >
          <div className="w-[360px] lg:w-[420px] h-full overflow-y-auto custom-scrollbar p-5">
              <ImageEditorSidebar
              setActiveTab={editorProps.setActiveTab}
              slices={editorProps.slices}
              setSlices={editorProps.setSlices}
              editingImageIdx={editingImageIdx ?? 0}
              scrapedImages={appLogic.scrapedImages}

              isMerging={editorProps.isMerging}
              handleMergeWithNext={editorProps.handleMergeWithNext}
              editCropTop={appLogic.editCropTop}
              editCropBottom={appLogic.editCropBottom}
              editCropLeft={appLogic.editCropLeft}
              editCropRight={appLogic.editCropRight}
              setEditCropTop={appLogic.setEditCropTop}
              setEditCropBottom={appLogic.setEditCropBottom}
              setEditCropLeft={appLogic.setEditCropLeft}
              setEditCropRight={appLogic.setEditCropRight}
              zoom={editorProps.zoom}
              setZoom={editorProps.setZoom}
              isTransforming={editorProps.isTransforming}
              handleTransform={(action, param) => editorProps.handleTransform(action as "rotate" | "flip", param)}
              handleResetCropBounds={editorProps.handleResetCropBounds}
              activeStoryboardPanel={
                appLogic.panels?.find((p: any) => p.image_url === appLogic.scrapedImages[editingImageIdx!]) || null
              }
              handleModifyBrightness={() => {}}
              handleModifyContrast={() => {}}
              handleModifySaturation={() => {}}
              handleModifyFilterPreset={() => {}}
              handleModifyGrayscale={() => {}}
              handleModifyDuration={() => {}}
              handleModifyMotionType={() => {}}
              handleModifySpeechText={() => {}}
              handleModifySfx={() => {}}
              handleModifyCropPadding={() => {}}
              setScrapedImages={appLogic.setScrapedImages}
              setPanels={appLogic.setPanels}
              addNotification={appLogic.addNotification}
              fetchWithInterceptor={appLogic.fetchWithInterceptor}
              setConsoleLogs={appLogic.setConsoleLogs}
              editMode={editorProps.editMode}
              setEditMode={editorProps.setEditMode}
              brushSize={editorProps.brushSize}
              setBrushSize={editorProps.setBrushSize}
              brushAction={editorProps.brushAction}
              setBrushAction={editorProps.setBrushAction}
              handleClearBrushMask={editorProps.handleClearBrushMask}
              detectionStyle={editorProps.detectionStyle}
              setDetectionStyle={editorProps.setDetectionStyle}
              eraseMethod={editorProps.eraseMethod}
              setEraseMethod={editorProps.setEraseMethod}
              sensitivity={editorProps.sensitivity}
              setSensitivity={editorProps.setSensitivity}
              dilation={editorProps.dilation}
              setDilation={editorProps.setDilation}
              inpaintRadius={editorProps.inpaintRadius}
              setInpaintRadius={editorProps.setInpaintRadius}
              debugMode={editorProps.debugMode}
              setDebugMode={editorProps.setDebugMode}
              fillColor={editorProps.fillColor}
              setFillColor={editorProps.setFillColor}
              textBgColor="#ffffff"
              setTextBgColor={() => {}}
              ocrLang={editorProps.ocrLang}
              setOcrLang={editorProps.setOcrLang}
              gpu={editorProps.gpu}
              setGpu={editorProps.setGpu}
              morphKernelSize={editorProps.morphKernelSize}
              setMorphKernelSize={editorProps.setMorphKernelSize}
              morphShape={editorProps.morphShape}
              setMorphShape={editorProps.setMorphShape}
              useCustomColorTarget={editorProps.useCustomColorTarget}
              setUseCustomColorTarget={editorProps.setUseCustomColorTarget}
              customColorTarget={editorProps.customColorTarget}
              setCustomColorTarget={editorProps.setCustomColorTarget}
              customColorTolerance={editorProps.customColorTolerance}
              setCustomColorTolerance={editorProps.setCustomColorTolerance}
              splitPosition={editorProps.splitPosition}
              setSplitPosition={editorProps.setSplitPosition}
              splitLines={editorProps.splitLines}
              setSplitLines={editorProps.setSplitLines}
              showSplitPosition={editorProps.showSplitPosition}
              setShowSplitPosition={editorProps.setShowSplitPosition}
              setSelectedSliceId={editorProps.setSelectedSliceId}
              handleAddSplitLine={editorProps.handleAddSplitLine}
              handleRemoveSplitLine={editorProps.handleRemoveSplitLine}
              handleExecuteHorizontalSplit={editorProps.handleExecuteHorizontalSplit}
              isSavingEdit={appLogic.isSavingEdit}
              imageUrl={editorProps.imageUrl}
              magneticSnap={editorProps.magneticSnap}
              setMagneticSnap={editorProps.setMagneticSnap}
              detectedGutters={editorProps.detectedGutters}
              setDetectedGutters={editorProps.setDetectedGutters}
              selectedSliceId={editorProps.selectedSliceId}
              editAutoTrim={appLogic.editAutoTrim}
              handlePushToSlices={editorProps.handlePushToSlices}
              autoPushOnDraw={editorProps.autoPushOnDraw}
              setAutoPushOnDraw={editorProps.setAutoPushOnDraw}
              handleClearAllSlices={editorProps.handleClearAllSlices}
              handleNudge={editorProps.handleNudge}
              handleSelectSlice={editorProps.handleSelectSlice}
              handleDeleteSlice={editorProps.handleDeleteSlice}
              handleCropSingleSlice={editorProps.handleCropSingleSlice}
              isCroppingSlice={editorProps.isCroppingSlice}
              handleDetectPanels={editorProps.handleDetectPanels}
              handleCancelDetect={editorProps.handleCancelDetect}
              isDetecting={editorProps.isDetecting}
              handleCommitDetectedBoxes={editorProps.handleCommitDetectedBoxes}
              detectedBoxes={editorProps.detectedBoxes}
              handleClearDetectedBoxes={editorProps.handleClearDetectedBoxes}
              handleExecuteSave={editorProps.handleExecuteSave}
              activeTab={editorProps.activeTab as any}

            />
          </div>
        </aside>
      </div>
    </div>
  );
});

export default ImageEditorPage;