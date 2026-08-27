// ─── TimelineStoryPanelsTrack (V1 Story Panels Track) ───────────────────────────
// Canonical location: timeline/components/tracks/TimelineStoryPanelsTrack.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Keyframe } from "../../types";
import { getProxiedImageUrl } from "@/utils";

export interface PanelTiming {
  index: number;
  duration: number;
  startTime: number;
  endTime: number;
  startPct: number;
  widthPct: number;
}

export interface TimelineStoryPanelsTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  currentPanelIndex: number;
  selectedClip: string | null;
  locked: boolean;
  hidden: boolean;
  keyframesVisible?: boolean;
  keyframesByClip?: Record<string, Keyframe[]>;
  selectedKeyframeId?: string | null;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
  getClipDuration: (key: string) => number;
  onDurationChange?: (key: string, duration: number) => void;
  onSelectKeyframe?: (id: string) => void;
  onCycleEasing?: (clipKey: string, keyframeId: string) => void;
  onAddKeyframe?: (clipKey: string, time: number) => void;
}

export const TimelineStoryPanelsTrack: React.FC<TimelineStoryPanelsTrackProps> = ({
  panels = [],
  panelTimings = [],
  currentPanelIndex,
  selectedClip,
  locked,
  hidden,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
}) => (
  <div className="flex flex-col border-b border-white/[0.04]">
    <div className="h-14 flex items-center">
      <TrackLabel
        id="V1"
        label="Story Panels"
        color="text-white"
        type="video"
        locked={locked}
        hidden={hidden}
        muted={false}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onToggleMute={() => {}}
      />
      <div className="flex-1 relative h-11 mx-1">
        {panels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] font-mono text-neutral-500 border border-dashed border-white/10 rounded-lg px-4 bg-black/20">
            No video panels in storyboard — Add frames from Imported Assets
          </div>
        ) : (
          <div className="relative w-full h-full">
            {panels.map((panel: any, idx: number) => {
              const timing = panelTimings[idx] ?? {
                startPct: (idx / Math.max(panels.length, 1)) * 100,
                widthPct: (1 / Math.max(panels.length, 1)) * 100,
                duration: panel.duration || 3.5,
              };

              const rawUrl =
                panel.image_url ||
                panel.imageUrl ||
                panel.url ||
                panel.original_url ||
                panel.thumbnail ||
                "";
              const imgUrl = rawUrl ? getProxiedImageUrl(rawUrl) : "";
              const isActive = idx === currentPanelIndex;
              const key = `v1-${idx}`;
              const dur = timing.duration;

              return (
                <div
                  key={key}
                  onClick={() => onClipClick(key, idx)}
                  onContextMenu={(e) => onContextMenu(e, key, idx)}
                  className={`absolute top-0 bottom-0 rounded-xl overflow-hidden cursor-pointer transition-all border group select-none ${
                    isActive
                      ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20"
                      : selectedClip === key
                      ? "border-purple-500 ring-1 ring-purple-400 z-10"
                      : "border-white/10 hover:border-purple-400/50"
                  } bg-[#090912]`}
                  style={{
                    left: `${timing.startPct}%`,
                    width: `calc(${timing.widthPct}% - 3px)`,
                  }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`P${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[9px] font-mono text-neutral-500">
                      #{idx + 1}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Panel # Badge */}
                  <span className="absolute bottom-1 left-1 text-[8px] font-mono font-black bg-black/80 text-purple-200 px-1 py-0.2 rounded border border-purple-500/30 leading-tight">
                    #{idx + 1}
                  </span>

                  {/* Duration Tag */}
                  <span className="absolute top-1 right-1 text-[7px] font-mono bg-black/80 text-neutral-300 px-1 rounded">
                    {dur.toFixed(1)}s
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default React.memo(TimelineStoryPanelsTrack);
