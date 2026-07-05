import React from "react";
import { Sparkles } from "lucide-react";

interface EnhancementsPresetsProps {
  activeStoryboardPanel: any;
  handleModifyFilterPreset: (panelId: number, preset: string) => void;
  handleModifyGrayscale: (panelId: number, val: boolean) => void;
}

const PRESETS = [
  { id: "none", label: "Original", icon: "◎" },
  { id: "anime_vibrant", label: "Anime Vibrant", icon: "✦" },
  { id: "cinematic_drama", label: "Cinematic Dark", icon: "◈" },
  { id: "hdr_clear", label: "Clarity HDR", icon: "◉" },
  { id: "vintage_warm", label: "Vintage Warm", icon: "☀️" },
  { id: "neon_cyber", label: "Neon Cyberpunk", icon: "🌌" },
];

export function EnhancementsPresets({
  activeStoryboardPanel,
  handleModifyFilterPreset,
  handleModifyGrayscale,
}: EnhancementsPresetsProps) {
  const activePreset = activeStoryboardPanel?.filter_preset || "none";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
          <Sparkles className="h-3 w-3 text-amber-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Style Grading Presets
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const isActive =
            activePreset === preset.id && !!activeStoryboardPanel;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={!activeStoryboardPanel}
              onClick={() =>
                activeStoryboardPanel &&
                handleModifyFilterPreset(activeStoryboardPanel.id, preset.id)
              }
              className={`relative text-left p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-200 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group ${
                isActive
                  ? "bg-purple-600/20 border-purple-500/60 text-white shadow-lg shadow-purple-900/30"
                  : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 hover:border-white/10"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
              )}
              <span className="text-base mr-1">{preset.icon}</span>
              {preset.label}
              {isActive && <span className="ml-1 text-purple-400">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Grayscale Manga Mode */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 mt-1">
        <span className="text-[10px] font-semibold text-neutral-400">
          Manga Grayscale Style
        </span>
        <label className="relative flex items-center cursor-pointer select-none">
          <div
            className={`relative w-8 h-4 rounded-full border transition-all ${
              activeStoryboardPanel?.grayscale && !!activeStoryboardPanel
                ? "bg-purple-600 border-purple-500"
                : "bg-neutral-800 border-neutral-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                activeStoryboardPanel?.grayscale && !!activeStoryboardPanel
                  ? "left-4.5"
                  : "left-0.5"
              }`}
            />
            <input
              type="checkbox"
              checked={activeStoryboardPanel?.grayscale || false}
              disabled={!activeStoryboardPanel}
              onChange={(e) =>
                activeStoryboardPanel &&
                handleModifyGrayscale(
                  activeStoryboardPanel.id,
                  e.target.checked
                )
              }
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
