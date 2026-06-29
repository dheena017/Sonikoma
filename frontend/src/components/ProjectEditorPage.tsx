import React from "react";
import {
  ArrowLeft,
  Film,
  Scissors,
  Sparkles,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Settings,
} from "lucide-react";
import StoryboardTimeline from "./timeline/StoryboardTimeline.js";
import VideoMonitor from "./video/VideoMonitor.js";
import VolumeAndProgressPanel from "./video/VolumeAndProgressPanel.js";
import OutputMetadataPanel from "./OutputMetadataPanel.js";

interface ProjectEditorPageProps {
  appLogic: any;
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
}

const ProjectEditorPage = React.memo(({
  appLogic,
  onNavigateHome,
  navigateTo,
}: ProjectEditorPageProps) => {
  const {
    panels,
    setPanels,
    projectId,
    isGeneratingStoryboard,
    handleGenerateStoryboardAI,
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
    setNarrationStyle,
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
    saveProject,
  } = appLogic;

  // Compute stats
  const totalDuration = panels.reduce(
    (acc: number, curr: any) => acc + (curr.duration || 4),
    0
  );

  return (
    <div className="flex-1 w-full min-h-screen bg-[#060608] text-neutral-100 flex flex-col font-sans">
      {/* 1. PREMIUM HEADER */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo("/profile")}
            className="group flex items-center justify-center p-2.5 rounded-xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-300">
                Active Workspace Editor
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                ID: {projectId}
              </span>
            </div>
            <h1 className="text-lg font-black text-white leading-tight truncate max-w-md md:max-w-xl">
              {seriesTitle || "Untitled Project"}
              {(chapterNumber || chapterTitle) && (
                <span className="text-neutral-400 font-semibold ml-2">
                  — Chapter {chapterNumber || "?"}{" "}
                  {chapterTitle && `(${chapterTitle})`}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Right: Info Badges & Compile Button */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-neutral-900/40 border border-white/5 text-[10px] font-mono text-neutral-400">
            <div>
              Panels:{" "}
              <span className="text-purple-300 font-bold">{panels.length}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div>
              Est. Length:{" "}
              <span className="text-purple-300 font-bold">
                {totalDuration}s
              </span>
            </div>
          </div>

          {/* Quick Action: Save Project */}
          <button
            onClick={async () => {
              if (saveProject) {
                await saveProject(panels, {
                  savingMessage: "Saving progress...",
                  successMessage: "Progress saved successfully!",
                  errorMessage: "Failed to save progress.",
                });
              }
            }}
            className="px-4 py-2 border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Save Progress
          </button>

          {/* Core Video Compile Button */}
          <button
            onClick={handleGenerateVideo}
            disabled={isProcessing || panels.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/30 hover:border-purple-400/50 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-3.5 h-3.5" />
            {isProcessing ? "Rendering Video..." : "Compile & Render Video"}
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: EDITING TOOLS & Storyboard Timeline (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-8 min-w-0">
          {/* QUICK EDITOR CONFIG CARD */}
          <div className="bg-neutral-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Workspace Quick Editors
              </span>
              <span className="text-[10px] text-neutral-500 font-bold font-mono">
                Asset Processing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Batch Auto-Crop */}
              <div className="flex flex-col justify-between p-4 bg-neutral-950/60 border border-white/5 rounded-2xl gap-3 hover:border-purple-500/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-purple-400" />
                    1. Auto-Crop Storyboard
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                    Detect panel boundaries automatically or fine-tune
                    sensitivity &amp; padding parameters.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setShowAutoCropModal(true)}
                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-xl transition-all border border-white/5 cursor-pointer text-center"
                  >
                    Configure Auto-Crop
                  </button>
                  {isBatchCropping ? (
                    <button
                      onClick={() =>
                        appLogic.handleCancelBatch &&
                        appLogic.handleCancelBatch()
                      }
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Stop Cropping
                    </button>
                  ) : (
                    <button
                      onClick={handleAutoCropSelected}
                      disabled={scrapedImages.length === 0}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      Run Crop
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Speech Bubble Cleaner */}
              <div className="flex flex-col justify-between p-4 bg-neutral-950/60 border border-white/5 rounded-2xl gap-3 hover:border-purple-500/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    2. Clean Speech Bubbles
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                    Speech bubble detection and clearing to remove text from
                    comic panels.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setShowBubbleModal(true)}
                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-xl transition-all border border-white/5 cursor-pointer text-center"
                  >
                    Configure Clearing
                  </button>
                  {isCleaningBubbles ? (
                    <button
                      onClick={() =>
                        appLogic.handleCancelBatch &&
                        appLogic.handleCancelBatch()
                      }
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Stop Clean
                    </button>
                  ) : (
                    <button
                      onClick={handleCleanBubblesSelected}
                      disabled={scrapedImages.length === 0}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      Run Clean
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE SECTION */}
          {panels.length > 0 && (
            <div className="bg-neutral-900/20 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                  Dialogue &amp; Timeline Editor
                </span>
                <span className="text-[10px] text-neutral-500 font-bold font-mono">
                  Step 3: Storyboard Editing
                </span>
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
                setConsoleLogs={setConsoleLogs}
                voiceActor={voiceActor}
                musicTheme={musicTheme}
                narrationStyle={narrationStyle}
                playStoryboardAudio={playStoryboardAudio}
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
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PREVIEW PLAYER & OUTPUT METADATA (col-span-5) */}
        {panels.length > 0 && (
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            {/* Monitor Preview */}
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

            {/* Playback accessories */}
            {activePreviewTab === "storyboard" && panels.length > 0 && (
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
            )}

            {/* Output settings preview */}
            <OutputMetadataPanel
              videoUrl={videoUrl}
              musicTheme={musicTheme}
              voiceActor={voiceActor}
            />

            {/* Imported Images Quick Edit Deck */}
            <div className="bg-neutral-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
                Stitch &amp; Merge Panel Deck
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono">
                Directly edit crop bounds or stitch consecutive panel strips
                together.
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => {
                    setEditingImageIdx(0);
                    navigateTo(`/editor/crop?idx=0`);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-950/60 border border-white/5 rounded-xl hover:border-purple-500/20 text-neutral-200 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  Manual Crop Canvas
                </button>
                <button
                  onClick={() => {
                    setEditingImageIdx(0);
                    navigateTo(`/editor/merge?idx=0`);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-950/60 border border-white/5 rounded-xl hover:border-purple-500/20 text-neutral-200 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                  Merge Panel Canvas
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

export default ProjectEditorPage;
