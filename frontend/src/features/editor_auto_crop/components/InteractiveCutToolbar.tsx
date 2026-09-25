import React from "react";
import {
  Box,
  MousePointer,
  Plus,
  Sparkles,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  Compass,
  ZoomIn,
  ZoomOut,
  ArrowUpDown,
  HelpCircle,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as api from "@/api";
import { ToolMode, ThemeConfigItem } from "./InteractiveCutOverlay.types";

export interface InteractiveCutToolbarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  boxes: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  onSelectPanel: (idx: number) => void;
  onSelectPrevPanel: () => void;
  onSelectNextPanel: () => void;
  onQuickAddBoxAtEnd?: () => void;
  onApplyCrop?: () => void;
  isReCropping?: boolean;
  showCutLines?: boolean;
  onToggleCutLines?: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  showSettingsMenu: boolean;
  onToggleSettingsMenu: () => void;
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  onAutoEqualizeGutters?: () => void;
  onOpenShortcutsModal: () => void;
  onOpenBigScreen?: () => void;
  activeTheme: ThemeConfigItem;
}

export const InteractiveCutToolbar: React.FC<InteractiveCutToolbarProps> = ({
  toolMode,
  setToolMode,
  boxes,
  selectedPanelIndex,
  onSelectPanel,
  onSelectPrevPanel,
  onSelectNextPanel,
  onQuickAddBoxAtEnd,
  onApplyCrop,
  isReCropping,
  showCutLines = true,
  onToggleCutLines,
  showMinimap,
  onToggleMinimap,
  showSettingsMenu,
  onToggleSettingsMenu,
  zoomScale,
  setZoomScale,
  onAutoEqualizeGutters,
  onOpenShortcutsModal,
  onOpenBigScreen,
  activeTheme,
}) => {
  return (
    <div className="shrink-0 w-full mb-2 p-1.5 sm:p-2 bg-neutral-950/98 border border-neutral-800/90 rounded-2xl flex items-center justify-between gap-2 flex-wrap text-xs shadow-xl z-30 backdrop-blur-xl">
      {/* Left: Mode Segmented Pill */}
      <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800/80 shadow-inner">
        <button
          type="button"
          onClick={() => setToolMode("box")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all !cursor-pointer ${
            toolMode === "box"
              ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
          }`}
          title="Draw rectangle or click to add a panel bounding box"
        >
          <Box className="h-3.5 w-3.5" />
          <span>Add Box</span>
        </button>

        <button
          type="button"
          onClick={() => setToolMode("select")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all !cursor-pointer ${
            toolMode === "select"
              ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
          }`}
          title="Select, move, and 4-side resize panels"
        >
          <MousePointer className="h-3.5 w-3.5" />
          <span>Select</span>
        </button>
      </div>

      {/* Center: Action Buttons (+ Box, Re-Slice, Panel Jumper) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Panel Jumper: Prev, # Indicator, Next */}
        {boxes.length > 0 && (
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs shadow-inner">
            <button
              type="button"
              onClick={onSelectPrevPanel}
              className="p-1 sm:px-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors !cursor-pointer"
              title="Previous Panel (K or ↑)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const targetNum = prompt(
                  `Jump to panel number (1 - ${boxes.length}):`,
                  `${(selectedPanelIndex ?? 0) + 1}`
                );
                if (targetNum) {
                  const num = parseInt(targetNum.trim(), 10);
                  if (!isNaN(num) && num >= 1 && num <= boxes.length) {
                    onSelectPanel(num - 1);
                  }
                }
              }}
              className="px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300 hover:bg-neutral-800 rounded-md transition-colors !cursor-pointer flex items-center gap-1"
              title="Click to jump directly to a panel number"
            >
              <span>
                #
                {selectedPanelIndex !== null && selectedPanelIndex >= 0
                  ? selectedPanelIndex + 1
                  : "—"}
              </span>
              <span className="text-neutral-500 font-normal">
                /{boxes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={onSelectNextPanel}
              className="p-1 sm:px-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors !cursor-pointer"
              title="Next Panel (J or ↓)"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {onQuickAddBoxAtEnd && (
          <button
            type="button"
            onClick={onQuickAddBoxAtEnd}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all !cursor-pointer active:scale-95 shadow-sm"
            title="Add a new panel box at bottom"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Box</span>
          </button>
        )}

        {onApplyCrop && (
          <button
            type="button"
            onClick={onApplyCrop}
            disabled={isReCropping}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all !cursor-pointer shadow-md active:scale-95 ${
              isReCropping
                ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed"
                : "bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40"
            }`}
            title="Re-slice panel thumbnails with current box positions"
          >
            {isReCropping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Slicing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Re-Slice</span>
              </>
            )}
          </button>
        )}

        {/* View Toggles: Boxes Overlay */}
        {onToggleCutLines && (
          <button
            type="button"
            onClick={onToggleCutLines}
            className={`p-2 rounded-xl text-xs border transition-colors flex items-center justify-center !cursor-pointer ${
              showCutLines
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
            }`}
            title={showCutLines ? "Hide Panel Boxes" : "Show Panel Boxes"}
          >
            {showCutLines ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Minimap Toggle */}
        <button
          type="button"
          onClick={onToggleMinimap}
          className={`p-2 rounded-xl text-xs border transition-colors flex items-center justify-center !cursor-pointer ${
            showMinimap
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
          }`}
          title="Toggle Strip Minimap Radar (M)"
        >
          <Compass className="h-3.5 w-3.5" />
        </button>

        {/* Customization Settings Menu Trigger */}
        <button
          type="button"
          onClick={onToggleSettingsMenu}
          className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all !cursor-pointer shadow-sm ${
            showSettingsMenu
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-emerald-500/20"
              : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-white"
          }`}
          title="Overlay Display Customization"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: Zoom Controls, Gutter Equalizer, Shortcuts & Big Screen */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() =>
              setZoomScale((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))
            }
            className="px-2 py-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors !cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(1.0)}
            className="px-2 py-1 text-emerald-400 font-bold hover:bg-neutral-800 rounded-lg transition-colors !cursor-pointer"
            title="Reset Zoom to 100% (0)"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            type="button"
            onClick={() =>
              setZoomScale((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)))
            }
            className="px-2 py-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors !cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Equalize Gutters Button */}
        {boxes.length > 1 && onAutoEqualizeGutters && (
          <button
            type="button"
            onClick={onAutoEqualizeGutters}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors !cursor-pointer shadow-sm"
            title="Auto-Equalize vertical gutters between panels"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Keyboard Shortcuts Help Button */}
        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors !cursor-pointer shadow-sm"
          title="Keyboard Shortcuts Cheat-sheet (?)"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>

        <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1 bg-neutral-900 rounded-xl border border-neutral-800">
          {boxes.length} Panels
        </span>

        {onOpenBigScreen && (
          <button
            type="button"
            onClick={onOpenBigScreen}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all shadow-sm active:scale-95 !cursor-pointer font-medium"
            title="Open full screen inspector"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Big Screen</span>
          </button>
        )}
      </div>
    </div>
  );
};
