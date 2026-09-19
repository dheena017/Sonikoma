import React, { useState } from "react";
import {
  Scissors,
  MoveVertical,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
  Minimize2,
  Expand,
  X,
} from "lucide-react";
import * as api from "@/api";
import { InteractiveCutOverlay } from "./InteractiveCutOverlay";

export interface AutoCropBigScreenModalProps {
  imageUrl: string;
  boxes: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  dimensions?: { width: number; height: number };
  isReCropping?: boolean;
  onClose: () => void;
  onSelectPanel: (idx: number) => void;
  onMoveCutLine?: (cutIdx: number, newY: number) => void;
  onNudgeCutLine?: (cutIdx: number, deltaPx: number) => void;
  onAddCutLine?: (yPosition: number) => void;
  onDeleteCutLine?: (cutIdx: number) => void;
  onUpdateBox?: (boxIdx: number, updatedBox: api.PanelBoundingBoxInput) => void;
  onAddBox?: (newBox: api.PanelBoundingBoxInput) => void;
  onSplitPanel?: (boxIdx: number) => void;
  onDeletePanel?: (boxIdx: number) => void;
  onNudgePanel?: (boxIdx: number, deltaY: number) => void;
  onApplyCrop?: () => void;
}

export function AutoCropBigScreenModal({
  imageUrl,
  boxes,
  selectedPanelIndex,
  dimensions,
  isReCropping,
  onClose,
  onSelectPanel,
  onMoveCutLine,
  onNudgeCutLine,
  onAddCutLine,
  onDeleteCutLine,
  onUpdateBox,
  onAddBox,
  onSplitPanel,
  onDeletePanel,
  onNudgePanel,
  onApplyCrop,
}: AutoCropBigScreenModalProps) {
  const [inspectZoom, setInspectZoom] = useState<number>(100);
  const [inspectFitMode, setInspectFitMode] = useState<"width" | "contain" | "actual">("width");
  const [inspectIsFullscreen, setInspectIsFullscreen] = useState(false);

  return (
    <div
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-150 ${
        inspectIsFullscreen ? "p-0" : ""
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          inspectIsFullscreen
            ? "h-screen max-w-none rounded-none"
            : "max-w-6xl xl:max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[95vh] rounded-none sm:rounded-3xl"
        } bg-[#09090D] border-0 sm:border sm:border-neutral-800/90 shadow-2xl flex flex-col overflow-hidden text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inspection Header Toolbar */}
        <div className="w-full flex items-center justify-between p-3 sm:p-4 border-b border-neutral-800/90 bg-neutral-950/90 backdrop-blur-lg shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block">
                Cut Line Editor & Inspector
              </span>
              <span className="text-[10px] text-neutral-400 hidden sm:block">
                Drag green handles to adjust cuts, click anywhere on the strip to add a cut
              </span>
            </div>
          </div>

          {/* Center Controls: View Modes & Zoom (Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Mode Toggles */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setInspectFitMode("width");
                  setInspectZoom(100);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  inspectFitMode === "width"
                    ? "bg-emerald-500 text-black font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Webtoon Strip Mode - Full readable width, vertical scroll"
              >
                <MoveVertical className="h-3.5 w-3.5" />
                <span>Fit Width</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectFitMode("contain");
                  setInspectZoom(100);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  inspectFitMode === "contain"
                    ? "bg-emerald-500 text-black font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Fit Window Mode - Scale to fit screen"
              >
                <span>⊡</span>
                <span>Fit Screen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectFitMode("actual");
                  setInspectZoom(100);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  inspectFitMode === "actual"
                    ? "bg-emerald-500 text-black font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="1:1 Native Resolution"
              >
                <span>1:1</span>
                <span>Actual</span>
              </button>
            </div>

            {/* Zoom Stepper */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setInspectZoom((z) => Math.max(25, z - 25))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-emerald-400 font-bold min-w-[42px] text-center">
                {inspectZoom}%
              </span>
              <button
                type="button"
                onClick={() => setInspectZoom((z) => Math.min(300, z + 25))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Actions: Responsive Overflow Menu + Fullscreen & Close */}
          <div className="flex items-center gap-1.5">
            {/* 3-Dot Responsive Overflow for Small Screens */}
            <div className="relative group block sm:hidden">
              <button
                type="button"
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center"
                title="Display & Zoom Options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-52 p-2.5 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 hidden group-hover:block group-focus-within:block space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 border-b border-neutral-800 pb-1">
                  View Modes
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectFitMode("width");
                      setInspectZoom(100);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      inspectFitMode === "width" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span>Fit Width (Webtoon)</span>
                    <MoveVertical className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectFitMode("contain");
                      setInspectZoom(100);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      inspectFitMode === "contain" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span>Fit Screen</span>
                    <span>⊡</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectFitMode("actual");
                      setInspectZoom(100);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                      inspectFitMode === "actual" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span>1:1 Actual Size</span>
                    <span>1:1</span>
                  </button>
                </div>

                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 border-b border-neutral-800 pb-1 pt-1">
                  Zoom Scale
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setInspectZoom((z) => Math.max(25, z - 25))}
                    className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-xs text-emerald-400 font-bold">{inspectZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setInspectZoom((z) => Math.min(300, z + 25))}
                    className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectIsFullscreen(!inspectIsFullscreen)}
              className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={inspectIsFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {inspectIsFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Expand className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* High-Resolution Interactive Cut Studio */}
        <div className="flex-1 min-h-0 w-full p-2 sm:p-4 flex flex-col bg-[#050508]">
          <InteractiveCutOverlay
            imageUrl={imageUrl}
            boxes={boxes}
            selectedPanelIndex={selectedPanelIndex}
            onSelectPanel={onSelectPanel}
            onMoveCutLine={onMoveCutLine}
            onNudgeCutLine={onNudgeCutLine}
            onAddCutLine={onAddCutLine}
            onDeleteCutLine={onDeleteCutLine}
            onUpdateBox={onUpdateBox}
            onAddBox={onAddBox}
            onSplitPanel={onSplitPanel}
            onDeletePanel={onDeletePanel}
            onNudgePanel={onNudgePanel}
            onApplyCrop={onApplyCrop}
            isReCropping={isReCropping}
            dimensions={dimensions}
            showCutLines={true}
          />
        </div>
      </div>
    </div>
  );
}

export default AutoCropBigScreenModal;
