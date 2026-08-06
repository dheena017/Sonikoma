import React from "react";
import LiveScraperDeck from "@/features/workspace_scraper/components/LiveScraperDeck";
import StoryboardTimeline from "@/features/editor_timeline/components/StoryboardTimeline";
import AdaptationPlayer from "@/features/video_preview/components/AdaptationPlayer";
import LayoutEditorPage from "@/features/editor_studio/components/EditorPageLayout";
import ImageEditorPage from "@/features/editor_image/pages/ImageEditorPage";
import AdvancedSettings from "@/features/video_preview/components/AdvancedSettings";
import AudioSettingsPage from "@/features/editor_audio/pages/AudioSettingsPage";
import VideoEditorPage from "@/features/editor_video/pages/VideoEditorPage";
import { useBackendHealth } from "@/shared/hooks/useBackendHealth";
import { getUserCredits } from "@/api/endpoints/auth";
import { Sliders, X, Mic } from "lucide-react";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import { Rnd } from "react-rnd";
import AutoCropOverlay from "@/shared/ui/loading/AutoCropOverlay";



interface EditorPageProps {
  appLogic: any;
  navigateTo: (path: string) => void;
  onRequestProjectConfirmation: () => void;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  rating?: number;
  likes?: string;
  views?: number;
}

