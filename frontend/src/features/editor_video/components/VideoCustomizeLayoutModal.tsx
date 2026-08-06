import React, { useState, useEffect } from "react";
import { X, RotateCcw, Check, LayoutGrid } from "lucide-react";

// ─── Layout Config Types ─────────────────────────────────────────────────────

export interface VideoLayoutConfig {
  leftSidebar: boolean;
  rightInspector: boolean;
  timeline: boolean;
  mediaBin: boolean;
  previewCanvas: boolean;
  timelinePosition: "bottom" | "top";
  inspectorPosition: "right" | "left";
}

export const defaultVideoLayoutConfig: VideoLayoutConfig = {
  leftSidebar: true,
  rightInspector: true,
  timeline: true,
  mediaBin: true,
  previewCanvas: true,
  timelinePosition: "bottom",
  inspectorPosition: "right",
};

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "sonikoma_video_editor_layout_config";

export function loadVideoLayoutConfig(): VideoLayoutConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultVideoLayoutConfig, ...JSON.parse(saved) };
    }
  } catch {
    // silent
  }
  return defaultVideoLayoutConfig;
}

export function saveVideoLayoutConfig(config: VideoLayoutConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // silent
  }
}

// ─── Component Props ─────────────────────────────────────────────────────────

interface VideoCustomizeLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: VideoLayoutConfig;
  onConfigChange?: (config: VideoLayoutConfig) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const VideoCustomizeLayoutModal: React.FC<VideoCustomizeLayoutModalProps> = ({
  isOpen,
  onClose,
  config: externalConfig,
  onConfigChange,
}) => {
  const [localConfig, setLocalConfig] = useState<VideoLayoutConfig>(() => {
    return externalConfig || loadVideoLayoutConfig();
  });

  useEffect(() => {
    if (externalConfig) {
      setLocalConfig(externalConfig);
    }
  }, [externalConfig]);

  if (!isOpen) return null;

  const updateConfig = (updater: (prev: VideoLayoutConfig) => VideoLayoutConfig) => {
    const next = updater(localConfig);
    setLocalConfig(next);
    saveVideoLayoutConfig(next);
    onConfigChange?.(next);
  };

  const handleReset = () => {
    setLocalConfig(defaultVideoLayoutConfig);
    saveVideoLayoutConfig(defaultVideoLayoutConfig);
    onConfigChange?.(defaultVideoLayoutConfig);
  };

  const toggleField = (field: keyof VideoLayoutConfig) => {
    if (typeof localConfig[field] === "boolean") {
      updateConfig((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const setTimelinePosition = (pos: "bottom" | "top") => {
    updateConfig((prev) => ({ ...prev, timelinePosition: pos }));
  };

  const setInspectorPosition = (pos: "right" | "left") => {
    updateConfig((prev) => ({ ...prev, inspectorPosition: pos }));
  };

  // ── Row helpers ──────────────────────────────────────────────────────────

  const PanelRow = ({
    field,
    label,
    shortcut,
    highlight,
  }: {
    field: keyof VideoLayoutConfig;
    label: string;
    shortcut?: string;
    highlight?: boolean;
  }) => (
    <div
      onClick={() => toggleField(field)}
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border border-transparent cursor-pointer transition-all group ${
        highlight
          ? "hover:bg-purple-600/15 hover:border-purple-500/30"
          : "hover:bg-neutral-800/60 hover:border-neutral-700/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!localConfig[field]}
          onChange={() => {}}
          className="w-4 h-4 rounded border-neutral-600 cursor-pointer accent-purple-600"
        />
        <span className="font-medium text-neutral-200 group-hover:text-white text-sm">
          {label}
        </span>
      </div>
      {shortcut && (
        <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
          {shortcut}
        </span>
      )}
      {highlight && !shortcut && (
        <span className="text-xs font-mono text-purple-400/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
          Visibility
        </span>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1e1e24] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 text-sm"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/70 bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-base text-white tracking-wide">
              Customize Video Editor Layout
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-1 max-h-[70vh] overflow-y-auto">

          {/* Panel visibility toggles */}
          <PanelRow field="previewCanvas" label="Preview Canvas" highlight />
          <PanelRow field="leftSidebar"   label="Left Sidebar (Tools)"   shortcut="Ctrl + B" />
          <PanelRow field="mediaBin"       label="Media Bin"              shortcut="Ctrl + M" />
          <PanelRow field="rightInspector" label="Property Inspector"     shortcut="Ctrl + I" />
          <PanelRow field="timeline"       label="Multi-Track Timeline"   shortcut="Ctrl + J" />

          {/* Timeline Position */}
          <div className="pt-3 mt-3 border-t border-neutral-700/60 space-y-2">
            <p className="px-4 text-xs font-semibold text-purple-400 uppercase tracking-widest">
              Timeline Position
            </p>
            <div className="grid grid-cols-2 gap-2 px-2">
              {(["bottom", "top"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setTimelinePosition(pos)}
                  className={`flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                    localConfig.timelinePosition === pos
                      ? "bg-purple-600/20 border-purple-500/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{pos}</span>
                  {localConfig.timelinePosition === pos && (
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Inspector Position */}
          <div className="pt-3 mt-3 border-t border-neutral-700/60 space-y-2">
            <p className="px-4 text-xs font-semibold text-purple-400 uppercase tracking-widest">
              Property Inspector Position
            </p>
            <div className="grid grid-cols-2 gap-2 px-2">
              {(["right", "left"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setInspectorPosition(pos)}
                  className={`flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                    localConfig.inspectorPosition === pos
                      ? "bg-purple-600/20 border-purple-500/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{pos}</span>
                  {localConfig.inspectorPosition === pos && (
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-neutral-700/70 bg-[#18181c]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCustomizeLayoutModal;
