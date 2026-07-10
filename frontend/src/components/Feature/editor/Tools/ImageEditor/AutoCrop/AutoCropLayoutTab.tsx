import React from "react";
import { AutoCropSharedProps } from "../../../../scraper/tabTypes";
import { AutoCropRatioLockSelector } from "./AutoCropRatioLockSelector";
import { AutoCropGutterModeToggle } from "./AutoCropGutterModeToggle";
import { AutoCropMarginPadding } from "../AutoCrop/AutoCropMarginPadding";
import { AutoCropVisualGuide } from "./AutoCropVisualGuide";

interface AutoCropLayoutTabProps
  extends Pick<
    AutoCropSharedProps,
    | "cropPaddingPx"
    | "setCropPaddingPx"
    | "cropBackgroundMode"
    | "setCropBackgroundMode"
    | "aspectRatioLock"
    | "setAspectRatioLock"
    | "scrapedImages"
    | "selectedScraped"
    | "autoSplitTallStrips"
    | "overlapMergeThreshold"
    | "cropSensitivity"
    | "cropCannyLow"
    | "cropCannyHigh"
    | "cropCloseKernelSize"
    | "addNotification"
  > {
  previewImageUrl?: string | null;
}

export function AutoCropLayoutTab({
  cropPaddingPx,
  setCropPaddingPx,
  cropBackgroundMode,
  setCropBackgroundMode,
  aspectRatioLock,
  setAspectRatioLock,
  scrapedImages,
  selectedScraped,
  autoSplitTallStrips,
  overlapMergeThreshold,
  cropSensitivity,
  cropCannyLow,
  cropCannyHigh,
  cropCloseKernelSize,
  addNotification,
  previewImageUrl,
}: AutoCropLayoutTabProps) {
  const firstImageUrl =
    previewImageUrl ||
    (selectedScraped.length > 0
      ? selectedScraped[0]
      : scrapedImages.length > 0
      ? scrapedImages[0]
      : null);

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls column */}
        <div className="lg:col-span-7 space-y-6">
          <AutoCropRatioLockSelector
            aspectRatioLock={aspectRatioLock}
            setAspectRatioLock={setAspectRatioLock}
          />

          <AutoCropGutterModeToggle
            cropBackgroundMode={cropBackgroundMode}
            setCropBackgroundMode={setCropBackgroundMode}
            firstImageUrl={firstImageUrl}
            addNotification={addNotification}
          />

          <AutoCropMarginPadding
            cropPaddingPx={cropPaddingPx}
            setCropPaddingPx={setCropPaddingPx}
            firstImageUrl={firstImageUrl}
          />
        </div>

        {/* Right info column */}
        <AutoCropVisualGuide
          firstImageUrl={firstImageUrl}
          cropPaddingPx={cropPaddingPx}
          aspectRatioLock={aspectRatioLock}
          cropBackgroundMode={cropBackgroundMode}
          autoSplit={autoSplitTallStrips}
          overlapMerge={overlapMergeThreshold}
          sensitivity={cropSensitivity}
          cannyLow={cropCannyLow}
          cannyHigh={cropCannyHigh}
          closeKernel={cropCloseKernelSize}
        />
      </div>
    </div>
  );
}
