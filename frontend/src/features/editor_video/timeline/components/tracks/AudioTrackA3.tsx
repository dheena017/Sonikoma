// ─── AudioTrackA3 (Voiceover) ─────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/AudioTrackA3.tsx

import React from "react";
import TrackLabel from "../TrackLabel";

interface AudioTrackA3Props {
  panels: any[];
  totalPanels: number;
  voiceActor: string;
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
    selectedClip === key ? "ring-2 ring-white/50 brightness-115 z-10" : "hover:brightness-110"
  }`;
}

const AudioTrackA3: React.FC<AudioTrackA3Props> = ({
  panels, totalPanels, voiceActor, selectedClip,
  muted, locked, hidden,
  onToggleMute, onToggleLock, onToggleHide,
  onClipClick, onContextMenu,
}) => (
  <div className={`h-10 border-b border-white/[0.04] flex items-center ${muted ? "opacity-40" : ""}`}>
    <TrackLabel
      id="A3" label="Voiceover" color="text-blue-400" type="audio"
      locked={locked} hidden={hidden} muted={muted}
      onToggleMute={onToggleMute}
      onToggleLock={onToggleLock}
      onToggleHide={onToggleHide}
    />
    <div className="flex-1 relative h-8 mx-1">
      {panels.map((panel: any, idx: number) => {
        const lbl = voiceActor
          ? `${voiceActor} — P${idx + 1}`
          : panel.dialogue || `VO P${idx + 1}`;
        const key = `a3-${idx}`;
        return (
          <div
            key={key}
            onClick={() => onClipClick(key, idx)}
            onContextMenu={(e) => onContextMenu(e, key, idx)}
            className={clipClass(key, selectedClip, "bg-blue-900/70 border-blue-600/40 text-blue-200 h-full")}
            style={{
              left: `${(idx / totalPanels) * 85}%`,
              width: `${(1 / totalPanels) * 82 - 0.5}%`,
            }}
          >
            {lbl}
          </div>
        );
      })}
    </div>
  </div>
);

export default React.memo(AudioTrackA3);
