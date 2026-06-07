import React, { useState } from "react";
import { Sparkles, RefreshCw, Scissors, Sliders, ChevronDown, Eye, HelpCircle } from "lucide-react";

interface AutoSlicerProps {
  handleDetectPanels: (settings?: { 
    sensitivity?: number; 
    backgroundMode?: string; 
    aspectRatio?: string;
    strategy?: string;
    model?: string;
    minAreaPct?: number;
    mergeThreshold?: number;
    cannyLow?: number;
    cannyHigh?: number;
    closeKernelSize?: number;
    minHeightPx?: number;
    dryRun?: boolean;
  }) => Promise<void>;
  isDetecting: boolean;
  onCommitCuts?: () => void;
  hasDetectedBoxes?: boolean;
  detectedCount?: number;
  clearDetectedBoxes?: () => void;
}

export default function AutoSlicer({
  handleDetectPanels,
  isDetecting,
  onCommitCuts,
  hasDetectedBoxes = false,
  detectedCount = 0,
  clearDetectedBoxes,
}: AutoSlicerProps) {
  // Advanced parameters states
  const [strategy, setStrategy] = useState<"local-cv" | "ai">("local-cv");
  const [model, setModel] = useState<string>("gemini-2.5-flash");
  const [sensitivity, setSensitivity] = useState<number>(30);
  const [backgroundMode, setBackgroundMode] = useState<string>("auto");
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  
  // OpenCV advanced parameters
  const [minHeightPx, setMinHeightPx] = useState<number>(60);
  const [minAreaPct, setMinAreaPct] = useState<number>(0.15);
  const [mergeThreshold, setMergeThreshold] = useState<number>(20);
  const [cannyLow, setCannyLow] = useState<number>(20);
  const [cannyHigh, setCannyHigh] = useState<number>(100);
  const [closeKernelSize, setCloseKernelSize] = useState<number>(15);

  const [dryRun, setDryRun] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showOpenCvAdvanced, setShowOpenCvAdvanced] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const resetSettings = () => {
    setStrategy("local-cv");
    setModel("gemini-2.5-flash");
    setSensitivity(30);
    setBackgroundMode("auto");
    setAspectRatio("free");
    setMinHeightPx(60);
    setMinAreaPct(0.15);
    setMergeThreshold(20);
    setCannyLow(20);
    setCannyHigh(100);
    setCloseKernelSize(15);
    setDryRun(true);
  };

  const handleScan = () => {
    handleDetectPanels({
      sensitivity,
      backgroundMode,
      aspectRatio,
      strategy,
      model,
      minAreaPct,
      mergeThreshold,
      cannyLow,
      cannyHigh,
      closeKernelSize,
      minHeightPx,
      dryRun,
    });
  };

  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05] shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-wider">
            Contours-Detection Auto Cutter
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSettings}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-neutral-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-300 hover:bg-white/5 transition"
            title="Reset settings to defaults"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 rounded bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Show Scanner Help"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-[9px] text-neutral-400 space-y-1.5 font-mono animate-fadeIn">
          <p><strong>OpenCV Contours Detector:</strong> Standard edge-based segmentation that identifies panels separated by high-luminance spacing gutters.</p>
          <p><strong>Gemini AI Smart Scanner:</strong> Vision-based LLM segmentation that extracts panel boundaries based on page context.</p>
          <p><strong>Dry Run:</strong> Highlights contours visually without saving them immediately, so you can tweak thresholds safely.</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStrategy("local-cv")}
          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
            strategy === "local-cv"
              ? "bg-emerald-600/20 border-emerald-500/50 text-white shadow-md shadow-emerald-950/20"
              : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
          }`}
        >
          CV Contours
        </button>
        <button
          type="button"
          onClick={() => setStrategy("ai")}
          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
            strategy === "ai"
              ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-md shadow-indigo-950/20"
              : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Gemini AI
        </button>
      </div>

      {/* Primary Action Button Row */}
      <div className="flex items-center h-9 w-full">
        <button
          type="button"
          onClick={handleScan}
          disabled={isDetecting}
          className="flex-1 h-full px-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
        >
          {isDetecting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scissors className="h-3.5 w-3.5" />
          )}
          <span>{isDetecting ? "Scanning..." : dryRun ? "Dry Run Preview" : "Slice Panel Cuts"}</span>
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

      {/* Dry Run Commit Row */}
      {hasDetectedBoxes && !isDetecting && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-900/60 border border-neutral-800 rounded-xl animate-fadeIn">
          <button
            type="button"
            onClick={onCommitCuts}
            className="py-1.5 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer"
          >
            Apply Detected Cuts
          </button>
          <button
            type="button"
            onClick={clearDetectedBoxes}
            className="py-1.5 px-2.5 bg-red-950/20 hover:bg-red-900/20 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer"
          >
            Clear Preview
          </button>
          <div className="col-span-2 text-[9px] text-neutral-400 font-mono">
            Preview contains <span className="font-semibold text-white">{detectedCount}</span> detected panel{detectedCount === 1 ? "" : "s"}.
          </div>
        </div>
      )}

      {showSettings && (
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
                Gemini Model
              </label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Visual)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          ) : (
            <>
              {/* Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-wider">Sensitivity</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">{sensitivity}%</span>
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
                  <ChevronDown className={`h-3 w-3 transition-transform ${showOpenCvAdvanced ? "rotate-180 text-emerald-400" : ""}`} />
                  <span>Advanced CV Parameters</span>
                </button>

                {showOpenCvAdvanced && (
                  <div className="space-y-3.5 pt-2.5 animate-fadeIn">
                    {/* Min Height Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-neutral-500">Min Panel Height</span>
                        <span className="text-emerald-400 font-bold">{minHeightPx}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="300"
                        value={minHeightPx}
                        onChange={(e) => setMinHeightPx(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Min Width Percentage Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-neutral-500">Min Panel Width Ratio</span>
                        <span className="text-emerald-400 font-bold">{Math.round(minAreaPct * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={minAreaPct}
                        onChange={(e) => setMinAreaPct(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Merge Threshold Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-neutral-500">Grouping Proximity</span>
                        <span className="text-emerald-400 font-bold">{mergeThreshold}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mergeThreshold}
                        onChange={(e) => setMergeThreshold(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Close Kernel Size */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-neutral-500">Morph Close Size</span>
                        <span className="text-emerald-400 font-bold">{closeKernelSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="51"
                        step="2" // Odd numbers only
                        value={closeKernelSize}
                        onChange={(e) => setCloseKernelSize(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Canny Edge Low & High sliders */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono">
                          <span className="text-neutral-500">Canny Low</span>
                          <span className="text-emerald-400 font-bold">{cannyLow}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          value={cannyLow}
                          onChange={(e) => setCannyLow(Number(e.target.value))}
                          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono">
                          <span className="text-neutral-500">Canny High</span>
                          <span className="text-emerald-400 font-bold">{cannyHigh}</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="255"
                          value={cannyHigh}
                          onChange={(e) => setCannyHigh(Number(e.target.value))}
                          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Interactive Dry-Run Toggle */}
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
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
              <div className="w-7 h-4 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white border border-neutral-700"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
