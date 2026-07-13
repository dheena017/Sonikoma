import React from "react";
import { GeneratedPanel } from "@/types";
import { VideoMonitorTabs } from "./VideoMonitorTabs.js";
import CinemaPlayer from "./CinemaPlayer.js";

interface VideoMonitorProps {
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  videoUrl: string | null;
  panels: GeneratedPanel[];
  aspectRatio: "auto" | "9:16" | "16:9";
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  currentPanelIndex: number;
  playbackTime: number;
  reprocessingPanelId: number | null;
  quality?: "draft" | "high";
  storyboardPlaying: boolean;
  isMuted?: boolean;
  setCurrentPanelIndex: (idx: number) => void;
  setPlaybackTime: (time: number) => void;
  setStoryboardPlaying: (playing: boolean) => void;
  setIsMuted?: (muted: boolean) => void;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
}

const VideoMonitor = React.memo(
  ({
    activePreviewTab,
    setActivePreviewTab,
    videoUrl,
    panels,
    aspectRatio,
    videoPlayerRef,
    currentPanelIndex,
    playbackTime,
    reprocessingPanelId,
    quality,
    storyboardPlaying,
    isMuted = false,
    setCurrentPanelIndex,
    setPlaybackTime,
    setStoryboardPlaying,
    setIsMuted,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
  }: VideoMonitorProps) => {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md rounded-xl p-1 border border-white/10 hidden md:block">
          <VideoMonitorTabs
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            videoUrl={videoUrl}
            panels={panels}
            aspectRatio={aspectRatio}
          />
        </div>

        <div
          className={`w-full h-full max-h-screen flex items-center justify-center transition-all duration-300 ${
            quality === "draft"
              ? "blur-[1px] brightness-90 grayscale-[0.2]"
              : ""
          }`}
        >
          {/* CinemaPlayer renders beautifully as the premium main player.
              When activePreviewTab === "video", it plays back compiled MP4 content.
              When activePreviewTab === "timeline", it plays back interactive canvas/panels. */}
          <CinemaPlayer
            panels={panels}
            videoUrl={activePreviewTab === "video" ? videoUrl : null}
            seriesSlug={null}
            chapterSlug={null}
            navigateTo={() => {}}
            addNotification={() => {}}
          />
        </div>
      </div>
    );
  }
);

export default VideoMonitor;
