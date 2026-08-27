// ─── TimelineCameraFxTrack (V2 Camera FX / Transitions Track) ──────────────────
// Canonical location: timeline/components/tracks/TimelineCameraFxTrack.tsx

import React, { useState, useMemo } from "react";
import TrackLabel from "../TrackLabel";
import { Camera, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import ClipTrimHandles from "../ClipTrimHandles";
import { AUDIO_FX_LANE_HEIGHT, assignLanes, trackInnerHeight } from "./timelineLanes";

export interface TimelineCameraFxTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
  selectedClip: string | null;
  locked: boolean;
  hidden: boolean;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (clipKey: string, panelIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, clipKey: string, panelIndex: number) => void;
  onDurationChange?: (clipKey: string, duration: number) => void;
  onAddFx?: () => void;
}

export const TimelineCameraFxTrack: React.FC<TimelineCameraFxTrackProps> = ({
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
  onAddFx,
}) => {
  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    side: "left" | "right";
    initialDuration: number;
    deltaSecs: number;
  } | null>(null);

  // Per-clip position offsets (persisted in local state across renders)
  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});
  const [movingInfo, setMovingInfo] = useState<{
    key: string;
    idx: number;
    baseLeftPx: number;
    deltaPx: number;
  } | null>(null);

  const handleMoveStart = (
    e: React.MouseEvent,
    key: string,
    idx: number,
    baseLeftPx: number
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const startX = e.clientX;
    let hasMoved = false;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    setMovingInfo({ key, idx, baseLeftPx, deltaPx: 0 });

    const dur = panels[idx]?.camera_duration || panels[idx]?.duration || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      if (Math.abs(deltaPx) > 2) {
        hasMoved = true;
      }
      setMovingInfo({ key, idx, baseLeftPx, deltaPx });
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

  const movingInfoRef = React.useRef(movingInfo);
  React.useEffect(() => { movingInfoRef.current = movingInfo; }, [movingInfo]);

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
    setResizingInfo({
      key,
      side,
      initialDuration,
      deltaSecs: 0,
    });

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

  // Reactively compute lanes whenever clips are moved, resized, or when space opens up
  const clipLanes = useMemo(() => {
    const allClips = panels.map((p: any, i: number) => {
      const t: PanelTiming | undefined = panelTimings[i];
      const k = `v2-${i}`;
      const dur = p.camera_duration || p.fx_duration || t?.duration || p.duration || 3.0;
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
    });
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
        id="V2"
        label="Camera FX"
        color="text-indigo-400"
        type="video"
        locked={locked}
        hidden={hidden}
        muted={false}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onToggleMute={() => {}}
        onAdd={onAddFx}
      />
      <div className="flex-1 relative overflow-hidden transition-all duration-300" style={{ height: `${Math.max(38, innerHeightPx)}px` }}>
        {panels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-[10px] italic">
            No camera motion FX. Click "+ Add FX" on the right.
          </div>
        ) : (
          panels.map((panel: any, idx: number) => {
            const fx =
              panel.camera_motion ||
              panel.camera_fx ||
              (idx % 2 === 0 ? "zoom_in" : "zoom_out");
            const dur =
              panel.camera_duration ||
              panel.fx_duration ||
              panelTimings[idx]?.duration ||
              panel.duration ||
              3.0;
            const key = `v2-${idx}`;
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

            const isSelected = selectedClip === key;
            const isResizing = resizingInfo?.key === key;

            const baseLeftPx =
              timing.startPx !== undefined
                ? timing.startPx
                : timing.startTime * 30;
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
                onMouseDown={(e) => handleMoveStart(e, key, idx, baseLeftPx + offsetPx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute flex items-center justify-between gap-1 select-none truncate rounded-md border text-[9px] font-mono font-bold px-2.5 bg-indigo-950/90 border-indigo-500/40 text-indigo-200 z-10 ${
                  isMoving
                    ? "cursor-grabbing shadow-[0_4px_20px_rgba(129,140,248,0.4)] z-40 scale-[1.01]"
                    : isResizing
                    ? "cursor-col-resize border-indigo-300 shadow-[0_0_14px_rgba(129,140,248,0.5)] z-30"
                    : selectedClip === key
                    ? "cursor-grab border-indigo-300 z-10"
                    : "cursor-grab hover:border-indigo-400/60"
                }`}
                style={{
                  left: `${finalLeftPx}px`,
                  width: `${displayWidthPx}px`,
                  top: `${clipTop}px`,
                  height: `${clipHeight}px`,
                  cursor: isMoving ? "grabbing" : isResizing ? "col-resize" : "grab",
                  transition: isMoving ? "none" : "top 0.2s ease",
                }}
                title={`Panel #${idx + 1} Effect: ${fx}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate pointer-events-none">
                  <GripVertical className="h-3 w-3 text-indigo-400/50 group-hover:text-indigo-300 shrink-0 transition-colors" />
                  <Camera className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{fx}</span>
                </div>

                <div className="flex items-center gap-1 z-20" style={{ cursor: "inherit" }}>
                  {isResizing && resizingInfo.deltaSecs !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-indigo-200 bg-indigo-950 px-1 py-0.2 rounded-sm border border-indigo-400/50 animate-pulse">
                      {resizingInfo.deltaSecs > 0 ? `+${resizingInfo.deltaSecs.toFixed(1)}s` : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                    </span>
                  )}
                  {displayWidthPx >= 55 && (
                  <span className="text-[7px] font-mono text-indigo-300/80 bg-black/40 px-1 py-0.2 rounded-sm border border-indigo-500/20 shrink-0">
                    {dur.toFixed(1)}s
                  </span>
                  )}

                  {/* Prominent Glassmorphic Three-Dots Action Menu Button */}
                  {displayWidthPx >= 55 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, key, idx);
                    }}
                    className="group/btn h-4.5 px-1 flex items-center justify-center rounded-[5px] bg-[#0c0c16]/85 hover:bg-indigo-600 text-neutral-300 hover:text-white border border-white/20 hover:border-indigo-300 shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(129,140,248,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                    title="Camera FX Options"
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
                  accentColor="indigo"
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
          onClick={onAddFx}
          className="w-full h-7 rounded-md border border-indigo-500/30 hover:border-indigo-400/80 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(129,140,248,0.35)] select-none group/add"
          title="Add Camera FX"
        >
          <Camera className="h-3 w-3 text-indigo-400 group-hover/add:scale-110 transition-transform" />
          <span>Add FX</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineCameraFxTrack);
