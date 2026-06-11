import React, { useState } from "react";
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

  const [showComparison, setShowComparison] = useState(false);
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

      {showComparison && (
           <div className="p-4 bg-neutral-900/50 border border-indigo-500/30 rounded-2xl space-y-3 animate-fadeIn">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Preset Slot Comparison</span>
              <div className="grid grid-cols-3 gap-2">
                 {['slot1', 'slot2', 'slot3'].map(s => (
                    <div key={s} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[8px] font-mono space-y-1.5">
                       <div className="text-white font-bold border-b border-neutral-800 pb-1 mb-1 truncate">{customPresets[s].name}</div>
                       <div className="flex justify-between"><span>SENS:</span><span className="text-indigo-400">{customPresets[s].cropSensitivity}%</span></div>
                       <div className="flex justify-between"><span>PAD:</span><span className="text-indigo-400">{customPresets[s].cropPaddingPx}px</span></div>
                       <div className="flex justify-between"><span>MERGE:</span><span className="text-indigo-400">{customPresets[s].overlapMergeThreshold}%</span></div>
                       <div className="flex justify-between"><span>STRAT:</span><span className="text-indigo-400">{customPresets[s].useLocalCV ? 'CV' : 'AI'}</span></div>
                    </div>
                 ))}
              </div>
           </div>
        )}

      <AutoCropCustomProfileManager
        customPresets={customPresets}
        savePreset={savePresetSlot}
        loadPreset={loadPresetSlot}
      />

      <button onClick={() => setShowComparison(!showComparison)} className="w-full py-2 rounded-xl border border-neutral-800 text-[9px] font-bold text-neutral-500 hover:text-white transition-all uppercase tracking-widest">
           {showComparison ? 'Hide Parameter Grid' : 'Compare All Custom Slots'}
      </button>
    </div>
  );
}
