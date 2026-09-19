import React from "react";
import { Scissors, X } from "lucide-react";
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
  return (
    <div className="fixed inset-0 z-[100000] w-screen h-screen flex flex-col bg-[#09090D] text-white overflow-hidden animate-in fade-in duration-150 select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-3.5 py-2 border-b border-neutral-800/90 bg-neutral-950/95 backdrop-blur-lg shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
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
        </div>

        {/* Right Action: Close */}
        <div className="flex items-center gap-1.5">
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

      {/* Edge-to-edge Studio Canvas with Full-Height Minimap Radar */}
      <div className="flex-1 min-h-0 w-full p-1 sm:p-2 flex flex-col bg-[#050508] overflow-hidden">
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
  );
}

export default AutoCropBigScreenModal;
