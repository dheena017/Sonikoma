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
import RepoRefChip from "./RepoRefChip";

interface TimelineToolbarProps {
  currentPanelIndex: number;
  totalPanels: number;
  snapEnabled: boolean;
  captionsVisible: boolean;
  keyframesVisible: boolean;
  selectedDuration: number | null;
  selectedClip: string | null;
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
  <button title={title} onClick={onClick} className={className}>
    {children}
  </button>
);

const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  currentPanelIndex,
  totalPanels,
  snapEnabled,
  captionsVisible,
  keyframesVisible,
  selectedDuration,
  selectedClip,
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
  const progressPercent =
    totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-10 px-3 border-b border-white/[0.05] flex items-center justify-between bg-[#0d0d12] shrink-0 relative">
      {/* ── Left: action buttons ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        {/* Undo / Redo */}
        <ToolBtn
          title="Undo"
          className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          title="Redo"
          className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* Captions toggle */}
        <button
          title="Captions (CC)"
          onClick={onToggleCaptions}
          className={`px-1.5 py-1 rounded transition-colors cursor-pointer border text-[10px] font-black tracking-tight ${
            captionsVisible
              ? "text-white bg-purple-500/20 border-purple-500/50"
              : "text-neutral-500 border-white/10 hover:text-white"
          }`}
        >
          CC
        </button>

        {/* Keyframe Sub-rows toggle */}
        <button
          title="Toggle Keyframe Sub-rows (K)"
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
          title="Split (S)"
          onClick={onSplit}
          className="p-1.5 ml-0.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors cursor-pointer border border-purple-500/20 hover:border-purple-400"
        >
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Delete */}
        <ToolBtn
          title="Delete"
          onClick={onDelete}
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Duplicate */}
        <ToolBtn
          title="Duplicate"
          onClick={onDuplicate}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
        >
          <CopyPlus className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* Snap */}
        <button
          title="Snap"
          onClick={onToggleSnap}
          className={`p-1.5 rounded transition-colors cursor-pointer border ${
            snapEnabled
              ? "text-purple-300 bg-purple-500/15 border-purple-500/40"
              : "text-neutral-600 border-white/10 hover:text-white"
          }`}
        >
          <Magnet className="h-3.5 w-3.5" />
        </button>

        {/* Fit view */}
        <ToolBtn
          title="Fit View"
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* ── Centre: panel info + repo ref ────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
          <span>
            Panel{" "}
            <span className="text-purple-300 font-bold">
              {currentPanelIndex + 1}
            </span>{" "}
            / {totalPanels}
          </span>
          <ChevronRight className="h-3 w-3" />
          {snapEnabled && (
            <span className="text-amber-400/80 font-bold text-[9px] tracking-wide">
              SNAP
            </span>
          )}
          {selectedDuration != null && selectedDuration > 0 && (
            <span className="ml-1 text-white font-bold bg-white/8 px-2 py-0.5 rounded border border-white/10">
              {selectedDuration.toFixed(1)}s
            </span>
          )}
          <button
            title={isPlaying ? "Pause" : "Play"}
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

        <RepoRefChip gitHash="main@a3f9c1" cacheAge="2m ago" />
      </div>

      {/* ── Progress Bar aligned to timeline track ─────────────────────────── */}
      <div className="absolute bottom-0 left-28 right-0 h-1 bg-black/30">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-500 transition-all duration-75 ease-out"
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
