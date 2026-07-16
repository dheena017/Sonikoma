// ============================================================================
// SECTION 1: IMPORTS & CORE DEPENDENCIES
// ============================================================================

import React from "react";

// --- Custom Logic Hooks ---
import {
  useAppLogic,
  useAppRouter,
  useGlobalShortcuts,
  useBackendHealth,
  useAutoSave,
  useThemeMode,
} from "./hooks";
import * as api from "./api";

// --- Components ---
import AppRouter from "./components/AppRouter";

// ============================================================================
// SECTION 2: MAIN APP COMPONENT
// ============================================================================

export default function App() {
  // --------------------------------------------------------------------------
  // SUB-SECTION 2.1: INITIALIZE CUSTOM & CORE HOOKS
  // --------------------------------------------------------------------------

  // --- Backend Engine Diagnostic Hook ---
  const { status: backendStatus, checkHealth: recheckBackend } =
    useBackendHealth();

  // --- Dark / Light Theme Mode ---
  const { themeMode, toggleThemeMode } = useThemeMode();

  // --- Auto-start backend controls ---
  const [isStartingBackend, setIsStartingBackend] = React.useState(false);
  const [startBackendError, setStartBackendError] = React.useState<
    string | null
  >(null);

  const startBackend = async () => {
    setIsStartingBackend(true);
    setStartBackendError(null);
    try {
      await api.startBackend();

      // Poll checking health for up to 15 seconds (30 attempts * 500ms)
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const data = await api.checkHealth();
          if (data) {
            clearInterval(interval);
            setIsStartingBackend(false);
            recheckBackend();
          } else if (attempts >= 30) {
            clearInterval(interval);
            setIsStartingBackend(false);
            setStartBackendError(
              "Backend started but didn't respond to health check in time."
            );
          }
        } catch {
          if (attempts >= 30) {
            clearInterval(interval);
            setIsStartingBackend(false);
            setStartBackendError(
              "Backend started but didn't respond to health check in time."
            );
          }
        }
      }, 500);
    } catch (err: any) {
      setIsStartingBackend(false);
      setStartBackendError(err.message || "Error starting backend server");
    }
  };

  // --- Global Custom Alert State ---
  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    accentColor?: string;
    resolve: () => void;
  } | null>(null);

  React.useEffect(() => {
    (window as any).alertAsync = (
      message: string,
      title: string = "localhost:3000 says",
      accentColor: string = "purple"
    ) => {
      return new Promise<void>((resolve) => {
        setAlertDialog({
          isOpen: true,
          title,
          message,
          accentColor,
          resolve,
        });
      });
    };
    return () => {
      delete (window as any).alertAsync;
    };
  }, []);

  // --- Global Custom Confirm State ---
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    accentColor?: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  React.useEffect(() => {
    (window as any).confirmAsync = (
      message: string,
      title: string = "localhost:3000 says",
      accentColor: string = "purple"
    ) => {
      return new Promise<boolean>((resolve) => {
        setGlobalConfirmRef.current = { resolve }; // Backup helper reference
        setConfirmDialog({
          isOpen: true,
          title,
          message,
          accentColor,
          resolve,
        });
      });
    };
    return () => {
      delete (window as any).confirmAsync;
    };
  }, []);

  const setGlobalConfirmRef = React.useRef<{
    resolve: (val: boolean) => void;
  } | null>(null);

  // --- Main Application Logic & Hook ---
  const appLogic = useAppLogic();

  const [scrapedRating, setScrapedRating] = React.useState<number | undefined>(() => {
    const val = localStorage.getItem("active_episode_rating");
    return val ? parseFloat(val) : undefined;
  });
  const [scrapedLikes, setScrapedLikes] = React.useState<string | undefined>(() => {
    return localStorage.getItem("active_episode_likes") || undefined;
  });
  const [scrapedViews, setScrapedViews] = React.useState<number | undefined>(() => {
    const val = localStorage.getItem("active_episode_views");
    return val ? parseInt(val) : undefined;
  });

  React.useEffect(() => {
    const ratingVal = localStorage.getItem("active_episode_rating");
    setScrapedRating(ratingVal ? parseFloat(ratingVal) : undefined);
    setScrapedLikes(localStorage.getItem("active_episode_likes") || undefined);
    const viewsVal = localStorage.getItem("active_episode_views");
    setScrapedViews(viewsVal ? parseInt(viewsVal) : undefined);
  }, [appLogic.projectId, window.location.pathname]);

  // --- Destructuring Logic Fields & Callbacks ---
  const {
    panels,
    setPanels,
    projectId,
    setProjectId,
    seriesSlugState,
    setSeriesSlugState,
    chapterSlugState,
    setChapterSlugState,
    consoleLogs,
    setConsoleLogs,
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    activePreviewTab,
    setActivePreviewTab,
    seriesTitle,
    setSeriesTitle,
    chapterNumber,
    setChapterNumber,
    chapterTitle,
    setChapterTitle,
    scrapedGenre,
    setScrapedGenre,
    seriesAuthor,
    setSeriesAuthor,
    seriesCoverImage,
    setSeriesCoverImage,
    seriesSynopsis,
    setSeriesSynopsis,

    // Image Editing states
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
    reprocessingPanelId,

    // Bubble Cleaner configuration
    showBubbleModal,
    setShowBubbleModal,
    bubbleDetectionStyle,
    bubbleEraseMethod,
    bubbleSensitivity,
    bubbleDilation,
    bubbleInpaintRadius,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,

    // Panel Auto-Cropping configuration
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
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,

    // Video Synthesis settings
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    narrationStyle,
    setNarrationStyle,
    smartSlice,
    setSmartSlice,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    selectedSource,
    setSelectedSource,
    frameRate,
    setFrameRate,

    // Video Playback & Volume Control
    videoPlayerRef,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    autoPlayAudio,
    setAutoPlayAudio,
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    narrationVolume,
    setNarrationVolume,
    bgmVolume,
    setBgmVolume,
    sfxVolume,
    setSfxVolume,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    audioDucking,
    setAudioDucking,
    audioReactiveShake,
    setAudioReactiveShake,
    shakeIntensity,
    setShakeIntensity,
    videoFormat,
    setVideoFormat,
    backgroundStyle,
    setBackgroundStyle,
    subtitlesStyle,
    setSubtitlesStyle,
    storyboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    playStoryboardAudio,

    // Pipeline Engine Status & Actions
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    videoUrl,
    setVideoUrl,
    totalCalculatedDuration,
    scrapeImages,
    handleGenerateVideo,
    handleStitchWithNext,
    isRendering,
    renderProgress,
    handleRenderFinalVideo,
    addPanelsToStoryboard,
    handleCleanBubblesSelected,
    handleAutoCropSelected,

    // Authentication Profile & Actions
    user,
    isAuthenticated,
    authLoading,
    isInitializing,
    login,
    register,
    logout,
    forgotPassword,
    checkAuth,

    // Notification Hub & Alerts
    notifications,
    notificationsMuted,
    setNotificationsMuted,
    setErrorPopup,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,

    showScrapeConfirmModal,
    setShowScrapeConfirmModal,

    // Utility Handlers
    fetchWithInterceptor,
    targetUrl,
    setTargetUrl,
    resetWorkspace,
    accumulatedTokens,
    setAccumulatedTokens,
    audioFeedback,
  } = appLogic;

  // --- Auto Save Hook ---
  const { saveStatus, saveProject, isDirty } = useAutoSave({
    projectId,
    setProjectId,
    setSeriesSlug: setSeriesSlugState,
    setChapterSlug: setChapterSlugState,
    seriesTitle,
    chapterNumber,
    chapterTitle,
    scrapedGenre,
    seriesAuthor,
    seriesCoverImage,
    seriesSynopsis,
    panels,
    scrapedImages,
    targetUrl,
    fetchWithInterceptor: fetchWithInterceptor as typeof fetch,
    addNotification,
    accumulatedTokens,
    setAccumulatedTokens,
    audioFeedback,
    videoUrl,
    setVideoUrl,
    voiceActor,
    musicTheme,
    aspectRatio,
    frameRate,
    volume,
    narrationVolume: appLogic.narrationVolume,
    bgmVolume: appLogic.bgmVolume,
    audioDucking: appLogic.audioDucking,
    speechRate: appLogic.speechRate,
    speechPitch: appLogic.speechPitch,
    audioReactiveShake: appLogic.audioReactiveShake,
    shakeIntensity: appLogic.shakeIntensity,
    videoFormat: appLogic.videoFormat,
    backgroundStyle: appLogic.backgroundStyle,
    subtitlesStyle: appLogic.subtitlesStyle,
  });

  React.useEffect(() => {
    if ((appLogic as any).setSaveProject) {
      (appLogic as any).setSaveProject(saveProject);
    }
  }, [saveProject, appLogic]);

  // --- Project Details Page Save Sync State ---
  const [projectDetailsDirty, setProjectDetailsDirty] = React.useState(false);
  const [projectDetailsSaveStatus, setProjectDetailsSaveStatus] =
    React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const projectDetailsSaveRef = React.useRef<(() => Promise<void>) | null>(
    null
  );

  const registerProjectDetailsSaveHandler = React.useCallback(
    (handler: () => Promise<void>) => {
      projectDetailsSaveRef.current = handler;
    },
    []
  );

  const isWorkspaceDirty = isDirty || projectDetailsDirty;

  // --- Router & Path Hook ---
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
    panels,
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
    isAuthenticated,
    authLoading,
    isInitializing,
    user,
    isDirty: isWorkspaceDirty,
    projectId,
    seriesSlug: seriesSlugState,
    chapterSlug: chapterSlugState,
  });

  // Trigger automatic scraping if ?importUrl=... is present in the URL on mount or path change, or if auto_import_url exists in localStorage
  React.useEffect(() => {
    if (!isAuthenticated || authLoading || isInitializing) return;

    const params = new URLSearchParams(window.location.search);
    const importUrl = params.get("importUrl") || localStorage.getItem("auto_import_url");
    const projId = params.get("id") || params.get("project_id");

    if (importUrl && projId && projId.startsWith("temp_")) {
      console.log(`[Auto Scrape] Triggering import for URL: ${importUrl} on project: ${projId}`);
      
      // Clean up the URL parameters so it doesn't trigger again on reload/navigation
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("importUrl");
      const newSearch = newParams.toString();
      const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "");
      window.history.replaceState(null, "", newUrl);

      // Clean up localStorage
      localStorage.removeItem("auto_import_url");

      // Run the scraping
      setTargetUrl(importUrl);
      scrapeImages(importUrl, projId).catch((err) => {
        console.error("[Auto Scrape] Failed to scrape images:", err);
      });
    }
  }, [isAuthenticated, authLoading, isInitializing, scrapeImages, setTargetUrl, currentPath]);

  // --- Global Keyboard Shortcuts Hook ---
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

  const handleProjectConfirm = React.useCallback(
    async (
      details: {
        seriesTitle: string;
        chapterNumber: string;
        chapterTitle: string;
        scrapedGenre: string;
        seriesAuthor: string;
        seriesCoverImage: string;
        seriesSynopsis: string;
        status: string;
        aiTasks: {
          generateScript: boolean;
          generateVoice: boolean;
          generateSFX: boolean;
        };
      },
      shouldGenerate: boolean
    ) => {
      // Update all metadata fields
      setSeriesTitle(details.seriesTitle);
      setChapterNumber(details.chapterNumber);
      setChapterTitle(details.chapterTitle);
      setScrapedGenre(details.scrapedGenre);
      setSeriesAuthor(details.seriesAuthor);
      setSeriesCoverImage(details.seriesCoverImage);
      setSeriesSynopsis(details.seriesSynopsis);

      // Always save full project state: metadata, timeline panels, imported images, and production details.
      const saved = await saveProject(undefined, {
        savingMessage: "Saving project...",
        successMessage: "Project saved successfully!",
        errorMessage: "Failed to save project.",
      }, {
        title: details.seriesTitle,
        genre: details.scrapedGenre,
        chapterNumber: details.chapterNumber,
        chapterTitle: details.chapterTitle,
        author: details.seriesAuthor,
        cover_image: details.seriesCoverImage || null,
        synopsis: details.seriesSynopsis || null,
        status: details.status,
      });

      if (!saved) {
        return false;
      }

      if (shouldGenerate) {
        setShowScrapeConfirmModal(false);

        // 1) Generate storyboard panels via central handler (ensures projectId/state correctness)
        try {
          await appLogic.handleGenerateStoryboardAI({
            title: details.seriesTitle,
            episode:
              details.chapterNumber && details.chapterTitle
                ? `Chapter ${details.chapterNumber} - ${details.chapterTitle}`
                : details.chapterNumber
                ? `Chapter ${details.chapterNumber}`
                : details.chapterTitle || undefined,
            genre: details.scrapedGenre,
            author: details.seriesAuthor,
            cover_image: details.seriesCoverImage,
            synopsis: details.seriesSynopsis,
          });

          // Wait a tick to allow panels to propagate through state
          await new Promise((res) => setTimeout(res, 50));

          // Use current panels from state after generation
          const currentPanels = panels || [];

          // 2) Optionally run sequence analysis (script extraction)
          if (details.aiTasks.generateScript && currentPanels.length > 0) {
            try {
              addNotification("Running script extraction...", "info");
              const seq = await api.analyzeSequence(fetchWithInterceptor, {
                urls: currentPanels.map((p: any) => p.image_url),
                model: selectedModel,
                narrationStyle,
              });
              if (seq.success && seq.results) {
                const updated = currentPanels.map((p: any, i: number) => {
                  const res = seq.results[i];
                  return res && res.analysis
                    ? {
                        ...p,
                        speech_text: res.analysis.speech_text || p.speech_text,
                        sfx: res.analysis.sfx || p.sfx,
                        duration: Number(res.analysis.duration) || p.duration,
                        motion_type: res.analysis.motion_type || p.motion_type,
                        visual_description:
                          res.analysis.visual_description || p.visual_description,
                        audio_url: res.audio_url || p.audio_url,
                      }
                    : p;
                });
                setPanels(updated);
                addNotification("Script extraction completed.", "success");
              } else {
                throw new Error(seq.error || "Sequence analysis failed");
              }
            } catch (err: any) {
              console.error("Script extraction failed:", err);
              addNotification(
                `Script extraction failed: ${err.message || String(err)}`,
                "error"
              );
            }
          }

          // 3) Optionally generate TTS audio per panel
          if (details.aiTasks.generateVoice) {
            try {
              addNotification("Generating voice audio (TTS)...", "info");
              const panelsWithSpeech = (panels || []).filter(
                (p: any) => p.speech_text && p.speech_text.trim()
              );
              const ttsPromises = panelsWithSpeech.map((p: any) =>
                api.generateTts(fetchWithInterceptor, {
                  project_id: projectId || undefined,
                  panel_id: p.id,
                  dialogue_list: [p.speech_text],
                  target_duration: 4.5,
                  voice: voiceActor || undefined,
                  return_base64: true,
                  speech_rate: appLogic.speechRate,
                  speech_pitch: appLogic.speechPitch,
                })
              );
              const ttsResults = await Promise.all(ttsPromises);
              const updated = (panels || []).map((p: any) => {
                const res = ttsResults.find(
                  (r: any) => r && r.panel_id === p.id
                );
                return res && res.success && res.audio_url
                  ? { ...p, audio_url: res.audio_url }
                  : p;
              });
              setPanels(updated);
              addNotification("Voice generation completed.", "success");
            } catch (err: any) {
              console.error("TTS generation failed:", err);
              addNotification(
                `TTS generation failed: ${err.message || String(err)}`,
                "error"
              );
            }
          }

          // 4) Optionally run SFX mapping/mix skill
          if (details.aiTasks.generateSFX) {
            try {
              addNotification("Mapping SFX for panels...", "info");
              const sfxRes = await api.runSfxAudioSkill(fetchWithInterceptor, {
                project_id: projectId || undefined,
                panels: (panels || []).map((p: any) => ({
                  id: p.id,
                  image_url: p.image_url,
                  visual_description: p.visual_description || null,
                })),
              });
              if (sfxRes.success && Array.isArray(sfxRes.panels)) {
                const updated = (panels || []).map((p: any) => {
                  const r = sfxRes.panels.find((x: any) => x.id === p.id);
                  return r ? { ...p, sfx: r.sfx || p.sfx } : p;
                });
                setPanels(updated);
                addNotification("SFX mapping completed.", "success");
              } else {
                throw new Error(sfxRes.error || "SFX skill failed");
              }
            } catch (err: any) {
              console.error("SFX mapping failed:", err);
              addNotification(
                `SFX mapping failed: ${err.message || String(err)}`,
                "error"
              );
            }
          }
        } catch (err: any) {
          console.error("Timeline generation failed:", err);
          addNotification(
            `Timeline generation failed: ${err.message || String(err)}`,
            "error"
          );
        }
      } else {
        setShowScrapeConfirmModal(false);
      }

      return true;
    },
    [
      saveProject,
      panels,
      projectId,
      voiceActor,
      fetchWithInterceptor,
      addNotification,
      selectedModel,
      narrationStyle,
      appLogic,
      setSeriesTitle,
      setChapterNumber,
      setChapterTitle,
      setScrapedGenre,
      setSeriesAuthor,
      setSeriesCoverImage,
      setSeriesSynopsis,
      setPanels,
      setShowScrapeConfirmModal,
    ]
  );

  const handleAutoCropApply = React.useCallback(() => {
    addNotification(
      "Auto-crop configurations applied successfully!",
      "success"
    );
    if (currentPath === "/auto-crop") {
      navigateTo("/");
    } else {
      setShowAutoCropModal(false);
    }
  }, [addNotification, currentPath, navigateTo, setShowAutoCropModal]);

  const handleAutoCropClose = React.useCallback(() => {
    if (currentPath === "/auto-crop") {
      if (projectId) {
        if (seriesSlugState && chapterSlugState) {
          navigateTo(
            `/workspace/editor/series/${seriesSlugState}/chapters/${chapterSlugState}`
          );
        } else {
          navigateTo(`/workspace?id=${projectId}`);
        }
      } else {
        navigateTo("/dashboard");
      }
    } else {
      setShowAutoCropModal(false);
    }
  }, [currentPath, projectId, seriesSlugState, chapterSlugState, navigateTo, setShowAutoCropModal]);

  return (
    <AppRouter
      currentPath={currentPath}
      lastEditorPath={lastEditorPath}
      activeTheme={activeTheme}
      setActiveTheme={setActiveTheme}
      isPipMode={isPipMode}
      setIsPipMode={setIsPipMode}
      navigateTo={navigateTo}
      isAuthenticated={isAuthenticated}
      authLoading={authLoading}
      isInitializing={isInitializing}
      user={user}
      projectId={projectId}
      seriesSlugState={seriesSlugState}
      chapterSlugState={chapterSlugState}
      themeMode={themeMode}
      toggleThemeMode={toggleThemeMode}
      login={login}
      register={register}
      logout={logout}
      forgotPassword={forgotPassword}
      checkAuth={checkAuth}
      scrapedImages={scrapedImages}
      panels={panels}
      editingImageIdx={editingImageIdx}
      setEditingImageIdx={setEditingImageIdx}
      setShowAutoCropModal={setShowAutoCropModal}
      setShowBubbleModal={setShowBubbleModal}
      setTargetUrl={setTargetUrl}
      setSelectedModel={setSelectedModel}
      setSelectedSource={setSelectedSource}
      setVoiceActor={setVoiceActor}
      setMusicTheme={setMusicTheme}
      setAspectRatio={setAspectRatio}
      setFrameRate={setFrameRate}
      addNotification={addNotification}
      voiceActor={voiceActor}
      musicTheme={musicTheme}
      aspectRatio={aspectRatio}
      frameRate={frameRate}
      isWorkspaceDirty={isWorkspaceDirty}
      appLogic={appLogic}
      totalCalculatedDuration={totalCalculatedDuration}
      autoPlayAudio={autoPlayAudio}
      setAutoPlayAudio={setAutoPlayAudio}
      saveProject={saveProject}
      videoUrl={videoUrl}
      setVideoUrl={setVideoUrl}
      consoleLogs={consoleLogs}
      setConsoleLogs={setConsoleLogs}
      selectedScraped={selectedScraped}
      setSelectedScraped={setSelectedScraped}
      activePreviewTab={activePreviewTab}
      setActivePreviewTab={setActivePreviewTab}
      setEditCropTop={setEditCropTop}
      setEditCropBottom={setEditCropBottom}
      setEditCropLeft={setEditCropLeft}
      setEditCropRight={setEditCropRight}
      isRendering={isRendering}
      renderProgress={renderProgress}
      handleRenderFinalVideo={handleRenderFinalVideo}
      setEditAutoTrim={setEditAutoTrim}
      showBubbleModal={showBubbleModal}
      playStoryboardAudio={playStoryboardAudio}
      isCleaningBubbles={isCleaningBubbles}
      cleanProgress={cleanProgress}
      bubbleCroppingImgUrl={bubbleCroppingImgUrl}
      showAutoCropModal={showAutoCropModal}
      isBatchCropping={isBatchCropping}
      batchProgress={batchProgress}
      croppingImgUrl={croppingImgUrl}
      resetWorkspace={resetWorkspace}
      handleAutoCropSelected={handleAutoCropSelected}
      handleCleanBubblesSelected={handleCleanBubblesSelected}
      scrapeImages={scrapeImages}
      videoPlayerRef={videoPlayerRef}
      setErrorPopup={setErrorPopup}
      fetchWithInterceptor={fetchWithInterceptor}
      targetUrl={targetUrl}
      selectedSource={selectedSource}
      seriesTitle={seriesTitle}
      setSeriesTitle={setSeriesTitle}
      chapterNumber={chapterNumber}
      setChapterNumber={setChapterNumber}
      chapterTitle={chapterTitle}
      setChapterTitle={setChapterTitle}
      scrapedGenre={scrapedGenre}
      setScrapedGenre={setScrapedGenre}
      seriesAuthor={seriesAuthor}
      setSeriesAuthor={setSeriesAuthor}
      seriesCoverImage={seriesCoverImage}
      setSeriesCoverImage={setSeriesCoverImage}
      seriesSynopsis={seriesSynopsis}
      setSeriesSynopsis={setSeriesSynopsis}
      selectedModel={selectedModel}
      isProcessing={isProcessing}
      handleGenerateVideo={handleGenerateVideo}
      isScraping={isScraping}
      mergingIndices={mergingIndices}
      handleStitchWithNext={handleStitchWithNext}
      addPanelsToStoryboard={addPanelsToStoryboard}
      progressStatus={progressStatus}
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
      narrationStyle={narrationStyle}
      setNarrationStyle={setNarrationStyle}
      smartSlice={smartSlice}
      setSmartSlice={setSmartSlice}
      bubbleSensitivity={bubbleSensitivity}
      bubbleDetectionStyle={bubbleDetectionStyle}
      bubbleEraseMethod={bubbleEraseMethod}
      bubbleDilation={bubbleDilation}
      bubbleInpaintRadius={bubbleInpaintRadius}
      cropSensitivity={cropSensitivity}
      setCropSensitivity={setCropSensitivity}
      cropBackgroundMode={cropBackgroundMode}
      setCropBackgroundMode={setCropBackgroundMode}
      aspectRatioLock={aspectRatioLock}
      setAspectRatioLock={setAspectRatioLock}
      minPanelAreaPct={minPanelAreaPct}
      setMinPanelAreaPct={setMinPanelAreaPct}
      overlapMergeThreshold={overlapMergeThreshold}
      setOverlapMergeThreshold={setOverlapMergeThreshold}
      useLocalCV={useLocalCV}
      setUseLocalCV={setUseLocalCV}
      autoSplitTallStrips={autoSplitTallStrips}
      setAutoSplitTallStrips={setAutoSplitTallStrips}
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
      showScrapeConfirmModal={showScrapeConfirmModal}
      setShowScrapeConfirmModal={setShowScrapeConfirmModal}
      audioFeedback={audioFeedback}
      setPanels={setPanels}
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
      audioDucking={appLogic.audioDucking}
      setAudioDucking={appLogic.setAudioDucking}
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
      shortcuts={shortcuts}
      setShortcuts={setShortcuts}
      notifications={notifications}
      notificationsMuted={notificationsMuted}
      setNotificationsMuted={setNotificationsMuted}
      markNotificationAsRead={markNotificationAsRead}
      markAllNotificationsAsRead={markAllNotificationsAsRead}
      deleteNotification={deleteNotification}
      clearAllNotifications={clearAllNotifications}
      removeNotification={removeNotification}
      scrapedRating={scrapedRating}
      scrapedLikes={scrapedLikes}
      scrapedViews={scrapedViews}
      isStartingBackend={isStartingBackend}
      setIsStartingBackend={setIsStartingBackend}
      startBackendError={startBackendError}
      setStartBackendError={setStartBackendError}
      startBackend={startBackend}
      recheckBackend={recheckBackend}
      backendStatus={backendStatus}
      alertDialog={alertDialog}
      setAlertDialog={setAlertDialog}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      handleProjectConfirm={handleProjectConfirm}
      cropPaddingPx={cropPaddingPx}
      setCropPaddingPx={setCropPaddingPx}
      activeAutoCropTab={activeAutoCropTab}
      setActiveAutoCropTab={setActiveAutoCropTab}
      cropGuidance={cropGuidance}
      setCropGuidance={setCropGuidance}
      cropFocusMode={cropFocusMode}
      setCropFocusMode={setCropFocusMode}
      handleAutoCropClose={handleAutoCropClose}
      handleAutoCropApply={handleAutoCropApply}
      projectDetailsDirty={projectDetailsDirty}
      projectDetailsSaveStatus={projectDetailsSaveStatus}
      registerProjectDetailsSaveHandler={registerProjectDetailsSaveHandler}
      projectDetailsSaveRef={projectDetailsSaveRef}
    />
  );
}
