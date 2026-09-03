// ─── TimelineToolbar ──────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineToolbar.tsx

import React from "react";
import {
  Undo,
  Redo,
  Trash2,
  CopyPlus,
  Diamond,
  Magnet,
  LayoutGrid,
  ChevronRight,
  SplitSquareHorizontal,
  Play,
  Pause,
} from "lucide-react";

import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { useAppShortcuts } from "@/shared/hooks/useAppShortcuts";

interface TimelineToolbarProps {
  currentPanelIndex: number;
  totalPanels: number;
  snapEnabled: boolean;
  captionsVisible: boolean;
  keyframesVisible: boolean;
  isPlaying?: boolean;
  playbackTime?: number;
  totalDuration?: number;
  onToggleSnap: () => void;
  onToggleCaptions: () => void;
  onToggleKeyframes: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPlay?: () => void;
}

/** Small reusable button used only within the toolbar. */
const ToolBtn: React.FC<{
  title: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ title, onClick, className = "", children }) => (
  <Tooltip text={title} placement="top">
    <button aria-label={title} onClick={onClick} className={className}>
      {children}
    </button>
  </Tooltip>
);

const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  currentPanelIndex,
  totalPanels,
  snapEnabled,
  captionsVisible,
  keyframesVisible,
  isPlaying = false,
  playbackTime = 0,
  totalDuration = 0,
  onToggleSnap,
  onToggleCaptions,
  onToggleKeyframes,
  onSplit,
  onDelete,
  onDuplicate,
  onPlay,
}) => {
  const { formatTooltip } = useAppShortcuts();
  const progressPercent =
    totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-10 px-3 border-b border-white/[0.05] flex items-center justify-between bg-[#0d0d12] shrink-0 relative">
      {/* ── Left: action buttons ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        {/* Undo / Redo */}
        <ToolBtn
          title={formatTooltip("Undo", "history_undo", "Ctrl+Z")}
          className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          title={formatTooltip("Redo", "history_redo", "Ctrl+Y")}
          className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* Captions toggle */}
        <button
          title={formatTooltip("Toggle Captions", "timeline_captions", "CC")}
          onClick={onToggleCaptions}
          className={`px-1.5 py-1 rounded transition-colors cursor-pointer border text-[10px] font-black tracking-tight ${
            captionsVisible
              ? "text-white bg-[#3B82F6]/20 border-[#3B82F6]/50"
              : "text-neutral-500 border-white/10 hover:text-white"
          }`}
        >
          CC
        </button>

        {/* Keyframe Sub-rows toggle */}
        <button
          title={formatTooltip("Toggle Keyframes", "timeline_keyframe", "K")}
          onClick={onToggleKeyframes}
          className={`p-1.5 rounded transition-colors cursor-pointer border ${
            keyframesVisible
              ? "text-amber-300 bg-amber-500/20 border-amber-500/50"
              : "text-neutral-500 border-white/10 hover:text-white"
          }`}
        >
          <Diamond className="h-3.5 w-3.5" />
        </button>

        {/* Split */}
        <ToolBtn
          title={formatTooltip("Split Clip", "timeline_split", "S")}
          onClick={onSplit}
          className="p-1.5 ml-0.5 text-[#3B82F6] hover:bg-[#3B82F6]/20 rounded transition-colors cursor-pointer border border-[#3B82F6]/20 hover:border-[#60A5FA]"
        >
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Delete */}
        <ToolBtn
          title={formatTooltip("Delete Selected Clip", "timeline_delete", "Del")}
          onClick={onDelete}
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Duplicate */}
        <ToolBtn
          title={formatTooltip("Duplicate Selected Clip", "timeline_duplicate", "Ctrl+D")}
          onClick={onDuplicate}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
        >
          <CopyPlus className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* Snap */}
        <button
          title={formatTooltip("Toggle Magnetic Snapping", "timeline_snap", "N")}
          onClick={onToggleSnap}
          className={`p-1.5 rounded transition-colors cursor-pointer border ${
            snapEnabled
              ? "text-[#60A5FA] bg-[#3B82F6]/15 border-[#3B82F6]/40"
              : "text-neutral-600 border-white/10 hover:text-white"
          }`}
        >
          <Magnet className="h-3.5 w-3.5" />
        </button>

        {/* Fit view */}
        <ToolBtn
          title={formatTooltip("Fit Timeline View", "timeline_fit_view", "Shift+Z")}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* ── Centre: panel info & controls ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
          <span>
            Panel{" "}
            <span className="text-[#60A5FA] font-bold">
              {totalPanels > 0 ? currentPanelIndex + 1 : 0}
            </span>{" "}
            / {totalPanels}
          </span>
          <ChevronRight className="h-3 w-3" />
          {snapEnabled && (
            <span className="text-amber-400/80 font-bold text-[9px] tracking-wide">
              SNAP
            </span>
          )}

          <button
            title={formatTooltip(
              isPlaying ? "Pause Playback" : "Start Playback",
              "playback_toggle",
              "Space"
            )}
            onClick={onPlay}
            className={`ml-0.5 p-1 rounded transition-colors cursor-pointer ${
              isPlaying
                ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                : "text-neutral-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* ── Progress Bar aligned to timeline track ─────────────────────────── */}
      <div className="absolute bottom-0 left-28 right-0 h-1 bg-black/30">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 transition-all duration-75 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Playback Time Display ─────────────────────────────────────────── */}
      {isPlaying && (
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-white/70 pointer-events-none">
          {formatTime(playbackTime)} / {formatTime(totalDuration)}
        </div>
      )}
    </div>
  );
};

export default React.memo(TimelineToolbar);
