import React, { useState } from "react";
import { Sparkles, RefreshCw, Scissors, Sliders, ChevronDown } from "lucide-react";

interface AutoSlicerProps {
  handleDetectPanels: (settings?: { sensitivity?: number; backgroundMode?: string; aspectRatio?: string }) => Promise<void>;
  isDetecting: boolean;
}

export default function AutoSlicer({
  handleDetectPanels,
  isDetecting,
}: AutoSlicerProps) {
  const [sensitivity, setSensitivity] = useState<number>(30);
  const [backgroundMode, setBackgroundMode] = useState<string>("auto");
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  return (
    <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
          <Sparkles className="h-3 w-3 text-emerald-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Contours-Detection Auto Cutter
        </span>
      </div>
      <p className="text-[10px] text-neutral-600 leading-relaxed">
        Contour scans look for white gutters to identify individual panel cuts.
        Detected panels are instantly loaded into the Targets list for fine-tuning.
      </p>
      
      <div className="flex items-center h-9 w-full">
        <button
          type="button"
          onClick={() => handleDetectPanels({ sensitivity, backgroundMode, aspectRatio })}
          disabled={isDetecting}
          className="flex-1 h-full px-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
        >
          {isDetecting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scissors className="h-3.5 w-3.5" />
          )}
          <span>{isDetecting ? "Scanning..." : "Auto-Crop"}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Toggle Auto-crop Settings"
          className={`h-full px-2.5 border rounded-r-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
            showSettings 
              ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/40" 
              : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>

      {showSettings && (
        <div className="pt-3 border-t border-white/5 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {/* Background Mode */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
                BG Mode
              </label>
              <div className="relative">
                <select
                  value={backgroundMode}
                  onChange={(e) => setBackgroundMode(e.target.value)}
                  className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="white">Force White</option>
                  <option value="black">Force Black</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
                Aspect Ratio
              </label>
              <div className="relative">
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15"
                >
                  <option value="free">Free Ratio</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Cinema</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 TV</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest">Sensitivity</span>
              <span className="text-[10px] font-mono font-bold text-indigo-400">{sensitivity}%</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
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
            <div className="flex justify-between text-[8px] font-mono text-neutral-700">
              <span>Low (Fewer Cuts)</span>
              <span>High (More Cuts)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
