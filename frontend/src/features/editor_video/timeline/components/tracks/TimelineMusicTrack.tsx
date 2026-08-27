// ─── TimelineMusicTrack (A1 Music / BGM Track) ────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineMusicTrack.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Music } from "lucide-react";
import { WAVEFORM } from "../../types";

export interface TimelineMusicTrackProps {
  musicTheme?: string;
  totalDuration: number;
  selectedClip: string | null;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
}

export const TimelineMusicTrack: React.FC<TimelineMusicTrackProps> = ({
  musicTheme,
  totalDuration,
  selectedClip,
  muted,
  locked,
  hidden,
  onToggleMute,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
}) => {
  const hasMusic =
    !!musicTheme && musicTheme !== "none" && musicTheme !== "No Music";

  return (
    <div
      className={`h-10 border-b border-white/[0.04] flex items-center ${
        muted ? "opacity-40" : ""
      }`}
    >
      <TrackLabel
        id="A1"
        label="Music (BGM)"
        color="text-emerald-400"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
      />
      <div className="flex-1 relative h-8 mx-1">
        {hasMusic ? (
          <div
            onClick={() => onClipClick("a1-0", 0)}
            onContextMenu={(e) => onContextMenu(e, "a1-0", 0)}
            className={`absolute inset-y-0 inset-x-0 rounded-lg overflow-hidden cursor-pointer transition-all border ${
              selectedClip === "a1-0"
                ? "border-emerald-400 ring-1 ring-emerald-400/40"
                : "border-emerald-600/40 hover:border-emerald-400/70"
            } bg-emerald-950/40`}
          >
            {/* Waveform Visualization Bars */}
            <div className="absolute inset-0 flex items-center gap-0.5 px-2 opacity-60">
              {WAVEFORM.slice(0, 48).map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-400/75 rounded-full transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Track Info Badge */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <Music className="h-3 w-3 text-emerald-300 shrink-0" />
                <span className="text-[9px] font-mono font-bold text-emerald-200 truncate">
                  {musicTheme}
                </span>
              </div>
              <span className="text-[8px] font-mono text-emerald-400/80 shrink-0">
                {totalDuration.toFixed(1)}s
              </span>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center text-[9px] font-mono text-neutral-600 italic px-2">
            No background music assigned
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineMusicTrack);
