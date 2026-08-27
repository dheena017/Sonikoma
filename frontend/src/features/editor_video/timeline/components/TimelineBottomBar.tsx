// ─── TimelineBottomBar ────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineBottomBar.tsx

import React from "react";
import { Music, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

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
        <button
          onClick={onOpenMediaPicker}
          title="Add audio track"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/15 border border-white/8 hover:border-purple-500/40 text-neutral-400 hover:text-purple-200 transition-all cursor-pointer text-[11px] font-medium shrink-0"
        >
          <Music className="h-3 w-3" />
          <span>Add media / audio</span>
        </button>

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

        {/* Left / Right Scroll Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleScrollLeft}
            title="Scroll timeline left"
            className="h-5 w-5 flex items-center justify-center rounded bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 text-neutral-500 hover:text-purple-200 transition-all cursor-pointer active:scale-90"
          >
            <ChevronLeft className="h-3 w-3 stroke-[2.5]" />
          </button>
          <button
            onClick={handleScrollRight}
            title="Scroll timeline right"
            className="h-5 w-5 flex items-center justify-center rounded bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 text-neutral-500 hover:text-purple-200 transition-all cursor-pointer active:scale-90"
          >
            <ChevronRight className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TimelineBottomBar);
