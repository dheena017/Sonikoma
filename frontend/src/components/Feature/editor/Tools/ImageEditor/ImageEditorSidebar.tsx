import React from "react";
import { RefreshCw, Layers, Database } from "lucide-react";
import MergePanel from "./MergePanel/MergePanel";
import ImageEditorPanel from "./ImageEditorPanel";
import FreehandPanel from "./FreehandPanel";
import EnhancementsPanel from "./EnhancementsPanel";
import LayerSeparationPanel from "./LayerSeparationPanel";
import HorizontalSplitter from "./HorizontalSplitter/HorizontalSplitter";
import CutsRegistry from "./CutsRegistry/CutsRegistry";
import AutoSlicer from "./AutoCrop/AutoSlicer";
import * as api from "@/api";
import { ImageTool } from "@/hooks/useImageEditorState";

interface ImageEditorSidebarProps {
  activeTab: ImageTool;
  setActiveTab: (tab: ImageTool) => void;

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
}: ImageEditorSidebarProps & { handleSaveTrainingData: () => Promise<void> }) {
  const [sampleCount, setSampleCount] = React.useState<number | null>(null);
  const [isTraining, setIsTraining] = React.useState(false);
  const [trainingEpoch, setTrainingEpoch] = React.useState(0);
  const [totalTrainingEpochs, setTotalTrainingEpochs] = React.useState(0);
  const [trainingElapsed, setTrainingElapsed] = React.useState(0);
  const [trainingMetrics, setTrainingMetrics] = React.useState<any>({});
  const [trainingError, setTrainingError] = React.useState<string | null>(null);
  const [epochsToTrain, setEpochsToTrain] = React.useState(20);

  React.useEffect(() => {
    if (activeTab === "train") {
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

  React.useEffect(() => {
    let intervalId: any = null;

    const checkStatus = async () => {
      try {
        const data = await api.getYoloTrainingStatus(fetchWithInterceptor);
        setIsTraining(data.is_training);
        setTrainingEpoch(data.epoch);
        setTotalTrainingEpochs(data.total_epochs);
        setTrainingElapsed(data.elapsed_seconds);
        setTrainingMetrics(data.metrics || {});
        setTrainingError(data.error);

        if (!data.is_training && isTraining) {
          const countRes = await fetchWithInterceptor("/api/image/training-data-count");
          const countData = await countRes.json();
          if (countData && typeof countData.count === "number") {
            setSampleCount(countData.count);
          }
        }
      } catch (err) {
        console.error("Failed to check training status:", err);
      }
    };

    checkStatus();

    if (activeTab === "train" || isTraining) {
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchWithInterceptor, isTraining, activeTab]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden pb-4">
      {/* Tab Contents */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
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
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <Database className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  AI Model Fine-Tuning
                </h4>
                <p className="text-[9px] text-purple-300/80 font-mono">
                  YOLO v8 Segment Fine-Tuner
                </p>
              </div>
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

            {/* Fine-Tuning Controller */}
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-purple-400 uppercase font-bold tracking-wider block">
                  Fine-Tuning Controls
                </span>
                {isTraining && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                )}
              </div>

              {isTraining ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-neutral-300">
                    <span className="font-mono">Epoch {trainingEpoch} / {totalTrainingEpochs}</span>
                    <span className="font-mono text-neutral-500">{Math.floor(trainingElapsed / 60)}m {trainingElapsed % 60}s</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(trainingEpoch / (totalTrainingEpochs || 1)) * 100}%` }}
                    ></div>
                  </div>
                  {Object.keys(trainingMetrics).length > 0 && (
                    <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-neutral-500 bg-neutral-950 p-2 rounded-xl border border-white/5">
                      {Object.entries(trainingMetrics).map(([k, v]: [string, any]) => (
                        <div key={k} className="flex justify-between">
                          <span>{k}:</span>
                          <span className="text-purple-400 font-bold">{v.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[9px] text-neutral-400 leading-relaxed font-sans">
                    Fine-tune the YOLO segmentation model directly on your corrected dataset. The server will hot-swap the fine-tuned weights automatically.
                  </p>

                  {trainingError && (
                    <div className="text-[9px] text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl font-mono leading-relaxed">
                      ⚠️ Error: {trainingError}
                    </div>
                  )}

                  {(!sampleCount || sampleCount === 0) ? (
                    <div className="text-[9px] text-purple-300/80 bg-purple-950/10 border border-purple-900/20 p-2.5 rounded-xl leading-relaxed">
                      💡 <strong>Get started:</strong> Save at least 1 mask correction in the <strong>Eraser</strong> tool to unlock fine-tuning.
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex flex-col space-y-1">
                        <label className="text-[8px] font-mono text-neutral-500 uppercase font-bold">Epochs</label>
                        <select
                          value={epochsToTrain}
                          onChange={(e) => setEpochsToTrain(Number(e.target.value))}
                          className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2 py-1.5 text-[10px] font-mono cursor-pointer focus:outline-none focus:border-purple-500"
                        >
                          <option value={5}>5 epochs (Fast)</option>
                          <option value={10}>10 epochs</option>
                          <option value={20}>20 epochs (Recommended)</option>
                          <option value={50}>50 epochs (Deep)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            addNotification("Starting YOLO fine-tuning...", "info");
                            await api.startYoloTraining(fetchWithInterceptor, epochsToTrain);
                            setIsTraining(true);
                          } catch (err: any) {
                            addNotification(`Failed to start training: ${err.message}`, "error");
                          }
                        }}
                        className="flex-1 self-end py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-mono font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                      >
                        Start Fine-Tuning
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
            setTextBgColor={setTextBgColor || (() => { })}
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
            handleModifySfx={handleModifySfx}
            handleModifyCropPadding={handleModifyCropPadding}
            setPanels={setPanels}
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

        {activeTab === "crop" && (
          <div className="space-y-4">
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
