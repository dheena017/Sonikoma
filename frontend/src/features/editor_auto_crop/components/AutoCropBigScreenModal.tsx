import React, { useState } from "react";
import {
  Scissors,
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
  const [inspectIsFullscreen, setInspectIsFullscreen] = useState(false);

  return (
    <div
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-3 bg-black/95 backdrop-blur-xl animate-in fade-in duration-150 ${
        inspectIsFullscreen ? "p-0" : ""
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          inspectIsFullscreen
            ? "h-screen max-w-none rounded-none"
            : "max-w-[98vw] h-[96vh] rounded-none sm:rounded-2xl"
        } bg-[#09090D] border-0 sm:border sm:border-neutral-800/90 shadow-2xl flex flex-col overflow-hidden text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inspection Top Header Bar */}
        <div className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800/90 bg-neutral-950/95 backdrop-blur-lg shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block">
                  Full-Screen Cut Studio & Inspector
                </span>
                {dimensions && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                    {dimensions.width}×{dimensions.height}px
                  </span>
                )}
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                  {boxes.length} Panels
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 hidden md:block">
                Precision bounding-box adjustment & real-time panel minimap radar
              </span>
            </div>
          </div>

          {/* Right Header Actions: Fullscreen & Close */}
          <div className="flex items-center gap-1.5">
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
              className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-rose-400 transition-colors cursor-pointer"
              title="Close Studio (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* High-Resolution Interactive Cut Studio (Full Height with Minimap Radar) */}
        <div className="flex-1 min-h-0 w-full p-2 sm:p-3 flex flex-col bg-[#050508] overflow-hidden">
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
