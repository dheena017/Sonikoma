import React from "react";
import { GeneratedPanel } from "../../types.js";
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
}

export default function VideoMonitor({
  activePreviewTab,
  setActivePreviewTab,
  videoUrl,
  panels,
  aspectRatio,
  videoPlayerRef,
  currentPanelIndex,
  playbackTime,
  reprocessingPanelId,
}: VideoMonitorProps) {
  return (
    <div className="space-y-4">
      <VideoMonitorTabs
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        videoUrl={videoUrl}
        panels={panels}
        aspectRatio={aspectRatio}
      />

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
  );
}
