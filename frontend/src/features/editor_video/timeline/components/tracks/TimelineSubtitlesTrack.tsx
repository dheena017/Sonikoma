// ─── TimelineSubtitlesTrack (V3 Subtitles & Text Overlay Track) ────────────────
// Canonical location: timeline/components/tracks/TimelineSubtitlesTrack.tsx

import React, { useState, useMemo } from "react";
import TrackLabel from "../TrackLabel";
import { Type, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import ClipTrimHandles from "../ClipTrimHandles";
import { AUDIO_FX_LANE_HEIGHT, assignLanes, trackInnerHeight } from "./timelineLanes";

export interface TimelineSubtitlesTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
  selectedClip: string | null;
  locked: boolean;
  hidden: boolean;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
  onDurationChange?: (key: string, duration: number) => void;
  onAddSubtitle?: () => void;
}

export const TimelineSubtitlesTrack: React.FC<TimelineSubtitlesTrackProps> = ({
  panels = [],
  panelTimings = [],
  selectedClip,
  locked,
  hidden,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
  onDurationChange,
  onAddSubtitle,
}) => {
  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    side: "left" | "right";
    initialDuration: number;
    deltaSecs: number;
  } | null>(null);

  // State for tracking per‑clip position offsets
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
    // Prevent drag when clicking on inner buttons (e.g., options menu)
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

  const hasAnyText = panels.some(
    (p: any) =>
      p.text_narration || p.caption || p.speech_text || p.narrative
  );

  // Reactively compute lanes whenever clips are moved, resized, or when space opens up
  const clipLanes = useMemo(() => {
    const allClips = panels
      .map((p: any, i: number) => {
        const hasText = !!(p.text_narration || p.caption || p.speech_text || p.narrative);
        if (!hasText) return null;
        const t: PanelTiming | undefined = panelTimings[i];
        const k = `v3-${i}`;
        const dur = p.subtitle_duration || t?.duration || p.duration || 3.0;
        const baseLeft = t?.startPx !== undefined ? t.startPx : (t?.startTime ?? 0) * 30;
        const offset = clipOffsets[k] ?? 0;
        const moveDelta = movingInfo?.key === k ? movingInfo.deltaPx : 0;
        const isResizingThis = resizingInfo?.key === k;
        const resizeLeftDelta =
          isResizingThis && resizingInfo?.side === "left"
            ? (dur - resizingInfo.initialDuration) * 30
            : 0;

        const left = Math.max(0, baseLeft + offset + moveDelta - resizeLeftDelta);
        const width = dur * 30;
        return { key: k, left, width };
      })
      .filter((c): c is { key: string; left: number; width: number } => c !== null);
    return assignLanes(allClips);
  }, [panels, panelTimings, clipOffsets, movingInfo, resizingInfo]);

  const maxLane = useMemo(() => {
    const vals = Object.values(clipLanes);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }, [clipLanes]);
  const innerHeightPx = trackInnerHeight(maxLane, AUDIO_FX_LANE_HEIGHT);
  const outerHeightPx = innerHeightPx + 8;

  return (
    <div
      className="border-b border-white/[0.04] flex items-center transition-all duration-300"
      style={{ height: `${Math.max(46, outerHeightPx)}px` }}
    >
      <TrackLabel
        id="V3"
        label="Subtitles"
        color="text-purple-400"
        type="video"
        locked={locked}
        hidden={hidden}
        muted={false}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onToggleMute={() => {}}
        onAdd={onAddSubtitle}
      />
      <div className="flex-1 relative overflow-hidden transition-all duration-300" style={{ height: `${Math.max(38, innerHeightPx)}px`, clipPath: "inset(0)" }}>
        {!hasAnyText ? (
          <button
            type="button"
            onClick={onAddSubtitle}
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-purple-300 italic px-2 hover:bg-purple-950/20 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add subtitles / text captions</span>
          </button>
        ) : (
          panels.map((panel: any, idx: number) => {
            const text =
              panel.text_narration ||
              panel.caption ||
              panel.speech_text ||
              panel.narrative;
            if (!text) return null;

            const dur =
              panel.subtitle_duration ||
              panelTimings[idx]?.duration ||
              panel.duration ||
              3.0;

            const timing: PanelTiming = panelTimings[idx] ?? {
              index: idx,
              duration: dur,
              startTime: idx * dur,
              endTime: (idx + 1) * dur,
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
              startPx: idx * dur * 30,
              widthPx: dur * 30,
            };

            const key = `v3-${idx}`;
            const isResizing = resizingInfo?.key === key;
            const baseLeftPx = timing.startPx !== undefined ? timing.startPx : timing.startTime * 30;
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
                className={`group absolute flex items-center justify-between gap-1 select-none rounded-md border text-[9px] font-mono font-bold px-2.5 bg-purple-950/90 border-purple-500/40 text-purple-200 z-10 ${
                  isMoving
                    ? "cursor-grabbing shadow-[0_4px_20px_rgba(168,85,247,0.4)] z-40"
                    : isResizing
                    ? "cursor-col-resize border-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.5)] z-30"
                    : selectedClip === key
                    ? "cursor-grab border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)] z-20"
                    : "cursor-grab hover:border-purple-400/60 z-10"
                }`}
                style={{
                  left: `${finalLeftPx}px`,
                  width: `${displayWidthPx}px`,
                  top: `${clipTop}px`,
                  height: `${clipHeight}px`,
                  cursor: isMoving ? "grabbing" : isResizing ? "col-resize" : "grab",
                  transition: isMoving ? "none" : "top 0.2s ease",
                }}
                title={`Panel #${idx + 1} Subtitle: ${text}`}
              >
                <div className="flex items-center gap-1 min-w-0 max-w-[calc(100%-48px)] truncate pointer-events-none bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/20 shadow-md group-hover:border-purple-400/60 transition-colors">
                  <GripVertical className="h-3 w-3 text-purple-300 group-hover:text-white shrink-0 transition-colors" />
                  <Type className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">"{text}"</span>
                </div>

                <div className="flex items-center gap-0.5 z-20 pointer-events-auto shrink-0" style={{ cursor: "inherit" }}>
                  {/* Live Drag Delta Display */}
                  {isMoving && movingInfo && movingInfo.deltaPx !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-purple-100 bg-purple-900/90 px-1 py-0.2 rounded border border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse">
                      {movingInfo.deltaPx > 0
                        ? `+${(movingInfo.deltaPx / 30).toFixed(1)}s`
                        : `${(movingInfo.deltaPx / 30).toFixed(1)}s`}
                    </span>
                  )}

                  {isResizing && resizingInfo.deltaSecs !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                      {resizingInfo.deltaSecs > 0
                        ? `+${resizingInfo.deltaSecs.toFixed(1)}s`
                        : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                    </span>
                  )}
                  <span className="text-[7.5px] font-mono font-bold text-purple-100 bg-black/60 px-1 py-0.2 rounded-sm border border-white/10 shrink-0">
                    {dur.toFixed(1)}s
                  </span>

                  {/* Three-Dots Action Menu Button — hidden on very narrow clips */}
                  {displayWidthPx >= 90 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, key, idx);
                    }}
                    className="group/btn h-4 px-1 flex items-center justify-center rounded-[4px] bg-[#0c0c16]/85 hover:bg-purple-600 text-neutral-300 hover:text-white border border-white/20 hover:border-purple-300 shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(192,132,252,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                    title="Subtitle Options"
                  >
                    <MoreHorizontal className="h-3 w-3 stroke-[2.5]" />
                  </button>
                  )}
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

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddSubtitle}
          className="w-full h-7 rounded-md border border-purple-500/30 hover:border-purple-400/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(168,85,247,0.35)] select-none group/add"
          title="Add Subtitles"
        >
          <Type className="h-3 w-3 text-purple-400 group-hover/add:scale-110 transition-transform" />
          <span>Add Text</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineSubtitlesTrack);
