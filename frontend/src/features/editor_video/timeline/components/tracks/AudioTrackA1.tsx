// ─── AudioTrackA1 (Music) ─────────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/AudioTrackA1.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { WAVEFORM } from "../../types";

interface AudioTrackA1Props {
  musicTheme: string;
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

const AudioTrackA1: React.FC<AudioTrackA1Props> = ({
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
}) => (
  <div
    className={`h-10 border-b border-white/[0.04] flex items-center ${
      muted ? "opacity-40" : ""
    }`}
  >
    <TrackLabel
      id="A1"
      label="Music"
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
      <div
        onClick={() => onClipClick("a1-0", 0)}
        onContextMenu={(e) => onContextMenu(e, "a1-0", 0)}
        className={`absolute inset-y-0 rounded-lg overflow-hidden cursor-pointer transition-all border ${
          selectedClip === "a1-0"
            ? "border-emerald-400 ring-1 ring-emerald-400/30"
            : "border-emerald-600/40 hover:border-emerald-400/70"
        }`}
        style={{
          left: "0%",
          right: "2%",
          background:
            "linear-gradient(90deg, #064e3b 0%, #065f46 50%, #047857 100%)",
        }}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-[1.5px] px-2 opacity-60 pointer-events-none">
          {WAVEFORM.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-emerald-400 rounded-full"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        {/* Label + duration */}
        <div className="relative z-10 h-full flex items-center px-2 gap-2">
          <span className="text-emerald-200 text-[10px] font-semibold truncate">
            {musicTheme}
          </span>
          <span className="ml-auto text-[8px] font-mono text-emerald-400/60 shrink-0">
            {totalDuration.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(AudioTrackA1);
