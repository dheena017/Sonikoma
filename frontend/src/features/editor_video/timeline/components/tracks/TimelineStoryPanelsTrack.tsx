// ─── TimelineStoryPanelsTrack (V1 Story Panels Track) ───────────────────────────
// Canonical location: timeline/components/tracks/TimelineStoryPanelsTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Keyframe } from "../../types";
import { getProxiedImageUrl } from "@/utils";
import { Film, ImagePlus } from "lucide-react";

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
  const [resizingIdx, setResizingIdx] = useState<number | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    idx: number,
    side: "left" | "right",
    initialDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingIdx(idx);

    const startX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // 25px ≈ 1 second of video
      const deltaSecs = side === "right" ? deltaX / 25 : -deltaX / 25;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      const rounded = parseFloat(nextDuration.toFixed(1));
      onDurationChange?.(`v1-${idx}`, rounded);
    };

    const onMouseUp = () => {
      setResizingIdx(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex flex-col border-b border-white/[0.04]">
      <div className="h-14 flex items-center">
        <TrackLabel
          id="V1"
          label="Story Panels"
          color="text-white"
          type="video"
          locked={locked}
          hidden={hidden}
          muted={false}
          onToggleLock={onToggleLock}
          onToggleHide={onToggleHide}
          onToggleMute={() => {}}
          onAdd={onAddPanel}
        />
        <div className="flex-1 relative h-11 mx-1">
          {panels.length === 0 ? (
            <button
              type="button"
              onClick={onAddPanel}
              className="w-full h-full flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-400 hover:text-purple-300 border border-dashed border-white/10 hover:border-purple-500/50 rounded-xl px-4 bg-black/20 hover:bg-purple-950/20 transition-all cursor-pointer"
            >
              <ImagePlus className="h-3.5 w-3.5 text-purple-400" />
              <span>No video panels — Click to add frames from Imported Assets</span>
            </button>
          ) : (
            <div className="relative w-full h-full flex items-center">
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
                  panel.original_url ||
                  panel.thumbnail ||
                  "";
                const imgUrl = rawUrl ? getProxiedImageUrl(rawUrl) : "";
                const isActive = idx === currentPanelIndex;
                const isResizing = resizingIdx === idx;
                const key = `v1-${idx}`;
                const dur = timing.duration;

                return (
                  <div
                    key={key}
                    onClick={() => onClipClick(key, idx)}
                    onContextMenu={(e) => onContextMenu(e, key, idx)}
                    className={`absolute top-0 bottom-0 rounded-md overflow-hidden cursor-pointer transition-all border group/panel select-none ${
                      isResizing
                        ? "border-purple-400 ring-2 ring-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.7)] z-30 brightness-110"
                        : isActive
                        ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20"
                        : selectedClip === key
                        ? "border-purple-500 ring-1 ring-purple-400 z-10"
                        : "border-white/10 hover:border-purple-400/50"
                    } bg-[#090912]`}
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
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 bg-neutral-900/60 p-1">
                        <Film className="h-4 w-4 mb-0.5 opacity-40" />
                        <span className="text-[8px] font-mono opacity-50">
                          P#{idx + 1}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay for Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                    {/* Badge: Panel Index */}
                    <div className="absolute top-1 left-1 flex items-center gap-1 z-10">
                      <span className="text-[8px] font-mono font-bold text-white bg-black/70 px-1 py-0.5 rounded-sm border border-white/10">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Live Duration Badge */}
                    <span
                      className={`absolute top-1 right-1 text-[7px] font-mono px-1 rounded-sm transition-colors ${
                        isResizing
                          ? "bg-purple-600 text-white font-bold shadow"
                          : "bg-black/80 text-neutral-300"
                      }`}
                    >
                      {dur.toFixed(1)}s
                    </span>

                    {/* Left Drag Resize Handle - Wide Grab Area */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, idx, "left", dur)}
                      className="absolute top-0 bottom-0 left-0 w-3.5 z-30 cursor-ew-resize opacity-0 group-hover/panel:opacity-100 flex items-center justify-center bg-purple-500/40 hover:bg-purple-400/90 rounded-l-sm transition-opacity"
                      title="Drag to trim start duration"
                    >
                      <div className="w-[1.5px] h-4 bg-white rounded-full shadow" />
                    </div>

                    {/* Right Drag Resize Handle - Wide Grab Area */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, idx, "right", dur)}
                      className="absolute top-0 bottom-0 right-0 w-3.5 z-30 cursor-ew-resize opacity-0 group-hover/panel:opacity-100 flex items-center justify-center bg-purple-500/40 hover:bg-purple-400/90 rounded-r-sm transition-opacity"
                      title="Drag to increase / decrease duration"
                    >
                      <div className="w-[1.5px] h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                );
              })}

              {/* Permanent Side-by-Side Add Frame Card at Track End */}
              <button
                type="button"
                onClick={onAddPanel}
                className="absolute top-0 bottom-0 w-24 rounded-md border border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/25 hover:bg-purple-900/40 text-purple-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer z-10 select-none shadow-sm hover:shadow-purple-500/20 shrink-0"
                style={{
                  left:
                    panelTimings.length > 0 &&
                    panelTimings[panelTimings.length - 1].startPx !== undefined
                      ? `${
                          panelTimings[panelTimings.length - 1].startPx! +
                          panelTimings[panelTimings.length - 1].widthPx! +
                          8
                        }px`
                      : `calc(100% + 8px)`,
                }}
                title="Add new panel / frame"
              >
                <ImagePlus className="h-4 w-4 text-purple-400" />
                <span className="text-[9px] font-mono font-bold">Add Frame</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TimelineStoryPanelsTrack);
