import React from "react";
import { createPortal } from "react-dom";
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Palette,
  Check,
  Focus,
  Grid3X3,
  Magnet,
  Search,
  Layers,
} from "lucide-react";
import {
  ThemeColor,
  BorderStyle,
  THEME_CONFIG,
  ThemeConfigItem,
} from "./InteractiveCutOverlay.types";

export interface InteractiveCutSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  activeTheme: ThemeConfigItem;
  borderStyle: BorderStyle;
  setBorderStyle: (style: BorderStyle) => void;
  boxFillOpacity: number;
  setBoxFillOpacity: (opacity: number) => void;
  showRuleOfThirds: boolean;
  setShowRuleOfThirds: (val: boolean) => void;
  dimInactivePanels: boolean;
  setDimInactivePanels: (val: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (val: boolean) => void;
  showMagnifierLoupe: boolean;
  setShowMagnifierLoupe: (val: boolean) => void;
  loupeZoomPower: number;
  setLoupeZoomPower: (val: number) => void;
  showPanelBoxes: boolean;
  setShowPanelBoxes: (val: boolean) => void;
  showEdgeHandles: boolean;
  setShowEdgeHandles: (val: boolean) => void;
  showCornerHandles: boolean;
  setShowCornerHandles: (val: boolean) => void;
  showMoveBadges: boolean;
  setShowMoveBadges: (val: boolean) => void;
  showDimensionTags: boolean;
  setShowDimensionTags: (val: boolean) => void;
  showPanelBadges: boolean;
  setShowPanelBadges: (val: boolean) => void;
  showQuickToolbar: boolean;
  setShowQuickToolbar: (val: boolean) => void;
  applyPreset: (preset: "default" | "focus" | "clean") => void;
  setAllCustomizations: (state: boolean) => void;
}

export const InteractiveCutSettingsMenu: React.FC<
  InteractiveCutSettingsMenuProps
