import React from "react";

interface AutoCropSettingsPanelProps {
  showAutoCropSettings: boolean;
  cropSensitivity: number;
  setCropSensitivity: (val: number) => void;
  cropPaddingPx: number;
  setCropPaddingPx: (val: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (val: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (val: boolean) => void;
}

export default function AutoCropSettingsPanel({
  showAutoCropSettings,
  cropSensitivity,
  setCropSensitivity,
  cropPaddingPx,
  setCropPaddingPx,
  cropBackgroundMode,
  setCropBackgroundMode,
  autoSplitTallStrips,
  setAutoSplitTallStrips,
}: AutoCropSettingsPanelProps) {
  if (!showAutoCropSettings) return null;

  return (
    <div
      id="smart_crop_options_box"
      className="bg-neutral-950/80 p-5 rounded-2xl border border-purple-900/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn shadow-2xl"
    >
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono flex justify-between">
          <span>Sensitivity</span>
          <span className="text-white font-bold">{cropSensitivity}%</span>
        </label>
        <input
          type="range"
          min="5"
          max="90"
          value={cropSensitivity}
          onChange={(e) => setCropSensitivity(Number(e.target.value))}
          className="w-full accent-purple-500 bg-neutral-800 rounded-lg h-1.5 px-0 cursor-pointer hover:accent-purple-400 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono flex justify-between">
          <span>Margin Padding</span>
          <span className="text-white font-bold">{cropPaddingPx}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={cropPaddingPx}
          onChange={(e) => setCropPaddingPx(Number(e.target.value))}
          className="w-full accent-purple-500 bg-neutral-800 rounded-lg h-1.5 px-0 cursor-pointer hover:accent-purple-400 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono block">
          Color Filter
        </label>
        <select
          value={cropBackgroundMode}
          onChange={(e) => setCropBackgroundMode(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-purple-600 focus:outline-none hover:border-neutral-500 transition-colors cursor-pointer"
        >
          <option value="auto">Auto-Detect BG</option>
          <option value="white">Force White</option>
          <option value="black">Force Black</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono block">
          Processing Strategy
        </label>
        <select className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-purple-600 focus:outline-none hover:border-neutral-500 transition-colors cursor-pointer">
          <option value="balanced">Balanced Quality</option>
          <option value="precise">High Precision</option>
          <option value="fast">High Speed</option>
        </select>
      </div>

      <div className="col-span-1 md:col-span-2 lg:col-span-4 border-t border-neutral-800 pt-4 flex gap-4 flex-wrap">
        <label className="relative flex items-center gap-3 bg-neutral-900/60 border border-neutral-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-neutral-800 transition-all select-none flex-1">
          <input
            type="checkbox"
            checked={autoSplitTallStrips}
            onChange={(e) => setAutoSplitTallStrips(e.target.checked)}
            className="accent-purple-500 h-4 w-4 rounded"
          />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-white">
              Auto-Split Strips
            </span>
            <span className="text-[10px] text-neutral-400">
              Automatically cut long strips into panels.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
