import React from "react";
import LiveScraperDeck, { formatDisplayEpisodeLabel, getSortedEpisodeGroups } from "@/features/scraper/components/LiveScraperDeck";
import StoryboardTimeline from "@/features/timeline/components/StoryboardTimeline";
import CinemaPlayer from "@/features/video/components/CinemaPlayer";
import OutputMetadataPanel from "@/features/video/components/OutputMetadataPanel";
import LayoutEditorPage from "@/features/image/components/editor/EditorPageLayout";
import ImageEditorPage from "@/features/image/pages/ImageEditorPage";
import AdvancedSettings from "@/features/video/components/AdvancedSettings";
import AudioSettingsPage from "@/features/audio/pages/AudioSettingsPage";
import ProcessBar from "@/features/pipeline/components/ProcessBar";
import { useBackendHealth } from "@/shared/hooks/useBackendHealth";
import { getUserCredits } from "@/api/endpoints/auth";
import { Sliders, X, Mic } from "lucide-react";
import { useImageEditorStore } from "@/features/image/hooks/useImageEditorState";
import { resolveWorkspaceReturnPath } from "@/utils/workspaceNavigation";
import { Rnd } from "react-rnd";


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
  const [isInitializing, setIsInitializing] = React.useState(true);

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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);


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
        const target = `/workspace/editor/series/${seriesSlug}/chapters/${chapterSlug}/image-editor?idx=${idx}`;
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

  const skeletonLoader = (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-pulse">
      <div className="w-12 h-12 bg-neutral-800 rounded-full" />
      <div className="h-4 w-48 bg-neutral-800 rounded" />
      <div className="h-3 w-32 bg-neutral-900 rounded" />
    </div>
  );

  const FinalProductionPanel: React.FC = () => {
    const hasEnoughCredits = userCredits === null || userCredits >= 20;
    const [selectedExportTarget, setSelectedExportTarget] = React.useState<string>("master");
    const episodeGroups =
      ((window as any).__scrapeEpisodeGroups as Array<{
        episodeLabel: string;
        startIndex: number;
        count: number;
      }>) || [];

    return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* IN-PANEL LEFT SIDEBAR: EXPORT PRESETS & EPISODES */}
        <aside className="w-full lg:w-56 bg-neutral-955 border border-neutral-850 rounded-2xl p-4 shrink-0 space-y-3 shadow-xl self-start">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Export Targets
              </h4>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedExportTarget("master")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                selectedExportTarget === "master"
                  ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                  : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
              }`}
            >
              <span>Full Master Video</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 text-emerald-400 rounded border border-emerald-900/40 font-mono">
                1080p
              </span>
            </button>
          </div>

          {episodeGroups.length > 0 && (
            <div className="pt-2 border-t border-neutral-850 space-y-2">
              <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono">
                Batch Render Episodes
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {getSortedEpisodeGroups(episodeGroups).map(({ grp, originalIdx }) => {
                  const isSelected = selectedExportTarget === `ep-${originalIdx}`;
                  return (
                    <button
                      key={originalIdx}
                      type="button"
                      onClick={() => setSelectedExportTarget(`ep-${originalIdx}`)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all text-left border cursor-pointer ${
                        isSelected
                          ? "bg-purple-600/25 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                          : "bg-neutral-900/50 border-neutral-850 text-neutral-350 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                      <span className="text-[9px] text-purple-400 font-bold bg-neutral-950 px-1.5 py-0.5 rounded border border-purple-900/30 shrink-0">
                        {grp.count}f
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN AREA: RENDER CONTROLS */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          <div className="bg-[#111115] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
            {isRendering && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-600/20 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            )}
            <div className="relative z-10 space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Final Production — {selectedExportTarget === "master" ? "Full Master Video" : `Selected Episode (${selectedExportTarget})`}
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono">
                Compile selected panels into a high-res video. <span className="text-purple-400 font-bold">(Cost: 20 Credits)</span>
              </p>
            </div>
            {isRendering ? (
              <ProcessBar progressStatus={progressStatus} />
            ) : (
              <button
                onClick={handleRenderFinalVideo}
                disabled={!hasEnoughCredits}
                className={`relative z-10 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 ${
                  !hasEnoughCredits
                    ? "bg-neutral-900/50 text-neutral-500 cursor-not-allowed border border-neutral-800"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-white/10 cursor-pointer"
                }`}
              >
                {!hasEnoughCredits ? (
                  <>⚠️ Insufficient Credits (20 required)</>
                ) : (
                  <>🎬 Export Master Video ({selectedExportTarget === "master" ? "All Panels" : "Selected Episode"})</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
      onNavigateToAll={( ) => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/notifications' } }))}
      fetchWithInterceptor={fetchWithInterceptor}
      locationSearch={window.location.search}
    >
      <main className="flex-1 w-full relative bg-neutral-950 min-w-0">
        {isInitializing && scrapedImages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {skeletonLoader}
          </div>
        ) : (
          <>
            {/* Scrolling Overlay Content (Timeline, Assets, Meta) */}
            <div
              className={`relative z-10 bg-[#070709] min-h-screen min-w-0 ${
                activeTab === "settings" || activeTab === "audio-settings"
                  ? "px-4 md:px-8 py-8 flex flex-col gap-8"
                  : `border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] px-4 md:px-6 py-8 flex flex-col gap-12 ${
                      isFocusMode ? "hidden" : "block"
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
                          Configure synthesis voice, compose soundtrack loops, and set rendering formats
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
                  {/* TOP: Inline CinemaPlayer */}
                  {playerSettings.isPlayerOpen && (
                    <div id="section-monitor" className="w-full max-w-[1600px] ml-0 mr-0 bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 mb-4 scroll-mt-24">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap md:flex-nowrap gap-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-sans">
                            ADAPTATION PLAYER
                          </h3>
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono shrink-0 uppercase tracking-widest font-black">
                            LIVE
                          </span>
                        </div>

                        <OutputMetadataPanel
                          videoUrl={videoUrl}
                          musicTheme={musicTheme}
                          voiceActor={voiceActor}
                          navigateTo={navigateTo}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
                          }}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold font-mono active:scale-95 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                          Hide Player
                        </button>
                      </div>

                      {/* Video Monitor Split Layout with Internal Left Sidebar */}
                      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                        {/* IN-PANEL LEFT SIDEBAR: MONITOR PRESETS & EPISODES */}
                        <aside className="w-full lg:w-56 bg-neutral-955 border border-neutral-850 rounded-2xl p-4 shrink-0 space-y-3 shadow-xl self-start">
                          <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                                Playback Monitor
                              </h4>
                            </div>
                          </div>

                          <div className="space-y-1.5 font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => setActivePreviewTab?.("timeline")}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                                activePreviewTab === "timeline"
                                  ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                                  : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
                              }`}
                            >
                              <span>Storyboard Live</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 text-purple-300 rounded border border-purple-900/40">
                                {panels.length}p
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActivePreviewTab?.("video")}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                                activePreviewTab === "video"
                                  ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                                  : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
                              }`}
                            >
                              <span>Compiled Video</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 text-emerald-400 rounded border border-emerald-900/40">
                                MP4
                              </span>
                            </button>
                          </div>

                          {/* Episode Playback Selectors */}
                          <div className="pt-2 border-t border-neutral-850 space-y-2">
                            <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono">
                              Episode Replays
                            </span>
                            {((window as any).__scrapeEpisodeGroups as Array<any> || []).length > 0 ? (
                              <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {getSortedEpisodeGroups(
                                  ((window as any).__scrapeEpisodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>) || []
                                ).map(({ grp, originalIdx }) => (
                                  <button
                                    key={originalIdx}
                                    type="button"
                                    onClick={() => {
                                      if (grp.startIndex !== undefined) {
                                        setCurrentPanelIndex(grp.startIndex);
                                      }
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-purple-900/30 text-[11px] font-mono text-purple-200 hover:text-white transition-all text-left border border-neutral-850 hover:border-purple-500/40 cursor-pointer"
                                  >
                                    <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                                    <span className="text-[9px] text-neutral-400 font-normal">{grp.count}f</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 text-center space-y-1">
                                <p className="text-[10px] font-mono text-neutral-400 font-semibold">Single Episode Active</p>
                                <p className="text-[9px] font-mono text-neutral-600">No multi-episode batch found</p>
                              </div>
                            )}
                          </div>
                        </aside>

                        {/* RIGHT: Video Player */}
                        <div className="flex-1 w-full aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-2xl relative bg-black min-w-0">
                          <CinemaPlayer
                            panels={panels}
                            videoUrl={activePreviewTab === "video" ? videoUrl : null}
                            currentPanelIndex={currentPanelIndex}
                            seriesSlug={null}
                            chapterSlug={null}
                            navigateTo={() => {}}
                            addNotification={addNotification}
                            variant="floating"
                            onCloseFloating={() => {
                              useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
                            }}
                          />
                        </div>
                      </div>
                    </div>
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
                  {/* Final Production panel below timeline */}
                  <div
                    id="section-production"
                    className="w-full max-w-[1600px] ml-0 mr-0 mt-12 pt-8 border-t border-white/5 scroll-mt-24"
                  >
                    <FinalProductionPanel />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </LayoutEditorPage>
  );
};

export default React.memo(EditorPage);
