import React from "react";
import { Music, Sparkles, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface TimelineBottomBarProps {
  currentPanelIndex: number;
  /** Actual accumulated time (seconds) for the current panel */
  currentTimeSecs?: number;
  totalDuration: number;
  snapEnabled: boolean;
  soloTrack: string | null;
  pacingScore?: string;
  onOpenMediaPicker: () => void;
  /** Ref to the scroll container so scroll buttons can control it */
  scrollRef?: React.RefObject<HTMLDivElement>;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}

function formatTime(secs: number): string {
  if (secs < 0) secs = 0;
  const hours = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (hours > 0) {
    return `${hours}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SCROLL_STEP = 300;

const TimelineBottomBar: React.FC<TimelineBottomBarProps> = ({
  currentPanelIndex,
  currentTimeSecs,
  totalDuration,
  snapEnabled,
  soloTrack,
  pacingScore,
  onOpenMediaPicker,
  scrollRef,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const handleScrollLeft = () => {
    scrollRef?.current?.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
  };
  const handleScrollRight = () => {
    scrollRef?.current?.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
  };

  return (
    <div className="h-8 px-3 border-t border-white/[0.05] bg-[#0d0d12] flex items-center justify-between shrink-0 gap-2">
      {/* Add audio */}
      <div className="flex items-center gap-2 min-w-0">
        <Tooltip text="Add audio track or sound effect" placement="top">
          <button
            onClick={onOpenMediaPicker}
            aria-label="Add audio track"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/15 border border-white/8 hover:border-purple-500/40 text-neutral-400 hover:text-purple-200 transition-all cursor-pointer text-[11px] font-medium shrink-0"
          >
            <Music className="h-3 w-3" />
            <span>Add media / audio</span>
          </button>
        </Tooltip>

        <div className="flex items-center gap-1 text-[9px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0">
          <Sparkles className="h-2.5 w-2.5" />
          <span>Pacing: {pacingScore}</span>
        </div>
      </div>

      {/* Timecode (center) */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 shrink-0">
        {soloTrack && (
          <span className="text-amber-400/70 font-bold">SOLO: {soloTrack}</span>
        )}
        <span className="text-neutral-300 font-bold">
          {formatTime(currentTimeSecs ?? 0)}
        </span>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-400">{formatTime(totalDuration)}</span>
      </div>

      {/* Right side: Scroll buttons + Snap indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-mono ${snapEnabled ? "text-purple-400/70" : "text-neutral-600"}`}>
          Snap {snapEnabled ? "ON" : "OFF"}
        </span>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <Tooltip text="Zoom Out (-)" placement="top">
            <button
              onClick={onZoomOut}
              aria-label="Zoom Out"
              className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-90"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
          </Tooltip>
          {zoomLevel !== undefined && (
            <button
              onClick={onZoomReset}
              title="Reset Zoom (30px/s)"
              className="px-1.5 py-0.5 rounded text-[9px] font-mono text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {Math.round((zoomLevel / 30) * 100)}%
            </button>
          )}
          <Tooltip text="Zoom In (+)" placement="top">
            <button
              onClick={onZoomIn}
              aria-label="Zoom In"
              className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-90"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>

        {/* Left / Right Scroll Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Tooltip text="Scroll timeline left (◀)" placement="top">
            <button
              onClick={handleScrollLeft}
              aria-label="Scroll timeline left"
              className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-purple-600 border border-white/10 hover:border-purple-300 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-90 shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </Tooltip>
          <Tooltip text="Scroll timeline right (▶)" placement="top">
            <button
              onClick={handleScrollRight}
              aria-label="Scroll timeline right"
              className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-purple-600 border border-white/10 hover:border-purple-300 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-90 shadow-sm"
            >
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TimelineBottomBar);
