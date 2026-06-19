import React from "react";
import { useAutoCropPresets } from "../../hooks/useAutoCropPresets";
import { AutoCropSharedProps } from "./tabTypes";
import { AutoCropPresetGrid } from "./AutoCropPresetGrid";
import { AutoCropEngineSelector } from "./AutoCropEngineSelector";

export function AutoCropGeneralTab(props: AutoCropSharedProps) {
  const {
    activeSlot,
    applyBuiltInPreset,
  } = useAutoCropPresets(props);

  const firstImageUrl =
    props.previewImageUrl ||
    (props.selectedScraped.length > 0
      ? props.selectedScraped[0]
      : props.scrapedImages.length > 0
      ? props.scrapedImages[0]
      : null);

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <AutoCropPresetGrid
        activeSlot={activeSlot}
        applyPreset={applyBuiltInPreset}
        firstImageUrl={firstImageUrl}
      />

      <div className="space-y-6">
        <AutoCropEngineSelector
          useLocalCV={props.useLocalCV}
          setUseLocalCV={props.setUseLocalCV}
          cropModel={props.cropModel}
          setCropModel={props.setCropModel}
          cropSensitivity={props.cropSensitivity}
          setCropSensitivity={props.setCropSensitivity}
          cropMinHeightPx={props.cropMinHeightPx}
          setCropMinHeightPx={props.setCropMinHeightPx}
          overlapMergeThreshold={props.overlapMergeThreshold}
          setOverlapMergeThreshold={props.setOverlapMergeThreshold}
          minPanelAreaPct={props.minPanelAreaPct}
          setMinPanelAreaPct={props.setMinPanelAreaPct}
          cropCannyLow={props.cropCannyLow}
          setCropCannyLow={props.setCropCannyLow}
          cropCannyHigh={props.cropCannyHigh}
          setCropCannyHigh={props.setCropCannyHigh}
          cropCloseKernelSize={props.cropCloseKernelSize}
          setCropCloseKernelSize={props.setCropCloseKernelSize}
          cropBackgroundMode={props.cropBackgroundMode}
          setCropBackgroundMode={props.setCropBackgroundMode}
          cropGuidance={props.cropGuidance}
          setCropGuidance={props.setCropGuidance}
          cropFocusMode={props.cropFocusMode}
          setCropFocusMode={props.setCropFocusMode}
        />

        <label className="relative flex items-center gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-5 py-4 cursor-pointer hover:bg-neutral-900 transition-all select-none">
          <input
            type="checkbox"
            checked={props.autoSplitTallStrips}
            onChange={(e) => props.setAutoSplitTallStrips(e.target.checked)}
            className="accent-indigo-500 h-4.5 w-4.5 rounded cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-white">
              Auto-Split Strips
            </span>
            <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
              Automatically detects vertical seams to split tall webtoon strip
              pages into standalone scenes.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
