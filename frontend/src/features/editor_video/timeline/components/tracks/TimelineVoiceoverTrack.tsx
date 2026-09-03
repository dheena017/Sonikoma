// ─── TimelineVoiceoverTrack (A3 Voiceover Track) ──────────────────────────────
// Canonical location: timeline/components/tracks/TimelineVoiceoverTrack.tsx

import React, { useState, useMemo } from "react";
import TrackLabel from "../TrackLabel";
import { Mic, Volume2, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";
import { AUDIO_FX_LANE_HEIGHT, assignLanes, trackInnerHeight } from "./timelineLanes";

export interface TimelineVoiceoverTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
  voiceActor?: string;
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
  onAddVoice?: () => void;
  totalDuration?: number;
  zoomLevel?: number;
}

export const TimelineVoiceoverTrack: React.FC<TimelineVoiceoverTrackProps> = ({
  panels = [],
  panelTimings = [],
  voiceActor,
  selectedClip,
  muted,
  locked,
  hidden,
  totalDuration,
  zoomLevel = 30,
  onToggleMute,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
  onDurationChange,
  onAddVoice,
}) => {
  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    side: "left" | "right";
    initialDuration: number;
    deltaSecs: number;
  } | null>(null);

  // per-clip offsets to persist moved positions
  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});
  const [movingInfo, setMovingInfo] = useState<{ key: string; idx: number; baseLeftPx: number; widthPx: number; deltaPx: number } | null>(null);
  const movingInfoRef = React.useRef(movingInfo);
  React.useEffect(() => { movingInfoRef.current = movingInfo; }, [movingInfo]);

  const handleMoveStart = (
    e: React.MouseEvent,
    key: string,
    idx: number,
    baseLeftPx: number,
    widthPx: number
  ) => {
    // ignore clicks on inner buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const startX = e.clientX;
    let hasMoved = false;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx: 0 });

    const onMouseMove = (mv: MouseEvent) => {
      const deltaPx = mv.clientX - startX;
      if (Math.abs(deltaPx) > 2) { hasMoved = true; }
      setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx });
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        onClipClick(key, idx);
      } else {
        const desiredLeft = baseLeftPx + (movingInfoRef.current?.deltaPx ?? 0);
        const newOffset = desiredLeft - baseLeftPx;
        setClipOffsets((prev) => ({
          ...prev,
          [key]: (prev[key] ?? 0) + newOffset,
        }));
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
      onDurationChange?.(key, latestDuration);
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

  const hasAnyVoice = panels.some(
    (p: any) =>
      p.speech_audio_url ||
      p.narrative_audio_url ||
      p.audio_url ||
      p.speech_text ||
      p.narrative ||
      p.dialogue
  );

  const pxPerSec = zoomLevel ?? 30;

  const clipLanes = useMemo(() => {
    const allClips = panels
      .map((p: any, i: number) => {
        const hasVoiceAudio = !!(
          p.speech_audio_url ||
          p.narrative_audio_url ||
          p.audio_url ||
          p.speech_text ||
          p.narrative ||
          p.dialogue
        );
        if (!hasVoiceAudio) return null;
        const t: PanelTiming | undefined = panelTimings[i];
        const k = `a3-${i}`;
        const dur = p.voice_duration ?? t?.duration ?? p.duration ?? 0;
        const baseLeft = t?.startPx !== undefined ? t.startPx : (t?.startTime ?? 0) * pxPerSec;
        const offset = clipOffsets[k] ?? 0;
        const moveDelta = movingInfo?.key === k ? movingInfo.deltaPx : 0;
        const isResizingThis = resizingInfo?.key === k;
        const resizeLeftDelta =
          isResizingThis && resizingInfo?.side === "left"
            ? (dur - resizingInfo.initialDuration) * pxPerSec
            : 0;

        const left = Math.max(0, baseLeft + offset + moveDelta - resizeLeftDelta);
        const width = dur * pxPerSec;
        return { key: k, left, width };
      })
      .filter((c): c is { key: string; left: number; width: number } => c !== null);
    return assignLanes(allClips);
  }, [panels, panelTimings, clipOffsets, movingInfo, resizingInfo, pxPerSec]);

  const maxLane = useMemo(() => {
    const vals = Object.values(clipLanes);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }, [clipLanes]);
  const innerHeightPx = trackInnerHeight(maxLane, AUDIO_FX_LANE_HEIGHT);
  const outerHeightPx = innerHeightPx + 8;

  const calcTotalDuration = useMemo(() => totalDuration ?? (panelTimings?.reduce((sum, p) => sum + (p.duration || 0), 0) || 3), [totalDuration, panelTimings]);

  return (
    <div
      className="border-b border-white/10 bg-[#18181B] flex items-center"
      style={{ height: `${Math.max(46, outerHeightPx)}px` }}
    >
      <TrackLabel
        id="A1"
        label="Voiceover"
        color="text-[#3B82F6]"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onAdd={onAddVoice}
      />

      <div className="flex-1 relative overflow-hidden" style={{ height: `${Math.max(38, innerHeightPx)}px`, clipPath: "inset(0)" }}>
        {!hasAnyVoice ? (
          <div className="w-full h-full p-1 pointer-events-none select-none">
            <div className="w-full h-full rounded border border-dashed border-white/[0.04] bg-white/[0.01] flex items-center px-3">
              <span className="text-[9px] font-mono text-neutral-500/50 uppercase tracking-widest font-medium">
                Empty Voiceover Track
              </span>
            </div>
          </div>
        ) : (
          panels.map((panel: any, idx: number) => {
            const hasVoiceAudio = !!(
              panel.speech_audio_url ||
              panel.narrative_audio_url ||
              panel.audio_url
            );
            const dialogue =
              panel.speech_text ||
              panel.narrative ||
              panel.dialogue ||
              "";

            if (!hasVoiceAudio && !dialogue) return null;

            // voice_duration may trim the clip; otherwise matches the frame from panelTimings
            const dur =
              panel.voice_duration ??
              panelTimings[idx]?.duration ??
              panel.duration ??
              0;

            const timing: PanelTiming = panelTimings[idx] ?? {
              index: idx,
              duration: dur,
              startTime: idx * dur,
              endTime: (idx + 1) * dur,
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
              startPx: idx * dur * pxPerSec,
              widthPx: dur * pxPerSec,
            };

            const speaker =
              panel.speaker_name ||
              panel.character_name ||
              (voiceActor ? voiceActor.split("—")[0].trim() : "VO");
            const label = `${speaker} #${idx + 1}`;
            const key = `a3-${idx}`;
            const isResizing = resizingInfo?.key === key;
            
            const baseLeftPx = timing.startPx !== undefined ? timing.startPx : timing.startTime * pxPerSec;
            const offsetPx = clipOffsets[key] ?? 0;

            const activeDur = isResizing && resizingInfo
              ? Math.max(0.5, resizingInfo.initialDuration + resizingInfo.deltaSecs)
              : dur;

            let displayLeftPx = baseLeftPx + offsetPx;
            let displayWidthPx = activeDur * pxPerSec;

            if (isResizing && resizingInfo && resizingInfo.side === "left") {
              const durDelta = resizingInfo.deltaSecs * pxPerSec;
              displayLeftPx = Math.max(0, baseLeftPx + offsetPx - durDelta);
            }

            const isMoving = movingInfo?.key === key;
            const finalLeftPx =
              displayLeftPx + (isMoving ? movingInfo!.deltaPx : 0);

            const lane = clipLanes[key] ?? 0;
            const clipTop = lane * AUDIO_FX_LANE_HEIGHT + 2;
            const clipHeight = AUDIO_FX_LANE_HEIGHT - 4;

            return (
              <div
                key={key}
                onMouseDown={(e) =>
                  handleMoveStart(
                    e,
                    key,
                    idx,
                    baseLeftPx + offsetPx,
                    displayWidthPx
                  )
                }
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute rounded-md overflow-hidden select-none border z-10 ${
                  isMoving
                    ? "cursor-grabbing shadow-[0_4px_20px_rgba(59,130,246,0.4)] z-40"
                    : isResizing
                    ? "cursor-col-resize border-[#2F2F2F] shadow-[0_0_14px_rgba(192,132,252,0.5)] z-30"
                    : selectedClip === key
                    ? "cursor-grab border-[#2F2F2F]  z-20"
                    : "cursor-grab border-[#2F2F2F] hover:border-[#2F2F2F] z-10"
                } bg-[#2563EB]`}
                style={{
                  left: `${finalLeftPx}px`,
                  width: `${displayWidthPx}px`,
                  top: `${clipTop}px`,
                  height: `${clipHeight}px`,
                  cursor: isMoving ? "grabbing" : isResizing ? "col-resize" : "grab",
                  transition: "none",
                }}
                title={`VO #${idx + 1} (${speaker}): ${dialogue}`}
              >
                {/* Audio Waveform Envelope */}
                <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
                  <AudioWaveformVisual
                    audioUrl={panel.speech_audio_url || panel.narrative_audio_url || panel.audio_url}
                    seed={`vo-${idx}-${speaker}-${dialogue}`}
                    color="#93C5FD"
                    opacity={0.92}
                  />
                </div>

                {/* Voice dialogue badge */}
                <div className="absolute inset-0 flex items-center justify-between px-1.5 z-10 pointer-events-none">
                  <div className="flex items-center gap-1 min-w-0 max-w-[calc(100%-48px)] bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/20 shadow-md group-hover:border-[#60A5FA]/60 transition-colors">
                    <GripVertical className="h-3 w-3 text-[#60A5FA] group-hover:text-white shrink-0 transition-colors" />
                    <Mic className="h-2.5 w-2.5 text-[#3B82F6] shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    <span className="text-[8.5px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 z-20 pointer-events-auto shrink-0" style={{ cursor: "inherit" }}>
                    {/* Live Drag Delta Display */}
                    {isMoving && movingInfo && movingInfo.deltaPx !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-[#3B82F6] bg-[#2A2A2A] px-1 py-0.2 rounded border border-[#2F2F2F]  animate-pulse">
                        {movingInfo.deltaPx > 0
                          ? `+${(movingInfo.deltaPx / 30).toFixed(1)}s`
                          : `${(movingInfo.deltaPx / 30).toFixed(1)}s`}
                      </span>
                    )}

                    {isResizing && resizingInfo.deltaSecs !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-[#3B82F6] bg-[#2A2A2A] px-1 py-0.2 rounded-sm border border-[#60A5FA]/50 animate-pulse">
                        {resizingInfo.deltaSecs > 0 ? `+${resizingInfo.deltaSecs.toFixed(1)}s` : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                      </span>
                    )}
                    {displayWidthPx >= 45 && (
                    <span className="text-[7.5px] font-mono font-bold text-[#3B82F6] bg-black/60 px-1 py-0.2 rounded-sm border border-white/10 shrink-0">
                      {activeDur.toFixed(1)}s
                    </span>
                    )}

                    {/* Prominent Glassmorphic Three-Dots Action Menu Button */}
                    {displayWidthPx >= 90 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="group/btn h-4 px-1 flex items-center justify-center rounded-[4px] bg-[#121212]/85 hover:bg-[#3B82F6] text-neutral-300 hover:text-white border border-white/20 hover:border-[#2F2F2F] shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(192,132,252,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                      title="Voiceover Options"
                    >
                      <MoreHorizontal className="h-3 w-3 stroke-[2.5]" />
                    </button>
                    )}
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
                  accentColor="purple"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineVoiceoverTrack);
