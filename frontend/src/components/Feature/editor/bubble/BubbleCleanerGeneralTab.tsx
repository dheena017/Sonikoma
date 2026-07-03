import React from "react";
import { useBubbleCleanerPresets } from "../../../../hooks/useBubbleCleanerPresets";
import { BubbleCleanerSharedProps } from "../../scraper/tabTypes";
import { BubbleCleanerQuickPresets } from "./BubbleCleanerQuickPresets";
import { BubbleCleanerDetectionStyle } from "./BubbleCleanerDetectionStyle";
import { BubbleCleanerEraseMethod } from "./BubbleCleanerEraseMethod";

export function BubbleCleanerGeneralTab(props: BubbleCleanerSharedProps) {
  const { activeSlot, applyQuickPreset } = useBubbleCleanerPresets(props);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.2s_ease-out]">
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
    </div>
  );
}
