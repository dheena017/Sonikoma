// ─── TimelineBottomBar ────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineBottomBar.tsx

import React from "react";
import { Music, Sparkles } from "lucide-react";
import { DEFAULT_PANEL_DURATION } from "../types";

interface TimelineBottomBarProps {
  currentPanelIndex: number;
  totalDuration: number;
  snapEnabled: boolean;
  soloTrack: string | null;
  pacingScore?: string;
  onOpenMediaPicker: () => void;
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

const TimelineBottomBar: React.FC<TimelineBottomBarProps> = ({
  currentPanelIndex,
  totalDuration,
  snapEnabled,
  soloTrack,
  pacingScore = "Balanced (2.1s avg)",
  onOpenMediaPicker,
}) => (
  <div className="h-8 px-3 border-t border-white/[0.05] bg-[#0d0d12] flex items-center justify-between shrink-0">
    {/* Add audio */}
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenMediaPicker}
        title="Add audio track"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/15 border border-white/8 hover:border-purple-500/40 text-neutral-400 hover:text-purple-200 transition-all cursor-pointer text-[11px] font-medium"
      >
        <Music className="h-3 w-3" />
        <span>Add media / audio</span>
      </button>

      <div className="flex items-center gap-1 text-[9px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
        <Sparkles className="h-2.5 w-2.5" />
        <span>Pacing: {pacingScore}</span>
      </div>
    </div>

    {/* Timecode */}
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
      {soloTrack && (
        <span className="text-amber-400/70 font-bold">SOLO: {soloTrack}</span>
      )}
      <span className="text-neutral-300 font-bold">
        {formatTime(totalDuration > 0 ? currentPanelIndex * DEFAULT_PANEL_DURATION : 0)}
      </span>
      <span className="text-neutral-700">/</span>
      <span className="text-neutral-400">{formatTime(totalDuration)}</span>
    </div>

    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-600">
      <span className={snapEnabled ? "text-purple-400/70" : "text-neutral-500"}>
        Snap {snapEnabled ? "ON" : "OFF"}
      </span>
    </div>
  </div>
);

export default React.memo(TimelineBottomBar);
