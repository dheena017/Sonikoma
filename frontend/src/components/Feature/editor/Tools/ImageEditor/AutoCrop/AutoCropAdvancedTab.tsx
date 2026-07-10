import React from "react";
import { AutoCropSharedProps } from "../../../../scraper/tabTypes";
import { AutoCropParameterSlider } from "./AutoCropParameterSlider";
import { AutoCropCannyControls } from "./AutoCropCannyControls";
import { AutoCropJsonDebugger } from "./AutoCropJsonDebugger";
import { AutoCropComplexityAnalysis } from "./AutoCropComplexityAnalysis";

interface AutoCropAdvancedTabProps
  extends Pick<
    AutoCropSharedProps,
    | "useLocalCV"
    | "cropModel"
    | "autoSplitTallStrips"
    | "cropSensitivity"
    | "setCropSensitivity"
    | "cropPaddingPx"
    | "cropBackgroundMode"
    | "aspectRatioLock"
    | "minPanelAreaPct"
    | "setMinPanelAreaPct"
    | "overlapMergeThreshold"
    | "setOverlapMergeThreshold"
    | "cropMinHeightPx"
    | "setCropMinHeightPx"
    | "cropCannyLow"
    | "setCropCannyLow"
    | "cropCannyHigh"
    | "setCropCannyHigh"
    | "cropCloseKernelSize"
    | "setCropCloseKernelSize"
    | "scrapedImages"
    | "selectedScraped"
    | "addNotification"
  > {
  previewImageUrl?: string | null;
}

export function AutoCropAdvancedTab({
  useLocalCV,
  cropModel,
  cropSensitivity,
  setCropSensitivity,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  cropMinHeightPx,
  setCropMinHeightPx,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
  scrapedImages,
  selectedScraped,
  addNotification,
  previewImageUrl,
}: AutoCropAdvancedTabProps) {
  const firstImageUrl =
    previewImageUrl ||
    (selectedScraped.length > 0
      ? selectedScraped[0]
      : scrapedImages.length > 0
      ? scrapedImages[0]
      : null);

  const jsonPayload = {
    sensitivity: cropSensitivity,
    backgroundColorMode: cropBackgroundMode,
    aspectRatio: aspectRatioLock,
    minAreaPct: minPanelAreaPct / 100.0,
    mergeThreshold: overlapMergeThreshold,
    strategy: useLocalCV ? "local-cv" : "balanced",
    model: cropModel,
    cannyLow: cropCannyLow,
    cannyHigh: cropCannyHigh,
    closeKernelSize: cropCloseKernelSize,
    minHeightPx: cropMinHeightPx,
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      <AutoCropComplexityAnalysis
        firstImageUrl={firstImageUrl}
        setCannyLow={setCropCannyLow}
        setCannyHigh={setCropCannyHigh}
        addNotification={addNotification}
      />

      <div className="grid grid-cols-2 gap-4">
        <AutoCropParameterSlider
          label="Edge Sensitivity"
          value={cropSensitivity}
          min={10}
          max={90}
          onChange={setCropSensitivity}
          unit="%"
          hint="Color gutter cutoff contrast. Higher values locate borders aggressively, lower is more selective."
        />
        <AutoCropParameterSlider
          label="Min Panel Height"
          value={cropMinHeightPx}
          min={30}
          max={300}
          onChange={setCropMinHeightPx}
          unit="px"
          hint="Ignores slice boundaries smaller than this vertical height limit to avoid cropping speech dialogue blocks."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AutoCropParameterSlider
          label="Min Panel Width Ratio"
          value={minPanelAreaPct}
          min={0.5}
          max={10.0}
          step={0.5}
          onChange={setMinPanelAreaPct}
          unit="%"
          hint="Discards elements whose width is less than this percentage ratio of the full page width."
        />
        <AutoCropParameterSlider
          label="Overlap Merge"
          value={overlapMergeThreshold}
          min={0}
          max={80}
          step={5}
          onChange={setOverlapMergeThreshold}
          unit="%"
          hint="Merges panel borders overlapping vertically by more than this percentage margin of the smaller frame."
        />
      </div>

      <AutoCropCannyControls
        cropCannyLow={cropCannyLow}
        setCropCannyLow={setCropCannyLow}
        cropCannyHigh={cropCannyHigh}
        setCropCannyHigh={setCropCannyHigh}
        cropCloseKernelSize={cropCloseKernelSize}
        setCropCloseKernelSize={setCropCloseKernelSize}
      />

      <AutoCropJsonDebugger payload={jsonPayload} />
    </div>
  );
}
