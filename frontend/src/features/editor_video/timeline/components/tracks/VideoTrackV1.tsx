// ─── VideoTrackV1 (Main Video) ────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/VideoTrackV1.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Keyframe } from "../../types";
import { getProxiedImageUrl } from "@/utils";

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
  panels = [],
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
        {panels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] font-mono text-neutral-500 border border-dashed border-white/10 rounded-lg px-4 bg-black/20">
            No video panels in storyboard — Add frames from Imported Assets
          </div>
        ) : (
          <div className="flex items-center gap-1.5 h-full">
            {panels.map((panel: any, idx: number) => {
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
              const dur = panel.duration || getClipDuration(key) || 3.5;

              return (
                <div
                  key={key}
                  onClick={() => onClipClick(key, idx)}
                  onContextMenu={(e) => onContextMenu(e, key, idx)}
                  className={`h-full rounded-xl overflow-hidden relative flex-none cursor-pointer transition-all border group select-none ${
                    isActive
                      ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)] w-20"
                      : selectedClip === key
                      ? "border-purple-500 ring-1 ring-purple-400 w-16"
                      : "border-white/10 hover:border-purple-400/50 w-14"
                  } bg-[#090912]`}
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
                    {dur}s
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

export default React.memo(VideoTrackV1);
