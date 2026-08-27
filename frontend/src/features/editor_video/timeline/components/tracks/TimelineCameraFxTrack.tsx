// ─── TimelineCameraFxTrack (V2 Camera FX / Transitions Track) ──────────────────
// Canonical location: timeline/components/tracks/TimelineCameraFxTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Camera, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";

export interface TimelineCameraFxTrackProps {
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

  const hasAnyFx = panels.some(
    (p: any) => p.motion_type || p.camera_motion || p.effect || p.transition
  );

  return (
    <div className="h-10 border-b border-white/[0.04] flex items-center">
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
      <div className="flex-1 relative h-8 mx-1">
        {!hasAnyFx ? (
          <button
            type="button"
            onClick={onAddFx}
            className="h-full flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-indigo-300 italic px-2 hover:bg-indigo-950/20 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add camera motion / transition FX</span>
          </button>
        ) : (
          panels.map((panel: any, idx: number) => {
            const fx = panel.motion_type || panel.camera_motion || panel.effect || panel.transition;
            if (!fx) return null;

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

            const key = `v2-${idx}`;
            const isResizing = resizingKey === key;
            const dur = timing.duration || 3.5;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group/clip absolute top-0 bottom-0 flex items-center justify-between gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2.5 bg-indigo-950/90 border-indigo-500/40 text-indigo-200 select-none ${
                  isResizing
                    ? "ring-2 ring-indigo-400 brightness-125 z-30 shadow-lg"
                    : selectedClip === key
                    ? "ring-2 ring-indigo-400/80 brightness-115 z-10"
                    : "hover:brightness-110 hover:border-indigo-400/60"
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
                title={`Panel #${idx + 1} Effect: ${fx}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Camera className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{fx}</span>
                </div>

                <span className="text-[7px] font-mono text-indigo-300/80 bg-black/40 px-1 py-0.2 rounded border border-indigo-500/20 shrink-0 ml-1">
                  {dur.toFixed(1)}s
                </span>

                {/* Left Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "left", dur)}
                  className="absolute top-0 bottom-0 left-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-indigo-500/30 hover:bg-indigo-400/80 rounded-l transition-opacity"
                  title="Drag to trim start"
                >
                  <div className="w-[1.5px] h-3.5 bg-white/90 rounded-full" />
                </div>

                {/* Right Trim Handle - Wide Grab Area */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, key, "right", dur)}
                  className="absolute top-0 bottom-0 right-0 w-3 z-30 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 flex items-center justify-center bg-indigo-500/30 hover:bg-indigo-400/80 rounded-r transition-opacity"
                  title="Drag to resize duration"
                >
                  <div className="w-[1.5px] h-3.5 bg-white/90 rounded-full" />
                </div>
              </div>
            );
          })
        )}

        {/* Permanent Side-by-Side Add FX Button at Track End */}
        {hasAnyFx && (
          <button
            type="button"
            onClick={onAddFx}
            className="absolute top-0 bottom-0 px-2 rounded-lg border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-900/40 text-indigo-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer z-10 select-none text-[8px] font-mono font-bold shrink-0"
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
            title="Add new camera motion FX"
          >
            <Plus className="h-2.5 w-2.5 text-indigo-400" />
            <span>+ Add FX</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimelineCameraFxTrack);
