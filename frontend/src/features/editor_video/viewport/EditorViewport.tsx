import React, { useState } from "react";
import PlaybackMonitor from "./monitor/PlaybackMonitor";
import { VideoPreviewHeader as MonitorHeader } from "./monitor/MonitorHeader";
import { VideoPreviewSidebar as MonitorSidebar } from "./monitor/MonitorSidebar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";

export interface EditorViewportProps {
  panels: any[];
  videoUrl: string | null;
  setVideoUrl?: (url: string | null) => void;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  activePreviewTab: string;
  setActivePreviewTab?: (tab: string) => void;
  musicTheme: string;
  voiceActor: string;
  navigateTo: (path: string) => void;
  seriesTitle: string;
  chapterNumber: string | number;
  chapterTitle: string;
  targetUrl: string;
  isRendering: boolean;
  renderProgress: number;
  handleRenderFinalVideo: () => void;
  progressStatus: any;
  hasEnoughCredits: boolean;
  addNotification: (...args: any[]) => void;
  onOpenVideoEditor?: () => void;
  variant?: "floating" | "embedded";
}

/**
 * EditorViewport — The central program monitor of the NLE.
 * Replaces the old `preview/VideoPreviewPlayer` component.
 * Organizes into: MonitorHeader | MonitorSidebar | PlaybackMonitor (CinemaPlayer)
 */
const EditorViewport: React.FC<EditorViewportProps> = ({
  panels,
  videoUrl,
  currentPanelIndex,
  setCurrentPanelIndex,
  activePreviewTab,
  setActivePreviewTab,
  musicTheme,
  voiceActor,
  navigateTo,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  isRendering,
  renderProgress,
  handleRenderFinalVideo,
  progressStatus,
  hasEnoughCredits,
  addNotification,
  onOpenVideoEditor,
  variant = "embedded",
}) => {
  const isEmbedded = variant === "embedded";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      id="section-monitor"
      className={
        isEmbedded
          ? "flex flex-col h-full w-full min-h-0 overflow-hidden"
          : "w-full max-w-[1600px] ml-0 mr-0 bg-neutral-900/70 backdrop-blur-lg rounded-2xl border border-neutral-800/90 p-4 sm:p-5 space-y-4 mb-4 scroll-mt-24 shadow-2xl"
      }
    >
      <MonitorHeader
        videoUrl={videoUrl}
        musicTheme={musicTheme}
        voiceActor={voiceActor}
        navigateTo={navigateTo}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        targetUrl={targetUrl}
        isRendering={isRendering}
        renderProgress={renderProgress}
        handleRenderFinalVideo={handleRenderFinalVideo}
        progressStatus={progressStatus}
        hasEnoughCredits={hasEnoughCredits}
        onOpenVideoEditor={onOpenVideoEditor}
        variant={variant}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />

      <div
        className={
          isEmbedded
            ? "flex flex-row flex-1 min-h-0 w-full overflow-hidden"
            : "flex flex-col lg:flex-row gap-5 w-full items-start"
        }
      >
        {/* LEFT: Monitor Sidebar */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
            isEmbedded
              ? isSidebarOpen
                ? "w-56 opacity-100"
                : "w-0 opacity-0"
              : isSidebarOpen
              ? "w-full lg:w-60 opacity-100"
              : "w-0 opacity-0 lg:w-0"
          }`}
        >
          <MonitorSidebar
            panels={panels}
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            setCurrentPanelIndex={setCurrentPanelIndex}
          />
        </div>

        {/* RIGHT: Cinema Player */}
        <div
          className={
            isEmbedded
              ? "flex-1 h-full min-h-0 min-w-0 overflow-hidden relative bg-black"
              : "flex-1 w-full aspect-video rounded-2xl overflow-hidden border border-neutral-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative bg-black min-w-0"
          }
        >
          <PlaybackMonitor
            panels={panels}
            videoUrl={activePreviewTab === "video" ? videoUrl : null}
            currentPanelIndex={currentPanelIndex}
            seriesSlug={null}
            chapterSlug={null}
            navigateTo={() => {}}
            addNotification={addNotification}
            variant={isEmbedded ? "embedded" : "floating"}
            onCloseFloating={() => {
              useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(EditorViewport);
export { EditorViewport };
