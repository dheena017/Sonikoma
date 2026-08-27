// ─── TimelineStoryPanelsTrack (V1 Video / Story Panels Track) ─────────────────
// Canonical location: timeline/components/tracks/TimelineStoryPanelsTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { ImagePlus, Film } from "lucide-react";
import { Keyframe } from "../../types";
import ClipTrimHandles from "../ClipTrimHandles";

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
    delta: number;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    idx: number,
    side: "left" | "right",
    initialDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingInfo({ idx, side, delta: 0 });

    const startX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // 30px = 1.0 second of video
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      const rounded = parseFloat(nextDuration.toFixed(1));
      setResizingInfo({ idx, side, delta: deltaSecs });
      onDurationChange?.(`v1-${idx}`, rounded);
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

  return (
    <div className="h-16 border-b border-white/[0.04] flex items-center">
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
      <div className="flex-1 relative h-14 mx-1">
        {panels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-[10px] italic">
            No story panels created yet. Click "+ Add Frame" to begin.
          </div>
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
                panel.panel_image_url ||
                panel.panel_image ||
                panel.generated_image_url;
              const imgUrl = rawUrl
                ? rawUrl.startsWith("http")
                  ? rawUrl
                  : `/api/media/${rawUrl}`
                : null;

              const key = `v1-${idx}`;
              const isResizing = resizingInfo?.idx === idx;
              const isActive = idx === currentPanelIndex;
              const dur = timing.duration || 3.5;

              return (
                <div
                  key={key}
                  onClick={() => onClipClick(key, idx)}
                  onContextMenu={(e) => onContextMenu(e, key, idx)}
                  className={`group absolute top-0 bottom-0 rounded-md overflow-hidden cursor-pointer transition-all border select-none ${
                    isResizing
                      ? "border-purple-400 ring-2 ring-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.8)] z-30 brightness-115"
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
                  <div className="absolute top-1 left-1.5 flex items-center gap-1 z-10">
                    <span className="text-[8px] font-mono font-bold text-white bg-black/70 px-1 py-0.5 rounded-sm border border-white/10">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Live Duration Badge & Three-Dots Menu */}
                  <div className="absolute top-1 right-1.5 flex items-center gap-1 z-20">
                    {isResizing && resizingInfo.delta !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950/90 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                        {resizingInfo.delta > 0 ? `+${resizingInfo.delta.toFixed(1)}s` : `${resizingInfo.delta.toFixed(1)}s`}
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

                    {/* Prominent Three-Dots Action Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="h-4 px-1 flex items-center justify-center rounded bg-black/70 hover:bg-purple-600 text-neutral-200 hover:text-white border border-white/20 hover:border-purple-400 shadow-sm transition-all cursor-pointer"
                      title="Frame Options"
                    >
                      <span className="font-bold text-[10px] tracking-widest leading-none px-0.5">···</span>
                    </button>
                  </div>

                  {/* Dual Left & Right Drag-to-Resize Handles */}
                  <ClipTrimHandles
                    clipKey={key}
                    duration={dur}
                    isResizing={isResizing}
                    activeSide={isResizing ? resizingInfo.side : null}
                    onResizeStart={(e, side, d) => handleResizeStart(e, idx, side, d)}
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
