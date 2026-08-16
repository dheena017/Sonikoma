import React, { useState } from "react";
import PlaybackMonitor from "./monitor/PlaybackMonitor";
import BlankViewport from "./BlankViewport";
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
  allowEditorTab?: boolean;
  zoomLevel?: number;
  onZoomLevelChange?: (zoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
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
  allowEditorTab = false,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const isEmbedded = variant === "embedded";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      id="section-monitor"
      className="w-full bg-[#0c0d16]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 sm:p-5 space-y-4 mb-4 scroll-mt-24 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col min-w-0"
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
        onOpenVideoEditor={onOpenVideoEditor ?? (() => {})}
        variant={variant}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        panelsCount={panels?.length || 0}
        allowEditorTab={allowEditorTab}
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />

      {/* RIGHT: Cinema Player or Blank Viewport */}
      <div
        className="w-full h-[460px] sm:h-[540px] md:h-[600px] lg:h-[660px] max-h-[75vh] rounded-2xl overflow-hidden border border-neutral-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative bg-[#09090f] min-w-0"
      >
        {activePreviewTab === "editor" ? (
          <BlankViewport panels={panels} currentPanelIndex={currentPanelIndex} />
        ) : (
          <PlaybackMonitor
            panels={panels}
            videoUrl={activePreviewTab === "video" ? videoUrl : null}
            mode={activePreviewTab}
            currentPanelIndex={currentPanelIndex}
            seriesSlug={null}
            chapterSlug={null}
            navigateTo={() => {}}
            addNotification={addNotification}
            variant="embedded"
            onCloseFloating={() => {
              useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(EditorViewport);
export { EditorViewport };
