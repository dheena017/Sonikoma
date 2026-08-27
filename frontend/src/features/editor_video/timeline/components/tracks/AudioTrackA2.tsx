// ─── AudioTrackA2 (Sound Effects - SFX) ───────────────────────────────────────
// Canonical location: timeline/components/tracks/AudioTrackA2.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Zap } from "lucide-react";

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
  return `absolute flex items-center gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2 ${base} ${
    selectedClip === key
      ? "ring-2 ring-cyan-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

const AudioTrackA2: React.FC<AudioTrackA2Props> = ({
  panels = [],
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
}) => {
  const hasAnySfx = panels.some((p: any) => p.sfx || p.sfx_name || p.sound_fx);

  return (
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
        {!hasAnySfx ? (
          <div className="h-full flex items-center text-[9px] font-mono text-neutral-600 italic px-2">
            No sound effects active
          </div>
        ) : (
          panels.map((panel: any, idx: number) => {
            const sfx = panel.sfx || panel.sfx_name || panel.sound_fx;
            if (!sfx) return null;

            const key = `a2-${idx}`;
            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={clipClass(
                  key,
                  selectedClip,
                  "bg-cyan-950/80 border-cyan-500/40 text-cyan-200 h-full"
                )}
                style={{
                  left: `${(idx / Math.max(totalPanels, 1)) * 96}%`,
                  width: `${Math.max((1 / Math.max(totalPanels, 1)) * 36, 12)}%`,
                }}
                title={`Panel #${idx + 1} SFX: ${sfx}`}
              >
                <Zap className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                <span className="truncate">{sfx}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(AudioTrackA2);
