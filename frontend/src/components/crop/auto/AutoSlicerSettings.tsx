import React from "react";
import { ChevronDown } from "lucide-react";
import { AI_MODELS } from "@/models";

interface AutoSlicerSettingsProps {
  backgroundMode: string;
  setBackgroundMode: (val: string) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  strategy: "local-cv" | "ai";
  model: string;
  setModel: (val: string) => void;
  sensitivity: number;
  setSensitivity: (val: number) => void;
  showOpenCvAdvanced: boolean;
  setShowOpenCvAdvanced: (val: boolean) => void;
  renderOpenCvAdvanced: () => React.ReactNode;
  dryRun: boolean;
  setDryRun: (val: boolean) => void;
}

export default function AutoSlicerSettings({
  backgroundMode,
  setBackgroundMode,
  aspectRatio,
  setAspectRatio,
  strategy,
  model,
  setModel,
  sensitivity,
  setSensitivity,
  showOpenCvAdvanced,
  setShowOpenCvAdvanced,
  renderOpenCvAdvanced,
  dryRun,
  setDryRun,
}: AutoSlicerSettingsProps) {
  return (
    <div className="pt-3.5 border-t border-white/5 space-y-3.5 animate-fadeIn">
      {/* General config */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
            BG Mode
          </label>
          <div className="relative">
            <select
              value={backgroundMode}
              onChange={(e) => setBackgroundMode(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              <option value="auto">Auto-Detect</option>
              <option value="white">Force White</option>
              <option value="black">Force Black</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
            Aspect Ratio
          </label>
          <div className="relative">
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              <option value="free">Free Ratio</option>
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Cinema</option>
              <option value="9:16">9:16 Portrait</option>
              <option value="4:3">4:3 TV</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {strategy === "ai" ? (
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
            Scanner Model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                console.log(
                  `[AutoSlicerSettings] Model changed to: ${e.target.value}`
                );
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      ) : (
        <>
          {/* Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-wider">
                Sensitivity
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-400">
                {sensitivity}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                style={{
                  width: `${((sensitivity - 10) / 80) * 100}%`,
                  background: "linear-gradient(to right, #4f46e5, #6366f1)",
                }}
              />
              <input
                type="range"
                min="10"
                max="90"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              />
            </div>
          </div>

          {/* OpenCV Advanced settings collapse toggle */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowOpenCvAdvanced(!showOpenCvAdvanced)}
              className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-wider transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  showOpenCvAdvanced ? "rotate-180 text-emerald-400" : ""
                }`}
              />
              <span>Advanced CV Parameters</span>
            </button>

            {showOpenCvAdvanced && renderOpenCvAdvanced()}
          </div>
        </>
      )}

      {/* Interactive Dry-Run Toggle */}
      <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
            <span>Dry-Run Preview Lines</span>
          </span>
          <span className="text-[8px] font-sans text-neutral-500 mt-0.5">
            Show scanning borders without performing permanent cuts.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white border border-neutral-700"></div>
        </label>
      </div>
    </div>
  );
}
