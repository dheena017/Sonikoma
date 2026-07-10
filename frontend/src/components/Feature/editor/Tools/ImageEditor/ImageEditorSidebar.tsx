import React, { useCallback } from "react";
import { RefreshCw, Layers } from "lucide-react";
import MergePanel from "./MergePanel/MergePanel";
import { CropToolsPanel, FreehandPanel } from ".";
import EnhancementsPanel from "./EnhancementsPanel";
import HorizontalSplitter from "./HorizontalSplitter/HorizontalSplitter";
import CutsRegistry from "./CutsRegistry/CutsRegistry";
import AutoSlicer from "./AutoCrop/AutoSlicer";

interface CropEditorSidebarProps {
  activeTab: "adjust" | "edit" | "eraser" | "slice" | "crop" | "merge" | "draw";
  setActiveTab: (tab: any) => void;
  slices: any[];
  setSlices: any;
  editingImageIdx: number;
  scrapedImages: string[];
  isMerging: boolean;
  handleMergeWithNext: any;
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  zoom: number;
  setZoom: (v: number) => void;
  isTransforming: boolean;
  handleTransform: (action: string, param: string) => void;
  handleResetCropBounds: () => void;
  activeStoryboardPanel: any;
  handleModifyBrightness: any;
  handleModifyContrast: any;
  handleModifySaturation: any;
  handleModifyFilterPreset: any;
  handleModifyGrayscale: any;
  handleModifyDuration: any;
  handleModifyMotionType: any;
  handleModifySpeechText: any;
  handleModifySfx: any;
  handleModifyCropPadding: any;
  setScrapedImages: any;
  setPanels: any;
  addNotification: any;
  fetchWithInterceptor: any;
  setConsoleLogs: any;
  editMode: any;
  setEditMode: any;
  brushSize: number;
  setBrushSize: any;
  brushAction: any;
  setBrushAction: any;
  handleClearBrushMask: any;
  detectionStyle: any;
  setDetectionStyle: any;
  eraseMethod: any;
  setEraseMethod: any;
  sensitivity: number;
  setSensitivity: any;
  dilation: number;
  setDilation: any;
  inpaintRadius: number;
  setInpaintRadius: any;
  debugMode: boolean;
  setDebugMode: any;
  fillColor: string;
  setFillColor: any;
  textBgColor?: string;
  setTextBgColor?: any;
  ocrLang: string;
  setOcrLang: any;
  gpu: boolean;
  setGpu: any;
  morphKernelSize: number;
  setMorphKernelSize: any;
  morphShape: string;
  setMorphShape: any;
  useCustomColorTarget: boolean;
  setUseCustomColorTarget: any;
  customColorTarget: string;
  setCustomColorTarget: any;
  customColorTolerance: number;
  setCustomColorTolerance: any;
  splitPosition: number;
  setSplitPosition: any;
  splitLines: number[];
  setSplitLines: any;
  showSplitPosition: boolean;
  setShowSplitPosition: any;
  setSelectedSliceId: any;
  handleAddSplitLine: any;
  handleRemoveSplitLine: any;
  handleExecuteHorizontalSplit: any;
  isSavingEdit: boolean;
  imageUrl: string | null;
  magneticSnap: boolean;
  setMagneticSnap: any;
  detectedGutters: number[];
  setDetectedGutters: any;
  selectedSliceId: string | null;
  editAutoTrim: boolean;
  handlePushToSlices: any;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: any;
  handleClearAllSlices: any;
  handleNudge: any;
  handleSelectSlice: any;
  handleDeleteSlice: any;
  handleCropSingleSlice: any;
  isCroppingSlice: string | null;
  handleDetectPanels: any;
  handleCancelDetect: () => void;
  isDetecting: boolean;
  handleCommitDetectedBoxes: any;
  detectedBoxes: any[];
  handleClearDetectedBoxes: any;
  handleExecuteSave: any;
}

function CropEditorSidebar({
  activeTab,
  setActiveTab,
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
  handleModifySfx,
  handleModifyCropPadding,
  setScrapedImages,
  setPanels,
  addNotification,
  fetchWithInterceptor,
  setConsoleLogs,
  editMode,
  setEditMode,
  brushSize,
  setBrushSize,
  brushAction,
  setBrushAction,
  handleClearBrushMask,
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
  textBgColor,
  setTextBgColor,
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
}: CropEditorSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col space-y-3 lg:h-full lg:min-h-0 overflow-hidden pr-0 sm:pr-1.5 scrollbar-thin overscroll-contain shrink-0 max-h-[45vh] lg:max-h-none pb-4 lg:pb-0">
      {/* Tab Contents */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 scrollbar-thin pr-0 sm:pr-1">
        {activeTab === "merge" && (
          <div className="rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <MergePanel
              editingImageIdx={editingImageIdx}
              scrapedImages={scrapedImages}
              isMerging={isMerging}
              onMerge={handleMergeWithNext}
            />
          </div>
        )}

        {activeTab === "draw" && (
          <div className="rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <FreehandPanel
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushAction={brushAction}
              setBrushAction={setBrushAction}
              fillColor={fillColor}
              setFillColor={setFillColor}
              textBgColor={textBgColor || "#ffffff"}
              setTextBgColor={setTextBgColor || (() => {})}
            />
          </div>
        )}

        {activeTab === "edit" && (
          <div className="rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <CropToolsPanel
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
          </div>
        )}

        {activeTab === "adjust" && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
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

        {activeTab === "slice" && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
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

        {activeTab === "crop" && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
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
              handleCancelDetect={handleCancelDetect}
              isDetecting={isDetecting}
              onCommitCuts={handleCommitDetectedBoxes}
              hasDetectedBoxes={detectedBoxes && detectedBoxes.length > 0}
              detectedCount={detectedBoxes.length}
              clearDetectedBoxes={handleClearDetectedBoxes}
            />
            <button
              type="button"
              onClick={handleExecuteSave}
              disabled={isSavingEdit}
              className={`w-full relative px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg ${
                selectedSliceId
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50"
                  : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/50"
              } disabled:opacity-40 disabled:cursor-not-allowed text-white`}
              style={{
                boxShadow: isSavingEdit
                  ? undefined
                  : `0 0 20px ${
                      selectedSliceId
                        ? "rgba(16,185,129,0.25)"
                        : "rgba(139,92,246,0.25)"
                    }, 0 4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              {isSavingEdit ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Crops...</span>
                </>
              ) : (
                <>
                  {selectedSliceId ? (
                    <>
                      <Layers className="h-4 w-4 text-emerald-200" />
                      <span>Execute Selected Crop</span>
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4 text-purple-200" />
                      <span>
                        {slices.length > 0
                          ? `Execute ${slices.length} Crops`
                          : "Execute Crop"}
                      </span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CropEditorSidebar);
