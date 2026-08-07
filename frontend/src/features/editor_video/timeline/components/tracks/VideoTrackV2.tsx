// ─── VideoTrackV2 (Effects) ───────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/VideoTrackV2.tsx

import React from "react";
import TrackLabel from "../TrackLabel";

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
  return `absolute flex items-center cursor-pointer truncate transition-all rounded-lg border text-[10px] font-semibold px-2 ${base} ${
    selectedClip === key ? "ring-2 ring-white/50 brightness-115 z-10" : "hover:brightness-110"
  }`;
}

const VideoTrackV2: React.FC<VideoTrackV2Props> = ({
  panels, totalPanels, selectedClip,
  locked, hidden,
  onToggleLock, onToggleHide, onClipClick, onContextMenu,
}) => (
  <div className="h-10 border-b border-white/[0.04] flex items-center">
    <TrackLabel
      id="V2" label="Effects" color="text-indigo-400" type="video"
      locked={locked} hidden={hidden} muted={false}
      onToggleLock={onToggleLock}
      onToggleHide={onToggleHide}
      onToggleMute={() => {}}
    />
    <div className="flex-1 relative h-8 mx-1">
      {panels.map((panel: any, idx: number) => {
        const fx = panel.effect || panel.transition || `Cut #${idx + 1}`;
        const key = `v2-${idx}`;
        return (
          <div
            key={key}
            onClick={() => onClipClick(key, idx)}
            onContextMenu={(e) => onContextMenu(e, key, idx)}
            className={clipClass(key, selectedClip, "bg-indigo-800/60 border-indigo-500/30 text-indigo-200 h-full")}
            style={{ left: `${(idx / totalPanels) * 85}%`, width: `${(1 / totalPanels) * 85 - 0.5}%` }}
          >
            {fx}
          </div>
        );
      })}
    </div>
  </div>
);

export default React.memo(VideoTrackV2);
