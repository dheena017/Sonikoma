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

  const [showComparison, setShowComparison] = React.useState(false);
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

        {showComparison && (
           <div className="p-4 bg-neutral-900/50 border border-indigo-500/30 rounded-2xl space-y-3 animate-fadeIn">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Slot Parameter Comparison</span>
              <div className="grid grid-cols-3 gap-2">
                 {['slot1', 'slot2', 'slot3'].map(s => (
                    <div key={s} className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[8px] font-mono space-y-1">
                       <div className="text-white font-bold border-b border-neutral-800 pb-1 mb-1 truncate">{customPresets[s].name}</div>
                       <div className="flex justify-between"><span>SENS:</span><span>{customPresets[s].sensitivity}%</span></div>
                       <div className="flex justify-between"><span>DIL:</span><span>{customPresets[s].bubbleDilation}px</span></div>
                       <div className="flex justify-between"><span>RAD:</span><span>{customPresets[s].bubbleInpaintRadius}px</span></div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        <BubbleCleanerCustomSlots
          customPresets={customPresets}
          savePreset={savePresetSlot}
          loadPreset={loadPresetSlot}
          exportPresets={exportPresets}
          importPresets={importPresets}
        />

        <button onClick={() => setShowComparison(!showComparison)} className="w-full py-2 rounded-xl border border-neutral-800 text-[9px] font-bold text-neutral-500 hover:text-white transition-all uppercase tracking-widest">
           {showComparison ? 'Hide Comparison' : 'Compare Saved Slot Parameters'}
        </button>
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
          setSensitivity={props.setSensitivity}
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
