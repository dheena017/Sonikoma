import { AutoCropSettings } from '../types';
import { defaultAutoCropSettings } from '../contexts/AutoCropContext';

export function migrateLegacySettings(legacyProps: any): AutoCropSettings {
  if (!legacyProps) return defaultAutoCropSettings;
  if (legacyProps.engine === "opencv" || legacyProps.engine === "aiSmart") return legacyProps;

  const engine: "opencv" | "aiSmart" = legacyProps.useLocalCV === false ? "aiSmart" : "opencv";

  return {
    engine,
    opencv: {
      sensitivity: legacyProps.cropSensitivity ?? defaultAutoCropSettings.opencv.sensitivity,
      paddingPx: legacyProps.cropPaddingPx ?? defaultAutoCropSettings.opencv.paddingPx,
      backgroundMode: legacyProps.cropBackgroundMode ?? defaultAutoCropSettings.opencv.backgroundMode,
      autoSplitTallStrips: legacyProps.autoSplitTallStrips ?? defaultAutoCropSettings.opencv.autoSplitTallStrips,
      minPanelAreaPct: legacyProps.minPanelAreaPct ?? defaultAutoCropSettings.opencv.minPanelAreaPct,
      overlapMergeThreshold: legacyProps.overlapMergeThreshold ?? defaultAutoCropSettings.opencv.overlapMergeThreshold,
      minHeightPx: legacyProps.cropMinHeightPx ?? defaultAutoCropSettings.opencv.minHeightPx,
      cannyLow: legacyProps.cropCannyLow ?? defaultAutoCropSettings.opencv.cannyLow,
      cannyHigh: legacyProps.cropCannyHigh ?? defaultAutoCropSettings.opencv.cannyHigh,
      closeKernelSize: legacyProps.cropCloseKernelSize ?? defaultAutoCropSettings.opencv.closeKernelSize,
      aspectRatioLock: legacyProps.aspectRatioLock ?? defaultAutoCropSettings.opencv.aspectRatioLock,
    },
    aiSmart: {
      model: legacyProps.cropModel ?? defaultAutoCropSettings.aiSmart.model,
      guidance: legacyProps.cropGuidance ?? defaultAutoCropSettings.aiSmart.guidance,
      focusMode: legacyProps.cropFocusMode ?? defaultAutoCropSettings.aiSmart.focusMode,
    }
  };
}
