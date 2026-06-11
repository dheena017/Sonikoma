import React from "react";
import { useAutoCropPresets } from "../../hooks/useAutoCropPresets";
import { AutoCropSharedProps } from "./tabTypes";
import { AutoCropPresetGrid } from "./AutoCropPresetGrid";
import { AutoCropEngineSelector } from "./AutoCropEngineSelector";
import { AutoCropCustomProfileManager } from "./AutoCropCustomProfileManager";
import { AutoCropEngineComparison } from "./AutoCropEngineComparison";
import { ConfigHistoryDropdown } from "./ConfigHistoryDropdown";

export function AutoCropGeneralTab(props: AutoCropSharedProps) {
  const {
    customPresets,
    activeSlot,
    savePresetSlot,
    loadPresetSlot,
    applyBuiltInPreset,
    history,
    applyState
  } = useAutoCropPresets(props);

  const firstImageUrl = props.selectedScraped.length > 0 ? props.selectedScraped[0] : props.scrapedImages.length > 0 ? props.scrapedImages[0] : null;

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <AutoCropPresetGrid
        activeSlot={activeSlot}
        applyPreset={applyBuiltInPreset}
        firstImageUrl={firstImageUrl}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AutoCropEngineSelector
            useLocalCV={props.useLocalCV}
            setUseLocalCV={props.setUseLocalCV}
            cropModel={props.cropModel}
            setCropModel={props.setCropModel}
          />

          <label className="relative flex items-center gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-5 py-4 cursor-pointer hover:bg-neutral-900 transition-all select-none">
            <input
              type="checkbox"
              checked={props.autoSplitTallStrips}
              onChange={(e) => props.setAutoSplitTallStrips(e.target.checked)}
              className="accent-indigo-500 h-4.5 w-4.5 rounded cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-white">Auto-Split Strips</span>
              <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">Automatically detects vertical seams to split tall webtoon strip pages into standalone scenes.</span>
            </div>
          </label>

          <ConfigHistoryDropdown history={history} onApply={applyState} />
        </div>

        <AutoCropEngineComparison
          firstImageUrl={firstImageUrl}
          sensitivity={props.cropSensitivity}
          bgMode={props.cropBackgroundMode}
          overlapMerge={props.overlapMergeThreshold}
          aspectRatio={props.aspectRatioLock}
          cannyLow={props.cropCannyLow}
          cannyHigh={props.cropCannyHigh}
          closeKernel={props.cropCloseKernelSize}
        />
      </div>

      <AutoCropCustomProfileManager
        customPresets={customPresets}
        savePreset={savePresetSlot}
        loadPreset={loadPresetSlot}
      />
    </div>
  );
}
