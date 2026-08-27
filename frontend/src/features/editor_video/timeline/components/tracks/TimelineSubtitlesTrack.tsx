// ─── TimelineSubtitlesTrack (V3 Subtitles & Text Overlay Track) ────────────────
// Canonical location: timeline/components/tracks/TimelineSubtitlesTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Type, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";

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
  const [resizingKey, setResizingKey] = useState<string | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    key: string,
    side: "left" | "right",
    currentDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingKey(key);

    const startX = e.clientX;
    const initialDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 25 : -deltaX / 25;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      onDurationChange?.(key, parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setResizingKey(null);
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
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-purple-300 italic px-2 hover:bg-purple-950/20 rounded-lg transition-colors cursor-pointer"
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
            const isResizing = resizingKey === key;
            const dur = timing.duration || 3.5;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group/clip absolute top-0 bottom-0 flex items-center justify-between gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2.5 bg-purple-950/90 border-purple-500/40 text-purple-200 select-none ${
                  isResizing
                    ? "ring-2 ring-purple-400 brightness-125 z-30 shadow-lg"
                    : selectedClip === key
                    ? "ring-2 ring-purple-400/80 brightness-115 z-10"
                    : "hover:brightness-110 hover:border-purple-400/60"
                }`}
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
                title={`Subtitle #${idx + 1}: "${text}"`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Type className="h-3 w-3 text-purple-300 shrink-0" />
                  <span className="truncate">"{text}"</span>
                </div>

                <span className="text-[7px] font-mono text-purple-300/80 bg-black/40 px-1 py-0.2 rounded border border-purple-500/20 shrink-0 ml-1">
                  {dur.toFixed(1)}s
                </span>

                {/* Left Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "left", dur)}
                  className="absolute top-0 bottom-0 left-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-purple-500/30 hover:bg-purple-400/80 rounded-l transition-opacity"
                  title="Drag to trim start"
                >
                  <div className="w-[1.5px] h-3.5 bg-white/90 rounded-full" />
                </div>

                {/* Right Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "right", dur)}
                  className="absolute top-0 bottom-0 right-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-purple-500/30 hover:bg-purple-400/80 rounded-r transition-opacity"
                  title="Drag to resize duration"
                >
                  <div className="w-[1.5px] h-3.5 bg-white/90 rounded-full" />
                </div>
              </div>
            );
          })
        )}

        {/* Permanent Side-by-Side Add Subtitle Button at Track End */}
        {hasAnyText && (
          <button
            type="button"
            onClick={onAddSubtitle}
            className="absolute top-0 bottom-0 px-2 rounded-lg border border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer z-10 select-none text-[8px] font-mono font-bold shrink-0"
            style={{
              left:
                panelTimings.length > 0 &&
                panelTimings[panelTimings.length - 1].startPx !== undefined
                  ? `${
                      panelTimings[panelTimings.length - 1].startPx! +
                      panelTimings[panelTimings.length - 1].widthPx! +
                      6
                    }px`
                  : `calc(100% + 4px)`,
            }}
            title="Add new subtitle line"
          >
            <Plus className="h-2.5 w-2.5 text-purple-400" />
            <span>+ Add Subtitle</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineSubtitlesTrack);
