import React from "react";
import PlaybackMonitor from "./monitor/PlaybackMonitor";
import BlankViewport from "./BlankViewport";
import { VideoPreviewHeader as MonitorHeader } from "./monitor/MonitorHeader";
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

  return (
    <div
      id="section-monitor"
      className="w-full h-full flex-1 bg-[#0c0d16]/95 flex flex-col min-w-0 min-h-0 overflow-hidden select-none"
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
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        panelsCount={panels?.length || 0}
        allowEditorTab={allowEditorTab}
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />

      {/* Cinema Player or Blank Viewport */}
      <div className="w-full flex-1 min-h-0 overflow-hidden relative bg-black min-w-0 flex flex-col">
        {activePreviewTab === "editor" ? (
          <BlankViewport
            panels={panels}
            currentPanelIndex={currentPanelIndex}
          />
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
              useImageEditorStore
                .getState()
                .setPlayerSettings({ isPlayerOpen: false });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(EditorViewport);
export { EditorViewport };
