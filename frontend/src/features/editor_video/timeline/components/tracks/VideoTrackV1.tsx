// ─── VideoTrackV1 (Main Video) ────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/VideoTrackV1.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import ClipBlock from "../clips/ClipBlock";
import KeyframeTrack from "../keyframes/KeyframeTrack";
import { Keyframe } from "../../types";

interface VideoTrackV1Props {
  panels: any[];
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

const VideoTrackV1: React.FC<VideoTrackV1Props> = ({
  panels,
  currentPanelIndex,
  selectedClip,
  locked,
  hidden,
  keyframesVisible = false,
  keyframesByClip = {},
  selectedKeyframeId = null,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
  getClipDuration,
  onDurationChange,
  onSelectKeyframe,
  onCycleEasing,
  onAddKeyframe,
}) => (
  <div className="flex flex-col border-b border-white/[0.04]">
    <div className="h-14 flex items-center">
      <TrackLabel
        id="V1"
        label="Video"
        color="text-white"
        type="video"
        locked={locked}
        hidden={hidden}
        muted={false}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onToggleMute={() => {}}
      />
      <div className="flex-1 relative h-11 mx-1 overflow-x-auto [scrollbar-width:none]">
        <div className="flex items-center gap-1 h-full">
          {panels.map((panel: any, idx: number) => {
            const imgUrl =
              panel.thumbnail ||
              panel.image_url ||
              panel.img_url ||
              panel.panel_url ||
              panel.imageUrl ||
              panel.url ||
              panel.original_url ||
              panel.src ||
              `https://placehold.co/100x160/1a1a24/a855f7?text=${idx + 1}`;
            const isActive = idx === currentPanelIndex;
            const key = `v1-${idx}`;
            const dur = getClipDuration(key);
            const clipKeyframes = keyframesByClip[key] ?? [];

            return (
              <React.Fragment key={key}>
                <div
                  onClick={() => onClipClick(key, idx)}
                  onContextMenu={(e) => onContextMenu(e, key, idx)}
                  className={`h-full rounded-lg overflow-hidden relative flex-none cursor-pointer transition-all border group ${
                    isActive
                      ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.45)] w-16"
                      : "border-white/10 hover:border-purple-400/50 w-11"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`P${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-0.5 left-0.5 text-[7px] font-mono font-black bg-black/60 text-purple-300 px-0.5 rounded leading-tight">
                    #{idx + 1}
                  </span>
                  {isActive && (
                    <div className="absolute inset-0 bg-purple-500/10" />
                  )}
                  <span className="absolute top-0.5 right-0.5 text-[7px] font-mono bg-black/80 text-white px-0.5 rounded leading-tight font-bold">
                    {dur.toFixed(1)}s
                  </span>
                </div>

                {/* Transition gap marker */}
                {idx < panels.length - 1 && (
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#1a1a24] border border-white/10 text-[7px] font-bold text-neutral-600 flex items-center justify-center cursor-pointer hover:text-purple-300 hover:border-purple-500/50 shrink-0 transition-colors">
                    ?
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>

    {/* Keyframe Sub-row */}
    {keyframesVisible && (
      <div className="flex items-center">
        <div className="w-28 shrink-0 border-r border-white/5 h-3 bg-black/50 text-[8px] font-mono text-neutral-500 flex items-center px-3">
          <span>Keyframes</span>
        </div>
        <div className="flex-1 mx-1">
          {panels.map((_, idx) => {
            const key = `v1-${idx}`;
            const dur = getClipDuration(key);
            const kfs = keyframesByClip[key] ?? [];

            return (
              <KeyframeTrack
                key={key}
                clipKey={key}
                clipDuration={dur}
                keyframes={kfs}
                selectedKeyframeId={selectedKeyframeId}
                onSelectKeyframe={(id) => onSelectKeyframe?.(id)}
                onCycleEasing={(kfId) => onCycleEasing?.(key, kfId)}
                onAddKeyframe={(t) => onAddKeyframe?.(key, t)}
              />
            );
          })}
        </div>
      </div>
    )}
  </div>
);

export default React.memo(VideoTrackV1);
