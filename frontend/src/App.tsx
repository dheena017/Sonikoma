import React from "react";
import { useAppLogic } from "./hooks/useAppLogic";

// Child Components
import Header from "./components/Header";
import LiveScraperDeck from "./components/LiveScraperDeck";
import StoryboardTimeline from "./components/StoryboardTimeline";
import VideoMonitor from "./components/VideoMonitor";
import VolumeAndProgressPanel from "./components/VolumeAndProgressPanel";
import CropEditorModal from "./components/CropEditorModal";
import BubbleCleanerModal from "./components/BubbleCleanerModal";
import AutoCropModal from "./components/AutoCropModal";
import TerminalLogs from "./components/TerminalLogs";
import ModelStatusTable from "./components/ModelStatusTable";
import NotificationStack from "./components/NotificationStack";
import ErrorPopupModal from "./components/ErrorPopupModal";
import UrlInputPanel from "./components/UrlInputPanel";
import PipelineStatusCard from "./components/PipelineStatusCard";
import FinalVideoPlayer from "./components/FinalVideoPlayer";
import OutputMetadataPanel from "./components/OutputMetadataPanel";

export default function App() {
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

      {/* WORKSPACE AREA — AutoCropModal / BubbleCleanerModal / CropEditorModal / Main */}
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
        <main id="main_workspace" className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: SOURCE INTEGRATION */}
        <div id="controls_column" className="lg:col-span-7 flex flex-col gap-8">
          
          {/* CONVERSION INPUT CARD */}
          <UrlInputPanel
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
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

          {/* DYNAMIC STORYBOARD TIMELINE DECK */}
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
        </div>

        {/* RIGHT COLUMN: INTEGRATED CINEMA PLAYER */}
        <div id="cinema_column" className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
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

          <ModelStatusTable 
            selectedModel={
              selectedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' :
              selectedModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
              selectedModel === 'gemini-1.5-pro' ? 'Gemini 1.5 Pro' :
              selectedModel === 'llama-3-70b' ? 'Llama 3 (via Groq)' :
              selectedModel === 'huggingface-mistral-7b' ? 'Mistral 7B (via HuggingFace)' :
              selectedModel
            }
            onSelect={(modelName) => {
              const matched = useAppLogic().panels.length >= 0; // Trigger select logic via App wrapper if needed
              if (modelName === "Gemini 2.5 Flash") {
                setSelectedModel("gemini-2.5-flash");
                addNotification(`Model configured to Gemini 2.5 Flash`, 'info');
              } else if (modelName === "Gemini 3.5 Flash") {
                setSelectedModel("gemini-3.5-flash");
                addNotification(`Model configured to Gemini 3.5 Flash`, 'info');
              } else if (modelName.includes("Pro")) {
                setSelectedModel("gemini-1.5-pro");
                addNotification(`Model configured to Gemini 1.5 Pro (Note: Pro Model)`, 'info');
              }
            }}
          />

          {/* METADATA RENDER MATRIX */}
          <OutputMetadataPanel
            videoUrl={videoUrl}
            musicTheme={musicTheme}
            voiceActor={voiceActor}
          />
        </div>
        </main>
      )}

      {editingImageIdx !== null && (
        <CropEditorModal
          key={editingImageIdx}
          editingImageIdx={editingImageIdx}
          setEditingImageIdx={setEditingImageIdx}
          editCropTop={editCropTop}
          setEditCropTop={setEditCropTop}
          editCropBottom={editCropBottom}
          setEditCropBottom={setEditCropBottom}
          editCropLeft={editCropLeft}
          setEditCropLeft={setEditCropLeft}
          editCropRight={editCropRight}
          setEditCropRight={setEditCropRight}
          editAutoTrim={editAutoTrim}
          setEditAutoTrim={setEditAutoTrim}
          scrapedImages={scrapedImages}
          setScrapedImages={setScrapedImages}
          isSavingEdit={isSavingEdit}
          handleSaveEditedImage={handleSaveEditedImage}
          handleSaveMultipleCuts={handleSaveMultipleCuts}
          setConsoleLogs={setConsoleLogs}
          addNotification={addNotification}
          selectedScraped={selectedScraped}
          setSelectedScraped={setSelectedScraped}
          panels={panels}
          setPanels={setPanels}
          fetchWithInterceptor={fetchWithInterceptor}
          setErrorPopup={setErrorPopup}
          imageEditStates={imageEditStates}
          setImageEditStates={setImageEditStates}
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
