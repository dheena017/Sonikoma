import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Scissors,
  Sliders,
  Eye,
  HelpCircle,
} from "lucide-react";
import AutoSlicerSettings from "./AutoSlicerSettings";
import AutoSlicerCanny from "./AutoSlicerCanny";

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

  const renderOpenCvAdvanced = () => (
    <AutoSlicerCanny
      minHeightPx={minHeightPx}
      setMinHeightPx={setMinHeightPx}
      minAreaPct={minAreaPct}
      setMinAreaPct={setMinAreaPct}
      mergeThreshold={mergeThreshold}
      setMergeThreshold={setMergeThreshold}
      closeKernelSize={closeKernelSize}
      setCloseKernelSize={setCloseKernelSize}
      cannyLow={cannyLow}
      setCannyLow={setCannyLow}
      cannyHigh={cannyHigh}
      setCannyHigh={setCannyHigh}
    />
  );

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
          <p>
            <strong>OpenCV Contours Detector:</strong> Standard edge-based
            segmentation that identifies panels separated by high-luminance
            spacing gutters.
          </p>
          <p>
            <strong>Gemini AI Smart Scanner:</strong> Vision-based LLM
            segmentation that extracts panel boundaries based on page context.
          </p>
          <p>
            <strong>Dry Run:</strong> Highlights contours visually without
            saving them immediately, so you can tweak thresholds safely.
          </p>
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
          <span>
            {isDetecting
              ? "Scanning..."
              : dryRun
              ? "Dry Run Preview"
              : "Slice Panel Cuts"}
          </span>
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
      {hasDetectedBoxes && dryRun && !isDetecting && (
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
            Dry-run preview contains{" "}
            <span className="font-semibold text-white">{detectedCount}</span>{" "}
            detected panel{detectedCount === 1 ? "" : "s"}.
          </div>
        </div>
      )}

      {showSettings && (
        <AutoSlicerSettings
          backgroundMode={backgroundMode}
          setBackgroundMode={setBackgroundMode}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          strategy={strategy}
          model={model}
          setModel={setModel}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          showOpenCvAdvanced={showOpenCvAdvanced}
          setShowOpenCvAdvanced={setShowOpenCvAdvanced}
          renderOpenCvAdvanced={renderOpenCvAdvanced}
          dryRun={dryRun}
          setDryRun={setDryRun}
        />
      )}
    </div>
  );
}
