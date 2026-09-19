import React from "react";
import * as api from "@/api";
import { InteractiveCutOverlay } from "./InteractiveCutOverlay";

export interface AutoCropCompareTabProps {
  imageUrl: string;
  boxes: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  dimensions?: { width: number; height: number };
  showCutLines: boolean;
  isReCropping?: boolean;
  onToggleCutLines: () => void;
  onOpenBigScreen: () => void;
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

export function AutoCropCompareTab({
  imageUrl,
  boxes,
  selectedPanelIndex,
  dimensions,
  showCutLines,
  isReCropping,
  onToggleCutLines,
  onOpenBigScreen,
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
}: AutoCropCompareTabProps) {
  return (
    <div className="flex-1 min-h-0 h-full flex flex-col animate-in fade-in duration-150 w-full">
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
        showCutLines={showCutLines}
        onToggleCutLines={onToggleCutLines}
        onOpenBigScreen={onOpenBigScreen}
      />
    </div>
  );
}

export default AutoCropCompareTab;

