import React from "react";
import MergePanel from "@/features/editor_merge_panel";
import ImageEditorPanel from "@/features/editor_image/components/ImageEditorPanel";
import FreehandPanel from "@/features/editor_freehand_draw/components/FreehandPanel";
import EnhancementsPanel from "@/features/editor_image_enhancements/components/EnhancementsPanel";
import LayerSeparationPanel from "@/features/editor_layer_separation/components/LayerSeparationPanel";
import HorizontalSplitter from "@/features/editor_horizontal_splitter";
import YoloTrainingPanel from "./YoloTrainingPanel";
import { ImageEditorSidebarProps } from "./ImageEditorSidebarTypes";

function ImageEditorToolsPanel(
  props: ImageEditorSidebarProps & {
    handleSaveTrainingData: () => Promise<void>;
  }
) {
  const {
    activeTab,
    slices,
    setSlices,
    editingImageIdx,
    scrapedImages,
    isMerging,
    handleMergeWithNext,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    zoom,
    setZoom,
    isTransforming,
    handleTransform,
    handleResetCropBounds,
    activeStoryboardPanel,
    handleModifyBrightness,
    handleModifyContrast,
    handleModifySaturation,
    handleModifyFilterPreset,
    handleModifyGrayscale,
    handleModifyDuration,
    handleModifyMotionType,
    handleModifySpeechText,
    handleModifyNarrative,
    handleModifyVisualDescription,
    handleModifySfx,
    handleModifyCropPadding,
    setPanels,
    addNotification,
    fetchWithInterceptor,
    brushSize,
    setBrushSize,
    brushAction,
    setBrushAction,
    fillColor,
    setFillColor,
    textBgColor,
    setTextBgColor,
    splitPosition,
    setSplitPosition,
    splitLines,
    setSplitLines,
    showSplitPosition,
    setShowSplitPosition,
    setSelectedSliceId,
    handleAddSplitLine,
    handleRemoveSplitLine,
    handleExecuteHorizontalSplit,
    isSavingEdit,
    imageUrl,
    magneticSnap,
    setMagneticSnap,
    detectedGutters,
    setDetectedGutters,
    selectedSliceId,
    editAutoTrim,
    handlePushToSlices,
    autoPushOnDraw,
    setAutoPushOnDraw,
    handleClearAllSlices,
    handleNudge,
    handleSelectSlice,
    handleDeleteSlice,
    handleCropSingleSlice,
    isCroppingSlice,
    handleDetectPanels,
    handleCancelDetect,
    isDetecting,
    handleCommitDetectedBoxes,
    detectedBoxes,
    handleClearDetectedBoxes,
    handleExecuteSave,
  } = props;

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl overflow-hidden text-left">
      {/* Main Active Tool Panel Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="bg-[#14151f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          {activeTab === "merge" && (
            <MergePanel
              editingImageIdx={editingImageIdx}
              scrapedImages={scrapedImages}
              isMerging={isMerging}
              onMerge={handleMergeWithNext}
            />
          )}

          {activeTab === "separate" && (
            <LayerSeparationPanel
              activeStoryboardPanel={activeStoryboardPanel}
              setPanels={setPanels}
              addNotification={addNotification}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}

          {activeTab === "train" && (
            <YoloTrainingPanel
              activeTab={activeTab}
              addNotification={addNotification}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}

          {activeTab === "draw" && (
            <FreehandPanel
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushAction={brushAction}
              setBrushAction={setBrushAction}
              fillColor={fillColor}
              setFillColor={setFillColor}
              textBgColor={textBgColor || "#ffffff"}
              setTextBgColor={setTextBgColor || (() => {})}
              activeStoryboardPanel={activeStoryboardPanel}
              setPanels={setPanels}
              addNotification={addNotification}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}

          {activeTab === "edit" && (
            <ImageEditorPanel
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
              onRotate={(deg) => handleTransform("rotate", String(deg))}
              onFlip={(axis) => handleTransform("flip", axis)}
              onReset={handleResetCropBounds}
              handleNudge={handleNudge}
            />
          )}

          {activeTab === "adjust" && (
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
              handleModifyNarrative={handleModifyNarrative}
              handleModifyVisualDescription={handleModifyVisualDescription}
              handleModifySfx={handleModifySfx}
              handleModifyCropPadding={handleModifyCropPadding}
              setPanels={setPanels}
              editingImageIdx={editingImageIdx}
              totalImages={scrapedImages?.length || 1}
              addNotification={addNotification}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}

          {activeTab === "slice" && (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ImageEditorToolsPanel);
