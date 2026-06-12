import React from "react";
import { useAppLogic } from "./hooks/useAppLogic.js";
import { useAppRouter } from "./hooks/useAppRouter.js";
import { useGlobalShortcuts, DEFAULT_SHORTCUTS } from "./hooks/useGlobalShortcuts.js";
import { useBackendHealth } from "./hooks/useBackendHealth.js";

// Child Components
import Header from "./components/Header.js";
import CropEditorModal from "./components/CropEditorModal.js";
import BubbleCleanerModal from "./components/processing/BubbleCleanerModal.js";
import AutoCropModal from "./components/processing/AutoCropModal.js";
import NotificationStack from "./components/NotificationStack.js";
import { AppWorkspace } from "./components/AppWorkspace.js";
import PageNotFound from "./components/PageNotFound.js";
import AdvancedSettings from "./components/AdvancedSettings.js";
import LogsPage from "./components/LogsPage.js";
import StatusPage from "./components/StatusPage.js";
import ShortcutsPage from "./components/ShortcutsPage.js";

export default function App() {

  const appLogic = useAppLogic();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();
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
    addPanelsToStoryboard,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    totalCalculatedDuration,
  } = appLogic;

  const {
    currentPath,
    lastEditorPath,
    activeTheme,
    setActiveTheme,
    isPipMode,
    setIsPipMode,
    navigateTo,
  } = useAppRouter({
    scrapedImages,
    editingImageIdx,
    setEditingImageIdx,
    setShowAutoCropModal,
    setShowBubbleModal,
    setTargetUrl,
    setSelectedModel,
    setSelectedSource,
    setVoiceActor,
    setMusicTheme,
    setAspectRatio,
    setFrameRate,
    addNotification,
    voiceActor,
    musicTheme,
    aspectRatio,
    frameRate,
  });

  const { shortcuts, setShortcuts } = useGlobalShortcuts({
    scrapedImages,
    selectedScraped,
    setSelectedScraped,
    lastEditorPath,
    targetUrl,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    addNotification,
    handleGenerateVideo,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    navigateTo,
    setIsPipMode,
  });

  const isDashboardPath = currentPath === "/" || currentPath === "" || currentPath === "/index.html" || currentPath === "/dashboard";
  const isSettingsPath = currentPath === "/settings";
  const isAutoCropPath = currentPath === "/auto-crop";
  const isBubbleCleanerPath = currentPath === "/bubble-cleaner";
  const isEditorPath = currentPath.startsWith("/editor");
  const isLogsPath = currentPath === "/logs";
  const isStatusPath = currentPath === "/status";
  const isShortcutsPath = currentPath === "/shortcuts";

  return (
    <div id="app_root" className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white relative">
      
      {backendStatus === "offline" && (
        <div className="bg-gradient-to-r from-rose-950/90 to-red-950/95 border-b border-rose-800/40 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-rose-250 flex items-center justify-center gap-3 z-50 animate-slide-down w-full">
          <span className="flex items-center gap-2 flex-wrap justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-550 animate-ping" />
            <span>⚠️ Computational Engine Server is Offline. Make sure the Python backend is active (run <code className="bg-black/50 px-1.5 py-0.5 rounded text-rose-300 font-mono text-xs">npm run backend</code>).</span>
          </span>
          <button
            onClick={recheckBackend}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-850 text-rose-100 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border border-rose-700/50 shadow-sm cursor-pointer whitespace-nowrap"
          >
            Recheck Connection
          </button>
        </div>
      )}

      {/* BRANDING HEADER */}
      <Header 
        isProcessing={isProcessing} 
        panels={panels} 
        totalCalculatedDuration={totalCalculatedDuration}
        currentPath={currentPath}
        editingImageIdx={editingImageIdx}
        lastEditorPath={lastEditorPath}
        isBatchCropping={isBatchCropping}
        isCleaningBubbles={isCleaningBubbles}
      />

      {/* PAGE 1: DASHBOARD */}
      <div 
        className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]"
        style={{ display: isDashboardPath ? "flex" : "none" }}
      >
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
          addPanelsToStoryboard={addPanelsToStoryboard}
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
      </div>

      {/* PAGE 2: ADVANCED RENDER SETTINGS */}
      <div 
        className="page-transition w-full flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6"
        style={{ display: isSettingsPath ? "flex" : "none" }}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">System Configuration Settings</h2>
            <p className="text-xs text-neutral-400 font-mono">Manage voice synthesis, music composition, and output rendering profiles</p>
          </div>
          <button
            onClick={() => navigateTo("/")}
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800/80 cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>
        <AdvancedSettings
          voiceActor={voiceActor}
          setVoiceActor={setVoiceActor}
          musicTheme={musicTheme}
          setMusicTheme={setMusicTheme}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          frameRate={frameRate}
          setFrameRate={setFrameRate}
          activeTheme={activeTheme}
          setActiveTheme={setActiveTheme}
          targetUrl={targetUrl}
          selectedModel={selectedModel}
          selectedSource={selectedSource}
          addNotification={addNotification}
        />
      </div>

      {/* PAGE 3: AUTO CROP */}
      <div 
        className="page-transition w-full flex-1"
        style={{ display: isAutoCropPath ? "block" : "none" }}
      >
        <AutoCropModal
          onClose={() => navigateTo("/")}
          onApply={() => {
             console.log("App: Triggering handleAutoCropSelected");
             handleAutoCropSelected();
             navigateTo("/");
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
      </div>

      {/* PAGE 4: BUBBLE CLEANER */}
      <div 
        className="page-transition w-full flex-1"
        style={{ display: isBubbleCleanerPath ? "block" : "none" }}
      >
        <BubbleCleanerModal
          onClose={() => navigateTo("/")}
          onApply={() => {
             console.log("App: Triggering handleCleanBubblesSelected");
             handleCleanBubblesSelected();
             navigateTo("/");
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
      </div>

      {/* PAGE 5: ADVANCED CROP EDITOR */}
      <div 
        className={isPipMode ? "fixed bottom-6 right-6 w-96 h-56 rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden bg-neutral-950/95 backdrop-blur-xl animate-fade-in cursor-pointer" : "page-transition w-full flex-1"}
        style={{ display: (isEditorPath || isPipMode) && editingImageIdx !== null ? "block" : "none" }}
        onClick={isPipMode ? () => {
          setIsPipMode(false);
          navigateTo(lastEditorPath);
        } : undefined}
      >
        {editingImageIdx !== null && (
          <CropEditorModal appLogic={{ ...appLogic, isPipMode, setIsPipMode }} />
        )}
      </div>

      {/* PAGE 6: DEDICATED LOGS CONSOLE */}
      <div 
        className="page-transition w-full flex-1 flex flex-col"
        style={{ display: isLogsPath ? "flex" : "none" }}
      >
        <LogsPage 
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
          onNavigateHome={() => navigateTo("/")}
        />
      </div>

      {/* PAGE 7: COMPUTATIONAL DIAGNOSTICS */}
      <div 
        className="page-transition w-full flex-1 flex flex-col"
        style={{ display: isStatusPath ? "flex" : "none" }}
      >
        <StatusPage 
          onNavigateHome={() => navigateTo("/")}
          fetchWithInterceptor={fetchWithInterceptor}
        />
      </div>

      {/* PAGE 8: SHORTCUTS CONFIGURATION */}
      <div 
        className="page-transition w-full flex-1 flex flex-col"
        style={{ display: isShortcutsPath ? "flex" : "none" }}
      >
        <ShortcutsPage 
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          defaultShortcuts={DEFAULT_SHORTCUTS}
          onNavigateHome={() => navigateTo("/")}
          addNotification={addNotification}
        />
      </div>

      {/* PAGE 404 (FALLBACK) */}
      {!isDashboardPath && !isSettingsPath && !isAutoCropPath && !isBubbleCleanerPath && !isEditorPath && !isLogsPath && !isStatusPath && !isShortcutsPath && (
        <PageNotFound onNavigateHome={() => navigateTo("/")} />
      )}

      {/* FOOTER */}
      <footer id="footer_pane" className="border-t border-neutral-800 bg-neutral-950/20 py-6 text-center text-xs text-neutral-500">
        <p className="font-mono">Webtoon-to-Video compilation dashboard &bull; Real-time Scraper Integration</p>
      </footer>

      <NotificationStack notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
}
