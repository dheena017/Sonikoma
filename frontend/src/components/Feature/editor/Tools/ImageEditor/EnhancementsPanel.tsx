import React from "react";
import { EnhancementsPresets } from "./EnhancementsPresets.js";
import { EnhancementsColors } from "./EnhancementsColors.js";
import { EnhancementsCinematic } from "./EnhancementsCinematic.js";
import { EnhancementsAudio } from "./EnhancementsAudio.js";

interface EnhancementsPanelProps {
  activeStoryboardPanel: any;
  handleModifyBrightness: (panelId: number, val: number) => void;
  handleModifyContrast: (panelId: number, val: number) => void;
  handleModifySaturation: (panelId: number, val: number) => void;
  handleModifyFilterPreset: (panelId: number, preset: string) => void;
  handleModifyGrayscale: (panelId: number, val: boolean) => void;
  handleModifyDuration: (panelId: number, val: number) => void;
  handleModifyMotionType: (panelId: number, val: string) => void;
  handleModifySpeechText: (panelId: number, val: string) => void;
  handleModifySfx: (panelId: number, val: string) => void;
  handleModifyCropPadding: (panelId: number, val: number) => void;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function EnhancementsPanel({
  activeStoryboardPanel,
  handleModifyBrightness,
  handleModifyContrast,
  handleModifySaturation,
  handleModifyFilterPreset,
  handleModifyGrayscale,
  handleModifyDuration,
  handleModifyMotionType,
  handleModifySpeechText,
  handleModifySfx,
  handleModifyCropPadding,
  setPanels,
}: EnhancementsPanelProps) {
  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
      {/* Notice box if raw frame not inserted yet */}
      {!activeStoryboardPanel && (
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-[10px] text-purple-300 font-sans leading-relaxed flex items-start gap-2 shadow-inner">
          <span className="text-xs leading-none">💡</span>
          <p>
            <strong>Note:</strong> Insert this frame panel into the storyboard
            to customize cinematic options like camera pans, text subtitles,
            sound effects, and color grading.
          </p>
        </div>
      )}

      <EnhancementsPresets
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyFilterPreset={handleModifyFilterPreset}
        handleModifyGrayscale={handleModifyGrayscale}
      />

      <EnhancementsColors
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyBrightness={handleModifyBrightness}
        handleModifyContrast={handleModifyContrast}
        handleModifySaturation={handleModifySaturation}
      />

      <EnhancementsCinematic
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyDuration={handleModifyDuration}
        handleModifyMotionType={handleModifyMotionType}
        handleModifyCropPadding={handleModifyCropPadding}
      />

      <EnhancementsAudio
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifySpeechText={handleModifySpeechText}
        handleModifySfx={handleModifySfx}
        setPanels={setPanels}
      />
    </div>
  );
}
