import React from "react";
import { EnhancementsPresets } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsPresets";
import { EnhancementsColors } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsColors";
import { EnhancementsCinematic } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsCinematic";
import { EnhancementsAudio } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsAudio";

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
        setPanels={setPanels}
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
