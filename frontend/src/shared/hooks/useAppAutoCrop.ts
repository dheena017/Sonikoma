import { useState } from "react";
import { DEFAULT_AUTOCROP_SETTINGS } from "@/features/editor_studio/types/settings";

export function useAppAutoCrop() {
  const [showAutoCropModal, setShowAutoCropModal] = useState<boolean>(false);
  const [cropSensitivity, setCropSensitivity] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_crop_sensitivity") || String(DEFAULT_AUTOCROP_SETTINGS.sensitivity), 10)
  );
  const [cropPaddingPx, setCropPaddingPx] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_crop_padding") || String(DEFAULT_AUTOCROP_SETTINGS.padding), 10)
  );
  const [cropBackgroundMode, setCropBackgroundMode] = useState<string>(
    () => localStorage.getItem("ai_crop_bg_mode") || DEFAULT_AUTOCROP_SETTINGS.backgroundColorMode
  );
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState<boolean>(
    () => localStorage.getItem("ai_crop_auto_split") !== "false"
  );
  const [aspectRatioLock, setAspectRatioLock] = useState<string>(
    () => localStorage.getItem("ai_crop_aspect_ratio") || DEFAULT_AUTOCROP_SETTINGS.aspectRatioLock
  );
  const [minPanelAreaPct, setMinPanelAreaPct] = useState<number>(() =>
    parseFloat(localStorage.getItem("ai_crop_min_area") || String(DEFAULT_AUTOCROP_SETTINGS.minPanelAreaPct))
  );
  const [overlapMergeThreshold, setOverlapMergeThreshold] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_merge_thresh") || String(Math.round(DEFAULT_AUTOCROP_SETTINGS.overlapMergeThreshold * 100)), 10)
  );
  const [useLocalCV, setUseLocalCV] = useState<boolean>(
    () => localStorage.getItem("ai_crop_use_local_cv") !== "false"
  );
  const [isBatchCropping, setIsBatchCropping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = useState<string | null>(null);

  const [cropModel, setCropModel] = useState<string>(
    () => localStorage.getItem("ai_crop_model") || DEFAULT_AUTOCROP_SETTINGS.cropModel || "opencv"
  );
  const [cropMinHeightPx, setCropMinHeightPx] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_min_h") || String(DEFAULT_AUTOCROP_SETTINGS.cropMinHeightPx || 60), 10)
  );
  const [cropCannyLow, setCropCannyLow] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_canny_l") || String(DEFAULT_AUTOCROP_SETTINGS.cropCannyLow || 20), 10)
  );
  const [cropCannyHigh, setCropCannyHigh] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_canny_h") || String(DEFAULT_AUTOCROP_SETTINGS.cropCannyHigh || 100), 10)
  );
  const [cropCloseKernelSize, setCropCloseKernelSize] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_close_k") || String(DEFAULT_AUTOCROP_SETTINGS.cropCloseKernelSize || 15), 10)
  );
  const [cropGuidance, setCropGuidance] = useState<string>(
    () => localStorage.getItem("ai_crop_guidance") || ""
  );
  const [cropFocusMode, setCropFocusMode] = useState<string>(
    () => localStorage.getItem("ai_crop_focus_mode") || "standard"
  );
  const [activeAutoCropTab, setActiveAutoCropTab] = useState<string>("general");
  const [processingStrategy, setProcessingStrategy] = useState<string>("auto");
  const [cropPreviewPanels, setCropPreviewPanels] = useState<any[]>([]);
  const [isGeneratingCropPreview, setIsGeneratingCropPreview] = useState<boolean>(false);

  return {
    showAutoCropModal,
    setShowAutoCropModal,
    activeAutoCropTab,
    setActiveAutoCropTab,
    cropSensitivity,
    setCropSensitivity,
    cropPaddingPx,
    setCropPaddingPx,
    cropBackgroundMode,
    setCropBackgroundMode,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    aspectRatioLock,
    setAspectRatioLock,
    minPanelAreaPct,
    setMinPanelAreaPct,
    overlapMergeThreshold,
    setOverlapMergeThreshold,
    useLocalCV,
    setUseLocalCV,
    isBatchCropping,
    setIsBatchCropping,
    batchProgress,
    setBatchProgress,
    croppingImgUrl,
    setCroppingImgUrl,
    cropModel,
    setCropModel,
    autoCropModel: cropModel,
    setAutoCropModel: setCropModel,
    cropMinHeightPx,
    setCropMinHeightPx,
    cropCannyLow,
    setCropCannyLow,
    cropCannyHigh,
    setCropCannyHigh,
    cropCloseKernelSize,
    setCropCloseKernelSize,
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,
    processingStrategy,
    setProcessingStrategy,
    cropPreviewPanels,
    setCropPreviewPanels,
    isGeneratingCropPreview,
    setIsGeneratingCropPreview,
  };
}
