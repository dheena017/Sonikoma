import React from "react";
import {
  Move,
  ChevronUp,
  ChevronDown,
  Copy,
  Maximize2,
  Layers,
  Split,
  Trash2,
} from "lucide-react";
import * as api from "@/api";
import {
  BorderStyle,
  BORDER_STYLE_CLASSES,
  ThemeConfigItem,
  DragAction,
} from "./InteractiveCutOverlay.types";

export interface InteractiveCutBoxItemProps {
  box: api.PanelBoundingBoxInput;
  idx: number;
  totalWidth: number;
  totalHeight: number;
  selectedPanelIndex: number | null;
  dragAction: DragAction | null;
  activeTheme: ThemeConfigItem;
  borderStyle: BorderStyle;
  boxFillOpacity: number;
  showPanelBoxes: boolean;
  showRuleOfThirds: boolean;
  showQuickToolbar: boolean;
  showPanelBadges: boolean;
  showMoveBadges: boolean;
  showDimensionTags: boolean;
  showEdgeHandles: boolean;
  showCornerHandles: boolean;
  lastDragEndTimeRef: React.RefObject<number>;
  onSelectPanel: (idx: number) => void;
  handleBoxMoveStart: (boxIdx: number, e: React.MouseEvent | React.TouchEvent) => void;
  handleBoxResizeStart: (
    boxIdx: number,
    handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se",
    e: React.MouseEvent | React.TouchEvent
  ) => void;
  onNudgePanel?: (boxIdx: number, deltaY: number) => void;
  onDuplicatePanel?: (idx: number) => void;
  onSnapToFullWidth?: (idx: number) => void;
  onMergeWithNext?: (idx: number) => void;
  onSplitPanel?: (boxIdx: number) => void;
  onDeletePanel?: (boxIdx: number) => void;
  boxesCount: number;
}

