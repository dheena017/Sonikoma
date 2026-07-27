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
} from "lucide-react";
import AutoCropTabContent from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropTabContent";

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

  // Lock body, html, and main container scroll when modal is open so only the modal contents scroll
  React.useEffect(() => {
    if (!isPage) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Lock all background scroll containers (like <main> in MainLayout)
      const scrollContainers = document.querySelectorAll("main, .overflow-y-auto");
      const originalContainerStyles: { elem: HTMLElement; overflow: string }[] = [];

      scrollContainers.forEach((el) => {
        const elem = el as HTMLElement;
        if (!elem.closest(".fixed.inset-0")) {
          originalContainerStyles.push({ elem, overflow: elem.style.overflow });
          elem.style.overflow = "hidden";
        }
      });

      const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
        const target = e.target as HTMLElement | null;
        // If event target is NOT inside the modal container, block scrolling completely
        if (!target || !target.closest(".fixed.inset-0")) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
      window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener("wheel", preventBackgroundScroll);
        window.removeEventListener("touchmove", preventBackgroundScroll);
        originalContainerStyles.forEach(({ elem, overflow }) => {
          elem.style.overflow = overflow;
        });
      };
    }
  }, [isPage]);

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
      id: "advanced",
      label: "Advanced CV",
      icon: <Sliders className="h-3.5 w-3.5" />,
    },
  ];

  const mainCard = (
    <div className="bg-neutral-900 border border-neutral-800 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-neutral-800/80 flex flex-wrap items-center justify-between bg-neutral-950/80 backdrop-blur-md gap-3">
        {/* Left: Title + Mode Badges + Selected Images info */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Auto Panel Detection
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                useLocalCV 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
              }`}>
                {useLocalCV ? "⚡ OpenCV Engine" : `🧠 AI (${cropModel})`}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-neutral-400 font-sans">
                Targeting: <strong className="text-neutral-200">{selectedScraped.length || scrapedImages.length}</strong> image{(selectedScraped.length || scrapedImages.length) === 1 ? "" : "s"}
              </span>
              <span className="text-neutral-700">•</span>
              <span className="text-[10px] text-neutral-400 font-sans">
                Sens: <strong className="text-neutral-200">{sensitivity}%</strong>
              </span>
              <span className="text-neutral-700">•</span>
              <span className="text-[10px] text-neutral-400 font-sans">
                Pad: <strong className="text-neutral-200">{padding}px</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Controls & Close */}
        <div className="flex items-center justify-end gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[10px] font-bold font-mono active:scale-95 cursor-pointer shrink-0"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="h-3 w-3 text-neutral-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 bg-neutral-900/80 border border-neutral-800"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Compact Tabs & Quick Actions Row */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800/80 bg-neutral-950/40 px-3 sm:px-5 py-1.5 sm:py-2 shrink-0 gap-2">
        {/* Left: Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                console.log(`[AutoCropModal] Switching to tab: ${tab.id}`);
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  : "text-neutral-400 border border-transparent hover:text-neutral-200 hover:bg-neutral-800/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Integrated Quick Actions & Controls */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Quick Engine Switcher Pills */}
          <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5" title="Engine Strategy Mode">
            <button
              type="button"
              onClick={() => setUseLocalCV(true)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                useLocalCV
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              OpenCV
            </button>
            <button
              type="button"
              onClick={() => setUseLocalCV(false)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                !useLocalCV
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Gemini AI
            </button>
          </div>

          {/* Background Gutter Mode Pills */}
          <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5" title="Background Gutter Mode">
            {(["auto", "white", "black"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBackgroundColorMode(mode)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  backgroundColorMode === mode
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Lock Pills */}
          <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5" title="Aspect Ratio Lock Mode">
            {(["free", "1:1", "16:9"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatioLock(ratio)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  aspectRatioLock === ratio
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Auto-Split Strips Quick Toggle */}
          <button
            type="button"
            onClick={() => setAutoSplitTallStrips(!autoSplitTallStrips)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
              autoSplitTallStrips
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:text-neutral-300"
            }`}
            title="Automatically split tall webtoon strips into separate scene panels"
          >
            <Layers className="h-3 w-3" />
            <span>Auto-Split: {autoSplitTallStrips ? "ON" : "OFF"}</span>
          </button>
        </div>
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
              SMART SCANNER ACTIVE
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
      <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
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
              filters or Smart Scanner custom prompts
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
    <div
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden transition-all duration-300"
    >
      <div className="relative w-full max-w-5xl h-[calc(100vh-3rem)] max-h-[880px] flex flex-col overflow-hidden rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 animate-[fadeIn_0.18s_ease-out]">
        {mainCard}
      </div>
    </div>
  );
}
