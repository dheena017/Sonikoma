import React from "react";
import { TextPreset } from "../../../types/workspace.types";

interface TextPresetCardProps {
  preset: TextPreset;
  onSelect: () => void;
}

export const TextPresetCard: React.FC<TextPresetCardProps> = ({
  preset,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 group shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-purple-400">
          {preset.title}
        </span>
        <span className="text-[8px] font-mono font-bold bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
          {preset.badge}
        </span>
      </div>
      <p className={`text-sm ${preset.styleClass}`}>{preset.previewText}</p>
    </div>
  );
};
