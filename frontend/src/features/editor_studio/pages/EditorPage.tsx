import React from "react";
import ChapterScraperDeck from "@/features/editor_imported_images/components/ImportedImagesSidebar";
import StoryboardTimeline from "@/features/editor_timeline/components/StoryboardTimeline";
import EditorViewport from "@/features/editor_video/viewport/EditorViewport";
import LayoutEditorPage from "@/features/editor_studio/components/EditorPageLayout";
import { VideoPreviewAdvancedSettings } from "@/features/editor_video/viewport/monitor";
import { useBackendHealth } from "@/shared/hooks/useBackendHealth";
import { getUserCredits } from "@/api/endpoints/auth";
import {
  Sliders,
  X,
  Mic,
  Tv,
  Eye,
  Sparkles,
  Layers,
  PlaySquare,
  MonitorPlay,
  Save,
} from "lucide-react";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { useProjectStore } from "@/store/useProjectStore";

const AudioSettingsPage = React.lazy(
  () => import("@/features/editor_audio/pages/AudioSettingsPage")
);
const VideoEditorPage = React.lazy(
  () => import("@/features/editor_video/pages/VideoEditorPage")
);
const AutoCropModal = React.lazy(
  () => import("@/features/editor_auto_crop/components/AutoCropModal")
);

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
  const [currentSection, setCurrentSection] = React.useState("storyboard");
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
    const newPath = `${window.location.pathname}${
      searchStr ? "?" + searchStr : ""
    }`;
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
      if (
        typeof value === "function" ||
        (Array.isArray(value) && value.length > 0)
      ) {
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
    const slug = seriesSlug || appLogic.seriesSlugState;
    if (slug) {
      navigateTo(`/projects/${slug}`);
    } else {
      navigateTo("/projects");
    }
  };

  // SCROLL RESTORATION: Restore the scroll position when returning from the Image Editor
  React.useEffect(() => {
    const savedWindowScroll = sessionStorage.getItem(
      "editor_page_scroll_top_window"
    );
    const savedContainerScroll = sessionStorage.getItem(
      "editor_page_scroll_top_container"
    );
    if (!savedWindowScroll && !savedContainerScroll) return;

    const windowVal = savedWindowScroll ? parseInt(savedWindowScroll, 10) : 0;
    const containerVal = savedContainerScroll
      ? parseInt(savedContainerScroll, 10)
      : 0;

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
        sessionStorage.setItem(
          "editor_page_scroll_top_window",
          String(window.scrollY)
        );
        const container = document.getElementById("main-scroll-container");
        if (container) {
          sessionStorage.setItem(
            "editor_page_scroll_top_container",
            String(container.scrollTop)
          );
        }

        const idx =
          useImageEditorStore.getState().editingImageIdx ??
          appLogic.editingImageIdx ??
          0;
        navigateTo(`/image-editor?idx=${idx}`);
      } else if (detail === "video-editor") {
        navigateTo("/video-editor");
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
        onBackToApp={() => setCurrentSection("storyboard")}
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
      onNavigateToAll={() =>
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: { path: "/notifications" } })
        )
      }
      fetchWithInterceptor={fetchWithInterceptor}
      locationSearch={window.location.search}
      user={appLogic.user}
    >
      <main className="flex-1 w-full relative bg-transparent min-w-0">
        {/* Scrolling Overlay Content (Storyboard, Assets, Meta) */}
        <div
          className={`relative z-10 bg-transparent min-h-0 min-w-0 ${
            activeTab === "video-settings" ||
            activeTab === "settings" ||
            activeTab === "audio-settings" ||
            activeTab === "autocrop-settings"
              ? "px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 w-full max-w-5xl mx-auto"
              : `border-t border-white/5 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8 w-full max-w-[1720px] mx-auto ${
                  isFocusMode ? "hidden" : "block"
                }`
          }`}
        >
          {activeTab === "video-settings" || activeTab === "settings" ? (
            <div className="w-full space-y-6 rounded-3xl border border-neutral-800/80 bg-[#050508]/95 backdrop-blur-3xl shadow-2xl p-6 sm:p-8">
              {/* Settings Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Video Settings
                    </h2>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Configure canvas aspect ratios, audio-reactive camera
                      shake, and render output codecs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (projectId) {
                        const success = await useProjectStore.getState().updateVideoSettings({
                          aspectRatio,
                          frameRate,
                          activeTheme: appLogic.activeTheme || "obsidian",
                          audioReactiveShake: appLogic.audioReactiveShake,
                          shakeIntensity: appLogic.shakeIntensity,
                          videoFormat: appLogic.videoFormat,
                          backgroundStyle: appLogic.backgroundStyle,
                          subtitlesStyle: appLogic.subtitlesStyle,
                          voiceActor,
                          musicTheme,
                        }, fetchWithInterceptor);
                        if (success) {
                          addNotification?.("Video settings saved successfully!", "success");
                        } else {
                          addNotification?.("Failed to save video settings", "error");
                        }
                      }
                    }}
                    className="p-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold active:scale-95 shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    Save Settings
                  </button>
                  <button
                    onClick={handleCloseSettings}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-xs font-bold font-mono active:scale-95 shadow-sm"
                  >
                    <X className="h-4 w-4" />
                    Close Settings
                  </button>
                </div>
              </div>

              {/* Render VideoPreviewAdvancedSettings */}
              <div className="pt-2">
                <VideoPreviewAdvancedSettings
                  voiceActor={voiceActor}
                  setVoiceActor={appLogic.setVoiceActor}
                  musicTheme={musicTheme}
                  setMusicTheme={appLogic.setMusicTheme}
                  aspectRatio={aspectRatio}
                  setAspectRatio={appLogic.setAspectRatio}
                  frameRate={frameRate}
                  setFrameRate={appLogic.setFrameRate}
                  activeTheme={appLogic.activeTheme || "obsidian"}
                  setActiveTheme={appLogic.setActiveTheme || (() => {})}
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
            <div className="w-full space-y-6 rounded-3xl border border-neutral-800/80 bg-[#050508]/95 backdrop-blur-3xl shadow-2xl p-6 sm:p-8">
              {/* Settings Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Audio Settings
                    </h2>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Synchronize narration character, configure pitch and rate,
                      and mix sound loop presets
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
          ) : activeTab === "autocrop-settings" ? (
            <div className="w-full space-y-6">
              <React.Suspense fallback={null}>
                <div className="rounded-3xl border border-neutral-800/80 overflow-hidden bg-[#050508] shadow-2xl">
                  <AutoCropModal
                    isPage={true}
                    onClose={handleCloseSettings}
                    onApply={async () => {
                      if (projectId) {
                        await useProjectStore.getState().updateAutoCropSettings({
                          sensitivity: cropSensitivity,
                          padding: cropPaddingPx,
                          backgroundColorMode: appLogic.cropBackgroundMode,
                          autoSplitTallStrips: appLogic.autoSplitTallStrips,
                          aspectRatioLock: appLogic.aspectRatioLock,
                          minPanelAreaPct: appLogic.minPanelAreaPct,
                          overlapMergeThreshold: appLogic.overlapMergeThreshold,
                          useLocalCV: appLogic.useLocalCV,
                          cropModel,
                          cropMinHeightPx: appLogic.cropMinHeightPx,
                          cropCannyLow: appLogic.cropCannyLow,
                          cropCannyHigh: appLogic.cropCannyHigh,
                          cropCloseKernelSize: appLogic.cropCloseKernelSize,
                        }, fetchWithInterceptor);
                      }
                      handleCloseSettings();
                      handleAutoCropSelected();
                    }}
                    fetchWithInterceptor={fetchWithInterceptor}
                    sensitivity={cropSensitivity}
                    setSensitivity={setCropSensitivity}
                    padding={cropPaddingPx}
                    setPadding={setCropPaddingPx}
                    backgroundColorMode={appLogic.cropBackgroundMode}
                    setBackgroundColorMode={appLogic.setCropBackgroundMode}
                    autoSplitTallStrips={appLogic.autoSplitTallStrips}
                    setAutoSplitTallStrips={appLogic.setAutoSplitTallStrips}
                    aspectRatioLock={appLogic.aspectRatioLock}
                    setAspectRatioLock={appLogic.setAspectRatioLock}
                    minPanelAreaPct={appLogic.minPanelAreaPct}
                    setMinPanelAreaPct={appLogic.setMinPanelAreaPct}
                    overlapMergeThreshold={appLogic.overlapMergeThreshold}
                    setOverlapMergeThreshold={appLogic.setOverlapMergeThreshold}
                    useLocalCV={appLogic.useLocalCV}
                    setUseLocalCV={appLogic.setUseLocalCV}
                    cropModel={cropModel}
                    setCropModel={setCropModel}
                    cropMinHeightPx={appLogic.cropMinHeightPx}
                    setCropMinHeightPx={appLogic.setCropMinHeightPx}
                    cropCannyLow={appLogic.cropCannyLow}
                    setCropCannyLow={appLogic.setCropCannyLow}
                    cropCannyHigh={appLogic.cropCannyHigh}
                    setCropCannyHigh={appLogic.setCropCannyHigh}
                    cropCloseKernelSize={appLogic.cropCloseKernelSize}
                    setCropCloseKernelSize={appLogic.setCropCloseKernelSize}
                    selectedCount={
                      selectedScraped?.length || scrapedImages?.length || 0
                    }
                    isApplying={isBatchCropping}
                    scrapedImages={scrapedImages}
                    selectedScraped={selectedScraped}
                    setSelectedScraped={setSelectedScraped}
                    setConsoleLogs={appLogic.setConsoleLogs}
                    addNotification={addNotification}
                  />
                </div>
              </React.Suspense>
            </div>
          ) : (
            <>
              {/* TOP: Video Preview Player / Viewport Monitor */}
              {playerSettings.isPlayerOpen ? (
                <EditorViewport
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
              ) : (
                <div className="w-full mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      useImageEditorStore
                        .getState()
                        .setPlayerSettings({ isPlayerOpen: true });
                    }}
                    className="w-full h-13 px-5 rounded-2xl bg-gradient-to-r from-neutral-900/95 via-neutral-900/80 to-purple-950/30 hover:from-neutral-850 hover:to-purple-900/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-8 w-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                        <Tv className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-mono tracking-wider uppercase block text-white">
                          Program Monitor Viewport
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Click to expand video preview player & visual canvas
                          monitor
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-purple-300 group-hover:bg-purple-900/80 group-hover:text-purple-100 transition-colors shadow-sm">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Expand Monitor</span>
                    </div>
                  </button>
                </div>
              )}

              {/* MIDDLE: Storyboard Workspace */}
              <div
                id="section-storyboard"
                data-section="section-timeline"
                className="w-full scroll-mt-20 min-h-0 flex flex-col"
              >
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
                className="w-full scroll-mt-20 min-h-0 flex flex-col"
              >
                <div className="bg-transparent">
                  <ChapterScraperDeck
                    isDashboardOnly={false}
                    scrapedImages={scrapedImages}
                    isScraping={isScraping}
                    selectedScraped={selectedScraped}
                    setSelectedScraped={handleSetSelectedScraped}
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
