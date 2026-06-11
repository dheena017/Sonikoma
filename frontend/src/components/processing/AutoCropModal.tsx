import React from "react";
import { Scissors, X, RefreshCw, Sparkles, RotateCcw, Cpu, Maximize2, Sliders, HelpCircle } from "lucide-react";
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
  
  selectedCount: number;
  isApplying: boolean;
  scrapedImages: string[];
  selectedScraped: string[];
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification?: (msg: string, type: any) => void;
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
  
  selectedCount,
  isApplying,
  scrapedImages,
  selectedScraped,
  setConsoleLogs,
  addNotification
}: AutoCropModalProps) {

  const handleResetAll = () => {
    setSensitivity(30);
    setPadding(10);
    setBackgroundColorMode("auto");
    setAutoSplitTallStrips(true);
    setAspectRatioLock("free");
    setMinPanelAreaPct(2);
    setOverlapMergeThreshold(20);
    setUseLocalCV(true);
    setCropModel("gemini-2.5-flash");
    setCropMinHeightPx(60);
    setCropCannyLow(20);
    setCropCannyHigh(100);
    setCropCloseKernelSize(15);
    setActiveTab("general");
    if (addNotification) {
      addNotification("Restored all crop parameters to defaults.", "info");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: "layout", label: "Layout & Guides", icon: <Maximize2 className="h-3.5 w-3.5" /> },
    { id: "advanced", label: "Advanced CV", icon: <Sliders className="h-3.5 w-3.5" /> },
    { id: "help", label: "Help Guide", icon: <HelpCircle className="h-3.5 w-3.5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.15)]">
                <Scissors className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Smart Auto-Crop Settings</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Advanced CV border-detection & panel segmentation parameters
                  {selectedCount > 0 && (
                    <span className="ml-2 text-indigo-400 font-bold">
                      · {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[10px] font-bold font-mono active:scale-95 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
                Reset Defaults
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="flex border-b border-neutral-800 bg-neutral-950/20 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer select-none ${
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
            />
          </div>

          {/* Live Config Summary Bar */}
          <div className="px-6 py-2.5 bg-neutral-950/20 border-t border-neutral-800 flex items-center gap-4 text-[9px] font-mono text-neutral-500 tracking-wider">
            <span className="font-bold text-neutral-400 uppercase">Active Profile:</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Engine: <strong className="text-neutral-350">{useLocalCV ? "OPENCV ONLY" : `GEMINI AI (${cropModel})`}</strong></span>
              <span>•</span>
              <span>Gutter: <strong className="text-neutral-350">{backgroundColorMode.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Padding: <strong className="text-neutral-350">{padding}px</strong></span>
              <span>•</span>
              <span>Lock: <strong className="text-neutral-350">{aspectRatioLock}</strong></span>
              <span>•</span>
              <span>Sensitivity: <strong className="text-neutral-350">{sensitivity}%</strong></span>
              <span>•</span>
              <span>Canny: <strong className="text-neutral-350">{cropCannyLow}/{cropCannyHigh}</strong></span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-neutral-500 font-mono">
                {selectedCount === 0
                  ? "⚠️  No panels selected — select panels first in the scraper deck"
                  : `Ready to auto-crop ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
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
                onClick={onApply}
                disabled={isApplying || selectedCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 flex items-center gap-2 active:scale-95"
              >
                {isApplying ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isApplying ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
