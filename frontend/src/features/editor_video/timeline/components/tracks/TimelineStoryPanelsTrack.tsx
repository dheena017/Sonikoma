// ─── TimelineStoryPanelsTrack (V1 Video / Story Panels Track) ─────────────────
// Canonical location: timeline/components/tracks/TimelineStoryPanelsTrack.tsx

import React, { useState, useMemo } from "react";
import TrackLabel from "../TrackLabel";
import { ImagePlus, Image as ImageIcon, Film, MoreHorizontal } from "lucide-react";
import { Keyframe } from "../../types";
import ClipTrimHandles from "../ClipTrimHandles";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";
import { LANE_HEIGHT, assignLanes, trackInnerHeight } from "./timelineLanes";

export interface PanelTiming {
  index: number;
  duration: number;
  startTime: number;
  endTime: number;
  startPct: number;
  widthPct: number;
  startPx?: number;
  widthPx?: number;
}

export interface TimelineStoryPanelsTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  currentPanelIndex: number;
  selectedClip: string | null;
  locked: boolean;
  hidden: boolean;
  keyframesVisible?: boolean;
  keyframesByClip?: Record<string, Keyframe[]>;
  selectedKeyframeId?: string | null;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
  getClipDuration: (key: string) => number;
  onDurationChange?: (key: string, duration: number) => void;
  onSelectKeyframe?: (id: string) => void;
  onCycleEasing?: (clipKey: string, keyframeId: string) => void;
  onAddKeyframe?: (clipKey: string, time: number) => void;
  onAddPanel?: () => void;
}

