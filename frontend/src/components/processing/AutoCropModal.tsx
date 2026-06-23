import React from "react";
import {
  Scissors,
  X,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Cpu,
  Maximize2,
  Sliders,
  HelpCircle,
} from "lucide-react";
import AutoCropTabContent from "../scraper/AutoCropTabContent";

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
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
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
    setCropModel("gemini-2.0-flash-lite");
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
      id: "layout",
      label: "Layout & Guides",
      icon: <Maximize2 className="h-3.5 w-3.5" />,
    },
    {
      id: "advanced",
      label: "Advanced CV",
      icon: <Sliders className="h-3.5 w-3.5" />,
    },
    {
      id: "help",
      label: "Help Guide",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
    },
  ];

  const mainCard = (
    <div className="bg-neutral-900 border border-neutral-800 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-950/40 gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.15)]">
            <Scissors className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-[13px] sm:text-sm text-white leading-tight">
              Auto-Crop Settings & Configuration
            </h3>
            <p className="text-[9px] sm:text-[10px] text-neutral-400 font-mono mt-1 sm:mt-0.5 leading-snug">
              Configure OpenCV contour models or Gemini Vision AI prompts for
              segmenting comic strips
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-850 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-450 hover:text-white transition-all text-[10px] font-bold font-mono active:scale-95 cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-500" />
            <span className="hidden sm:inline">Reset Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 sm:p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 bg-neutral-900 sm:bg-transparent"
          >
            <X className="h-4 w-4 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Tab Selection Row */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-neutral-800 bg-neutral-950/20 px-2 sm:px-6 shrink-0 custom-scrollbar pb-1 sm:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              console.log(`[AutoCropModal] Switching to tab: ${tab.id}`);
              setActiveTab(tab.id);
            }}
            className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-[10px] sm:text-xs font-bold font-mono transition-all border-b-2 cursor-pointer select-none whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? "text-indigo-400 border-indigo-500 bg-indigo-500/5"
                : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/30"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="p-6 overflow-y-auto flex flex-col flex-1 min-h-0 bg-neutral-900/50">
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

      {/* Scrollable Horizontal Preview Ribbon */}
      {scrapedImages.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/35 flex flex-col gap-2 shrink-0 animate-[fadeIn_0.15s_ease-out]">
          <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider select-none">
            All Scraped Panels ({scrapedImages.length})
          </span>
          <div className="flex flex-wrap gap-3 overflow-y-auto py-1.5 pr-2 scrollbar-thin max-h-28 sm:max-h-32">
            {scrapedImages.map((imgUrl) => {
              const globalIdx = scrapedImages.indexOf(imgUrl);
              const isSelected = selectedScraped.includes(imgUrl);
              const isCurrentPreview = imgUrl === previewImageUrl;
              return (
                <div
                  key={imgUrl}
                  onClick={() => {
                    console.log(
                      `[AutoCropModal] Selected preview image: ${imgUrl}`
                    );
                    setActivePreviewUrl(imgUrl);
                    setSelectedScraped((prev) =>
                      prev.includes(imgUrl)
                        ? prev.filter((u) => u !== imgUrl)
                        : [...prev, imgUrl]
                    );
                  }}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-900 border shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isCurrentPreview
                      ? "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/30"
                      : isSelected
                      ? "border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Panel #${globalIdx + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <div
                    className={`absolute bottom-1.5 right-1.5 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono leading-none border transition-all duration-200 ${
                      isCurrentPreview
                        ? "bg-emerald-600/90 border-emerald-400/60 text-white"
                        : isSelected
                        ? "bg-indigo-600/90 border-indigo-400/60 text-white"
                        : "bg-black/80 border-indigo-900/30 text-indigo-400"
                    }`}
                  >
                    #{globalIdx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Config Summary Bar */}
      <div className="px-6 py-2.5 bg-neutral-950/20 border-t border-neutral-800 flex items-center gap-4 text-[9px] font-mono text-neutral-500 tracking-wider">
        <span className="font-bold text-neutral-400 uppercase">
          Active Strategy:
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Engine:{" "}
            <strong className="text-neutral-350">
              {useLocalCV ? "LOCAL OPENCV" : "GEMINI VISION AI"}
            </strong>
          </span>
          <span>•</span>
          {useLocalCV ? (
            <>
              <span>
                Sensitivity:{" "}
                <strong className="text-neutral-350">{sensitivity}</strong>
              </span>
              <span>•</span>
            </>
          ) : (
            <>
              <span>
                Model:{" "}
                <strong className="text-neutral-350">
                  {cropModel.toUpperCase()}
                </strong>
              </span>
              <span>•</span>
              <span>
                Focus Mode:{" "}
                <strong className="text-neutral-350">
                  {cropFocusMode.toUpperCase()}
                </strong>
              </span>
              <span>•</span>
            </>
          )}
          <span>
            Padding: <strong className="text-neutral-350">{padding}px</strong>
          </span>
          <span>•</span>
          <span>
            Split Tall:{" "}
            <strong className="text-neutral-350">
              {autoSplitTallStrips ? "YES" : "NO"}
            </strong>
          </span>
          <span>•</span>
          <span>
            Canny:{" "}
            <strong className="text-neutral-350">
              {cropCannyLow}/{cropCannyHigh}
            </strong>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-neutral-500 font-mono">
            Settings will be applied to future auto-crop tasks.
          </p>
          {useLocalCV ? (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              LOCAL CV ACTIVE
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-950/85 text-indigo-400 border border-indigo-800/40">
              GEMINI AI ACTIVE
            </span>
          )}
          {aspectRatioLock !== "free" && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-violet-950/80 text-violet-400 border border-violet-800/40">
              {aspectRatioLock} LOCKED
            </span>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold font-sans transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("[AutoCropModal] Apply clicked");
              onApply();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-sans transition-all cursor-pointer shadow-lg shadow-indigo-900/30 flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-indigo-400 cursor-pointer"
                onClick={onClose}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-indigo-400">Auto-Crop</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Scissors className="h-6 w-6 text-indigo-400" />
              Auto-Crop Settings & Configuration
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Configure parameters for Canny thresholds, model sizes, overlap
              filters or Gemini AI custom prompts
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-350 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer font-bold"
          >
            Dashboard
          </button>
        </div>
        <div className="flex-grow min-h-0">{mainCard}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
        {mainCard}
      </div>
    </div>
  );
}
