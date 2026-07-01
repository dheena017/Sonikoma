import React from "react";
import EditorSidebar from "./EditorSidebar";
import EditorNavbar from "./EditorNavbar";
import LiveScraperDeck from "../scraper/LiveScraperDeck.js";
import StoryboardTimeline from "../timeline/StoryboardTimeline.js";
import VideoMonitor from "../video/VideoMonitor.js";
import VolumeAndProgressPanel from "../video/VolumeAndProgressPanel.js";
import OutputMetadataPanel from "../OutputMetadataPanel.js";
import PipelineStatusCard from "../pipeline/PipelineStatusCard.js";
import { useBackendHealth } from "../../hooks/useBackendHealth.js";

interface EditorPageProps {
  appLogic: any;
  navigateTo: (path: string) => void;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
}

const EditorPage: React.FC<EditorPageProps> = ({
  appLogic,
  navigateTo,
  seriesSlug,
  chapterSlug,
}: EditorPageProps) => {
  void seriesSlug;
  void chapterSlug;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [currentSection, setCurrentSection] = React.useState("timeline");
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const [previewQuality, setPreviewQuality] = React.useState<"draft" | "high">("high");
  const [isInitializing, setIsInitializing] = React.useState(true);

  const { status: backendStatus } = useBackendHealth();

  const {
    projectId,
    panels,
    setPanels,
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
    playStoryboardAudio,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    showAutoCropModal,
    setShowAutoCropModal,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    handleAutoCropSelected,
    handleCleanBubblesSelected,
    handleCancelBatch,
    videoPlayerRef,
    addNotification,
    setErrorPopup,
    fetchWithInterceptor,
    targetUrl,
    selectedSource,
    selectedModel,
    isProcessing,
    handleGenerateVideo,
    isScraping,
    mergingIndices,
    handleStitchWithNext,
    addPanelsToStoryboard,
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
    narrationStyle,
    bubbleSensitivity,
    bubbleDetectionStyle,
    bubbleEraseMethod,
    bubbleDilation,
    bubbleInpaintRadius,
    cropSensitivity,
    cropBackgroundMode,
    aspectRatioLock,
    minPanelAreaPct,
    overlapMergeThreshold,
    useLocalCV,
    autoSplitTallStrips,
    cropModel,
    cropMinHeightPx,
    cropCannyLow,
    cropCannyHigh,
    cropCloseKernelSize,
    seriesTitle,
    chapterNumber,
    chapterTitle,
    autoPlayAudio,
    saveProject,
    audioFeedback,
    isRendering,
    renderProgress,
    handleRenderFinalVideo,
  } = appLogic;

  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
        setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    if (saveProject) {
      setIsSaving(true);
      await saveProject(panels, {
        savingMessage: "Saving project...",
        successMessage: "Project saved successfully!",
        errorMessage: "Failed to save project.",
      });
      setIsSaving(false);
    }
  };

  const handleBackToApp = () => {
    navigateTo("/dashboard");
  };

  // Sync section with modals if needed
  React.useEffect(() => {
    if (currentSection === "autocrop") {
      setShowAutoCropModal(true);
      setCurrentSection("images");
    }
    if (currentSection === "bubbles") {
      setShowBubbleModal(true);
      setCurrentSection("images");
    }
  }, [currentSection]);

  const skeletonLoader = (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-pulse">
       <div className="w-12 h-12 bg-neutral-800 rounded-full" />
       <div className="h-4 w-48 bg-neutral-800 rounded" />
       <div className="h-3 w-32 bg-neutral-900 rounded" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#070709] text-white overflow-hidden">
      {!isFocusMode && (
        <EditorSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          onBackToApp={handleBackToApp}
          scrapedCount={scrapedImages.length}
          panelsCount={panels.length}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
        />
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isFocusMode ? "ml-0" : isSidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <EditorNavbar
          projectId={projectId}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber}
          chapterTitle={chapterTitle}
          onSave={handleSave}
          onCompile={handleGenerateVideo}
          isProcessing={isProcessing}
          isSaving={isSaving}
          backendStatus={backendStatus}
          isFocusMode={isFocusMode}
          toggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          previewQuality={previewQuality}
          setPreviewQuality={setPreviewQuality}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

            {/* TOP AREA: VIDEO MONITOR (Expanded in Focus Mode) */}
            <div className={`grid grid-cols-1 ${isFocusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
               <div className={`${isFocusMode ? 'lg:col-span-1' : 'lg:col-span-7'} flex flex-col gap-6`}>
                  {/* Monitor Container */}
                  <div className={`${isFocusMode ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
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
                      quality={previewQuality}
                    />

                    {panels.length > 0 && (
                      <div className="mt-4">
                        <VolumeAndProgressPanel
                          panels={panels}
                          setPanels={setPanels}
                          currentPanelIndex={currentPanelIndex}
                          playbackTime={playbackTime}
                          storyboardPlaying={storyboardPlaying}
                          toggleStoryboardPlayback={toggleStoryboardPlayback}
                          resetStoryboardPlayback={resetStoryboardPlayback}
                          isMuted={isMuted}
                          setIsMuted={setIsMuted}
                          volume={volume}
                          setVolume={setVolume}
                          addNotification={addNotification}
                        />
                      </div>
                    )}
                  </div>
               </div>

               {/* Right Side Metadata/Render (Hidden in Focus Mode) */}
               {!isFocusMode && (
                 <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#111115] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
                      {isRendering && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-purple-600/20 transition-all duration-300"
                          style={{ width: `${renderProgress}%` }}
                        />
                      )}
                      <div className="relative z-10 space-y-1">
                         <h3 className="text-sm font-bold text-white uppercase tracking-wider">Final Production</h3>
                         <p className="text-[10px] text-neutral-500 font-mono">Compile all storyboard panels into a high-res video.</p>
                      </div>
                      <button
                        onClick={handleRenderFinalVideo}
                        disabled={isRendering}
                        className={`relative z-10 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 ${
                          isRendering
                            ? "bg-purple-900/50 text-purple-200 cursor-not-allowed border border-purple-500/30"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-white/10"
                        }`}
                      >
                        {isRendering ? (
                          <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Rendering {Math.round(renderProgress)}%
                        </>
                        ) : (
                          <>🎬 Export Master Video</>
                        )}
                      </button>
                    </div>

                    <OutputMetadataPanel
                      videoUrl={videoUrl}
                      musicTheme={musicTheme}
                      voiceActor={voiceActor}
                      handleSaveVideo={handleSave}
                    />
                 </div>
               )}
            </div>

            {/* BOTTOM AREA: STORYBOARD & SCRAPER DECK (Always visible in Pro Editor) */}
            <div className={`transition-all duration-500 ${isFocusMode ? 'opacity-20 blur-sm pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
               <div className="flex flex-col gap-10">
                  {isScraping && (
                    <PipelineStatusCard progressStatus={{...progressStatus, status: 'Scraping Assets...'}} />
                  )}

                  {isInitializing && scrapedImages.length === 0 ? skeletonLoader : (
                    <div className="flex flex-col gap-12">
                      {/* Section 1: Scraper Deck */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                           <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">1. Imported Images (Live Scraper Deck)</h3>
                        </div>
                        <LiveScraperDeck
                          isDashboardOnly={false}
                          scrapedImages={scrapedImages}
                          isScraping={isScraping}
                          selectedScraped={selectedScraped}
                          setSelectedScraped={setSelectedScraped}
                          setScrapedImages={setScrapedImages}
                          mergingIndices={mergingIndices}
                          setConsoleLogs={() => {}}
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
                          handleAutoCropSelected={handleAutoCropSelected}
                          handleCleanBubblesSelected={handleCleanBubblesSelected}
                          handleCancelBatch={handleCancelBatch}
                          addPanelsToStoryboard={addPanelsToStoryboard}
                          audioFeedback={audioFeedback}
                          seriesTitle={seriesTitle}
                          chapterNumber={chapterNumber}
                          chapterTitle={chapterTitle}
                          targetUrl={targetUrl}
                          selectedSource={selectedSource}
                        />
                      </div>

                      {/* Section 2: Storyboard Timeline */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                           <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">2. Timeline & Text (Storyboard Timeline)</h3>
                        </div>
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
                          setConsoleLogs={() => {}}
                          voiceActor={voiceActor}
                          musicTheme={musicTheme}
                          narrationStyle={narrationStyle}
                          playStoryboardAudio={playStoryboardAudio}
                          autoPlayAudio={autoPlayAudio}
                          bubbleSensitivity={bubbleSensitivity}
                          bubbleDetectionStyle={bubbleDetectionStyle}
                          bubbleEraseMethod={bubbleEraseMethod}
                          bubbleDilation={bubbleDilation}
                          bubbleInpaintRadius={bubbleInpaintRadius}
                          cropSensitivity={cropSensitivity}
                          cropBackgroundMode={cropBackgroundMode}
                          aspectRatioLock={aspectRatioLock}
                          minPanelAreaPct={minPanelAreaPct}
                          overlapMergeThreshold={overlapMergeThreshold}
                          useLocalCV={useLocalCV}
                          saveProject={saveProject}
                          cropModel={cropModel}
                          cropMinHeightPx={cropMinHeightPx}
                          cropCannyLow={cropCannyLow}
                          cropCannyHigh={cropCannyHigh}
                          cropCloseKernelSize={cropCloseKernelSize}
                          autoSplitTallStrips={autoSplitTallStrips}
                          handleSaveStoryboard={handleSave}
                          handleCancelBatch={handleCancelBatch}
                          audioFeedback={audioFeedback}
                        />
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(EditorPage);
