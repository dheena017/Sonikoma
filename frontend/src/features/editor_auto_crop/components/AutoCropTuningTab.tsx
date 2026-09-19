import React from "react";
import {
  Zap,
  Smartphone,
  BookOpen,
  Film,
  RefreshCw,
} from "lucide-react";

export interface AutoCropTuningTabProps {
  padding: number;
  sensitivity: number;
  aspectRatioLock: string;
  backgroundColorMode: string;
  onPaddingChange: (val: number) => void;
  onSensitivityChange: (val: number) => void;
  onAspectRatioChange: (val: string) => void;
  onBackgroundColorModeChange: (val: string) => void;
  onApplyPreset: (preset: "webtoon" | "manga" | "shorts") => void;
  onApplySettingsAndRecrop: () => void;
}

export function AutoCropTuningTab({
  padding,
  sensitivity,
  aspectRatioLock,
  backgroundColorMode,
  onPaddingChange,
  onSensitivityChange,
  onAspectRatioChange,
  onBackgroundColorModeChange,
  onApplyPreset,
  onApplySettingsAndRecrop,
}: AutoCropTuningTabProps) {
  return (
    <div className="p-4 sm:p-6 rounded-3xl border border-neutral-800 bg-neutral-950/80 space-y-6 animate-in fade-in duration-150">
      {/* Quick Presets */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-900">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span>Detection Presets:</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onApplyPreset("webtoon")}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-xs font-medium text-neutral-300 hover:text-emerald-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span>Webtoon Vertical</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset("manga")}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-xs font-medium text-neutral-300 hover:text-purple-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>Manga Page</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset("shorts")}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-sky-500 text-xs font-medium text-neutral-300 hover:text-sky-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
          >
            <Film className="h-3.5 w-3.5 text-sky-400" />
            <span>9:16 Shorts</span>
          </button>
        </div>
      </div>

      {/* Sliders and Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Bleed Padding
            </label>
            <span className="text-xs font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {padding}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={padding}
            onChange={(e) => onPaddingChange(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500 block">Expands boundary to preserve border art</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Gutter Sensitivity
            </label>
            <span className="text-xs font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {sensitivity}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500 block">Higher = cuts more granular panel slices</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
            Aspect Ratio Lock
          </label>
          <select
            value={aspectRatioLock}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="free">Free / Natural Frame</option>
            <option value="16:9">16:9 (Landscape Video)</option>
            <option value="9:16">9:16 (Vertical Shorts / Reels)</option>
            <option value="1:1">1:1 (Square Feed)</option>
            <option value="4:3">4:3 (Classic TV)</option>
          </select>
          <span className="text-[10px] text-neutral-500 block">Locks output slices to aspect ratio</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
            Background Palette
          </label>
          <select
            value={backgroundColorMode}
            onChange={(e) => onBackgroundColorModeChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="auto">Auto Detect Palette</option>
            <option value="white">White Gutter Seams</option>
            <option value="black">Dark / Black Gutter</option>
            <option value="transparent">Transparent Channels</option>
          </select>
          <span className="text-[10px] text-neutral-500 block">Auto detects seam gutter color</span>
        </div>
      </div>

      {/* Apply Tuning Button */}
      <div className="flex justify-end pt-3 border-t border-neutral-900">
        <button
          type="button"
          onClick={onApplySettingsAndRecrop}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 flex items-center gap-2 transition-all !cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Apply Settings & Re-Crop</span>
        </button>
      </div>
    </div>
  );
}

export default AutoCropTuningTab;
