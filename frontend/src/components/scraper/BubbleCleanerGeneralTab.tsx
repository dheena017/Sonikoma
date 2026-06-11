import React from "react";
import { useBubbleCleanerPresets } from "../../hooks/useBubbleCleanerPresets";
import { BubbleCleanerSharedProps } from "./tabTypes";
import { BubbleCleanerQuickPresets } from "./BubbleCleanerQuickPresets";
import { BubbleCleanerDetectionStyle } from "./BubbleCleanerDetectionStyle";
import { BubbleCleanerEraseMethod } from "./BubbleCleanerEraseMethod";
import { BubbleCleanerCustomSlots } from "./BubbleCleanerCustomSlots";
import { BubbleCleanerSplitSlider } from "./BubbleCleanerSplitSlider";
import { BubbleCleanerPixelScanner } from "./BubbleCleanerPixelScanner";
import { BubbleCleanerPerfEstimator } from "./BubbleCleanerPerfEstimator";
import { ConfigHistoryDropdown } from "./ConfigHistoryDropdown";

export function BubbleCleanerGeneralTab(props: BubbleCleanerSharedProps) {
  const {
    customPresets,
    activeSlot,
    savePresetSlot,
    loadPresetSlot,
    applyQuickPreset,
    exportPresets,
    importPresets,
    history,
    applyState
  } = useBubbleCleanerPresets(props);

  const firstImageUrl = props.selectedScraped.length > 0 ? props.selectedScraped[0] : props.scrapedImages.length > 0 ? props.scrapedImages[0] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Left column */}
      <div className="lg:col-span-7 space-y-6">
        <BubbleCleanerQuickPresets
          activeSlot={activeSlot}
          applyPreset={applyQuickPreset}
        />

        <BubbleCleanerDetectionStyle
          detectionStyle={props.detectionStyle}
          setDetectionStyle={props.setDetectionStyle}
        />

        <BubbleCleanerEraseMethod
          eraseMethod={props.eraseMethod}
          setEraseMethod={props.setEraseMethod}
        />

        <BubbleCleanerCustomSlots
          customPresets={customPresets}
          savePreset={savePresetSlot}
          loadPreset={loadPresetSlot}
          exportPresets={exportPresets}
          importPresets={importPresets}
        />
      </div>

      {/* Right column */}
      <div className="lg:col-span-5 space-y-5">
        <BubbleCleanerSplitSlider
          firstImageUrl={firstImageUrl}
          eraseMethod={props.eraseMethod}
        />

        <ConfigHistoryDropdown history={history} onApply={applyState} />

        <BubbleCleanerPixelScanner
          firstImageUrl={firstImageUrl}
          sensitivity={props.sensitivity}
          detectionStyle={props.detectionStyle}
          addNotification={props.addNotification}
        />

        <BubbleCleanerPerfEstimator
          eraseMethod={props.eraseMethod}
        />
      </div>
    </div>
  );
}
