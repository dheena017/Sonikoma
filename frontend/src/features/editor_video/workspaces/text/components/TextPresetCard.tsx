import React from "react";
import { TextPreset } from "../../../types/workspace.types";
import { loadGoogleFont } from "@/shared/utils/fontLoader";

interface TextPresetCardProps {
  preset: TextPreset;
  onSelect: () => void;
}

export const TextPresetCard: React.FC<TextPresetCardProps> = ({
  preset,
  onSelect,
}) => {
  // Ensure font is loaded when card renders
  React.useEffect(() => {
    if (preset.fontFamily) {
      loadGoogleFont(preset.fontFamily);
    }
  }, [preset.fontFamily]);

  return (
    <div
      onClick={onSelect}
      className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-[#3B82F6]/60 hover:bg-neutral-800/60 cursor-pointer transition-all flex flex-col justify-between space-y-2 group shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-[#60A5FA] group-hover:text-purple-200 transition-colors">
          {preset.title}
        </span>
        <span className="text-[8px] font-mono font-bold bg-[#3B82F6]/15 text-[#60A5FA] px-1.5 py-0.5 rounded border border-[#3B82F6]/30">
          {preset.badge}
        </span>
      </div>
      <p
        className={`text-sm ${preset.styleClass}`}
        style={{ fontFamily: `'${preset.fontFamily}', sans-serif` }}
      >
        {preset.previewText}
      </p>
    </div>
  );
};
