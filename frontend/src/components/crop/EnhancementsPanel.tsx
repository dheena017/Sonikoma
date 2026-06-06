import React from "react";
import { Sparkles } from "lucide-react";

interface EnhancementsPanelProps {
  activeStoryboardPanel: any;
  handleModifyBrightness: (panelId: number, val: number) => void;
  handleModifyContrast: (panelId: number, val: number) => void;
  handleModifySaturation: (panelId: number, val: number) => void;
  handleModifyFilterPreset: (panelId: number, preset: string) => void;
}

const PRESETS = [
  { id: "none", label: "Original", icon: "◎" },
  { id: "anime_vibrant", label: "Anime Vibrant", icon: "✦" },
  { id: "cinematic_drama", label: "Cinematic Dark", icon: "◈" },
  { id: "hdr_clear", label: "Clarity HDR", icon: "◉" },
];

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

function SliderRow({ label, value, min, max, onChange, disabled }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-neutral-400">{label}</span>
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
          style={{ color: value === 100 ? "#a78bfa" : value > 100 ? "#34d399" : "#f87171", background: "rgba(255,255,255,0.05)" }}
        >
          {value}%
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, #7c3aed, #a78bfa)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-full"
        />
      </div>
    </div>
  );
}

export default function EnhancementsPanel({
  activeStoryboardPanel,
  handleModifyBrightness,
  handleModifyContrast,
  handleModifySaturation,
  handleModifyFilterPreset,
}: EnhancementsPanelProps) {
  const activePreset = activeStoryboardPanel?.filter_preset || "none";

  return (
    <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
          <Sparkles className="h-3 w-3 text-amber-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Enhancement Style Presets
        </span>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                activeStoryboardPanel &&
                handleModifyFilterPreset(activeStoryboardPanel.id, preset.id)
              }
              className={`relative text-left p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-200 overflow-hidden group ${
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
              {isActive && (
                <span className="ml-1 text-purple-400">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Fine-tuning sliders */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[9px] uppercase font-mono font-bold text-neutral-600 tracking-widest px-1">
            Fine-Tuning
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <SliderRow
          label="Brightness"
          value={activeStoryboardPanel?.brightness ?? 100}
          min={50}
          max={180}
          disabled={!activeStoryboardPanel}
          onChange={(val) =>
            activeStoryboardPanel &&
            handleModifyBrightness(activeStoryboardPanel.id, val)
          }
        />
        <SliderRow
          label="Contrast"
          value={activeStoryboardPanel?.contrast ?? 100}
          min={50}
          max={180}
          disabled={!activeStoryboardPanel}
          onChange={(val) =>
            activeStoryboardPanel &&
            handleModifyContrast(activeStoryboardPanel.id, val)
          }
        />
        <SliderRow
          label="Saturation"
          value={activeStoryboardPanel?.saturation ?? 100}
          min={50}
          max={180}
          disabled={!activeStoryboardPanel}
          onChange={(val) =>
            activeStoryboardPanel &&
            handleModifySaturation(activeStoryboardPanel.id, val)
          }
        />
      </div>
    </div>
  );
}
