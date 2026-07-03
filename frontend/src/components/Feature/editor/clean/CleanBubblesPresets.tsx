import React from "react";
import { PRESETS } from "../auto";

interface CleanBubblesPresetsProps {
  activePreset: string;
  handleApplyPreset: (p: (typeof PRESETS)[number]) => void;
}

export default function CleanBubblesPresets({
  activePreset,
  handleApplyPreset,
}: CleanBubblesPresetsProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
        Presets ({PRESETS.length})
      </label>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800">
        {PRESETS.map((p) => {
          const isSelected = activePreset === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/30"
                  : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200"
              }`}
              title={p.description}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
