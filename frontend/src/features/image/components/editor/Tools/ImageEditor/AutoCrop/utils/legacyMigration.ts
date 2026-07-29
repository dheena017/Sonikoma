import { AutoCropSettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/types';
import { defaultAutoCropSettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext';

export function migrateLegacySettings(legacyProps: any): AutoCropSettings {
  if (!legacyProps) return defaultAutoCropSettings;
  if (legacyProps.engine === "opencv" || legacyProps.engine === "aiSmart" || legacyProps.engine === "hybrid") return legacyProps;

  // Map legacy useLocalCV + autoSplitTallStrips logic
  const engine: "opencv" | "aiSmart" | "hybrid" = legacyProps.useLocalCV === false ? "aiSmart" : "opencv"; // fallback to opencv for old states unless AI explicitly set
  const imageType: "auto" | "strip" | "panel" = legacyProps.autoSplitTallStrips ? "strip" : "auto";

  return {
    engine,
    imageType,
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
    },
    hybrid: {
      mode: defaultAutoCropSettings.hybrid.mode,
    }
  };
}
