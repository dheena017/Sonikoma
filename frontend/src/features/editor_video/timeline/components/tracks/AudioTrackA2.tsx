// ─── AudioTrackA2 (SFX) ──────────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/AudioTrackA2.tsx

import React from "react";
import TrackLabel from "../TrackLabel";

interface AudioTrackA2Props {
  panels: any[];
  totalPanels: number;
  selectedClip: string | null;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  onToggleMute: () => void;
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

const AudioTrackA2: React.FC<AudioTrackA2Props> = ({
  panels,
  totalPanels,
  selectedClip,
  muted,
  locked,
  hidden,
  onToggleMute,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
}) => (
  <div
    className={`h-10 border-b border-white/[0.04] flex items-center ${
      muted ? "opacity-40" : ""
    }`}
  >
    <TrackLabel
      id="A2"
      label="SFX"
      color="text-cyan-400"
      type="audio"
      locked={locked}
      hidden={hidden}
      muted={muted}
      onToggleMute={onToggleMute}
      onToggleLock={onToggleLock}
      onToggleHide={onToggleHide}
    />
    <div className="flex-1 relative h-8 mx-1">
      {panels.map((panel: any, idx: number) => {
        const sfx =
          panel.sfx_name ||
          panel.sfx ||
          panel.sound_effect ||
          `SFX #${idx + 1}`;
        const key = `a2-${idx}`;
        return (
          <div
            key={key}
            onClick={() => onClipClick(key, idx)}
            onContextMenu={(e) => onContextMenu(e, key, idx)}
            className={clipClass(
              key,
              selectedClip,
              "bg-cyan-900/70 border-cyan-600/40 text-cyan-200 h-full"
            )}
            style={{
              left: `${(idx / totalPanels) * 85}%`,
              width: `${Math.max((1 / totalPanels) * 36, 2.5)}%`,
            }}
          >
            {sfx}
          </div>
        );
      })}
    </div>
  </div>
);

export default React.memo(AudioTrackA2);
