import React from "react";
import UrlInputPanel from "./scraper/UrlInputPanel.tsx";
import LiveScraperDeck from "./scraper/LiveScraperDeck.tsx";
import PipelineStatusCard from "./pipeline/PipelineStatusCard.tsx";
import TerminalLogs from "./terminal/TerminalLogs.tsx";
import StoryboardTimeline from "./timeline/StoryboardTimeline.tsx";
import VideoMonitor from "./video/VideoMonitor.tsx";
import FinalVideoPlayer from "./video/FinalVideoPlayer.tsx";
import VolumeAndProgressPanel from "./video/VolumeAndProgressPanel.tsx";
import OutputMetadataPanel from "./OutputMetadataPanel.js";

interface AppWorkspaceProps {
  panels: any[];
  setPanels: any;
  consoleLogs: string[];
  setConsoleLogs: any;
  scrapedImages: string[];
  setScrapedImages: any;
  selectedScraped: string[];
  setSelectedScraped: any;
  activePreviewTab: "video" | "storyboard";
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setEditingImageIdx: (idx: number | null) => void;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  setEditAutoTrim: (v: boolean) => void;
  showBubbleModal: boolean;
  setShowBubbleModal: (v: boolean) => void;
  isCleaningBubbles: boolean;
  cleanProgress: any;
  bubbleCroppingImgUrl: string | null;
  showAutoCropModal: boolean;
  setShowAutoCropModal: (v: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: any;
  croppingImgUrl: string | null;
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  addNotification: any;
  setErrorPopup: any;
  fetchWithInterceptor: any;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedSource: string;
  setSelectedSource: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isProcessing: boolean;
  handleGenerateVideo: () => void;
  isScraping: boolean;
  mergingIndices: number[];
  handleStitchWithNext: (idx: number) => Promise<void>;
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
  progressStatus: any;
  videoUrl: string | null;
  setVideoUrl: any;
  aspectRatio: "9:16" | "16:9";
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  playbackTime: number;
  setPlaybackTime: (time: number) => void;
  reprocessingPanelId: number | null;
  storyboardPlaying: boolean;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  musicTheme: string;
  voiceActor: string;
}

export function AppWorkspace({
  panels,
  setPanels,
  consoleLogs,
  setConsoleLogs,
  scrapedImages,
  setScrapedImages,
  selectedScraped,
  setSelectedScraped,
  activePreviewTab,
  setActivePreviewTab,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  showBubbleModal,
  setShowBubbleModal,
  isCleaningBubbles,
  cleanProgress,
  bubbleCroppingImgUrl,
  showAutoCropModal,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  croppingImgUrl,
  videoPlayerRef,
  addNotification,
  setErrorPopup,
  fetchWithInterceptor,
  targetUrl,
  setTargetUrl,
  selectedSource,
  setSelectedSource,
  selectedModel,
  setSelectedModel,
  isProcessing,
  handleGenerateVideo,
  isScraping,
  mergingIndices,
  handleStitchWithNext,
  addPanelsWithAutoAnalysis,
  progressStatus,
  videoUrl,
  setVideoUrl,
  aspectRatio,
  currentPanelIndex,
  setCurrentPanelIndex,
  playbackTime,
  setPlaybackTime,
  reprocessingPanelId,
  storyboardPlaying,
  toggleStoryboardPlayback,
  resetStoryboardPlayback,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  musicTheme,
  voiceActor,
}: AppWorkspaceProps) {
  return (
    <main id="main_workspace" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
      
      {/* LEFT COLUMN: SOURCE INTEGRATION */}
      <div id="controls_column" className="order-1 lg:order-1 lg:col-span-7 flex flex-col gap-6 md:gap-8">
        
        {/* CONVERSION INPUT CARD */}
        <UrlInputPanel
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isProcessing={isProcessing}
          handleGenerateVideo={handleGenerateVideo}
          addNotification={addNotification}
        />

        {/* SEPARATED IMAGE STRIPS GALLERY */}
        <LiveScraperDeck
          scrapedImages={scrapedImages}
          isScraping={isScraping}
          selectedScraped={selectedScraped}
          setSelectedScraped={setSelectedScraped}
          setScrapedImages={setScrapedImages}
          mergingIndices={mergingIndices}
          setConsoleLogs={setConsoleLogs}
          panels={panels}
          setPanels={setPanels}
          currentPanelIndex={currentPanelIndex}
          handleMergeWithNext={handleStitchWithNext}
          setEditingImageIdx={setEditingImageIdx}
          openEditingImageIdx={setEditingImageIdx}
          setEditCropTop={setEditCropTop}
          setEditCropBottom={setEditCropBottom}
          setEditCropLeft={setEditCropLeft}
          setEditCropRight={setEditCropRight}
          setEditAutoTrim={setEditAutoTrim}
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          setErrorPopup={setErrorPopup}
          showBubbleModal={showBubbleModal}
          setShowBubbleModal={setShowBubbleModal}
          isCleaningBubbles={isCleaningBubbles}
          cleanProgress={cleanProgress}
          bubbleCroppingImgUrl={bubbleCroppingImgUrl}
          showAutoCropModal={showAutoCropModal}
          setShowAutoCropModal={setShowAutoCropModal}
          isBatchCropping={isBatchCropping}
          batchProgress={batchProgress}
          croppingImgUrl={croppingImgUrl}
          addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
        />

        {/* ACTIVE QUEUE / LIVE PIPELINE PROGRESS */}
        {isProcessing && (
          <PipelineStatusCard progressStatus={progressStatus} />
        )}

        {/* REAL-TIME LOG MONITOR — Always visible */}
        <TerminalLogs consoleLogs={consoleLogs} setConsoleLogs={setConsoleLogs} />

        {/* DYNAMIC STORYBOARD TIMELINE DECK (hidden when empty to save vertical space on mobile) */}
        {panels.length > 0 && (
          <div id="storyboard_timeline_section">
            <StoryboardTimeline
              panels={panels}
              setPanels={setPanels}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              activePreviewTab={activePreviewTab}
              setActivePreviewTab={setActivePreviewTab}
              setPlaybackTime={setPlaybackTime}
              hasScrapedImages={scrapedImages.length > 0}
              setVideoUrl={setVideoUrl}
              addNotification={addNotification}
              targetUrl={targetUrl}
              fetchWithInterceptor={fetchWithInterceptor}
              selectedModel={selectedModel}
              setConsoleLogs={setConsoleLogs}
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: INTEGRATED CINEMA PLAYER */}
      <div id="cinema_column" className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
        <VideoMonitor
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          videoUrl={videoUrl}
          panels={panels}
          aspectRatio={aspectRatio}
          videoPlayerRef={videoPlayerRef}
          currentPanelIndex={currentPanelIndex}
          playbackTime={playbackTime}
          reprocessingPanelId={reprocessingPanelId}
        />

        {/* SECTION: FINAL COMPILED VIDEO PREVIEW */}
        {videoUrl && (
          <FinalVideoPlayer videoUrl={videoUrl} aspectRatio={aspectRatio} />
        )}

        {/* PLAYBACK CONTROLLER ACCESSORIES FOR STORYBOARD PREVIEW */}
        {activePreviewTab === "storyboard" && panels.length > 0 && (
          <VolumeAndProgressPanel
            panels={panels}
            currentPanelIndex={currentPanelIndex}
            playbackTime={playbackTime}
            storyboardPlaying={storyboardPlaying}
            toggleStoryboardPlayback={toggleStoryboardPlayback}
            resetStoryboardPlayback={resetStoryboardPlayback}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            volume={volume}
            setVolume={setVolume}
          />
        )}

        {/* AI Model Capabilities panel intentionally removed */}

        {/* METADATA RENDER MATRIX */}
        <OutputMetadataPanel
          videoUrl={videoUrl}
          musicTheme={musicTheme}
          voiceActor={voiceActor}
        />
      </div>
    </main>
  );
}