export const TimelineStoryPanelsTrack: React.FC<TimelineStoryPanelsTrackProps> = ({
  panels = [],
  panelTimings = [],
  currentPanelIndex,
  selectedClip,
  locked,
  hidden,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
  onDurationChange,
  onAddPanel,
}) => {
  const [resizingInfo, setResizingInfo] = useState<{
    idx: number;
    side: "left" | "right";
    initialDuration: number;
    deltaSecs: number;
  } | null>(null);

  // Per-clip position offsets for move dragging
  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});
  // Per-clip lane (row) assignments to avoid overlap
  const [clipLanes, setClipLanes] = useState<Record<string, number>>({});
  const [movingInfo, setMovingInfo] = useState<{
    key: string;
    idx: number;
    baseLeftPx: number;
    widthPx: number;
    deltaPx: number;
  } | null>(null);
  const movingInfoRef = React.useRef(movingInfo);
  React.useEffect(() => {
    movingInfoRef.current = movingInfo;
  }, [movingInfo]);

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
    setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx: 0 });

    const onMouseMove = (mv: MouseEvent) => {
      const deltaPx = mv.clientX - startX;
      if (Math.abs(deltaPx) > 4) {
        hasMoved = true;
        document.body.style.cursor = "grabbing";
      }
      setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx });
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        onClipClick(key, idx);
      } else {
        const desiredLeft = baseLeftPx + (movingInfoRef.current?.deltaPx ?? 0);
        const newOffset = desiredLeft - baseLeftPx;
        const newOffsets = { ...clipOffsets, [key]: (clipOffsets[key] ?? 0) + newOffset };
        setClipOffsets(newOffsets);

        // Recalculate lanes for all clips after the move
        const allClips = panels.map((p: any, i: number) => {
          const t: PanelTiming | undefined = panelTimings[i];
          const k = `v1-${i}`;
          const offset = newOffsets[k] ?? 0;
          const left = (t?.startPx !== undefined ? t.startPx : (t?.startTime ?? 0) * 30) + offset;
          const width = (p.duration || 3.5) * 30;
          return { key: k, left, width };
        });
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
    idx: number,
    side: "left" | "right",
    currentDuration: number,
    currentLeftPx: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initialDuration = currentDuration;
    let latestDuration = currentDuration;
    const key = `v1-${idx}`;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizingInfo({ idx, side, initialDuration, deltaSecs: 0 });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      const rounded = parseFloat(nextDuration.toFixed(1));
      latestDuration = rounded;
      setResizingInfo({
        idx,
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

  // Compute max lane to size track height dynamically
  const maxLane = useMemo(() => {
    const vals = Object.values(clipLanes);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }, [clipLanes]);
  const innerHeightPx = trackInnerHeight(maxLane);
  const outerHeightPx = innerHeightPx + 8;

  return (
    <div
      className="border-b border-white/[0.04] flex items-center transition-all duration-300"
      style={{ height: `${Math.max(64, outerHeightPx)}px` }}
    >
      <TrackLabel
        id="V1"
        label="Story Panels"
        color="text-purple-400"
        type="video"
        locked={locked}
        hidden={hidden}
        muted={false}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onToggleMute={() => {}}
        onAdd={onAddPanel}
      />
      <div className="flex-1 relative transition-all duration-300" style={{ height: `${Math.max(56, innerHeightPx)}px` }}>
        {panels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-[10px] italic">
            No story panels created yet. Click "+ Add Frame" to begin.
          </div>
        ) : (
          <div className="relative w-full h-full">
            {panels.map((panel: any, idx: number) => {
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

              const rawUrl =
                panel.image_url ||
                panel.imageUrl ||
                panel.url ||
                panel.panel_image_url ||
                panel.panel_image ||
                panel.generated_image_url ||
                panel.image ||
                panel.thumbnail_url ||
                panel.thumbnail ||
                panel.preview_url ||
                panel.media_url ||
                panel.src ||
                "";
              const imgUrl = rawUrl ? getProxiedImageUrl(rawUrl) : undefined;

              const isSelected =
                selectedClip === `v1-${idx}` || currentPanelIndex === idx;
              const dur = panel.duration || 3.5;
              const key = `v1-${idx}`;
              const isResizing = resizingInfo?.idx === idx;

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
              const clipTop = lane * LANE_HEIGHT + 2;
              const clipHeight = LANE_HEIGHT - 4;

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
                  className={`group absolute rounded-md border select-none overflow-hidden z-10 ${
                    isMoving
                      ? "cursor-grabbing shadow-[0_4px_20px_rgba(168,85,247,0.5)] z-40 border-purple-300"
                      : isResizing
                      ? "cursor-col-resize shadow-[0_0_10px_rgba(168,85,247,0.5)] z-30"
                      : isSelected
                      ? "cursor-grab border-purple-400/90 shadow-[0_0_10px_rgba(168,85,247,0.4)] z-20"
                      : "cursor-grab border-purple-500/25 hover:border-purple-400/60 z-10"
                  }`}
                  style={{
                    left: `${finalLeftPx}px`,
                    width: `${displayWidthPx}px`,
                    top: `${clipTop}px`,
                    height: `${clipHeight}px`,
                    cursor: isMoving ? "grabbing" : isResizing ? "col-resize" : "grab",
                    backgroundColor: "#0d0b14",
                    transition: isMoving ? "none" : "top 0.2s ease",
                  }}
                >
                  {/* Thumbnail background */}
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Panel ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity pointer-events-none"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-purple-950/30 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-mono text-purple-400/60 font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  )}

                  {/* Top Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />

                  {/* Panel Number Badge */}
                  <div className="absolute top-1 left-1.5 flex items-center gap-1 z-10">
                    <span className="text-[8px] font-mono font-bold text-white bg-black/60 px-1 py-0.2 rounded-sm border border-white/10 flex items-center gap-0.5">
                      <ImageIcon className="h-2.5 w-2.5 text-purple-400" />
                      #{idx + 1}
                    </span>
                    <span className="text-[8px] font-mono text-white/90 truncate max-w-[50px] font-semibold drop-shadow-sm">
                      {panel.title || `Panel ${idx + 1}`}
                    </span>
                  </div>

                  {/* Live Duration Badge & Three-Dots Menu */}
                  <div className="absolute top-1 right-1.5 flex items-center gap-1 z-20" style={{ cursor: "inherit" }}>
                    {isResizing && resizingInfo.deltaSecs !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950/90 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                        {resizingInfo.deltaSecs > 0
                          ? `+${resizingInfo.deltaSecs.toFixed(1)}s`
                          : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                      </span>
                    )}
                    <span
                      className={`text-[7px] font-mono px-1 rounded-sm transition-colors ${
                        isResizing
                          ? "bg-purple-600 text-white font-bold shadow"
                          : "bg-black/80 text-neutral-300"
                      }`}
                    >
                      {dur.toFixed(1)}s
                    </span>

                    {/* Prominent Glassmorphic Three-Dots Action Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="group/btn h-4.5 px-1 flex items-center justify-center rounded-[5px] bg-[#0c0c16]/85 hover:bg-purple-600 text-neutral-300 hover:text-white border border-white/20 hover:border-purple-300 shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(192,132,252,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                      title="Frame Options"
                    >
                      <MoreHorizontal className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Dual Left & Right Drag-to-Resize Handles */}
                  <ClipTrimHandles
                    clipKey={key}
                    duration={dur}
                    isResizing={isResizing}
                    activeSide={isResizing ? resizingInfo.side : null}
                    onResizeStart={(e, side, d) =>
                      handleResizeStart(e, idx, side, d, baseLeftPx + offsetPx)
                    }
                    accentColor="purple"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddPanel}
          className="w-full h-11 rounded-md border border-purple-500/30 hover:border-purple-400/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(168,85,247,0.35)] select-none group/add"
          title="Add Frame"
        >
          <ImagePlus className="h-3.5 w-3.5 text-purple-400 group-hover/add:scale-110 transition-transform" />
          <span>Add Frame</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineStoryPanelsTrack);
