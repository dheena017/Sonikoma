import React from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  CheckSquare,
  RefreshCw,
  X,
  Trash,
  Clock,
  Move,
} from "lucide-react";

interface TimelineSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isAnalyzingAll: boolean;
  handleAnalyzeSelected: () => void;
  selectAllPanels: () => void;
  clearSelection: () => void;
  isCompiling: boolean;
  handleCompileVideo: () => void;
  handleDeleteSelected: () => void;
  handleBulkModifyDuration: (val: number) => void;
  handleBulkModifyMotion: (val: string) => void;
}

export default function TimelineSelectionBar({
  selectedCount,
  totalCount,
  isAnalyzingAll,
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
  isCompiling,
  handleCompileVideo,
  handleDeleteSelected,
  handleBulkModifyDuration,
  handleBulkModifyMotion,
}: TimelineSelectionBarProps) {
  // Visible only when panels are selected
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
      {/* Container with neutral border and standard dark shadow */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 px-4 py-3 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* LEFT SECTION: Selection Actions or General Timeline Status */}
          <div className="flex items-center gap-3">
            {selectedCount > 0 ? (
              <>
                {/* Selection Count Badge */}
                <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 shrink-0">
                  <div className="h-5 w-5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold font-mono">
                    {selectedCount > 99 ? "99+" : selectedCount}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {selectedCount} panel{selectedCount !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <p className="text-[9px] text-purple-400 font-mono leading-tight">
                      of {totalCount} in storyboard
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-neutral-800 shrink-0" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
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
                      console.log(
                        `[TimelineSelectionBar] Analyze ${selectedCount} selected panels`
                      );
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
                    {isAnalyzingAll
                      ? "Analyzing..."
                      : `AI Analyse Selected (${selectedCount})`}
                  </button>

                  {/* Set Duration for Selected */}
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-tight hidden md:inline">
                      Duration:
                    </span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      placeholder="sec"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0.5) {
                          handleBulkModifyDuration(val);
                        }
                      }}
                      className="w-12 bg-neutral-950 border border-neutral-850 text-neutral-200 rounded text-center text-xs outline-none py-0.5 font-mono focus:border-purple-500"
                    />
                  </div>

                  {/* Set Motion for Selected */}
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300">
                    <Move className="h-3.5 w-3.5 text-purple-400" />
                    <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-tight hidden md:inline">
                      Motion:
                    </span>
                    <select
                      onChange={(e) => handleBulkModifyMotion(e.target.value)}
                      className="bg-neutral-950 border border-neutral-850 text-neutral-255 rounded text-xs outline-none py-0.5 cursor-pointer font-sans focus:border-purple-500"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="">AI Decide</option>
                      <option value="zoom_in">Zoom In</option>
                      <option value="zoom_out">Zoom Out</option>
                      <option value="pan_right">Pan Right</option>
                      <option value="pan_left">Pan Left</option>
                      <option value="pan_down">Pan Down</option>
                    </select>
                  </div>

                  {/* Delete Selected */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log(
                        `[TimelineSelectionBar] Delete ${selectedCount} selected panels`
                      );
                      handleDeleteSelected();
                    }}
                    className="px-3 sm:px-4 py-2 text-xs rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-350 hover:text-rose-100 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Trash className="h-3.5 w-3.5 text-rose-400" />
                    Delete ({selectedCount})
                  </button>

                  {/* Clear / Dismiss */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[TimelineSelectionBar] Clearing selection");
                      clearSelection();
                    }}
                    className="p-2 text-xs rounded-xl border font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    title="Clear Selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5 text-neutral-400 py-1.5 pl-1.5 select-none">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-mono">
                  Storyboard active:{" "}
                  <strong className="text-white">{totalCount} panels</strong>{" "}
                  ready for production.
                </span>
              </div>
            )}
          </div>

          {/* RIGHT SECTION: PRIMARY COMPILE ACTION */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <button
              type="button"
              disabled={isCompiling || totalCount === 0}
              onClick={() => {
                console.log("[TimelineSelectionBar] Compile video triggered");
                handleCompileVideo();
              }}
              className={`whitespace-nowrap px-5 py-2.5 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isCompiling
                  ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-not-allowed"
                  : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isCompiling ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white shrink-0" />
              ) : (
                <Sparkles className="h-4 w-4 text-white animate-pulse shrink-0" />
              )}
              <span>
                {isCompiling
                  ? "Compiling Video..."
                  : "Convert Storyboard to Video"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
