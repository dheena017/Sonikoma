import React, { useCallback } from "react";
import { RefreshCw, Layers, Database, Brush, Eraser, Trash2, Save } from "lucide-react";
import MergePanel from "./MergePanel/MergePanel";
import { ImageEditorPanel, FreehandPanel } from ".";
import EnhancementsPanel from "./EnhancementsPanel";
import LayerSeparationPanel from "./LayerSeparationPanel";
import HorizontalSplitter from "./HorizontalSplitter/HorizontalSplitter";
import CutsRegistry from "./CutsRegistry/CutsRegistry";
import AutoSlicer from "./AutoCrop/AutoSlicer";

interface ImageEditorSidebarProps {
  activeTab: "adjust" | "edit" | "eraser" | "slice" | "crop" | "merge" | "draw" | "separate";
  setActiveTab: (tab: any) => void;
  handleSaveTrainingData: () => Promise<void>;
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

function ImageEditorSidebar({
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
  handleSaveTrainingData,
}: ImageEditorSidebarProps) {
  const [sampleCount, setSampleCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (activeTab === "eraser") {
      const fetchCount = async () => {
        try {
          const res = await fetchWithInterceptor("/api/image/training-data-count");
          const data = await res.json();
          if (data && typeof data.count === "number") {
            setSampleCount(data.count);
          }
        } catch (err) {
          console.error("Failed to load training count:", err);
        }
      };
      fetchCount();
    }
  }, [activeTab, fetchWithInterceptor]);

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

        {activeTab === "separate" && (
          <div className="rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <LayerSeparationPanel
              activeStoryboardPanel={activeStoryboardPanel}
              setPanels={setPanels}
              addNotification={addNotification}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          </div>
        )}

        {activeTab === "eraser" && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <Database className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  AI Mask Correction
                </h4>
                <p className="text-[9px] text-purple-300/80 font-mono">
                  YOLO Data Flywheel Loop
                </p>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
              Brush over hair, panels, or speech bubbles that the model missed or incorrectly segmented. Hitting save generates a perfect binary training pair to fine-tune your custom model.
            </p>

            {/* Brush Tool Toggles */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                Brush Mode
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBrushAction("paint")}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono font-bold transition-all cursor-pointer ${brushAction === "paint"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800"
                    }`}
                >
                  <Brush className="h-3.5 w-3.5" />
                  Highlight
                </button>
                <button
                  type="button"
                  onClick={() => setBrushAction("erase")}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono font-bold transition-all cursor-pointer ${brushAction === "erase"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800"
                    }`}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Erase Strokes
                </button>
              </div>
            </div>

            {/* Brush Size Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
                <span>Brush Size</span>
                <span className="text-purple-400">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Stats / Flywheel Card */}
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                  Training Dataset
                </span>
                <span className="text-[10px] text-neutral-300 font-sans">
                  Total saved correction pairs:
                </span>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="text-xs font-mono font-black text-purple-400">
                  {sampleCount !== null ? sampleCount : "..."}
                </span>
                <span className="text-[8px] font-mono text-purple-300 uppercase font-bold">
                  pairs
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <button
                type="button"
                onClick={handleClearBrushMask}
                className="flex-1 py-2 bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveTrainingData();
                  // Refresh count
                  try {
                    const res = await fetchWithInterceptor("/api/image/training-data-count");
                    const data = await res.json();
                    if (data && typeof data.count === "number") {
                      setSampleCount(data.count);
                    }
                  } catch (e) { }
                }}
                disabled={isSavingEdit}
                className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-40"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Correction</span>
                  </>
                )}
              </button>
            </div>
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
              setTextBgColor={setTextBgColor || (() => { })}
            />
          </div>
        )}

        {activeTab === "edit" && (
          <div className="rounded-3xl border border-white/10 bg-neutral-950/75 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
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
              setPanels={setPanels}
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
              className={`w-full relative px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg ${selectedSliceId
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50"
                  : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/50"
                } disabled:opacity-40 disabled:cursor-not-allowed text-white`}
              style={{
                boxShadow: isSavingEdit
                  ? undefined
                  : `0 0 20px ${selectedSliceId
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

export default React.memo(ImageEditorSidebar);
