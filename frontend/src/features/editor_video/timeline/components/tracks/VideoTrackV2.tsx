// ─── VideoTrackV2 (Effects / Camera FX) ───────────────────────────────────────
// Canonical location: timeline/components/tracks/VideoTrackV2.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Camera, Sparkles } from "lucide-react";

interface VideoTrackV2Props {
  panels: any[];
  totalPanels: number;
  selectedClip: string | null;
  locked: boolean;
  hidden: boolean;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
}

function clipClass(key: string, selectedClip: string | null, base: string) {
  return `absolute flex items-center gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2 ${base} ${
    selectedClip === key
      ? "ring-2 ring-indigo-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

const VideoTrackV2: React.FC<VideoTrackV2Props> = ({
  panels = [],
  totalPanels,
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
      label="Effects"
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

          const key = `v2-${idx}`;
          return (
            <div
              key={key}
              onClick={() => onClipClick(key, idx)}
              onContextMenu={(e) => onContextMenu(e, key, idx)}
              className={clipClass(
                key,
                selectedClip,
                "bg-indigo-950/80 border-indigo-500/40 text-indigo-200 h-full"
              )}
              style={{
                left: `${(idx / Math.max(totalPanels, 1)) * 96}%`,
                width: `${(1 / Math.max(totalPanels, 1)) * 94}%`,
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

export default React.memo(VideoTrackV2);