const EditorPage: React.FC<EditorPageProps> = ({
  appLogic,
  navigateTo,
  onRequestProjectConfirmation,
  seriesSlug,
  chapterSlug,
  rating,
  likes,
  views,
}: EditorPageProps) => {
  void seriesSlug;
  void chapterSlug;
  const playerSettings = useImageEditorStore((state) => state.playerSettings);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [currentSection, setCurrentSection] = React.useState("timeline");
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const [previewQuality, setPreviewQuality] = React.useState<"draft" | "high">(
    "high"
  );

  const [activeTab, setActiveTab] = React.useState(() => {
    return new URLSearchParams(window.location.search).get("tab") || "";
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      const tab = new URLSearchParams(window.location.search).get("tab") || "";
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("locationchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, []);

  const handleCloseSettings = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("tab");
    const searchStr = params.toString();
    const newPath = `${window.location.pathname}${searchStr ? "?" + searchStr : ""}`;
    if (navigateTo) {
      navigateTo(newPath);
    } else {
      window.history.pushState({}, "", newPath);
      window.dispatchEvent(new Event("popstate"));
    }
  };

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
    consoleLogs,
    resetWorkspace,
    frameRate,

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
    setStoryboardPlaying,
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
    setBubbleSensitivity,
    bubbleDetectionStyle,
    setBubbleDetectionStyle,
    bubbleEraseMethod,
    setBubbleEraseMethod,
    bubbleDilation,
    setBubbleDilation,
    bubbleInpaintRadius,
    cropSensitivity,
    setCropSensitivity,
    cropPaddingPx,
    setCropPaddingPx,
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,
    cropBackgroundMode,
    aspectRatioLock,
    minPanelAreaPct,
    overlapMergeThreshold,
    useLocalCV,
    autoSplitTallStrips,
    cropModel,
    setCropModel,
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



  const [selectedPanelIds, setSelectedPanelIds] = React.useState<Set<number>>(
    new Set()
  );

  // Clear timeline selection when assets are selected, and vice-versa
  const handleSetSelectedScraped = React.useCallback(
    (value: React.SetStateAction<string[]>) => {
      setSelectedScraped(value);
      if (typeof value === "function" || (Array.isArray(value) && value.length > 0)) {
        setSelectedPanelIds(new Set());
      }
    },
    [setSelectedScraped, setSelectedPanelIds]
  );

  const handleSetSelectedPanelIds = React.useCallback(
    (value: React.SetStateAction<Set<number>>) => {
      setSelectedPanelIds(value);
      if (
        typeof value === "function" ||
        (value instanceof Set && value.size > 0)
      ) {
        setSelectedScraped([]);
      }
    },
    [setSelectedPanelIds, setSelectedScraped]
  );

  const [isSaving, setIsSaving] = React.useState(false);
  const [userCredits, setUserCredits] = React.useState<number | null>(
    appLogic.user?.credit_balance ?? appLogic.user?.credits ?? null
  );

  React.useEffect(() => {
    let active = true;
    const fetchCredits = async () => {
      try {
        const balance = await getUserCredits(fetchWithInterceptor);
        if (active && balance !== null) {
          setUserCredits(balance);
        }
      } catch (e) {
        console.error("Failed to fetch user credits in EditorPage:", e);
      }
    };
    fetchCredits();
    return () => {
      active = false;
    };
  }, [fetchWithInterceptor]);


  const handleSave = () => {
    onRequestProjectConfirmation();
  };

  const handleBackToApp = () => {
    navigateTo("/workspace");
  };

  // SCROLL RESTORATION: Restore the scroll position when returning from the Image Editor
  React.useEffect(() => {
    const savedWindowScroll = sessionStorage.getItem("editor_page_scroll_top_window");
    const savedContainerScroll = sessionStorage.getItem("editor_page_scroll_top_container");
    if (!savedWindowScroll && !savedContainerScroll) return;

    const windowVal = savedWindowScroll ? parseInt(savedWindowScroll, 10) : 0;
    const containerVal = savedContainerScroll ? parseInt(savedContainerScroll, 10) : 0;

    const restoreScroll = () => {
      if (savedWindowScroll) {
        window.scrollTo(0, windowVal);
      }
      if (savedContainerScroll) {
        const container = document.getElementById("main-scroll-container");
        if (container) {
          container.scrollTop = containerVal;
        }
      }
    };

    // Restore immediately on mount
    restoreScroll();

    // Restore at multiple intervals to handle async rendering and shifting heights
    const t1 = setTimeout(restoreScroll, 50);
    const t2 = setTimeout(restoreScroll, 150);
    const t3 = setTimeout(restoreScroll, 300);
    const t4 = setTimeout(restoreScroll, 600);

    // Cleanup sessionStorage after applying the scroll
    const tClean = setTimeout(() => {
      sessionStorage.removeItem("editor_page_scroll_top_window");
      sessionStorage.removeItem("editor_page_scroll_top_container");
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tClean);
    };
  }, []);

  // LISTEN FOR THE EDIT BUTTON CLICK (tab switching via CustomEvent)
  React.useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent?.detail;
      if (!detail) return;

      if (detail === "image-editor") {
        // Save current scroll position before navigating (both window scroll and main container scroll)
        sessionStorage.setItem("editor_page_scroll_top_window", String(window.scrollY));
        const container = document.getElementById("main-scroll-container");
        if (container) {
          sessionStorage.setItem("editor_page_scroll_top_container", String(container.scrollTop));
        }

        const idx = useImageEditorStore.getState().editingImageIdx ?? appLogic.editingImageIdx ?? 0;
        const hasValidSlugs = seriesSlug && chapterSlug && seriesSlug !== "null" && chapterSlug !== "null";
        const projId = appLogic.projectId || new URLSearchParams(window.location.search).get("id") || "";
        const target = hasValidSlugs
          ? `/workspace/editor/series/${seriesSlug}/chapters/${chapterSlug}/image-editor?idx=${idx}`
          : `/workspace/editor/image-editor?id=${projId}&idx=${idx}`;
        navigateTo(target);
      } else {
        setCurrentSection(detail);
      }
    };

    window.addEventListener("SWITCH_TAB", handleSwitchTab);
    return () => window.removeEventListener("SWITCH_TAB", handleSwitchTab);
  }, [seriesSlug, chapterSlug, navigateTo, appLogic.editingImageIdx]);

  // Sync section with modals if needed
  React.useEffect(() => {
    if (currentSection === "autocrop") {
      setShowAutoCropModal(true);
      setCurrentSection("assets");
    }
    if (currentSection === "bubbles") {
      setShowBubbleModal(true);
      setCurrentSection("assets");
    }
  }, [currentSection]);

  const hasEnoughCredits = userCredits === null || userCredits >= 20;

  if (currentSection === "video-editor" || activeTab === "video-editor") {
    return (
      <VideoEditorPage
        appLogic={appLogic}
        navigateTo={navigateTo}
        onBackToApp={() => setCurrentSection("timeline")}
        projectTitle={
          seriesTitle && chapterTitle
            ? `${seriesTitle} · ${chapterTitle}`
            : "Cyberpunk Story"
        }
      />
    );
  }

  return (
    <LayoutEditorPage
      projectId={projectId}
      seriesSlug={seriesSlug || appLogic.seriesSlugState}
      chapterSlug={chapterSlug || appLogic.chapterSlugState}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      currentSection={currentSection}
      setCurrentSection={setCurrentSection}
      onBackToApp={handleBackToApp}
      scrapedCount={scrapedImages.length}
      panelsCount={panels.length}
      isBatchCropping={isBatchCropping}
      isCleaningBubbles={isCleaningBubbles}
      title={
        seriesTitle && chapterTitle
          ? `${seriesTitle} · ${chapterTitle}`
          : "Storyboard Editor"
      }
      subtitle={
        seriesTitle && chapterNumber
          ? `Series ${seriesTitle} • Chapter ${chapterNumber}`
          : undefined
      }
      onSave={handleSave}
      isSaving={isSaving}
      isDirty={appLogic.isDirty}
      isFocusMode={isFocusMode}
      setIsFocusMode={setIsFocusMode}
      navigateTo={navigateTo}
      notifications={appLogic.notifications}
      markNotificationAsRead={appLogic.markNotificationAsRead}
      markAllNotificationsAsRead={appLogic.markAllNotificationsAsRead}
      deleteNotification={appLogic.deleteNotification}
      clearAllNotifications={appLogic.clearAllNotifications}
      notificationsMuted={appLogic.notificationsMuted}
      setNotificationsMuted={appLogic.setNotificationsMuted}
      onNavigateToAll={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/notifications' } }))}
      fetchWithInterceptor={fetchWithInterceptor}
      locationSearch={window.location.search}
    >
      <main className="flex-1 w-full relative bg-neutral-950 min-w-0">
        {/* Scrolling Overlay Content (Timeline, Assets, Meta) */}
        <div
          className={`relative z-10 bg-[#070709] min-h-screen min-w-0 ${activeTab === "settings" || activeTab === "audio-settings"
              ? "px-4 md:px-8 py-8 flex flex-col gap-8"
              : `border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] px-4 md:px-6 py-8 flex flex-col gap-12 ${isFocusMode ? "hidden" : "block"
              }`
            }`}
        >
          {activeTab === "settings" ? (
            <div className="w-full space-y-6">
              {/* Settings Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Video Settings</h2>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Configure canvas aspect ratios, audio-reactive camera shake, and render output codecs
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSettings}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-xs font-bold font-mono active:scale-95 shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Close Settings
                </button>
              </div>

              {/* Render AdvancedSettings */}
              <div className="pt-2">
                <AdvancedSettings
                  voiceActor={voiceActor}
                  setVoiceActor={appLogic.setVoiceActor}
                  musicTheme={musicTheme}
                  setMusicTheme={appLogic.setMusicTheme}
                  aspectRatio={aspectRatio}
                  setAspectRatio={appLogic.setAspectRatio}
                  frameRate={frameRate}
                  setFrameRate={appLogic.setFrameRate}
                  activeTheme={appLogic.activeTheme || "obsidian"}
                  setActiveTheme={appLogic.setActiveTheme || (() => { })}
                  targetUrl={targetUrl}
                  selectedModel={selectedModel}
                  selectedSource={selectedSource}
                  addNotification={addNotification}
                  fetchWithInterceptor={fetchWithInterceptor}

                  audioReactiveShake={appLogic.audioReactiveShake}
                  setAudioReactiveShake={appLogic.setAudioReactiveShake}
                  shakeIntensity={appLogic.shakeIntensity}
                  setShakeIntensity={appLogic.setShakeIntensity}
                  videoFormat={appLogic.videoFormat}
                  setVideoFormat={appLogic.setVideoFormat}
                  backgroundStyle={appLogic.backgroundStyle}
                  setBackgroundStyle={appLogic.setBackgroundStyle}
                  subtitlesStyle={appLogic.subtitlesStyle}
                  setSubtitlesStyle={appLogic.setSubtitlesStyle}

                  // Crop Settings
                  cropSensitivity={cropSensitivity}
                  setCropSensitivity={setCropSensitivity}
                  cropPaddingPx={cropPaddingPx}
                  setCropPaddingPx={setCropPaddingPx}
                  cropFocusMode={cropFocusMode}
                  setCropFocusMode={setCropFocusMode}
                  cropModel={cropModel}
                  setCropModel={setCropModel}

                  // Bubble Settings
                  bubbleSensitivity={bubbleSensitivity}
                  setBubbleSensitivity={setBubbleSensitivity}
                  bubbleDilation={bubbleDilation}
                  setBubbleDilation={setBubbleDilation}
                  bubbleEraseMethod={bubbleEraseMethod}
                  setBubbleEraseMethod={setBubbleEraseMethod}
                  bubbleDetectionStyle={bubbleDetectionStyle}
                  setBubbleDetectionStyle={setBubbleDetectionStyle}
                />
              </div>
            </div>
          ) : activeTab === "audio-settings" ? (
            <div className="w-full space-y-6">
              {/* Settings Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Audio Settings</h2>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Synchronize narration character, configure pitch and rate, and mix sound loop presets
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSettings}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-xs font-bold font-mono active:scale-95 shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Close Settings
                </button>
              </div>

              {/* Render AudioSettingsPage */}
              <div className="pt-2">
                <AudioSettingsPage
                  projectId={projectId}
                  onNavigateHome={handleCloseSettings}
                  addNotification={addNotification}
                  fetchWithInterceptor={fetchWithInterceptor}
                  isEmbed={true}
                  volume={appLogic.volume}
                  setVolume={appLogic.setVolume}
                  narrationVolume={appLogic.narrationVolume}
                  setNarrationVolume={appLogic.setNarrationVolume}
                  bgmVolume={appLogic.bgmVolume}
                  setBgmVolume={appLogic.setBgmVolume}
                  sfxVolume={appLogic.sfxVolume}
                  setSfxVolume={appLogic.setSfxVolume}
                  speechRate={appLogic.speechRate}
                  setSpeechRate={appLogic.setSpeechRate}
                  speechPitch={appLogic.speechPitch}
                  setSpeechPitch={appLogic.setSpeechPitch}
                  voiceActor={voiceActor}
                  setVoiceActor={appLogic.setVoiceActor}
                  musicTheme={musicTheme}
                  setMusicTheme={appLogic.setMusicTheme}
                  audioDucking={appLogic.audioDucking}
                  setAudioDucking={appLogic.setAudioDucking}
                />
              </div>
            </div>
          ) : (
            <>
              {/* TOP: AdaptationPlayer */}
              {playerSettings.isPlayerOpen && (
                <AdaptationPlayer
                  panels={panels}
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  currentPanelIndex={currentPanelIndex}
                  setCurrentPanelIndex={setCurrentPanelIndex}
                  activePreviewTab={activePreviewTab}
                  setActivePreviewTab={setActivePreviewTab}
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
                  addNotification={addNotification}
                  onOpenVideoEditor={() => setCurrentSection("video-editor")}
                />
              )}




              {/* MIDDLE: Storyboard Timeline */}
              <div
                id="section-timeline"
                className="w-full max-w-[1600px] ml-0 mr-0 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">
                    Timeline
                  </h3>
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
                  setConsoleLogs={() => { }}
                  voiceActor={voiceActor}
                  musicTheme={musicTheme}
                  speechRate={appLogic.speechRate}
                  speechPitch={appLogic.speechPitch}
                  narrationStyle={narrationStyle}
                  playStoryboardAudio={playStoryboardAudio}
                  autoPlayAudio={autoPlayAudio}
                  bubbleSensitivity={bubbleSensitivity}
                  bubbleDetectionStyle={bubbleDetectionStyle}
                  bubbleEraseMethod={bubbleEraseMethod}
                  bubbleDilation={bubbleDilation}
                  bubbleInpaintRadius={bubbleInpaintRadius}
                  cropSensitivity={cropSensitivity}
                  cropPaddingPx={cropPaddingPx}
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
                  cropGuidance={cropGuidance}
                  cropFocusMode={cropFocusMode}
                  handleCancelBatch={handleCancelBatch}
                  audioFeedback={audioFeedback}
                  selectedPanelIds={selectedPanelIds}
                  setSelectedPanelIds={handleSetSelectedPanelIds}
                />
              </div>
              {/* BOTTOM: Imported Assets (Resource Pool) */}
              <div
                id="section-assets"
                className="w-full max-w-[1600px] ml-0 mr-0 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">
                    Imported Assets
                  </h3>
                </div>
                <div className="bg-transparent">
                  <LiveScraperDeck
                    isDashboardOnly={false}
                    scrapedImages={scrapedImages}
                    isScraping={isScraping}
                    selectedScraped={selectedScraped}
                    setSelectedScraped={handleSetSelectedScraped}
                    setScrapedImages={setScrapedImages}
                    mergingIndices={mergingIndices}
                    setConsoleLogs={() => { }}
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
                    selectedModel={selectedModel}
                    consoleLogs={consoleLogs}
                    resetWorkspace={resetWorkspace}
                    rating={rating}
                    likes={likes}
                    views={views}
                  />

                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </LayoutEditorPage>
  );
};

export default React.memo(EditorPage);
