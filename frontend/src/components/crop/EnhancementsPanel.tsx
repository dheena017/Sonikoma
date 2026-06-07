import React from "react";
import { Sparkles, Film, Volume2, Type, Sliders, Layout } from "lucide-react";
import { NotificationType } from "../NotificationStack";

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
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

function SliderRow({ label, value, min, max, step = 1, unit = "%", onChange, disabled }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-neutral-400">{label}</span>
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
          style={{ color: disabled ? "#6b7280" : value === (min + max) / 2 || value === 100 ? "#a78bfa" : value > (min + max) / 2 ? "#34d399" : "#f87171", background: "rgba(255,255,255,0.05)" }}
        >
          {value}{unit}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: disabled ? "#4b5563" : "linear-gradient(to right, #7c3aed, #a78bfa)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
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
  handleModifyGrayscale,
  handleModifyDuration,
  handleModifyMotionType,
  handleModifySpeechText,
  handleModifySfx,
  handleModifyCropPadding,
}: EnhancementsPanelProps) {
  const activePreset = activeStoryboardPanel?.filter_preset || "none";

  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
      
      {/* Notice box if raw frame not inserted yet */}
      {!activeStoryboardPanel && (
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-[10px] text-purple-300 font-sans leading-relaxed flex items-start gap-2 shadow-inner">
          <span className="text-xs leading-none">💡</span>
          <p>
            <strong>Note:</strong> Insert this frame panel into the storyboard to customize cinematic options like camera pans, text subtitles, sound effects, and color grading.
          </p>
        </div>
      )}

      {/* SECTION 1: STYLE PRESETS */}
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
            const isActive = activePreset === preset.id && !!activeStoryboardPanel;
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
                {isActive && (
                  <span className="ml-1 text-purple-400">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grayscale Manga Mode */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 mt-1">
          <span className="text-[10px] font-semibold text-neutral-400">Manga Grayscale Style</span>
          <label className="relative flex items-center cursor-pointer select-none">
            <div className={`relative w-8 h-4 rounded-full border transition-all ${activeStoryboardPanel?.grayscale && !!activeStoryboardPanel ? "bg-purple-600 border-purple-500" : "bg-neutral-800 border-neutral-700"}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${activeStoryboardPanel?.grayscale && !!activeStoryboardPanel ? "left-4.5" : "left-0.5"}`} />
              <input
                type="checkbox"
                checked={activeStoryboardPanel?.grayscale || false}
                disabled={!activeStoryboardPanel}
                onChange={(e) => activeStoryboardPanel && handleModifyGrayscale(activeStoryboardPanel.id, e.target.checked)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              />
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 2: COLOR ADJUSTMENTS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[9px] uppercase font-mono font-bold text-neutral-600 tracking-widest px-1">
            Fine-Tuning Colors
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

      {/* SECTION 3: CINEMATIC TIMELINE & CROP ADJUSTS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
            <Film className="h-3 w-3 text-indigo-400" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Cinematic Properties
          </span>
        </div>

        {/* Motion Type Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
            Camera Motion Effect
          </label>
          <div className="relative">
            <select
              value={activeStoryboardPanel?.motion_type || "static"}
              disabled={!activeStoryboardPanel}
              onChange={(e) => activeStoryboardPanel && handleModifyMotionType(activeStoryboardPanel.id, e.target.value)}
              className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="static">Static (No Motion)</option>
              <option value="zoom_in">Zoom In Animation</option>
              <option value="zoom_out">Zoom Out Animation</option>
              <option value="pan_right">Pan Right</option>
              <option value="pan_left">Pan Left</option>
              <option value="pan_down">Pan Down</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none text-neutral-500">▼</span>
          </div>
        </div>

        {/* Playback Duration */}
        <SliderRow
          label="Scene Timing (Duration)"
          value={activeStoryboardPanel?.duration ?? 4.5}
          min={1}
          max={10}
          step={0.5}
          unit="s"
          disabled={!activeStoryboardPanel}
          onChange={(val) =>
            activeStoryboardPanel &&
            handleModifyDuration(activeStoryboardPanel.id, val)
          }
        />

        {/* Crop Margins Padding */}
        <SliderRow
          label="Margin Crop Padding"
          value={activeStoryboardPanel?.crop_padding ?? 10}
          min={0}
          max={40}
          step={1}
          unit="px"
          disabled={!activeStoryboardPanel}
          onChange={(val) =>
            activeStoryboardPanel &&
            handleModifyCropPadding(activeStoryboardPanel.id, val)
          }
        />
      </div>

      {/* SECTION 4: NARRATION & SOUND */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-pink-500/10 border border-pink-500/15">
            <Type className="h-3 w-3 text-pink-400" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Speech & SFX Audio
          </span>
        </div>

        {/* Speech text narration input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
            Dialogue / Narration Subtitle
          </label>
          <textarea
            value={activeStoryboardPanel?.speech_text || ""}
            disabled={!activeStoryboardPanel}
            onChange={(e) => activeStoryboardPanel && handleModifySpeechText(activeStoryboardPanel.id, e.target.value)}
            className="w-full h-16 bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed resize-none"
            placeholder="Dialogue spoken in scene script..."
          />
        </div>

        {/* SFX tag input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
            Sound Effect (SFX) Tag
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={activeStoryboardPanel?.sfx || ""}
              disabled={!activeStoryboardPanel}
              onChange={(e) => activeStoryboardPanel && handleModifySfx(activeStoryboardPanel.id, e.target.value)}
              className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl pl-7 pr-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder="e.g. [Crash], [Whoosh]"
            />
            <Volume2 className="absolute left-2.5 h-3 w-3 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

    </div>
  );
}
