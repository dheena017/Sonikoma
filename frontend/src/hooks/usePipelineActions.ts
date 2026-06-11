import { GeneratedPanel } from "../types.js";
import { NotificationType } from "../components/NotificationStack.js";
import { useAutoAnalysis } from "./useAutoAnalysis.js";
import { useVideoGeneration } from "./useVideoGeneration.js";
import { useBatchImageActions } from "./useBatchImageActions.js";
import { useSingleImageEdits } from "./useSingleImageEdits.js";
import { useAppState } from "./useAppState.js";

interface UsePipelineActionsProps {
  state: ReturnType<typeof useAppState>;
  setCurrentPanelIndex: (idx: number) => void;
  setPlaybackTime: (time: number) => void;
  setStoryboardPlaying: (val: boolean) => void;
  playStoryboardAudio: (idx: number) => void;
}

export function usePipelineActions({
  state,
  setCurrentPanelIndex,
  setPlaybackTime,
  setStoryboardPlaying,
  playStoryboardAudio,
}: UsePipelineActionsProps) {
  const {
    panels,
    setPanels,
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    setConsoleLogs,
    addNotification,
    fetchWithInterceptor,
    targetUrl,
    selectedSource,
    selectedModel,
    frameRate,
    voiceActor,
    musicTheme,
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    editAutoTrim,
    bubbleDetectionStyle,
    bubbleEraseMethod,
    bubbleSensitivity,
    bubbleDilation,
    bubbleInpaintRadius,
    activeBubbleTab,
    setIsCleaningBubbles,
    setCleanProgress,
    setBubbleCroppingImgUrl,
    cropSensitivity,
    cropPaddingPx,
    cropBackgroundMode,
    autoSplitTallStrips,
    processingStrategy,
    aspectRatioLock,
    minPanelAreaPct,
    overlapMergeThreshold,
    useLocalCV,
    cropModel,
    cropMinHeightPx,
    cropCannyLow,
    cropCannyHigh,
    cropCloseKernelSize,
    setIsBatchCropping,
    setBatchProgress,
    setCroppingImgUrl,
    setActivePreviewTab,
    setVideoUrl,
    isScraping,
  } = state;

  const {
    runBackgroundAnalysis,
    addPanelsWithAutoAnalysis,
  } = useAutoAnalysis({
    panels,
    selectedModel,
    scrapedImages,
    setPanels,
    setConsoleLogs,
    addNotification,
    fetchWithInterceptor,
    setActivePreviewTab,
  });

  const {
    isProcessing,
    progressStatus,
    reprocessingPanelId,
    handleGenerateVideo,
    handleTriggerReprocess,
  } = useVideoGeneration({
    panels,
    setPanels,
    setConsoleLogs,
    addNotification,
    fetchWithInterceptor,
    targetUrl,
    selectedSource,
    selectedModel,
    frameRate,
    voiceActor,
    musicTheme,
    setVideoUrl,
    setActivePreviewTab,
  });

  const {
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
  } = useBatchImageActions({
    selectedScraped,
    setSelectedScraped,
    setScrapedImages,
    setPanels,
    setConsoleLogs,
    addNotification,
    fetchWithInterceptor,
    bubbleEraseMethod,
    bubbleSensitivity,
    bubbleDetectionStyle,
    bubbleDilation,
    bubbleInpaintRadius,
    cropSensitivity,
    cropBackgroundMode,
    aspectRatioLock,
    minPanelAreaPct,
    overlapMergeThreshold,
    useLocalCV,
    selectedModel,
    cropPaddingPx,
    cropModel,
    cropMinHeightPx,
    cropCannyLow,
    cropCannyHigh,
    cropCloseKernelSize,
  });

  const {
    mergingIndices,
    isSavingEdit,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
  } = useSingleImageEdits({
    editingImageIdx,
    scrapedImages,
    setScrapedImages,
    setSelectedScraped,
    setConsoleLogs,
    addNotification,
    fetchWithInterceptor,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    editAutoTrim,
  });

  return {
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    reprocessingPanelId,
    isSavingEdit,
    handleGenerateVideo,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
    addPanelsWithAutoAnalysis,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
  };
}
