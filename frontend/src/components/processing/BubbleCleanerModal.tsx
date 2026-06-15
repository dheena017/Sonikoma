import React from "react";
import { Brain, X, RefreshCw, Cpu, Sliders, HelpCircle, RotateCcw } from "lucide-react";
import BubbleCleanerTabContent from "../scraper/BubbleCleanerTabContent";

interface BubbleCleanerModalProps {
  onClose: () => void;
  onApply: () => void;
  
  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (v: "all" | "white_only" | "text_only") => void;
  eraseMethod: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  setEraseMethod: (v: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black") => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  
  // Advanced States
  bubbleDilation: number;
  setBubbleDilation: (v: number) => void;
  bubbleInpaintRadius: number;
  setBubbleInpaintRadius: (v: number) => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
  
  selectedCount: number;
  isApplying: boolean;
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: (v: string[]) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function BubbleCleanerModal({
  onClose,
  onApply,
  detectionStyle,
  setDetectionStyle,
  eraseMethod,
  setEraseMethod,
  sensitivity,
  setSensitivity,
  
  bubbleDilation,
  setBubbleDilation,
  bubbleInpaintRadius,
  setBubbleInpaintRadius,
  activeTab,
  setActiveTab,
  
  selectedCount,
  isApplying,
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  addNotification
}: BubbleCleanerModalProps) {

  const handleResetAll = () => {
    console.log("[BubbleCleanerModal] Resetting all parameters to defaults");
    setDetectionStyle("all");
    setEraseMethod("auto");
    setSensitivity(50);
    setBubbleDilation(-1);
    setBubbleInpaintRadius(3);
    setActiveTab("general");
    if (addNotification) {
      addNotification("Restored all speech bubble cleaner parameters to defaults.", "info");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: "advanced", label: "Advanced CV", icon: <Sliders className="h-3.5 w-3.5" /> },
    { id: "help", label: "Help & Legend", icon: <HelpCircle className="h-3.5 w-3.5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.15)]">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Smart Speech Bubble Cleaner</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Advanced OpenCV inpainting & text boundary cleanup parameters
                  {selectedCount > 0 && (
                    <span className="ml-2 text-purple-400 font-bold">
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
                onClick={() => {
                  console.log(`[BubbleCleanerModal] Switching to tab: ${tab.id}`);
                  setActiveTab(tab.id);
                }}
                className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer select-none ${
                  activeTab === tab.id
                    ? "text-purple-400 border-purple-500 bg-purple-500/5"
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
            <BubbleCleanerTabContent
              activeTab={activeTab}
              detectionStyle={detectionStyle}
              setDetectionStyle={setDetectionStyle}
              eraseMethod={eraseMethod}
              setEraseMethod={setEraseMethod}
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              bubbleDilation={bubbleDilation}
              setBubbleDilation={setBubbleDilation}
              bubbleInpaintRadius={bubbleInpaintRadius}
              setBubbleInpaintRadius={setBubbleInpaintRadius}
              selectedCount={selectedCount}
              scrapedImages={scrapedImages}
              selectedScraped={selectedScraped}
              addNotification={addNotification}
            />
          </div>

          {/* Scrollable Horizontal Preview Ribbon */}
          {(() => {
            const imagesToShow = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
            return imagesToShow.length > 0 && (
              <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/35 flex flex-col gap-2 shrink-0 animate-[fadeIn_0.15s_ease-out]">
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider select-none">
                  {selectedScraped.length > 0 ? "Selected Panels to Clean" : "All Scraped Panels"} ({imagesToShow.length})
                </span>
                <div className="flex flex-wrap gap-3 overflow-y-auto py-1.5 pr-2 scrollbar-thin max-h-28 sm:max-h-32">
                  {imagesToShow.map((imgUrl) => {
                    const globalIdx = scrapedImages.indexOf(imgUrl);
                    const isSelected = selectedScraped.includes(imgUrl);
                    return (
                      <div 
                        key={imgUrl} 
                        onClick={() => {
                          console.log(`[BubbleCleanerModal] Navigating to editor for image index ${globalIdx}`);
                          window.history.pushState({}, "", `/editor/adjust?idx=${globalIdx}`);
                          window.dispatchEvent(new Event("popstate"));
                        }}
                        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-900 border shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                          isSelected 
                            ? "border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/30" 
                            : "border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Panel #${globalIdx + 1}`} 
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div className={`absolute bottom-1.5 right-1.5 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono leading-none border transition-all duration-200 ${
                          isSelected
                            ? "bg-purple-600/90 border-purple-400/60 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                            : "bg-black/80 border-purple-900/30 text-purple-400"
                        }`}>
                          #{globalIdx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Live Config Summary Bar */}
          <div className="px-6 py-2.5 bg-neutral-950/20 border-t border-neutral-800 flex items-center gap-4 text-[9px] font-mono text-neutral-500 tracking-wider">
            <span className="font-bold text-neutral-400 uppercase">Active Profile:</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Detection: <strong className="text-neutral-350">{detectionStyle.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Method: <strong className="text-neutral-350">{eraseMethod.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Sensitivity: <strong className="text-neutral-350">{sensitivity}%</strong></span>
              <span>•</span>
              <span>Dilation: <strong className="text-neutral-350">{bubbleDilation === -1 ? "AUTO" : `${bubbleDilation}px`}</strong></span>
              <span>•</span>
              <span>Inpaint Radius: <strong className="text-neutral-350">{bubbleInpaintRadius}px</strong></span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-neutral-500 font-mono">
                {selectedCount === 0
                  ? "⚠️  No panels selected — select panels first in the scraper deck"
                  : `Ready to clean speech bubbles in ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
              </p>
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
                  console.log("[BubbleCleanerModal] Apply clicked");
                  onApply();
                }}
                disabled={isApplying || selectedCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 flex items-center gap-2 active:scale-95"
              >
                {isApplying ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Brain className="h-3.5 w-3.5" />
                )}
                {isApplying ? "Cleaning…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
