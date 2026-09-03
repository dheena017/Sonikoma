import React from "react";
import PlaybackMonitor from "@/features/editor_video/viewport/monitor/PlaybackMonitor";
import StudioVideoPreviewHeader from "./StudioVideoPreviewHeader";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";

export interface StudioVideoPreviewProps {
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
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

/**
 * StudioVideoPreview — Dedicated Top Panel of the 3-panel Studio Editor (/editor).
 * Uses the unified 3-panel glassmorphism card frame matching Storyboard and Imported Assets.
 */
const StudioVideoPreview: React.FC<StudioVideoPreviewProps> = ({
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
  onSave,
  isSaving = false,
  isDirty = false,
}) => {
  return (
    <div
      id="studio_video_preview_deck"
      className="bg-[#0c0d16]/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 sm:p-5 lg:p-6 space-y-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] min-w-0 w-full flex-1 flex flex-col select-none"
    >
      <StudioVideoPreviewHeader
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
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        panelsCount={panels?.length || 0}
        onSave={onSave}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      {/* Cinema Playback Screen Canvas */}
      <div className="w-full flex-1 min-h-[340px] sm:min-h-[400px] overflow-hidden relative rounded-2xl border border-purple-500/20 bg-black min-w-0 flex flex-col">
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
      </div>
    </div>
  );
};

export default React.memo(StudioVideoPreview);
export { StudioVideoPreview, StudioVideoPreview as VideoPreviewDeck };
