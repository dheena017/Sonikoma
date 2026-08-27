// ─── TimelineCameraFxTrack (V2 Camera FX / Transitions Track) ──────────────────
// Canonical location: timeline/components/tracks/TimelineCameraFxTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Camera, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import ClipTrimHandles from "../ClipTrimHandles";

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
    deltaPx: number;
    deltaSecs: number;
  } | null>(null);

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
      <div className="flex-1 relative h-8">
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
            const dur = panel.camera_duration || panel.duration || 3.0;
            const key = `v2-${idx}`;
            const timing: PanelTiming = panelTimings[idx] ?? {
              index: idx,
              duration: dur,
              startTime: 0,
              endTime: dur,
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
              startPx: 0,
              widthPx: dur * 30,
            };

            const isSelected = selectedClip === key;
            const isResizing = resizingInfo?.key === key;

            const baseLeftPx =
              timing.startPx !== undefined
                ? timing.startPx
                : timing.startTime * 30;
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

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute top-0.5 bottom-0.5 flex items-center justify-between gap-1 cursor-pointer truncate transition-all rounded-md border text-[9px] font-mono font-bold px-2.5 bg-indigo-950/90 border-indigo-500/40 text-indigo-200 select-none ${
                  isResizing
                    ? "ring-2 ring-indigo-400 border-indigo-300 shadow-[0_0_24px_rgba(129,140,248,0.8)] z-30 brightness-125"
                    : selectedClip === key
                    ? "ring-2 ring-indigo-400/80 brightness-115 z-10"
                    : "hover:brightness-110 hover:border-indigo-400/60"
                }`}
                style={{
                  left: `${displayLeftPx}px`,
                  width: `${displayWidthPx}px`,
                }}
                title={`Panel #${idx + 1} Effect: ${fx}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Camera className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{fx}</span>
                </div>

                <div className="flex items-center gap-1 z-20">
                  {isResizing && resizingInfo.deltaSecs !== 0 && (
                    <span className="text-[7px] font-mono font-bold text-indigo-200 bg-indigo-950 px-1 py-0.2 rounded-sm border border-indigo-400/50 animate-pulse">
                      {resizingInfo.deltaSecs > 0 ? `+${resizingInfo.deltaSecs.toFixed(1)}s` : `${resizingInfo.deltaSecs.toFixed(1)}s`}
                    </span>
                  )}
                  <span className="text-[7px] font-mono text-indigo-300/80 bg-black/40 px-1 py-0.2 rounded-sm border border-indigo-500/20 shrink-0">
                    {dur.toFixed(1)}s
                  </span>

                  {/* Prominent Three-Dots Action Menu Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, key, idx);
                    }}
                    className="h-4 px-1 flex items-center justify-center rounded bg-black/70 hover:bg-indigo-600 text-neutral-200 hover:text-white border border-white/20 hover:border-indigo-400 shadow-sm transition-all cursor-pointer"
                    title="Camera FX Options"
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
