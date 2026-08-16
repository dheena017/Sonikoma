// ─── VideoTrackV3 (Overlay / Captions) ───────────────────────────────────────
// Canonical location: timeline/components/tracks/VideoTrackV3.tsx

import React from "react";
import TrackLabel from "../TrackLabel";

interface VideoTrackV3Props {
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
    selectedClip === key
      ? "ring-2 ring-white/50 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

const VideoTrackV3: React.FC<VideoTrackV3Props> = ({
  panels,
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
      id="V3"
      label="Overlay"
      color="text-purple-400"
      type="video"
      locked={locked}
      hidden={hidden}
      muted={false}
      onToggleLock={onToggleLock}
      onToggleHide={onToggleHide}
      onToggleMute={() => {}}
    />
    <div className="flex-1 relative h-8 mx-1">
      {panels.map((panel: any, idx: number) => {
        const text =
          panel.text_narration || panel.caption || `Caption #${idx + 1}`;
        const key = `v3-${idx}`;
        return (
          <div
            key={key}
            onClick={() => onClipClick(key, idx)}
            onContextMenu={(e) => onContextMenu(e, key, idx)}
            className={clipClass(
              key,
              selectedClip,
              "bg-purple-800/70 border-purple-500/40 text-purple-100 h-full"
            )}
            style={{
              left: `${(idx / totalPanels) * 90}%`,
              width: `${(1 / totalPanels) * 90 - 0.5}%`,
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  </div>
);

export default React.memo(VideoTrackV3);
