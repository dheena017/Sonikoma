// ─── TimelineSubtitlesTrack (V3 Subtitles & Text Overlay Track) ────────────────
// Canonical location: timeline/components/tracks/TimelineSubtitlesTrack.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Type } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";

export interface TimelineSubtitlesTrackProps {
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
      ? "ring-2 ring-purple-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

export const TimelineSubtitlesTrack: React.FC<TimelineSubtitlesTrackProps> = ({
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
      id="V3"
      label="Subtitles"
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
          panel.text_narration ||
          panel.caption ||
          panel.speech_text ||
          panel.narrative;
        if (!text) return null;

        const timing = panelTimings[idx] ?? {
          startPct: (idx / Math.max(panels.length, 1)) * 100,
          widthPct: (1 / Math.max(panels.length, 1)) * 100,
        };

        const key = `v3-${idx}`;
        return (
          <div
            key={key}
            onClick={() => onClipClick(key, idx)}
            onContextMenu={(e) => onContextMenu(e, key, idx)}
            className={clipClass(
              key,
              selectedClip,
              "bg-purple-950/80 border-purple-500/40 text-purple-200"
            )}
            style={{
              left: `${timing.startPct}%`,
              width: `calc(${timing.widthPct}% - 3px)`,
            }}
            title={`Subtitle #${idx + 1}: "${text}"`}
          >
            <Type className="h-2.5 w-2.5 text-purple-300 shrink-0" />
            <span className="truncate">"{text}"</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default React.memo(TimelineSubtitlesTrack);
