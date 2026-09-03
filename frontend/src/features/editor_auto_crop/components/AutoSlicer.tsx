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
    paddingPx?: number;
    autoSplit?: boolean;
    useYolo?: boolean;
    dryRun?: boolean;
  }) => Promise<void>;
  handleCancelDetect: () => void;
  isDetecting: boolean;
  onCommitCuts?: () => void;
  hasDetectedBoxes?: boolean;
  detectedCount?: number;
  clearDetectedBoxes?: () => void;
}

export default function AutoSlicer({
  handleDetectPanels,
  handleCancelDetect,
  isDetecting,
  onCommitCuts,
  hasDetectedBoxes = false,
  detectedCount = 0,
  clearDetectedBoxes,
}: AutoSlicerProps) {
  // Advanced parameters states
  const [strategy, setStrategy] = useState<"local-cv" | "ai">("local-cv");
  const [model, setModel] = useState<string>("");
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
    console.log("[AutoSlicer] Resetting scanner settings");
    setStrategy("local-cv");
    setModel("");
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
    console.log(
      `[AutoSlicer] Initiating scan. Strategy: ${strategy}, DryRun: ${dryRun}`
    );
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
    <div className="space-y-4 bg-neutral-900/60 p-5 rounded-3xl border border-neutral-800/80 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-[#3B82F6]/50 flex items-center justify-center  shrink-0">
            <Sparkles className="h-5 w-5 text-[#60A5FA]" />
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
            <strong>Smart Scanner:</strong> Vision-based segmentation that
            extracts panel boundaries based on page context.
          </p>
          <p>
            <strong>Dry Run:</strong> Highlights contours visually without
            saving them immediately, so you can tweak thresholds safely.
          </p>
        </div>
      )}

      {/* Strategy Toggle Pill Switcher */}
      <div className="flex gap-2 p-1.5 bg-neutral-950/90 rounded-2xl border border-neutral-800">
        <button
          type="button"
          onClick={() => setStrategy("local-cv")}
          className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            strategy === "local-cv"
              ? "bg-gradient-to-r from-purple-950/80 via-purple-900/50 to-purple-950/60 text-white  border border-[#3B82F6]/40"
              : "text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          CV Contours
        </button>
        <button
          type="button"
          onClick={() => setStrategy("ai")}
          className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            strategy === "ai"
              ? "bg-gradient-to-r from-purple-950/80 via-purple-900/50 to-purple-950/60 text-white  border border-[#3B82F6]/40"
              : "text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          Smart Scanner
        </button>
      </div>

      {/* Primary Action Button Row */}
      <div className="flex items-center gap-2 w-full">
        {isDetecting ? (
          <button
            type="button"
            onClick={handleCancelDetect}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95 shadow-[0_4px_14px_rgba(239,68,68,0.3)] border border-red-400/30"
          >
            <RefreshCw className="h-4 w-4 animate-spin text-red-200" />
            <span>Stop Scanning</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleScan}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95 shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] border border-[#60A5FA]/30"
          >
            <Scissors className="h-4 w-4 text-purple-200" />
            <span>{dryRun ? "Dry Run Preview" : "Slice Panel Cuts"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Toggle Auto-crop Settings"
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ${
            showSettings
              ? "bg-purple-950/60 border-[#3B82F6]/50 text-[#60A5FA] "
              : "bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
        </button>
      </div>

      {/* Dry Run Commit Row */}
      {hasDetectedBoxes && dryRun && !isDetecting && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-900/60 border border-neutral-800 rounded-xl animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              console.log("[AutoSlicer] Committing detected cuts");
              onCommitCuts?.();
            }}
            className="py-1.5 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer"
          >
            Apply Detected Cuts
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("[AutoSlicer] Clearing detected preview");
              clearDetectedBoxes?.();
            }}
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
