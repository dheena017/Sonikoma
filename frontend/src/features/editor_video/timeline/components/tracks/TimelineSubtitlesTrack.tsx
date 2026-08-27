// ─── TimelineSubtitlesTrack (V3 Subtitles & Text Overlay Track) ────────────────
// Canonical location: timeline/components/tracks/TimelineSubtitlesTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Type, Plus } from "lucide-react";
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
      <div className="flex-1 relative h-8 mx-1">
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
            const clipWidthPx = dur * 30;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute top-0 bottom-0 flex items-center justify-between gap-1 cursor-pointer truncate transition-all rounded-md border text-[9px] font-mono font-bold px-2.5 bg-purple-950/90 border-purple-500/40 text-purple-200 select-none ${
                  isResizing
                    ? "ring-2 ring-purple-400 border-purple-300 shadow-[0_0_24px_rgba(192,132,252,0.8)] z-30 brightness-125"
                    : selectedClip === key
                    ? "ring-2 ring-purple-400/80 brightness-115 z-10"
                    : "hover:brightness-110 hover:border-purple-400/60"
                }`}
                style={{
                  left:
                    timing.startPx !== undefined
                      ? `${timing.startPx}px`
                      : `${timing.startPct}%`,
                  width: `${Math.max(24, clipWidthPx - 3)}px`,
                }}
                title={`Subtitle #${idx + 1}: "${text}"`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Type className="h-3 w-3 text-purple-300 shrink-0" />
                  <span className="truncate">"{text}"</span>
                </div>

                <div className="flex items-center gap-1 z-20">
                  {isResizing && resizingInfo.delta !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                      {resizingInfo.delta > 0 ? `+${resizingInfo.delta.toFixed(1)}s` : `${resizingInfo.delta.toFixed(1)}s`}
                    </span>
                  )}
                  <span className="text-[7px] font-mono text-purple-300/80 bg-black/40 px-1 py-0.2 rounded-sm border border-purple-500/20 shrink-0">
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
                    title="Subtitle Options"
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
