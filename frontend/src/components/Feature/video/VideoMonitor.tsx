import React from "react";
import { GeneratedPanel } from "@/types";
import { VideoMonitorTabs } from "./VideoMonitorTabs.js";
import { VideoMonitorActive } from "./VideoMonitorActive.js";

interface VideoMonitorProps {
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  videoUrl: string | null;
  panels: GeneratedPanel[];
  aspectRatio: "9:16" | "16:9";
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  currentPanelIndex: number;
  playbackTime: number;
  reprocessingPanelId: number | null;
  quality?: "draft" | "high";
}

const VideoMonitor = React.memo(({
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
}: VideoMonitorProps) => {
  return (
    <div className="space-y-4">
      <VideoMonitorTabs
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        videoUrl={videoUrl}
        panels={panels}
        aspectRatio={aspectRatio}
      />

      <div className={`transition-all duration-300 ${quality === 'draft' ? 'blur-[1px] brightness-90 grayscale-[0.2]' : ''}`}>
        <VideoMonitorActive
          activePreviewTab={activePreviewTab}
          videoUrl={videoUrl}
          panels={panels}
          aspectRatio={aspectRatio}
          videoPlayerRef={videoPlayerRef}
          currentPanelIndex={currentPanelIndex}
          playbackTime={playbackTime}
          reprocessingPanelId={reprocessingPanelId}
        />
      </div>
    </div>
  );
});

export default VideoMonitor;
