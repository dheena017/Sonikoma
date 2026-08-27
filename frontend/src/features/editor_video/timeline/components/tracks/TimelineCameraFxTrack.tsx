// ─── TimelineCameraFxTrack (V2 Camera FX / Transitions Track) ──────────────────
// Canonical location: timeline/components/tracks/TimelineCameraFxTrack.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Camera } from "lucide-react";
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
}

function clipClass(key: string, selectedClip: string | null, base: string) {
  return `absolute top-0 bottom-0 flex items-center gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2 ${base} ${
    selectedClip === key
      ? "ring-2 ring-indigo-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
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
}) => (
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
    />
    <div className="flex-1 relative h-8 mx-1">
      {panels.length === 0 ? (
        <div className="h-full flex items-center text-[9px] font-mono text-neutral-600 italic px-2">
          No effects active
        </div>
      ) : (
        panels.map((panel: any, idx: number) => {
          const fx = panel.motion_type || panel.camera_motion || panel.effect || panel.transition;
          if (!fx) return null;

          const timing = panelTimings[idx] ?? {
            startPct: (idx / Math.max(panels.length, 1)) * 100,
            widthPct: (1 / Math.max(panels.length, 1)) * 100,
          };

          const key = `v2-${idx}`;
          return (
            <div
              key={key}
              onClick={() => onClipClick(key, idx)}
              onContextMenu={(e) => onContextMenu(e, key, idx)}
              className={clipClass(
                key,
                selectedClip,
                "bg-indigo-950/80 border-indigo-500/40 text-indigo-200"
              )}
              style={{
                left: `${timing.startPct}%`,
                width: `calc(${timing.widthPct}% - 3px)`,
              }}
              title={`Panel #${idx + 1} Effect: ${fx}`}
            >
              <Camera className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
              <span className="truncate">{fx}</span>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export default React.memo(TimelineCameraFxTrack);
