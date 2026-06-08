import React from "react";
import { useAppLogic } from "./hooks/useAppLogic.js";

// Child Components
import Header from "./components/Header.js";
import CropEditorModal from "./components/CropEditorModal.js";
import BubbleCleanerModal from "./components/processing/BubbleCleanerModal.js";
import AutoCropModal from "./components/processing/AutoCropModal.js";
import NotificationStack from "./components/NotificationStack.js";
import ErrorPopupModal from "./components/ErrorPopupModal.js";
import { AppWorkspace } from "./components/AppWorkspace.js";

export default function App() {
  const appLogic = useAppLogic();
  const {
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
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    setEditAutoTrim,
    imageEditStates,
    setImageEditStates,
    showBubbleModal,
    setShowBubbleModal,
    bubbleDetectionStyle,
    setBubbleDetectionStyle,
    bubbleEraseMethod,
    setBubbleEraseMethod,
    bubbleSensitivity,
    setBubbleSensitivity,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    showAutoCropModal,
    setShowAutoCropModal,
    cropSensitivity,
    setCropSensitivity,
    cropPaddingPx,
    setCropPaddingPx,
    cropBackgroundMode,
    setCropBackgroundMode,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    processingStrategy,
    setProcessingStrategy,
    aspectRatioLock,
    setAspectRatioLock,
    minPanelAreaPct,
    setMinPanelAreaPct,
    overlapMergeThreshold,
    setOverlapMergeThreshold,
    useLocalCV,
    setUseLocalCV,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    videoPlayerRef,
    notifications,
    errorPopup,
    setErrorPopup,
    addNotification,
    removeNotification,
    fetchWithInterceptor,
    targetUrl,
    setTargetUrl,
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    storyboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    videoUrl,
    setVideoUrl,
    reprocessingPanelId,
    isSavingEdit,
    handleGenerateVideo,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
    addPanelsWithAutoAnalysis,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    totalCalculatedDuration,
  } = useAppLogic();

  return (
    <div id="app_root" className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      
      {/* BRANDING HEADER */}
      <Header 
        isProcessing={isProcessing} 
        panels={panels} 
        totalCalculatedDuration={totalCalculatedDuration}
      />

      {/* WORKSPACE AREA — AutoCropModal / BubbleCleanerModal / CropEditorModal / Main Grid */}
      {showAutoCropModal ? (
        <AutoCropModal
          onClose={() => setShowAutoCropModal(false)}
          onApply={() => { setShowAutoCropModal(false); handleAutoCropSelected(); }}
          sensitivity={cropSensitivity}
          setSensitivity={setCropSensitivity}
          padding={cropPaddingPx}
          setPadding={setCropPaddingPx}
          backgroundColorMode={cropBackgroundMode}
          setBackgroundColorMode={setCropBackgroundMode}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
          processingStrategy={processingStrategy}
          setProcessingStrategy={setProcessingStrategy}
          aspectRatioLock={aspectRatioLock}
          setAspectRatioLock={setAspectRatioLock}
          minPanelAreaPct={minPanelAreaPct}
          setMinPanelAreaPct={setMinPanelAreaPct}
          overlapMergeThreshold={overlapMergeThreshold}
          setOverlapMergeThreshold={setOverlapMergeThreshold}
          useLocalCV={useLocalCV}
          setUseLocalCV={setUseLocalCV}
          selectedCount={selectedScraped.length}
          isApplying={isBatchCropping}
        />
      ) : showBubbleModal ? (
        <BubbleCleanerModal
          onClose={() => setShowBubbleModal(false)}
          onApply={() => { setShowBubbleModal(false); handleCleanBubblesSelected(); }}
          detectionStyle={bubbleDetectionStyle}
          setDetectionStyle={setBubbleDetectionStyle}
          eraseMethod={bubbleEraseMethod}
          setEraseMethod={setBubbleEraseMethod}
          sensitivity={bubbleSensitivity}
          setSensitivity={setBubbleSensitivity}
          selectedCount={selectedScraped.length}
          isApplying={isCleaningBubbles}
        />
      ) : (
        <AppWorkspace
          panels={panels}
          setPanels={setPanels}
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
          scrapedImages={scrapedImages}
          setScrapedImages={setScrapedImages}
          selectedScraped={selectedScraped}
          setSelectedScraped={setSelectedScraped}
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          setEditingImageIdx={setEditingImageIdx}
          setEditCropTop={setEditCropTop}
          setEditCropBottom={setEditCropBottom}
          setEditCropLeft={setEditCropLeft}
          setEditCropRight={setEditCropRight}
          setEditAutoTrim={setEditAutoTrim}
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
          videoPlayerRef={videoPlayerRef}
          addNotification={addNotification}
          setErrorPopup={setErrorPopup}
          fetchWithInterceptor={fetchWithInterceptor}
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isProcessing={isProcessing}
          handleGenerateVideo={handleGenerateVideo}
          isScraping={isScraping}
          mergingIndices={mergingIndices}
          handleStitchWithNext={handleStitchWithNext}
          addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
          progressStatus={progressStatus}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          aspectRatio={aspectRatio}
          currentPanelIndex={currentPanelIndex}
          setCurrentPanelIndex={setCurrentPanelIndex}
          playbackTime={playbackTime}
          setPlaybackTime={setPlaybackTime}
          reprocessingPanelId={reprocessingPanelId}
          storyboardPlaying={storyboardPlaying}
          toggleStoryboardPlayback={toggleStoryboardPlayback}
          resetStoryboardPlayback={resetStoryboardPlayback}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          volume={volume}
          setVolume={setVolume}
          musicTheme={musicTheme}
          voiceActor={voiceActor}
        />
      )}

      {editingImageIdx !== null && (
        <CropEditorModal
          key={editingImageIdx}
          appLogic={appLogic}
        />
      )}

      {/* FOOTER */}
      <footer id="footer_pane" className="border-t border-neutral-850 bg-neutral-950/20 py-6 text-center text-xs text-neutral-500">
        <p className="font-mono">Webtoon-to-Video compilation dashboard &bull; Real-time Scraper Integration</p>
      </footer>

      <NotificationStack notifications={notifications} removeNotification={removeNotification} />
      <ErrorPopupModal error={errorPopup} onClose={() => setErrorPopup(null)} />
    </div>
  );
}
