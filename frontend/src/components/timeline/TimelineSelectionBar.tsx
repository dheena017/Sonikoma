import React from "react";
import { createPortal } from "react-dom";
import { Sparkles, CheckSquare, RefreshCw, X } from "lucide-react";

interface TimelineSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isAnalyzingAll: boolean;
  handleAnalyzeSelected: () => void;
  selectAllPanels: () => void;
  clearSelection: () => void;
}

export default function TimelineSelectionBar({
  selectedCount,
  totalCount,
  isAnalyzingAll,
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
}: TimelineSelectionBarProps) {
  const isVisible = selectedCount > 0;

  // Safeguard: Ensure we are in a browser environment before using the DOM
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Container with neutral border and standard dark shadow (no glow) */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap sm:flex-nowrap">

          {/* Selection Count Badge */}
          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 shrink-0">
            <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
              {selectedCount > 99 ? "99+" : selectedCount}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-[9px] text-purple-400 font-mono leading-tight">
                of {totalCount} in storyboard
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-neutral-800 shrink-0" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-1">

            {/* Select All */}
            <button
              type="button"
              onClick={() => {
                console.log("[TimelineSelectionBar] Select all panels");
                selectAllPanels();
              }}
              className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            >
              <CheckSquare className="h-4 w-4 text-purple-400" />
              Select All
            </button>

            {/* AI Analyse Selected */}
            <button
              type="button"
              disabled={isAnalyzingAll}
              onClick={() => {
                console.log(`[TimelineSelectionBar] Analyze ${selectedCount} selected panels`);
                handleAnalyzeSelected();
              }}
              className={`px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isAnalyzingAll
                  ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-wait"
                  : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20"
              }`}
            >
              {isAnalyzingAll ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              )}
              {isAnalyzingAll ? "Analyzing..." : `AI Analyse Selected (${selectedCount})`}
            </button>
          </div>

          {/* Clear / Dismiss */}
          <button
            type="button"
            onClick={() => {
              console.log("[TimelineSelectionBar] Clearing selection");
              clearSelection();
            }}
            className="ml-auto px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 shrink-0"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}