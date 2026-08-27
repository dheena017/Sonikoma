// ─── TimelineSubtitlesTrack (V3 Subtitles & Text Overlay Track) ────────────────
// Canonical location: timeline/components/tracks/TimelineSubtitlesTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Type, Plus, MoreHorizontal } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import ClipTrimHandles from "../ClipTrimHandles";

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
    deltaPx: number;
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
    document.body.style.userSelect = "none";
    setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx: 0 });

    const onMouseMove = (mv: MouseEvent) => {
      const deltaPx = mv.clientX - startX;
      if (Math.abs(deltaPx) > 4) { hasMoved = true; document.body.style.cursor = "grabbing"; }
      setMovingInfo({ key, idx, baseLeftPx, widthPx, deltaPx });
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        onClipClick(key, idx);
      } else {
        // Desired new left position
        const desiredLeft = baseLeftPx + (movingInfoRef.current?.deltaPx ?? 0);
        // Build positions of all other clips
        const otherClips = panels.map((p: any, i: number) => {
          const t: PanelTiming | undefined = panelTimings[i];
          const k = `v3-${i}`;
          const offset = clipOffsets[k] ?? 0;
          const left = (t?.startPx !== undefined ? t.startPx : (t?.startTime ?? 0) * 30) + offset;
          const width = (p.subtitle_duration ?? t?.duration ?? 3.5) * 30;
          return { key: k, left, width };
        }).filter(c => c.key !== key);
        // Find nearest neighbours
        const leftNeighbors = otherClips.filter(c => c.left < baseLeftPx).sort((a, b) => b.left - a.left);
        const rightNeighbors = otherClips.filter(c => c.left > baseLeftPx).sort((a, b) => a.left - b.left);
        const leftBound = leftNeighbors.length ? leftNeighbors[0].left + leftNeighbors[0].width : 0;
        const rightBound = rightNeighbors.length ? rightNeighbors[0].left - widthPx : Infinity;
        const clampedLeft = Math.max(leftBound, Math.min(desiredLeft, rightBound));
        const finalOffset = clampedLeft - baseLeftPx;
        setClipOffsets(prev => ({ ...prev, [key]: (prev[key] ?? 0) + finalOffset }));
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
    currentDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingInfo({ key, side, deltaPx: 0, deltaSecs: 0 });

    const startX = e.clientX;
    const initialDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      setResizingInfo({ key, side, deltaPx: deltaX, deltaSecs });
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

  const hasAnyText = panels.some(
    (p: any) =>
      p.text_narration || p.caption || p.speech_text || p.narrative
  );

  return (
    <div className="h-10 border-b border-white/[0.04] flex items-center">
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
      <div className="flex-1 relative h-8">
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

            const key = `v3-${idx}`;
            const isResizing = resizingInfo?.key === key;
            const dur = panel.subtitle_duration ?? timing.duration ?? 3.5;
            const baseLeftPx = timing.startPx !== undefined ? timing.startPx : timing.startTime * 30;
            const baseWidthPx = dur * 30;

            let displayLeftPx = baseLeftPx;
            let displayWidthPx = baseWidthPx;

            if (isResizing && resizingInfo) {
              if (resizingInfo.side === "left") {
                displayLeftPx = Math.max(0, baseLeftPx + resizingInfo.deltaPx);
                displayWidthPx = Math.max(15, baseWidthPx - resizingInfo.deltaPx);
              } else {
                displayWidthPx = Math.max(15, baseWidthPx + resizingInfo.deltaPx);
              }
            }

            const isMoving = movingInfo?.key === key;
            const offsetPx = clipOffsets[key] ?? 0;
            const finalLeftPx =
              displayLeftPx + offsetPx + (isMoving ? movingInfo!.deltaPx : 0);

            return (
              <div
                key={key}
                onMouseDown={(e) =>
                  handleMoveStart(
                    e,
                    key,
                    idx,
                    baseLeftPx + offsetPx,
                    baseWidthPx
                  )
                }
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute top-0.5 bottom-0.5 flex items-center justify-between gap-1 select-none rounded-md border text-[9px] font-mono font-bold px-2.5 bg-purple-950/90 border-purple-500/40 text-purple-200 z-10 ${
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
                  transition: isMoving ? "none" : undefined,
                }}
                title={`Panel #${idx + 1} Subtitle: ${text}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Type className="h-3 w-3 text-purple-400 shrink-0" />
                  <span className="truncate">"{text}"</span>
                </div>

                <div className="flex items-center gap-1 z-20">
                  {isResizing && resizingInfo.deltaSecs !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                      {resizingInfo.deltaSecs > 0
                        ? `+${resizingInfo.deltaSecs.toFixed(1)}s`
                        : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                    </span>
                  )}
                  <span className="text-[7px] font-mono text-purple-300/80 bg-black/40 px-1 py-0.2 rounded-sm border border-purple-500/20 shrink-0">
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
                    title="Subtitle Options"
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
                  onResizeStart={(e, side, d) => handleResizeStart(e, key, side, d)}
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
