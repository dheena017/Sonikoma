// ─── TimelineSoundFxTrack (A2 Sound FX Track) ─────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineSoundFxTrack.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Zap } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";

export interface TimelineSoundFxTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
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
  return `absolute top-0 bottom-0 flex items-center gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2 ${base} ${
    selectedClip === key
      ? "ring-2 ring-cyan-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

export const TimelineSoundFxTrack: React.FC<TimelineSoundFxTrackProps> = ({
  panels = [],
  panelTimings = [],
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
        label="Sound FX"
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

            const timing = panelTimings[idx] ?? {
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
            };

            const key = `a2-${idx}`;
            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={clipClass(
                  key,
                  selectedClip,
                  "bg-cyan-950/80 border-cyan-500/40 text-cyan-200"
                )}
                style={{
                  left: `${timing.startPct}%`,
                  width: `calc(${timing.widthPct}% - 3px)`,
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

export default React.memo(TimelineSoundFxTrack);
