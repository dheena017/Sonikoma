import React from "react";
import { Brain, X, RefreshCw } from "lucide-react";
import BubbleCleanerLeftColumn from "./scraper/BubbleCleanerLeftColumn";
import BubbleCleanerRightColumn from "./scraper/BubbleCleanerRightColumn";

interface BubbleCleanerModalProps {
  onClose: () => void;
  onApply: () => void;
  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (v: "all" | "white_only" | "text_only") => void;
  eraseMethod: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  setEraseMethod: (v: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black") => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  selectedCount: number;
  isApplying: boolean;
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
  selectedCount,
  isApplying,
}: BubbleCleanerModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center">
                <Brain className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Bubble Cleaner Settings</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Configure what gets detected and how it is erased
                  {selectedCount > 0 && (
                    <span className="ml-2 text-purple-400 font-bold">· {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected</span>
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
            <BubbleCleanerLeftColumn
              detectionStyle={detectionStyle}
              setDetectionStyle={setDetectionStyle}
              eraseMethod={eraseMethod}
              setEraseMethod={setEraseMethod}
            />
            <BubbleCleanerRightColumn
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              detectionStyle={detectionStyle}
              eraseMethod={eraseMethod}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
            <p className="text-[10px] text-neutral-500 font-mono">
              {selectedCount === 0
                ? "⚠️  No panels selected — select panels first in the scraper deck"
                : `Ready to clean ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
            </p>
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 flex items-center gap-2 active:scale-95"
              >
                {isApplying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                {isApplying ? "Cleaning…" : "Apply & Clean"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
