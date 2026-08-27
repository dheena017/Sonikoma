// ─── TimelineMusicTrack (A1 Music / BGM Track) ────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineMusicTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Music, Plus } from "lucide-react";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";

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
  const [resizingSide, setResizingSide] = useState<"left" | "right" | null>(null);
  const [deltaSecs, setDeltaSecs] = useState<number>(0);

  const handleResizeStart = (
    e: React.MouseEvent,
    side: "left" | "right",
    initialDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingSide(side);
    setDeltaSecs(0);

    const startX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const delta = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(1, initialDuration + delta);
      setDeltaSecs(delta);
      onDurationChange?.("a1-0", parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setResizingSide(null);
      setDeltaSecs(0);
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
            className={`group absolute inset-y-0 inset-x-0 rounded-md overflow-hidden cursor-pointer transition-all border ${
              resizingSide !== null
                ? "border-emerald-300 ring-2 ring-emerald-400/80 shadow-[0_0_24px_rgba(52,211,153,0.8)] brightness-115"
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

              <div className="flex items-center gap-1 z-20 pointer-events-auto">
                {resizingSide !== null && deltaSecs !== 0 && (
                  <span className="text-[7px] font-mono font-bold text-emerald-200 bg-emerald-950 px-1 py-0.2 rounded-sm border border-emerald-400/50 animate-pulse">
                    {deltaSecs > 0 ? `+${deltaSecs.toFixed(1)}s` : `${deltaSecs.toFixed(1)}s`}
                  </span>
                )}
                <span className="text-[8px] font-mono text-emerald-100 bg-black/50 px-1 py-0.2 rounded-sm border border-white/10 shrink-0 font-bold">
                  {totalDuration.toFixed(1)}s
                </span>

                {/* Prominent Three-Dots Action Menu Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, "a1-0", 0);
                  }}
                  className="h-4 px-1 flex items-center justify-center rounded bg-black/70 hover:bg-emerald-600 text-neutral-200 hover:text-white border border-white/20 hover:border-emerald-400 shadow-sm transition-all cursor-pointer"
                  title="Music Options"
                >
                  <span className="font-bold text-[10px] tracking-widest leading-none px-0.5">···</span>
                </button>
              </div>
            </div>

            {/* Dual Left & Right Drag-to-Resize Handles */}
            <ClipTrimHandles
              clipKey="a1-0"
              duration={totalDuration}
              isResizing={resizingSide !== null}
              activeSide={resizingSide}
              onResizeStart={(e, side, d) => handleResizeStart(e, side, d)}
              accentColor="emerald"
            />
          </div>
        ) : (
          <div className="h-full flex items-center text-neutral-600 font-mono text-[9px] italic px-2">
            No background music added. Click "+ Add BGM" on the right.
          </div>
        )}
      </div>

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddMusic}
          className="w-full h-8 rounded-md border border-emerald-500/30 hover:border-emerald-400/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(52,211,153,0.35)] select-none group/add"
          title="Add Background Music"
        >
          <Music className="h-3 w-3 text-emerald-400 group-hover/add:scale-110 transition-transform" />
          <span>Add BGM</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineMusicTrack);
