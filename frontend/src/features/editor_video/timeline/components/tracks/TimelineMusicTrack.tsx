// ─── TimelineMusicTrack (A1 Music / BGM Track) ────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineMusicTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Music, Plus } from "lucide-react";
import AudioWaveformVisual from "../AudioWaveformVisual";

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
  onDurationChange?: (key: string, duration: number) => void;
  onAddMusic?: () => void;
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
  onDurationChange,
  onAddMusic,
}) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = (e: React.MouseEvent, side: "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const initialDuration = totalDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 25 : -deltaX / 25;
      const nextDuration = Math.max(1, initialDuration + deltaSecs);
      onDurationChange?.("a1-0", parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const hasMusic =
    !!musicTheme && musicTheme !== "none" && musicTheme !== "No Music";

  return (
    <div
      className={`h-11 border-b border-white/[0.04] flex items-center ${
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
        onAdd={onAddMusic}
      />
      <div className="flex-1 relative h-9 mx-1">
        {hasMusic ? (
          <div
            onClick={() => onClipClick("a1-0", 0)}
            onContextMenu={(e) => onContextMenu(e, "a1-0", 0)}
            className={`group/music absolute inset-y-0 inset-x-0 rounded-2xl overflow-hidden cursor-pointer transition-all border ${
              isResizing
                ? "border-emerald-300 ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.7)] brightness-115"
                : selectedClip === "a1-0"
                ? "border-emerald-300 ring-2 ring-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                : "border-emerald-600/50 hover:border-emerald-300/80"
            } bg-[#064e3b]`}
          >
            {/* Continuous Waveform Envelope */}
            <div className="absolute inset-0 flex items-center px-1">
              <AudioWaveformVisual
                seed={`bgm-${musicTheme}`}
                color="#6ee7b7"
                opacity={0.9}
              />
            </div>

            {/* Track Info Badge */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 min-w-0">
                <Music className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
                <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">
                  {musicTheme}
                </span>
              </div>
              <span className="text-[8px] font-mono text-emerald-100 bg-black/50 px-1 py-0.2 rounded border border-white/10 shrink-0 font-bold">
                {totalDuration.toFixed(1)}s
              </span>
            </div>

            {/* Right Trim Handle */}
            <div
              onMouseDown={(e) => handleResizeStart(e, "right")}
              className="absolute top-0 bottom-0 right-0 w-2.5 z-30 cursor-ew-resize opacity-0 group-hover/music:opacity-100 flex items-center justify-center bg-white/30 hover:bg-white/60 rounded-r transition-opacity"
              title="Drag to trim music track"
            >
              <div className="w-[1.5px] h-3.5 bg-white rounded-full shadow" />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAddMusic}
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-emerald-300 italic px-2 hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add background music / audio soundtrack</span>
          </button>
        )}

        {/* Permanent Side-by-Side Add Music Button at Track End */}
        {hasMusic && (
          <button
            type="button"
            onClick={onAddMusic}
            className="absolute top-0 bottom-0 px-2 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer z-10 select-none text-[8px] font-mono font-bold shrink-0"
            style={{ left: `calc(100% + 4px)` }}
            title="Add background music"
          >
            <Plus className="h-2.5 w-2.5 text-emerald-400" />
            <span>+ Add BGM</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineMusicTrack);
