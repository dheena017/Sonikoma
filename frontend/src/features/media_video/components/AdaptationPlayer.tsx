import React from "react";
import CinemaPlayer from "@/features/media_video/components/CinemaPlayer";
import AdaptationPlayerHeader from "@/features/media_video/components/AdaptationPlayerHeader";
import AdaptationPlayerSidebar from "@/features/media_video/components/AdaptationPlayerSidebar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";

interface AdaptationPlayerProps {
  panels: any[];
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  activePreviewTab: string;
  setActivePreviewTab: ((tab: string) => void) | undefined;
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
  onOpenVideoEditor: () => void;
  /** 'floating' = EditorPage overlay (default), 'embedded' = inside VideoEditorPage */
  variant?: "floating" | "embedded";
}

const AdaptationPlayer: React.FC<AdaptationPlayerProps> = ({
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
  variant = "floating",
}) => {
  return (
    <div
      id="section-monitor"
      className={variant === "embedded"
        ? "flex flex-col h-full w-full min-h-0 overflow-hidden"
        : "w-full max-w-[1600px] ml-0 mr-0 bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 mb-4 scroll-mt-24"
      }
    >
      {/* Adaptation Player Header */}
      <AdaptationPlayerHeader
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
      />

      {/* Video Monitor Split Layout with Internal Left Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* IN-PANEL LEFT SIDEBAR */}
        <AdaptationPlayerSidebar
          panels={panels}
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          setCurrentPanelIndex={setCurrentPanelIndex}
        />

        {/* RIGHT: Video Player */}
        <div className="flex-1 w-full aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-2xl relative bg-black min-w-0">
          <CinemaPlayer
            panels={panels}
            videoUrl={activePreviewTab === "video" ? videoUrl : null}
            currentPanelIndex={currentPanelIndex}
            seriesSlug={null}
            chapterSlug={null}
            navigateTo={() => { }}
            addNotification={addNotification}
            variant="floating"
            onCloseFloating={() => {
              useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdaptationPlayer);

