import React from "react";
import { Scissors, X, RefreshCw, Sparkles } from "lucide-react";
import AutoCropLeftColumn from "../scraper/AutoCropLeftColumn";
import AutoCropRightColumn from "../scraper/AutoCropRightColumn";

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
  processingStrategy: string;
  setProcessingStrategy: (v: string) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  selectedCount: number;
  isApplying: boolean;
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
  processingStrategy,
  setProcessingStrategy,
  aspectRatioLock,
  setAspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  useLocalCV,
  setUseLocalCV,
  selectedCount,
  isApplying,
}: AutoCropModalProps) {
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
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            <AutoCropLeftColumn
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              padding={padding}
              setPadding={setPadding}
              backgroundColorMode={backgroundColorMode}
              setBackgroundColorMode={setBackgroundColorMode}
              autoSplitTallStrips={autoSplitTallStrips}
              setAutoSplitTallStrips={setAutoSplitTallStrips}
              processingStrategy={processingStrategy}
              setProcessingStrategy={setProcessingStrategy}
              aspectRatioLock={aspectRatioLock}
              setAspectRatioLock={setAspectRatioLock}
              minPanelAreaPct={minPanelAreaPct}
              setMinPanelAreaPct={setMinPanelAreaPct}
              overlapMergeThreshold={overlapMergeThreshold}
              setOverlapMergeThreshold={setOverlapMergeThreshold}
            />
            <AutoCropRightColumn
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              padding={padding}
              setPadding={setPadding}
              minPanelAreaPct={minPanelAreaPct}
              setMinPanelAreaPct={setMinPanelAreaPct}
              overlapMergeThreshold={overlapMergeThreshold}
              setOverlapMergeThreshold={setOverlapMergeThreshold}
              autoSplitTallStrips={autoSplitTallStrips}
              setAutoSplitTallStrips={setAutoSplitTallStrips}
              useLocalCV={useLocalCV}
              setUseLocalCV={setUseLocalCV}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-neutral-505 font-mono">
                {selectedCount === 0
                  ? "⚠️  No panels selected — select panels first in the scraper deck"
                  : `Ready to auto-crop ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
              </p>
              {useLocalCV && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                  LOCAL CV ACTIVE
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
                onClick={onApply}
                disabled={isApplying || selectedCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 flex items-center gap-2 active:scale-95"
              >
                {isApplying ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isApplying ? "Auto-Cropping…" : "Apply & Crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
