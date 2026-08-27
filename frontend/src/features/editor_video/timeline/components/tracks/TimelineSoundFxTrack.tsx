// ─── TimelineSoundFxTrack (A2 Sound FX Track) ─────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineSoundFxTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Zap, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";

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
  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    side: "left" | "right";
    delta: number;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    key: string,
    side: "left" | "right",
    currentDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingInfo({ key, side, delta: 0 });

    const startX = e.clientX;
    const initialDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      setResizingInfo({ key, side, delta: deltaSecs });
      onDurationChange?.(key, parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setResizingInfo(null);
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
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-cyan-300 italic px-2 hover:bg-cyan-950/20 rounded-md transition-colors cursor-pointer"
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
            const isResizing = resizingInfo?.key === key;
            const dur = panel.sfx_duration ?? timing.duration ?? 3.5;
            const clipWidthPx = dur * 30;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute top-0 bottom-0 rounded-md overflow-hidden cursor-pointer transition-all border select-none ${
                  isResizing
                    ? "ring-2 ring-cyan-300 border-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.8)] z-30 brightness-115"
                    : selectedClip === key
                    ? "ring-2 ring-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.4)] z-20"
                    : "border-cyan-600/50 hover:border-cyan-300/80"
                } bg-[#0e7490]`}
                style={{
                  left:
                    timing.startPx !== undefined
                      ? `${timing.startPx}px`
                      : `${timing.startPct}%`,
                  width: `${Math.max(24, clipWidthPx - 3)}px`,
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

                  <div className="flex items-center gap-1 z-20 pointer-events-auto">
                    {isResizing && resizingInfo.delta !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-cyan-200 bg-cyan-950 px-1 py-0.2 rounded-sm border border-cyan-400/50 animate-pulse">
                        {resizingInfo.delta > 0 ? `+${resizingInfo.delta.toFixed(1)}s` : `${resizingInfo.delta.toFixed(1)}s`}
                      </span>
                    )}
                    <span className="text-[8px] font-mono font-bold text-cyan-100 bg-black/50 px-1 py-0.2 rounded-sm border border-white/10 shrink-0">
                      {dur.toFixed(1)}s
                    </span>

                    {/* Prominent Three-Dots Action Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="h-4 px-1 flex items-center justify-center rounded bg-black/70 hover:bg-cyan-600 text-neutral-200 hover:text-white border border-white/20 hover:border-cyan-400 shadow-sm transition-all cursor-pointer"
                      title="Sound FX Options"
                    >
                      <span className="font-bold text-[10px] tracking-widest leading-none px-0.5">···</span>
                    </button>
                  </div>
                </div>

                {/* Dual Left & Right Drag-to-Resize Handles */}
                <ClipTrimHandles
                  clipKey={key}
                  duration={dur}
                  isResizing={isResizing}
                  activeSide={isResizing ? resizingInfo.side : null}
                  onResizeStart={(e, side, d) => handleResizeStart(e, key, side, d)}
                  accentColor="cyan"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddSfx}
          className="w-full h-8 rounded-md border border-cyan-500/30 hover:border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(103,232,249,0.35)] select-none group/add"
          title="Add Sound FX"
        >
          <Zap className="h-3 w-3 text-cyan-400 group-hover/add:scale-110 transition-transform" />
          <span>Add SFX</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineSoundFxTrack);
