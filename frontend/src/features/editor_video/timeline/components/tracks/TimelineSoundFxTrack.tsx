// ─── TimelineSoundFxTrack (A2 Sound FX Track) ─────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineSoundFxTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Zap, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import AudioWaveformVisual from "../AudioWaveformVisual";

export interface TimelineSoundFxTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
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
  onAddSfx?: () => void;
}

export const TimelineSoundFxTrack: React.FC<TimelineSoundFxTrackProps> = ({
  panels = [],
  panelTimings = [],
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
  onAddSfx,
}) => {
  const [resizingKey, setResizingKey] = useState<string | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    key: string,
    side: "left" | "right",
    currentDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingKey(key);

    const startX = e.clientX;
    const initialDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 25 : -deltaX / 25;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      onDurationChange?.(key, parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setResizingKey(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const hasAnySfx = panels.some((p: any) => p.sfx || p.sfx_name || p.sound_fx);

  return (
    <div
      className={`h-11 border-b border-white/[0.04] flex items-center ${
        muted ? "opacity-40" : ""
      }`}
    >
      <TrackLabel
        id="A2"
        label="Sound FX"
        color="text-cyan-400"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onAdd={onAddSfx}
      />
      <div className="flex-1 relative h-9 mx-1">
        {!hasAnySfx ? (
          <button
            type="button"
            onClick={onAddSfx}
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-cyan-300 italic px-2 hover:bg-cyan-950/20 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add sound effect (SFX)</span>
          </button>
        ) : (
          panels.map((panel: any, idx: number) => {
            const sfx = panel.sfx || panel.sfx_name || panel.sound_fx;
            if (!sfx) return null;

            const timing: PanelTiming = panelTimings[idx] ?? {
              index: idx,
              duration: panel.duration || 3.5,
              startTime: 0,
              endTime: panel.duration || 3.5,
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
              startPx: 0,
              widthPx: (panel.duration || 3.5) * 30,
            };

            const key = `a2-${idx}`;
            const isResizing = resizingKey === key;
            const dur = timing.duration || 3.5;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group/clip absolute top-0 bottom-0 rounded-2xl overflow-hidden cursor-pointer transition-all border select-none ${
                  isResizing
                    ? "ring-2 ring-cyan-300 border-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.7)] z-30 brightness-115"
                    : selectedClip === key
                    ? "ring-2 ring-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.4)] z-20"
                    : "border-cyan-600/50 hover:border-cyan-300/80"
                } bg-[#0e7490]`}
                style={{
                  left:
                    timing.startPx !== undefined
                      ? `${timing.startPx}px`
                      : `${timing.startPct}%`,
                  width:
                    timing.widthPx !== undefined
                      ? `${Math.max(24, timing.widthPx - 3)}px`
                      : `calc(${timing.widthPct}% - 3px)`,
                }}
                title={`Panel #${idx + 1} SFX: ${sfx}`}
              >
                {/* Continuous Waveform Envelope */}
                <div className="absolute inset-0 flex items-center px-1">
                  <AudioWaveformVisual
                    audioUrl={
                      panel.sfx_audio_url ||
                      panel.sound_url ||
                      panel.sfx_url
                    }
                    seed={`sfx-${idx}-${sfx}`}
                    color="#67e8f9"
                    opacity={0.9}
                  />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-2.5 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <Zap className="h-3 w-3 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
                    <span className="truncate text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {sfx}
                    </span>
                  </div>

                  <span className="text-[8px] font-mono font-bold text-cyan-100 bg-black/50 px-1 py-0.2 rounded border border-white/10 shrink-0 ml-1">
                    {dur.toFixed(1)}s
                  </span>
                </div>

                {/* Left Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "left", dur)}
                  className="absolute top-0 bottom-0 left-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-cyan-400/40 hover:bg-cyan-300/90 rounded-l transition-opacity"
                  title="Drag to trim start"
                >
                  <div className="w-[1.5px] h-3.5 bg-white rounded-full shadow" />
                </div>

                {/* Right Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "right", dur)}
                  className="absolute top-0 bottom-0 right-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-cyan-400/40 hover:bg-cyan-300/90 rounded-r transition-opacity"
                  title="Drag to resize duration"
                >
                  <div className="w-[1.5px] h-3.5 bg-white rounded-full shadow" />
                </div>
              </div>
            );
          })
        )}

        {/* Permanent Side-by-Side Add SFX Button at Track End */}
        {hasAnySfx && (
          <button
            type="button"
            onClick={onAddSfx}
            className="absolute top-0 bottom-0 px-2 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer z-10 select-none text-[8px] font-mono font-bold shrink-0"
            style={{
              left:
                panelTimings.length > 0 &&
                panelTimings[panelTimings.length - 1].startPx !== undefined
                  ? `${
                      panelTimings[panelTimings.length - 1].startPx! +
                      panelTimings[panelTimings.length - 1].widthPx! +
                      6
                    }px`
                  : `calc(100% + 4px)`,
            }}
            title="Add sound effect"
          >
            <Plus className="h-2.5 w-2.5 text-cyan-400" />
            <span>+ Add SFX</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineSoundFxTrack);
