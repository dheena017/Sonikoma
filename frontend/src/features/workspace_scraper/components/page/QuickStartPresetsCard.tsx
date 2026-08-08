import React from "react";
import { Sparkles, Tag, ArrowRight } from "lucide-react";

export interface PresetItem {
  id: string;
  name: string;
  url: string;
  title: string;
  genre: string;
  style: string;
  cropSens: number;
}

export interface QuickStartPresetsCardProps {
  samplePresets: PresetItem[];
  applyPreset: (preset: PresetItem) => void;
  getGenreStyle: (genre: string) => string;
}

export const QuickStartPresetsCard: React.FC<QuickStartPresetsCardProps> = ({
  samplePresets,
  applyPreset,
  getGenreStyle,
}) => {
  return (
    <div className="w-full bg-[#111116]/60 border border-neutral-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
        <h4 className="text-sm font-bold text-white tracking-tight">
          Quick Start Presets & Templates
        </h4>
      </div>
      <p className="text-xs text-neutral-400 font-medium font-sans">
        Select a pre-configured template format to instantly fill in scraper
        parameters, crop sensitivities, and auto-split configurations.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {samplePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="group relative flex flex-col text-left p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/60 hover:border-purple-500/40 hover:bg-purple-955/10 cursor-pointer transition-all duration-200"
          >
            <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              {preset.name}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium mt-1">
              {preset.style}
            </span>
            <span
              className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${getGenreStyle(
                preset.genre
              )}`}
            >
              <Tag className="h-2.5 w-2.5" />
              {preset.genre}
            </span>
            <span className="absolute bottom-2.5 right-3 h-4 w-4 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              <ArrowRight className="h-2.5 w-2.5 text-purple-400" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
