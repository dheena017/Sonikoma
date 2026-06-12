import React from "react";
import { useAppLogic } from "./hooks/useAppLogic.js";

// Child Components
import Header from "./components/Header.js";
import CropEditorModal from "./components/CropEditorModal.js";
import BubbleCleanerModal from "./components/processing/BubbleCleanerModal.js";
import AutoCropModal from "./components/processing/AutoCropModal.js";
import NotificationStack from "./components/NotificationStack.js";
import { AppWorkspace } from "./components/AppWorkspace.js";
import PageNotFound from "./components/PageNotFound.js";

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
    bubbleDilation,
    setBubbleDilation,
    bubbleInpaintRadius,
    setBubbleInpaintRadius,
    activeBubbleTab,
    setActiveBubbleTab,
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
    cropModel,
    setCropModel,
    cropMinHeightPx,
    setCropMinHeightPx,
    cropCannyLow,
    setCropCannyLow,
    cropCannyHigh,
    setCropCannyHigh,
    cropCloseKernelSize,
    setCropCloseKernelSize,
    activeAutoCropTab,
    setActiveAutoCropTab,
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
    selectedSource,
    setSelectedSource,
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
  } = appLogic;

  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener("popstate", handleLocationChange);
    
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
  };

  const isPathValid = currentPath === "/" || currentPath === "" || currentPath === "/index.html";

  return (

    <div id="app_root" className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white relative">
      
      {/* BRANDING HEADER */}
      <Header 
        isProcessing={isProcessing} 
        panels={panels} 
        totalCalculatedDuration={totalCalculatedDuration}
      />

      {/* WORKSPACE AREA — AutoCropModal / BubbleCleanerModal / CropEditorModal / Main Grid */}
      {!isPathValid ? (
        <PageNotFound onNavigateHome={() => navigateTo("/")} />
      ) : showAutoCropModal ? (
        <AutoCropModal

          onClose={() => setShowAutoCropModal(false)}
          onApply={() => {
             console.log("App: Triggering handleAutoCropSelected");
             handleAutoCropSelected();
             setShowAutoCropModal(false);
          }}
          sensitivity={cropSensitivity}
          setSensitivity={setCropSensitivity}
          padding={cropPaddingPx}
          setPadding={setCropPaddingPx}
          backgroundColorMode={cropBackgroundMode}
          setBackgroundColorMode={setCropBackgroundMode}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
          aspectRatioLock={aspectRatioLock}
          setAspectRatioLock={setAspectRatioLock}
          minPanelAreaPct={minPanelAreaPct}
          setMinPanelAreaPct={setMinPanelAreaPct}
          overlapMergeThreshold={overlapMergeThreshold}
          setOverlapMergeThreshold={setOverlapMergeThreshold}
          useLocalCV={useLocalCV}
          setUseLocalCV={setUseLocalCV}
          cropModel={cropModel}
          setCropModel={setCropModel}
          cropMinHeightPx={cropMinHeightPx}
          setCropMinHeightPx={setCropMinHeightPx}
          cropCannyLow={cropCannyLow}
          setCropCannyLow={setCropCannyLow}
          cropCannyHigh={cropCannyHigh}
          setCropCannyHigh={setCropCannyHigh}
          cropCloseKernelSize={cropCloseKernelSize}
          setCropCloseKernelSize={setCropCloseKernelSize}
          activeTab={activeAutoCropTab}
          setActiveTab={setActiveAutoCropTab}
          selectedCount={selectedScraped.length}
          isApplying={isBatchCropping}
          scrapedImages={scrapedImages}
          selectedScraped={selectedScraped}
          setConsoleLogs={setConsoleLogs}
          addNotification={addNotification}
        />
      ) : showBubbleModal ? (
        <BubbleCleanerModal
          onClose={() => setShowBubbleModal(false)}
          onApply={() => {
             console.log("App: Triggering handleCleanBubblesSelected");
             handleCleanBubblesSelected();
             setShowBubbleModal(false);
          }}
          detectionStyle={bubbleDetectionStyle}
          setDetectionStyle={setBubbleDetectionStyle}
          eraseMethod={bubbleEraseMethod}
          setEraseMethod={setBubbleEraseMethod}
          sensitivity={bubbleSensitivity}
          setSensitivity={setBubbleSensitivity}
          bubbleDilation={bubbleDilation}
          setBubbleDilation={setBubbleDilation}
          bubbleInpaintRadius={bubbleInpaintRadius}
          setBubbleInpaintRadius={setBubbleInpaintRadius}
          activeTab={activeBubbleTab}
          setActiveTab={setActiveBubbleTab}
          selectedCount={selectedScraped.length}
          isApplying={isCleaningBubbles}
          scrapedImages={scrapedImages}
          selectedScraped={selectedScraped}
          addNotification={addNotification}
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
          handleAutoCropSelected={handleAutoCropSelected}
          handleCleanBubblesSelected={handleCleanBubblesSelected}
          videoPlayerRef={videoPlayerRef}
          addNotification={addNotification}
          setErrorPopup={setErrorPopup}
          fetchWithInterceptor={fetchWithInterceptor}
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
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

      {editingImageIdx !== null && isPathValid && (
        <CropEditorModal
          appLogic={appLogic}
        />
      )}



      {/* FOOTER */}
      <footer id="footer_pane" className="border-t border-neutral-800 bg-neutral-950/20 py-6 text-center text-xs text-neutral-500">
        <p className="font-mono">Webtoon-to-Video compilation dashboard &bull; Real-time Scraper Integration</p>
      </footer>

      <NotificationStack notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
}
