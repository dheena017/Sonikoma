// ─── TimelineSoundFxTrack (A2 Sound FX Track) ─────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineSoundFxTrack.tsx

import React, { useState, useMemo } from "react";
import TrackLabel from "../TrackLabel";
import { Zap, Plus, MoreHorizontal } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";
import { LANE_HEIGHT, assignLanes, trackInnerHeight } from "./timelineLanes";

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
    initialDuration: number;
    deltaSecs: number;
  } | null>(null);

  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});
  const [clipLanes, setClipLanes] = useState<Record<string, number>>({});
  const [movingInfo, setMovingInfo] = useState<{ key: string; idx: number; deltaPx: number } | null>(null);
  const movingInfoRef = React.useRef(movingInfo);
  React.useEffect(() => { movingInfoRef.current = movingInfo; }, [movingInfo]);

  const handleMoveStart = (
    e: React.MouseEvent,
    key: string,
    idx: number,
    baseLeftPx: number,
    widthPx: number
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const startX = e.clientX;
    let hasMoved = false;
    document.body.style.userSelect = "none";
    setMovingInfo({ key, idx, deltaPx: 0 });

    const onMouseMove = (mv: MouseEvent) => {
      const d = mv.clientX - startX;
      if (Math.abs(d) > 4) {
        hasMoved = true;
        document.body.style.cursor = "grabbing";
      }
      setMovingInfo({ key, idx, deltaPx: d });
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        onClipClick(key, idx);
      } else {
        const desiredLeft = baseLeftPx + (movingInfoRef.current?.deltaPx ?? 0);
        const newOffset = desiredLeft - baseLeftPx;
        const newOffsets = { ...clipOffsets, [key]: (clipOffsets[key] ?? 0) + newOffset };
        setClipOffsets(newOffsets);

        const allClips = panels.map((p: any, i: number) => {
          const sfx = p.sfx || p.sfx_name || p.sound_fx;
          if (!sfx) return null;
          const t: PanelTiming | undefined = panelTimings[i];
          const k = `a2-${i}`;
          const offset = newOffsets[k] ?? 0;
          const left = (t?.startPx !== undefined ? t.startPx : (t?.startTime ?? 0) * 30) + offset;
          const width = (p.sfx_duration ?? t?.duration ?? 1.5) * 30;
          return { key: k, left, width };
        }).filter((c): c is { key: string; left: number; width: number } => c !== null);
        setClipLanes(assignLanes(allClips));
      }
      setMovingInfo(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    key: string,
    side: "left" | "right",
    currentDuration: number,
    currentLeftPx: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initialDuration = currentDuration;
    let latestDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizingInfo({ key, side, initialDuration, deltaSecs: 0 });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      const rounded = parseFloat(nextDuration.toFixed(1));
      latestDuration = rounded;
      setResizingInfo({
        key,
        side,
        initialDuration,
        deltaSecs: parseFloat((rounded - initialDuration).toFixed(1)),
      });
      onDurationChange?.(key, rounded);
    };

    const onMouseUp = () => {
      if (side === "left") {
        const durDiff = initialDuration - latestDuration;
        const shiftPx = durDiff * 30;
        setClipOffsets((prev) => ({
          ...prev,
          [key]: (prev[key] ?? 0) + shiftPx,
        }));
      }
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

  const maxLane = useMemo(() => {
    const vals = Object.values(clipLanes);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }, [clipLanes]);
  const innerHeightPx = trackInnerHeight(maxLane);

  return (
    <div
      className={`border-b border-white/[0.04] flex items-center transition-all duration-300 ${
        muted ? "opacity-40" : ""
      }`}
      style={{ height: `${Math.max(44, innerHeightPx + 8)}px` }}
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
      <div className="flex-1 relative transition-all duration-300" style={{ height: `${Math.max(36, innerHeightPx)}px` }}>
        {!hasAnySfx ? (
          <button
            type="button"
            onClick={onAddSfx}
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-cyan-300 italic px-2 hover:bg-cyan-950/20 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add sound effect / ambient SFX</span>
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
            const dur = panel.sfx_duration ?? timing.duration ?? 1.5;
            const baseLeftPx =
              timing.startPx !== undefined ? timing.startPx : timing.startTime * 30;
            const offsetPx = clipOffsets[key] ?? 0;

            let displayLeftPx = baseLeftPx + offsetPx;
            let displayWidthPx = dur * 30;

            if (isResizing && resizingInfo && resizingInfo.side === "left") {
              const durDelta = (dur - resizingInfo.initialDuration) * 30;
              displayLeftPx = Math.max(0, baseLeftPx + offsetPx - durDelta);
            }

            const isMoving = movingInfo?.key === key;
            const finalLeftPx =
              displayLeftPx + (isMoving ? movingInfo!.deltaPx : 0);

            const lane = clipLanes[key] ?? 0;
            const clipTop = lane * LANE_HEIGHT + 1;
            const clipHeight = LANE_HEIGHT - 2;

            return (
              <div
                key={key}
                onMouseDown={(e) => handleMoveStart(e, key, idx, baseLeftPx + offsetPx, displayWidthPx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute rounded-md overflow-hidden select-none border z-10 ${
                  isMoving
                    ? "cursor-grabbing shadow-[0_4px_20px_rgba(103,232,249,0.4)] z-40"
                    : isResizing
                    ? "cursor-col-resize border-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.5)] z-30"
                    : selectedClip === key
                    ? "cursor-grab border-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.3)] z-20"
                    : "cursor-grab border-cyan-500/40 hover:border-cyan-300/80 z-10"
                } bg-[#0e7490]`}
                style={{
                  left: `${finalLeftPx}px`,
                  width: `${displayWidthPx}px`,
                  top: `${clipTop}px`,
                  height: `${clipHeight}px`,
                  cursor: isMoving ? "grabbing" : isResizing ? "col-resize" : "grab",
                  transition: isMoving ? "none" : "top 0.2s ease",
                }}
                title={`SFX #${idx + 1}: ${sfx}`}
              >
                {/* Audio Waveform Envelope */}
                <div className="absolute inset-0 flex items-center px-1">
                  <AudioWaveformVisual
                    audioUrl={panel.sfx_audio_url || panel.sfx_url || panel.audio_url}
                    color="#a5f3fc"
                    opacity={0.92}
                  />
                </div>

                {/* SFX Label & Controls */}
                <div className="absolute inset-0 flex items-center justify-between px-2 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 min-w-0 bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15 shadow-sm">
                    <Zap className="h-3 w-3 text-amber-300 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">
                      [{sfx}]
                    </span>
                  </div>

                  <div className="flex items-center gap-1 z-20 pointer-events-auto" style={{ cursor: "inherit" }}>
                    {isResizing && resizingInfo.deltaSecs !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-cyan-200 bg-cyan-950 px-1 py-0.2 rounded-sm border border-cyan-400/50 animate-pulse">
                        {resizingInfo.deltaSecs > 0 ? `+${resizingInfo.deltaSecs.toFixed(1)}s` : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                      </span>
                    )}
                    <span className="text-[8px] font-mono font-bold text-cyan-100 bg-black/50 px-1 py-0.2 rounded-sm border border-white/10 shrink-0">
                      {dur.toFixed(1)}s
                    </span>

                    {/* Prominent Glassmorphic Three-Dots Action Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="group/btn h-4.5 px-1 flex items-center justify-center rounded-[5px] bg-[#0c0c16]/85 hover:bg-cyan-600 text-neutral-300 hover:text-white border border-white/20 hover:border-cyan-300 shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(6,182,212,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                      title="Sound FX Options"
                    >
                      <MoreHorizontal className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Dual Left & Right Drag-to-Resize Handles */}
                <ClipTrimHandles
                  clipKey={key}
                  duration={dur}
                  isResizing={isResizing}
                  activeSide={isResizing ? resizingInfo.side : null}
                  onResizeStart={(e, side, d) =>
                    handleResizeStart(e, key, side, d, baseLeftPx + offsetPx)
                  }
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