> = ({
  isOpen,
  onClose,
  themeColor,
  setThemeColor,
  activeTheme,
  borderStyle,
  setBorderStyle,
  boxFillOpacity,
  setBoxFillOpacity,
  showRuleOfThirds,
  setShowRuleOfThirds,
  dimInactivePanels,
  setDimInactivePanels,
  snapToGrid,
  setSnapToGrid,
  showMagnifierLoupe,
  setShowMagnifierLoupe,
  loupeZoomPower,
  setLoupeZoomPower,
  showPanelBoxes,
  setShowPanelBoxes,
  showEdgeHandles,
  setShowEdgeHandles,
  showCornerHandles,
  setShowCornerHandles,
  showMoveBadges,
  setShowMoveBadges,
  showDimensionTags,
  setShowDimensionTags,
  showPanelBadges,
  setShowPanelBadges,
  showQuickToolbar,
  setShowQuickToolbar,
  applyPreset,
  setAllCustomizations,
}) => {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl p-4 sm:p-5 bg-neutral-950/98 border border-neutral-700/90 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto scrollbar-thin text-xs text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs sm:text-sm">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span>Overlay Customization</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 !cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2-Column Main Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN: Presets, Theme, Borders, Guides */}
          <div className="space-y-3.5">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-semibold">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Quick Presets</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("default")}
                  className="py-1 px-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-[10px] font-medium text-neutral-200 transition-colors !cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("focus")}
                  className="py-1 px-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 text-[10px] font-medium text-neutral-200 transition-colors !cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Cinema</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("clean")}
                  className="py-1 px-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-violet-500/50 text-[10px] font-medium text-neutral-200 transition-colors !cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>Minimal</span>
                </button>
              </div>
            </div>

            {/* Accent Palette */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-semibold">
                  <Palette className="h-3 w-3 text-cyan-400" />
                  <span>Accent Color</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-300 font-semibold">
                  {activeTheme.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5 bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800">
                {(Object.keys(THEME_CONFIG) as ThemeColor[]).map((themeKey) => {
                  const t = THEME_CONFIG[themeKey];
                  const isCurrent = themeColor === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setThemeColor(themeKey)}
                      style={{ backgroundColor: t.hex }}
                      className={`w-6 h-6 rounded-lg transition-transform !cursor-pointer flex items-center justify-center shadow-md ${
                        isCurrent
                          ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-950"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      title={t.name}
                    >
                      {isCurrent && (
                        <Check className="h-3 w-3 text-black stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border Style & Fill Opacity */}
            <div className="space-y-2 pt-2 border-t border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Border Style
                </span>
                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                  {(["solid", "dashed", "dotted"] as BorderStyle[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setBorderStyle(st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors !cursor-pointer ${
                          borderStyle === st
                            ? "bg-neutral-800 text-white font-bold"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-400">Fill Opacity</span>
                  <span className="text-white font-bold">
                    {boxFillOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={boxFillOpacity}
                  onChange={(e) => setBoxFillOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-neutral-900 h-1.5 rounded-lg !cursor-pointer"
                />
              </div>
            </div>

            {/* Smart Guides */}
            <div className="space-y-1 pt-2 border-t border-neutral-900">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-semibold">
                <Focus className="h-3 w-3 text-emerald-400" />
                <span>Guides & Snapping</span>
              </span>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <div className="flex items-center gap-1.5">
                  <Grid3X3 className="h-3 w-3 text-cyan-400" />
                  <span className="text-neutral-300">Rule of Thirds (3×3)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showRuleOfThirds}
                  onChange={(e) => setShowRuleOfThirds(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <div className="flex items-center gap-1.5">
                  <Focus className="h-3 w-3 text-violet-400" />
                  <span className="text-neutral-300">
                    Dim Inactive (Cinema)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dimInactivePanels}
                  onChange={(e) => setDimInactivePanels(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <div className="flex items-center gap-1.5">
                  <Magnet className="h-3 w-3 text-amber-400" />
                  <span className="text-neutral-300">Magnetic Snap (10px)</span>
                </div>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN: Loupe Zoom & Element Visibility */}
          <div className="space-y-3.5">
            {/* Magnifier Loupe Zoom Power */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-neutral-200 font-medium">
                    Magnifier Lens
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showMagnifierLoupe}
                  onChange={(e) => setShowMagnifierLoupe(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </div>
              {showMagnifierLoupe && (
                <div className="flex items-center justify-between pt-1 pl-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Power
                  </span>
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                    {[1.5, 2.0, 2.5, 3.0].map((zoom) => (
                      <button
                        key={zoom}
                        type="button"
                        onClick={() => setLoupeZoomPower(zoom)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors !cursor-pointer ${
                          loupeZoomPower === zoom
                            ? "bg-emerald-500 text-black font-bold"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {zoom}×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* UI Elements Checkboxes */}
            <div className="space-y-1 pt-2 border-t border-neutral-900">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-semibold">
                  <Layers className="h-3 w-3 text-neutral-400" />
                  <span>Element Visibility</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAllCustomizations(true)}
                    className="text-[9px] font-mono text-emerald-400 hover:underline !cursor-pointer font-bold"
                  >
                    All
                  </button>
                  <span className="text-neutral-700">·</span>
                  <button
                    type="button"
                    onClick={() => setAllCustomizations(false)}
                    className="text-[9px] font-mono text-neutral-500 hover:text-rose-400 !cursor-pointer font-bold"
                  >
                    None
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">Panel Boxes & Borders</span>
                <input
                  type="checkbox"
                  checked={showPanelBoxes}
                  onChange={(e) => setShowPanelBoxes(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">4-Side Edge Handles</span>
                <input
                  type="checkbox"
                  checked={showEdgeHandles}
                  onChange={(e) => setShowEdgeHandles(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">4 Corner Handles</span>
                <input
                  type="checkbox"
                  checked={showCornerHandles}
                  onChange={(e) => setShowCornerHandles(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">Move Drag Handles</span>
                <input
                  type="checkbox"
                  checked={showMoveBadges}
                  onChange={(e) => setShowMoveBadges(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">Dimensions & Ratio</span>
                <input
                  type="checkbox"
                  checked={showDimensionTags}
                  onChange={(e) => setShowDimensionTags(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">Panel # Badges</span>
                <input
                  type="checkbox"
                  checked={showPanelBadges}
                  onChange={(e) => setShowPanelBadges(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                <span className="text-neutral-300">
                  Floating Action Toolbar
                </span>
                <input
                  type="checkbox"
                  checked={showQuickToolbar}
                  onChange={(e) => setShowQuickToolbar(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => applyPreset("default")}
            className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer text-xs font-mono"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all !cursor-pointer text-xs shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