export const InteractiveCutBoxItem: React.FC<InteractiveCutBoxItemProps> = ({
  box,
  idx,
  totalWidth,
  totalHeight,
  selectedPanelIndex,
  dragAction,
  activeTheme,
  borderStyle,
  boxFillOpacity,
  showPanelBoxes,
  showRuleOfThirds,
  showQuickToolbar,
  showPanelBadges,
  showMoveBadges,
  showDimensionTags,
  showEdgeHandles,
  showCornerHandles,
  lastDragEndTimeRef,
  onSelectPanel,
  handleBoxMoveStart,
  handleBoxResizeStart,
  onNudgePanel,
  onDuplicatePanel,
  onSnapToFullWidth,
  onMergeWithNext,
  onSplitPanel,
  onDeletePanel,
  boxesCount,
}) => {
  const isBeingMoved =
    dragAction?.type === "move-box" && dragAction.boxIdx === idx;
  const isBeingResized =
    dragAction?.type === "resize-box" && dragAction.boxIdx === idx;

  const curX = isBeingMoved
    ? dragAction.currentX
    : isBeingResized
    ? dragAction.currentX
    : (box.x ?? 0);
  const curY = isBeingMoved
    ? dragAction.currentY
    : isBeingResized
    ? dragAction.currentY
    : (box.y ?? 0);
  const curW = isBeingResized
    ? dragAction.currentW
    : (box.width ?? totalWidth);
  const curH = isBeingResized
    ? dragAction.currentH
    : (box.height ?? Math.round(totalHeight / Math.max(1, boxesCount)));

  const leftPercent = (curX / totalWidth) * 100;
  const topPercent = (curY / totalHeight) * 100;
  const widthPercent = (curW / totalWidth) * 100;
  const heightPercent = (curH / totalHeight) * 100;

  const isSelected = selectedPanelIndex === idx;
  const ratio = curW > 0 && curH > 0 ? (curW / curH).toFixed(2) : undefined;
  const borderClass = BORDER_STYLE_CLASSES[borderStyle];

  // Background color fill calculation
  const fillAlpha = isSelected
    ? Math.max(0.12, boxFillOpacity / 100)
    : (boxFillOpacity * 0.4) / 100;
  const bgFillStyle = showPanelBoxes
    ? `rgba(${activeTheme.rgb}, ${fillAlpha})`
    : undefined;

  return (
    <div
      data-panel-idx={idx}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelectPanel(idx);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onSelectPanel(idx);
      }}
      onClick={(e) => {
        if (
          dragAction !== null ||
          Date.now() - (lastDragEndTimeRef.current ?? 0) < 250
        )
          return;
        e.stopPropagation();
        onSelectPanel(idx);
      }}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        backgroundColor: bgFillStyle,
        boxShadow: isSelected && showPanelBoxes ? activeTheme.glowShadow : undefined,
      }}
      className={`absolute pointer-events-auto transition-[border-color,box-shadow,background-color] select-none ${
        showPanelBoxes
          ? isSelected
            ? `border-2 ${borderClass} ${activeTheme.borderActive} ring-2 ${activeTheme.ring} z-20`
            : `border-2 ${borderClass} ${activeTheme.borderInactive} hover:${activeTheme.borderActive} z-10`
          : isSelected
          ? `border-2 border-dashed ${activeTheme.borderActive} z-20`
          : "z-10"
      }`}
    >
      {/* Rule of Thirds (3×3 Composition Grid) */}
      {showRuleOfThirds && isSelected && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-35">
          <div className="border-r border-b border-dashed border-white/70" />
          <div className="border-r border-b border-dashed border-white/70" />
          <div className="border-b border-dashed border-white/70" />
          <div className="border-r border-b border-dashed border-white/70" />
          <div className="border-r border-b border-dashed border-white/70" />
          <div className="border-b border-dashed border-white/70" />
          <div className="border-r border-dashed border-white/70" />
          <div className="border-r border-dashed border-white/70" />
          <div />
        </div>
      )}

      {/* Selected Floating Quick Actions Toolbar */}
      {isSelected && showQuickToolbar && !isBeingMoved && !isBeingResized && (
        <div
          className={`absolute left-2 top-2 z-40 flex items-center gap-1 px-2 py-1 rounded-xl bg-neutral-950/95 border ${
            activeTheme.borderActive
          }/90 shadow-2xl backdrop-blur-md transition-all duration-150 pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {showPanelBadges && (
            <span
              className={`text-[10px] font-mono font-bold ${activeTheme.text} px-1 select-none`}
            >
              #{idx + 1}
            </span>
          )}

          {/* Move Handle Pill in Toolbar */}
          {showMoveBadges && (
            <div
              onMouseDown={(e) => handleBoxMoveStart(idx, e)}
              onTouchStart={(e) => handleBoxMoveStart(idx, e)}
              style={{ touchAction: "none" }}
              className={`p-1 rounded-lg ${activeTheme.badgeBg} hover:opacity-90 ${activeTheme.text} flex items-center justify-center border ${activeTheme.borderInactive} !cursor-move active:!cursor-grabbing transition-colors shadow-sm`}
              title="Drag to move panel anywhere"
            >
              <Move className="h-3 w-3 pointer-events-none" />
            </div>
          )}

          {/* Nudge Controls */}
          {onNudgePanel && (
            <div className="flex items-center gap-0.5 border-l border-r border-neutral-800 px-0.5">
              <button
                type="button"
                onClick={() => onNudgePanel(idx, -5)}
                className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-90`}
                title="Nudge Up 5px (↑)"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onNudgePanel(idx, 5)}
                className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-90`}
                title="Nudge Down 5px (↓)"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Duplicate Panel Button */}
          {onDuplicatePanel && (
            <button
              type="button"
              onClick={() => onDuplicatePanel(idx)}
              className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-95`}
              title="Duplicate Panel (D)"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}

          {/* Snap to Full Width */}
          {onSnapToFullWidth && (
            <button
              type="button"
              onClick={() => onSnapToFullWidth(idx)}
              className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-95`}
              title="Snap to Full Width (F)"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}

          {/* Merge with Below Panel */}
          {idx < boxesCount - 1 && onMergeWithNext && (
            <button
              type="button"
              onClick={() => onMergeWithNext(idx)}
              className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-95`}
              title="Merge with below"
            >
              <Layers className="h-3 w-3" />
            </button>
          )}

          {/* Split in Half */}
          {onSplitPanel && (
            <button
              type="button"
              onClick={() => onSplitPanel(idx)}
              className={`p-1 rounded-md hover:bg-neutral-800 text-neutral-300 hover:${activeTheme.text} transition-colors !cursor-pointer active:scale-95`}
              title="Split in half (S)"
            >
              <Split className="h-3 w-3" />
            </button>
          )}

          {/* Delete Panel */}
          {onDeletePanel && boxesCount > 1 && (
            <button
              type="button"
              onClick={() => onDeletePanel(idx)}
              className="p-1 rounded-md hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition-colors !cursor-pointer active:scale-90"
              title="Delete Panel (Del)"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Header: Panel Number Badge, Move Drag Handle & Dimension Tag */}
      <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between z-30 pointer-events-auto gap-1">
        <div className="flex items-center gap-1">
          {showPanelBadges && !isSelected && (
            <span
              className={`px-1.5 py-0.5 rounded bg-neutral-950/90 text-[10px] font-mono font-bold ${activeTheme.text} border ${activeTheme.borderInactive} shadow-md select-none`}
            >
              #{idx + 1}
            </span>
          )}

          {/* 4-Way Full Move Button / Drag Handle (only when unselected) */}
          {showMoveBadges && !isSelected && (
            <div
              onMouseDown={(e) => handleBoxMoveStart(idx, e)}
              onTouchStart={(e) => handleBoxMoveStart(idx, e)}
              style={{ touchAction: "none" }}
              className={`p-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all !cursor-move active:!cursor-grabbing select-none shadow-md ${
                isBeingMoved
                  ? `${activeTheme.handleBg} text-black border-white ring-2 ${activeTheme.ring}/50 scale-105`
                  : `bg-neutral-900/95 ${activeTheme.text} border-neutral-700 hover:bg-neutral-800`
              }`}
              title="Click and drag to move panel anywhere"
            >
              <Move className="h-3 w-3 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Dimension & Coordinates Display */}
        {showDimensionTags && (
          <div className="flex items-center gap-1">
            {(isBeingMoved || isBeingResized) && (
              <span
                className={`px-1.5 py-0.5 rounded bg-black/95 text-[9px] font-mono font-bold ${activeTheme.text} border ${activeTheme.borderActive}/60 shadow-md`}
              >
                X:{curX} Y:{curY}
              </span>
            )}
            {curH > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono text-neutral-300 border border-neutral-700 shadow-sm">
                {curW}×{curH}px {ratio ? `· ${ratio}:1` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interior Draggable Move Zone */}
      <div
        onMouseDown={(e) => handleBoxMoveStart(idx, e)}
        onTouchStart={(e) => handleBoxMoveStart(idx, e)}
        style={{ touchAction: "none" }}
        className="absolute inset-4 sm:inset-6 !cursor-move active:!cursor-grabbing z-10"
        title="Drag anywhere inside to move panel"
      />

      {/* ── 4-SIDED EDGE RESIZE HANDLES (With Expanded Touch Hitboxes) ── */}
      {showEdgeHandles && (
        <>
          {/* Top Edge */}
          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "n", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "n", e)}
            style={{ touchAction: "none" }}
            className="absolute -top-4 inset-x-6 h-8 sm:h-6 !cursor-ns-resize z-30 flex items-center justify-center group/h-top pointer-events-auto"
            title="Drag to resize top edge"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-24 h-2 rounded-full group-hover/h-top:h-2.5 group-hover/h-top:w-32 shadow-lg transition-all"
            />
          </div>

          {/* Bottom Edge */}
          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "s", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "s", e)}
            style={{ touchAction: "none" }}
            className="absolute -bottom-4 inset-x-6 h-8 sm:h-6 !cursor-ns-resize z-30 flex items-center justify-center group/h-bottom pointer-events-auto"
            title="Drag to resize bottom edge"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-24 h-2 rounded-full group-hover/h-bottom:h-2.5 group-hover/h-bottom:w-32 shadow-lg transition-all"
            />
          </div>

          {/* Left Edge */}
          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "w", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "w", e)}
            style={{ touchAction: "none" }}
            className="absolute -left-4 inset-y-6 w-8 sm:w-6 !cursor-ew-resize z-30 flex items-center justify-center group/h-left pointer-events-auto"
            title="Drag to resize left edge"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="h-24 w-2 rounded-full group-hover/h-left:w-2.5 group-hover/h-left:h-32 shadow-lg transition-all"
            />
          </div>

          {/* Right Edge */}
          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "e", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "e", e)}
            style={{ touchAction: "none" }}
            className="absolute -right-4 inset-y-6 w-8 sm:w-6 !cursor-ew-resize z-30 flex items-center justify-center group/h-right pointer-events-auto"
            title="Drag to resize right edge"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="h-24 w-2 rounded-full group-hover/h-right:w-2.5 group-hover/h-right:h-32 shadow-lg transition-all"
            />
          </div>
        </>
      )}

      {/* ── 4 CORNER RESIZE HANDLES (With Large Touch Targets) ── */}
      {showCornerHandles && (
        <>
          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "nw", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "nw", e)}
            style={{ touchAction: "none" }}
            className="absolute -top-4 -left-4 w-9 h-9 !cursor-nwse-resize z-40 flex items-center justify-center pointer-events-auto group/c-nw"
            title="Resize Top-Left"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-5 h-5 rounded-md border-2 border-white shadow-xl transition-transform group-hover/c-nw:scale-125"
            />
          </div>

          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "ne", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "ne", e)}
            style={{ touchAction: "none" }}
            className="absolute -top-4 -right-4 w-9 h-9 !cursor-nesw-resize z-40 flex items-center justify-center pointer-events-auto group/c-ne"
            title="Resize Top-Right"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-5 h-5 rounded-md border-2 border-white shadow-xl transition-transform group-hover/c-ne:scale-125"
            />
          </div>

          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "sw", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "sw", e)}
            style={{ touchAction: "none" }}
            className="absolute -bottom-4 -left-4 w-9 h-9 !cursor-nesw-resize z-40 flex items-center justify-center pointer-events-auto group/c-sw"
            title="Resize Bottom-Left"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-5 h-5 rounded-md border-2 border-white shadow-xl transition-transform group-hover/c-sw:scale-125"
            />
          </div>

          <div
            onMouseDown={(e) => handleBoxResizeStart(idx, "se", e)}
            onTouchStart={(e) => handleBoxResizeStart(idx, "se", e)}
            style={{ touchAction: "none" }}
            className="absolute -bottom-4 -right-4 w-9 h-9 !cursor-nwse-resize z-40 flex items-center justify-center pointer-events-auto group/c-se"
            title="Resize Bottom-Right"
          >
            <div
              style={{ backgroundColor: activeTheme.hex }}
              className="w-5 h-5 rounded-md border-2 border-white shadow-xl transition-transform group-hover/c-se:scale-125"
            />
          </div>
        </>
      )}
    </div>
  );
};
