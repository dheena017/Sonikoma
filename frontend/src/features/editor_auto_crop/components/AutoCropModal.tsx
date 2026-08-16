import React from "react";
import {
  Scissors,
  X,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Cpu,
  Sliders,
  Layers,
  Brain,
  Zap,
  ArrowLeft,
} from "lucide-react";
import AutoCropTabContent from "./AutoCropTabContent";

interface AutoCropModalProps {
  onClose: () => void;
  onApply: () => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  padding: number;
  setPadding: (v: number) => void;
  backgroundColorMode: string;
  setBackgroundColorMode: (v: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (v: boolean) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;

  // Advanced States
  cropModel: string;
  setCropModel: (v: string) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (v: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
  cropGuidance: string;
  setCropGuidance: (v: string) => void;
  cropFocusMode: string;
  setCropFocusMode: (v: string) => void;

  selectedCount: number;
  isApplying: boolean;
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification?: (msg: string, type: any) => void;
  isPage?: boolean;
}

export default function AutoCropModal({
  onClose,
  onApply,
  sensitivity,
  setSensitivity,
  padding,
  setPadding,
  backgroundColorMode,
  setBackgroundColorMode,
  autoSplitTallStrips,
  setAutoSplitTallStrips,
  aspectRatioLock,
  setAspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  useLocalCV,
  setUseLocalCV,

  cropModel,
  setCropModel,
  cropMinHeightPx,
  setCropMinHeightPx,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
  activeTab,
  setActiveTab,
  cropGuidance,
  setCropGuidance,
  cropFocusMode,
  setCropFocusMode,

  selectedCount,
  isApplying,
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
  isPage = false,
}: AutoCropModalProps) {
  const [useYolo, setUseYolo] = React.useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = React.useState<string | null>(
    null
  );

  const previewImageUrl =
    activePreviewUrl ||
    (selectedScraped.length > 0
      ? selectedScraped[0]
      : scrapedImages.length > 0
      ? scrapedImages[0]
      : null);

  const handleResetAll = () => {
    console.log("[AutoCropModal] Resetting all parameters to defaults");
    setSensitivity(30);
    setPadding(10);
    setBackgroundColorMode("auto");
    setAutoSplitTallStrips(true);
    setAspectRatioLock("free");
    setMinPanelAreaPct(2);
    setOverlapMergeThreshold(20);
    setUseLocalCV(true);
    setCropModel("");
    setCropMinHeightPx(60);
    setCropCannyLow(20);
    setCropCannyHigh(100);
    setCropCloseKernelSize(15);
    setActiveTab("general");
    setCropGuidance("");
    setCropFocusMode("standard");
    setActivePreviewUrl(null);
    if (addNotification) {
      addNotification("Restored all crop parameters to defaults.", "info");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: <Cpu className="h-3.5 w-3.5" /> },
    {
      id: "advanced",
      label: "Advanced CV",
      icon: <Sliders className="h-3.5 w-3.5" />,
    },
  ];

  const mainCard = (
    <div className="bg-[#050508] text-neutral-100 w-full flex flex-col p-4 sm:p-6 md:p-8 space-y-6 pb-24 animate-[fadeIn_0.22s_ease-out]">
      {/* HEADER SECTION (Matched to AI Model Control Hub Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span
              className="hover:text-purple-400 cursor-pointer transition-colors"
              onClick={onClose}
            >
              Dashboard
            </span>
            <span>&gt;</span>
            <span className="text-purple-400 font-semibold">
              Auto Panel Detection Hub
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-950/60 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.35)] flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 text-purple-300" />
            </div>
            Auto Panel Detection Hub
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">
            Configure OpenCV contour segmentation, AI vision models, and comic
            panel auto-crop parameters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Strategy Status Badge */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 border border-neutral-800/90 px-4 py-2.5 rounded-2xl flex items-center gap-3 font-mono text-xs shadow-md">
            <div>
              <span className="text-[9px] text-purple-400 uppercase tracking-wider block font-bold">
                Active System Strategy
              </span>
              <span className="text-white font-bold block mt-0.5">
                {useLocalCV
                  ? "OPENCV LOCAL ENGINE"
                  : `AI VISION (${cropModel.toUpperCase() || "GEMINI"})`}
              </span>
            </div>
            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[9px] font-bold px-2.5 py-1 rounded-xl uppercase flex items-center gap-1 shadow-sm">
              <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400" />{" "}
              ACTIVE
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all duration-300 text-xs font-mono font-bold active:scale-95 cursor-pointer shrink-0 shadow-sm"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-mono transition-all duration-300 shadow-lg shadow-purple-900/40 font-bold cursor-pointer active:scale-95 border border-purple-400/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </button>
        </div>
      </div>

      {/* Tabs & Quick Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border border-neutral-800/90 bg-neutral-900/70 backdrop-blur-xl rounded-3xl p-3 shrink-0 gap-3 shadow-lg">
        {/* Left: Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                console.log(`[AutoCropModal] Switching to tab: ${tab.id}`);
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer select-none whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-purple-200 bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3)] scale-102"
                  : "text-neutral-400 border border-transparent hover:text-neutral-200 hover:bg-neutral-800/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Quick Engine Switcher Pills */}
          <div
            className="flex items-center bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-1 shadow-inner"
            title="Engine Strategy Mode"
          >
            <button
              type="button"
              onClick={() => setUseLocalCV(true)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                useLocalCV
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              OpenCV
            </button>
            <button
              type="button"
              onClick={() => setUseLocalCV(false)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                !useLocalCV
                  ? "bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Gemini AI
            </button>
          </div>

          {/* Background Gutter Mode Pills */}
          <div
            className="flex items-center bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-1 shadow-inner"
            title="Background Gutter Mode"
          >
            {(["auto", "white", "black"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBackgroundColorMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                  backgroundColorMode === mode
                    ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Lock Pills */}
          <div
            className="flex items-center bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-1 shadow-inner"
            title="Aspect Ratio Lock Mode"
          >
            {(["free", "1:1", "16:9"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatioLock(ratio)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                  aspectRatioLock === ratio
                    ? "bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Auto-Split Strips Indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-bold shadow-sm"
            title="Auto-Split is automatically active for all tall webtoon strips"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Auto-Split: ACTIVE</span>
          </div>

          {/* YOLO AI Vision Box Fusion Quick Toggle */}
          <button
            type="button"
            onClick={() => setUseYolo(!useYolo)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
              useYolo
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                : "bg-neutral-900/90 border-neutral-800/90 text-neutral-400 hover:text-neutral-200"
            }`}
            title="Use YOLO AI neural model for deep learning panel candidates & speech bubble protection"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>YOLO AI: {useYolo ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Content */}
      <div className="w-full flex flex-col space-y-6">
        <AutoCropTabContent
          activeTab={activeTab}
          useLocalCV={useLocalCV}
          setUseLocalCV={setUseLocalCV}
          cropModel={cropModel}
          setCropModel={setCropModel}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
          cropSensitivity={sensitivity}
          setCropSensitivity={setSensitivity}
          cropPaddingPx={padding}
          setCropPaddingPx={setPadding}
          cropBackgroundMode={backgroundColorMode}
          setCropBackgroundMode={setBackgroundColorMode}
          aspectRatioLock={aspectRatioLock}
          setAspectRatioLock={setAspectRatioLock}
          minPanelAreaPct={minPanelAreaPct}
          setMinPanelAreaPct={setMinPanelAreaPct}
          overlapMergeThreshold={overlapMergeThreshold}
          setOverlapMergeThreshold={setOverlapMergeThreshold}
          cropMinHeightPx={cropMinHeightPx}
          setCropMinHeightPx={setCropMinHeightPx}
          cropCannyLow={cropCannyLow}
          setCropCannyLow={setCropCannyLow}
          cropCannyHigh={cropCannyHigh}
          setCropCannyHigh={setCropCannyHigh}
          cropCloseKernelSize={cropCloseKernelSize}
          setCropCloseKernelSize={setCropCloseKernelSize}
          scrapedImages={scrapedImages}
          selectedScraped={selectedScraped}
          setConsoleLogs={setConsoleLogs}
          addNotification={addNotification}
          cropGuidance={cropGuidance}
          setCropGuidance={setCropGuidance}
          cropFocusMode={cropFocusMode}
          setCropFocusMode={setCropFocusMode}
          previewImageUrl={previewImageUrl}
        />
      </div>

      {/* Footer */}
      <div className="pt-6 pb-2 border-t border-neutral-800/80 flex items-center justify-between gap-4 shrink-0 mt-auto">
        <p className="text-xs text-neutral-500 font-mono hidden sm:block">
          Settings apply to all current and future auto-crop jobs.
        </p>
        <div className="flex items-center gap-3.5 ml-auto">
          <button
            type="button"
            onClick={() => {
              console.log("[AutoCropModal] Apply clicked");
              onApply();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans transition-all cursor-pointer shadow-lg shadow-purple-900/40 flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="auto-crop-container"
      className="flex-1 w-full min-h-full flex flex-col animate-[fadeIn_0.22s_ease-out] bg-[#050508]"
    >
      {mainCard}
    </div>
  );
}
