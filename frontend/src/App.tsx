// ============================================================================
// SECTION 1: IMPORTS & CORE DEPENDENCIES
// ============================================================================

// --- React & State Hooks ---
import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

// --- Custom Logic Hooks ---
import { useAppLogic } from "./hooks/useAppLogic.js";
import { useAppRouter } from "./hooks/useAppRouter.js";
import {
  useGlobalShortcuts,
  DEFAULT_SHORTCUTS,
} from "./hooks/useGlobalShortcuts.js";
import { useBackendHealth } from "./hooks/useBackendHealth.js";
import { useAutoSave } from "./hooks/useAutoSave.js";

// --- Layout & Main Workspace Components ---
import Header from "./components/Header.js";
import Sidebar from "./components/Sidebar.js";
import { AppWorkspace } from "./components/AppWorkspace.js";
import PageNotFound from "./components/PageNotFound.js";
import AdvancedSettings from "./components/AdvancedSettings.js";
import LogsPage from "./components/LogsPage.js";
import StatusPage from "./components/StatusPage.js";
import ShortcutsPage from "./components/ShortcutsPage.js";

// --- Processing & Editor Modals ---
import CropEditorModal from "./components/CropEditorModal.js";
import BubbleCleanerModal from "./components/processing/BubbleCleanerModal.js";
import AutoCropModal from "./components/processing/AutoCropModal.js";
import NotificationStack from "./components/NotificationStack.js";
import ConfirmModal from "./components/ConfirmModal.js";

// --- Authentication & Landing Views ---
import LandingPage from "./components/landing/LandingPage.js";
import LoginPage from "./components/auth/LoginPage.js";
import RegisterPage from "./components/auth/RegisterPage.js";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage.js";
import ProfilePage from "./components/ProfilePage.js";
import LoadingPage from "./components/LoadingPage.js";
import ProjectDetailsPage from "./components/ProjectDetailsPage.js";

// --- AI Creator & Engagement Suite Views ---
import AIOptimizerPage from "./components/optimizer/AIOptimizerPage.js";
import PanelAssistantPage from "./components/panel_assistant/PanelAssistantPage.js";
import CharacterProfilePage from "./components/characters/CharacterProfilePage.js";
import TranslationStudioPage from "./components/translation/TranslationStudioPage.js";
import AudioLabPage from "./components/audio_lab/AudioLabPage.js";
import ThumbnailStudioPage from "./components/thumbnails/ThumbnailStudioPage.js";
import EngagementPage from "./components/engagement/EngagementPage.js";
import VoiceStudioPage from "./components/voice/VoiceStudioPage.js";
import CTRAnalyticsPage from "./components/analytics/CTRAnalyticsPage.js";
import NotificationsPage from "./components/NotificationsPage.js";

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

  // --- Auto-start backend controls ---
  const [isStartingBackend, setIsStartingBackend] = React.useState(false);
  const [startBackendError, setStartBackendError] = React.useState<
    string | null
  >(null);

  const startBackend = async () => {
    setIsStartingBackend(true);
    setStartBackendError(null);
    try {
      const res = await fetch("/start-backend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to start backend");
      }

      // Poll checking health for up to 15 seconds (30 attempts * 500ms)
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const checkRes = await fetch("/api/health", { method: "GET" }).catch(
            () => null
          );
          if (checkRes && checkRes.ok) {
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

  // --- Mobile Sidebar Toggle State ---
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
      title: string = "Confirm Action",
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

  // --- Destructuring Logic Fields & Callbacks ---
  const {
    // Workspace & Panel states
    panels,
    setPanels,
    projectId,
    setProjectId,
    consoleLogs,
    setConsoleLogs,
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    activePreviewTab,
    setActivePreviewTab,
    scrapedTitle,
    scrapedGenre,
    setScrapedGenre,
    seriesTitle,
    setSeriesTitle,
    chapterNumber,
    setChapterNumber,
    chapterTitle,
    setChapterTitle,
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
    imageEditStates,
    setImageEditStates,
    reprocessingPanelId,
    isSavingEdit,

    // Bubble Cleaner configuration
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
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
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
    isGeneratingStoryboard,
    handleGenerateStoryboardAI,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
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
    errorPopup,
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
  } = appLogic;

  // --- Effect: Fade out and remove static HTML splash screen once React app is ready ---
  React.useEffect(() => {
    if (!isInitializing && !authLoading) {
      const splash = document.getElementById("splash-screen-root");
      if (splash) {
        splash.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        splash.style.opacity = "0";
        splash.style.transform = "scale(1.05)";
        splash.style.pointerEvents = "none";
        const timer = setTimeout(() => {
          splash.remove();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isInitializing, authLoading]);

  // --- Auto Save Hook ---
  const { saveStatus, saveProject, isDirty } = useAutoSave({
    projectId,
    setProjectId,
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
    fetchWithInterceptor,
    addNotification,
  });

  // --- Project Details Page Save Sync State ---
  const [projectDetailsDirty, setProjectDetailsDirty] = React.useState(false);
  const [projectDetailsSaveStatus, setProjectDetailsSaveStatus] =
    React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const projectDetailsSaveRef = React.useRef<(() => Promise<void>) | null>(
    null
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
    pendingNavigationPath,
    setPendingNavigationPath,
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
    isDirty: isWorkspaceDirty,
  });

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

  const urlParams = new URLSearchParams(window.location.search);
  const detailsProjectId = urlParams.get("id") || urlParams.get("project_id");

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: ROUTING / NAVIGATION PATH CHECKS
  // --------------------------------------------------------------------------
  const isDashboardPath = currentPath === "/dashboard";
  const isDashboardOnly = currentPath === "/dashboard";
  const isSettingsPath = currentPath === "/settings";
  const isAutoCropPath = currentPath === "/auto-crop";
  const isBubbleCleanerPath = currentPath === "/bubble-cleaner";
  const isEditorPath = currentPath.startsWith("/editor");
  const isLogsPath = currentPath === "/logs";
  const isStatusPath = currentPath === "/status";
  const isShortcutsPath = currentPath === "/shortcuts";
  const isOptimizerPath = currentPath === "/ai-optimizer";
  const isPanelAssistantPath = currentPath.startsWith("/panel-assistant");
  const isCharacterPath = currentPath === "/ai-characters";
  const isTranslationPath = currentPath === "/ai-translation";
  const isAudioLabPath = currentPath === "/ai-audio-lab";
  const isThumbnailPath = currentPath === "/ai-thumbnails";
  const isEngagementPath = currentPath === "/ai-engagement";
  const isVoicePath = currentPath === "/ai-voice";
  const isAnalyticsPath = currentPath === "/ai-analytics";
  const isProfilePath = currentPath === "/profile";
  const isNotificationsPath = currentPath === "/notifications";
  const isProjectDetailsPath = currentPath === "/project-details";
  const isLandingPath =
    currentPath === "/" ||
    currentPath === "/landing" ||
    currentPath === "" ||
    currentPath === "/index.html";
  const isLoginPath = currentPath === "/login";
  const isRegisterPath = currentPath === "/register";
  const isForgotPasswordPath = currentPath === "/forgot-password";

  const headerProjectId = isProjectDetailsPath ? detailsProjectId : projectId;
  const headerIsDirty = isProjectDetailsPath ? projectDetailsDirty : isDirty;
  const headerSaveStatus = isProjectDetailsPath
    ? projectDetailsSaveStatus
    : saveStatus;
  const headerOnSave = isProjectDetailsPath
    ? () => {
        projectDetailsSaveRef.current?.();
      }
    : saveProject;

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: AUTHENTICATION GUARDS & EARLY RETURNS
  // --------------------------------------------------------------------------

  // --- Guard: Session Initialization loading state ---
  if (isInitializing || authLoading) {
    return null;
  }

  // --- Guard: Public Landing Page ---
  if (isLandingPath) {
    return (
      <LandingPage
        onGetStarted={() => navigateTo("/register")}
        onLogin={() => navigateTo("/login")}
      />
    );
  }

  // --- Guard: Login Screen ---
  if (isLoginPath) {
    return (
      <LoginPage
        onLogin={login}
        onNavigateToRegister={() => navigateTo("/register")}
        onNavigateToForgotPassword={() => navigateTo("/forgot-password")}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  // --- Guard: Registration Screen ---
  if (isRegisterPath) {
    return (
      <RegisterPage
        onRegister={register}
        onNavigateToLogin={() => navigateTo("/login")}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  // --- Guard: Password Recovery Screen ---
  if (isForgotPasswordPath) {
    return (
      <ForgotPasswordPage
        onForgotPassword={forgotPassword}
        onNavigateToLogin={() => navigateTo("/login")}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  // --- Guard: Protected Route Redirect ---
  if (
    !isAuthenticated &&
    !isLandingPath &&
    !isLoginPath &&
    !isRegisterPath &&
    !isForgotPasswordPath
  ) {
    setTimeout(() => navigateTo("/"), 0);
    return <LoadingPage status="Redirecting to Landing..." />;
  }

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.4: APPLICATION WORKSPACE AND PAGE RENDERING (JSX)
  // --------------------------------------------------------------------------
  return (
    <div
      id="app_root"
      className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col lg:flex-row selection:bg-purple-600 selection:text-white relative"
    >
      {/* --- Page Navigation Sidebar --- */}
      <Sidebar
        isProcessing={isProcessing}
        panels={panels}
        scrapedImages={scrapedImages}
        totalCalculatedDuration={totalCalculatedDuration}
        currentPath={currentPath}
        editingImageIdx={editingImageIdx}
        lastEditorPath={lastEditorPath}
        isBatchCropping={isBatchCropping}
        isCleaningBubbles={isCleaningBubbles}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projectId={projectId}
        isDirty={isWorkspaceDirty}
        navigateTo={navigateTo}
        notifications={notifications}
      />

      {/* --- Main Contents Controller & Router --- */}
      <div className="flex-grow flex-1 flex flex-col min-h-screen lg:max-h-screen lg:overflow-y-auto justify-between">
        <div>
          {/* Engine Health Banner */}
          {backendStatus === "offline" && (
            <div className="flex flex-col w-full z-50 animate-slide-down">
              <div className="bg-gradient-to-r from-rose-950/90 to-red-950/95 border-b border-rose-800/40 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-rose-250 flex flex-wrap items-center justify-center gap-3 w-full">
                <span className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-550 animate-ping" />
                  <span>
                    ⚠️ Computational Engine Server is Offline. Make sure the
                    Python backend is active (run{" "}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-rose-350 font-mono text-xs">
                      npm run backend
                    </code>
                    ).
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startBackend}
                    disabled={isStartingBackend}
                    className={`px-3 py-1 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isStartingBackend
                        ? "bg-amber-950/60 border-amber-700/40 text-amber-200 cursor-not-allowed"
                        : "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/40"
                    }`}
                  >
                    {isStartingBackend ? (
                      <>
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-amber-400"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Starting...
                      </>
                    ) : (
                      "Start Backend Server"
                    )}
                  </button>
                  <button
                    onClick={recheckBackend}
                    className="px-3 py-1 bg-rose-900/60 hover:bg-rose-850 text-rose-100 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border border-rose-700/50 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Recheck Connection
                  </button>
                </div>
              </div>
              {startBackendError && (
                <div className="bg-red-950/80 border-b border-red-800/30 px-4 py-2 text-center text-xs font-semibold text-red-200 flex items-center justify-center gap-2">
                  <span>⚠️ {startBackendError}</span>
                  <button
                    onClick={() => setStartBackendError(null)}
                    className="text-red-400 hover:text-red-300 font-bold ml-2 underline text-[10px] uppercase cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top Header */}
          <Header
            isProcessing={isProcessing}
            panels={panels}
            totalCalculatedDuration={totalCalculatedDuration}
            currentPath={currentPath}
            editingImageIdx={editingImageIdx}
            lastEditorPath={lastEditorPath}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            backendStatus={backendStatus}
            narrationStyle={narrationStyle}
            setNarrationStyle={setNarrationStyle}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            user={user}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            markAllNotificationsAsRead={markAllNotificationsAsRead}
            deleteNotification={deleteNotification}
            clearAllNotifications={clearAllNotifications}
            projectId={headerProjectId}
            saveStatus={headerSaveStatus}
            isDirty={headerIsDirty}
            onSave={headerOnSave}
            navigateTo={navigateTo}
            notificationsMuted={notificationsMuted}
            setNotificationsMuted={setNotificationsMuted}
          />

          {/* PAGE VIEW 1: Main Dashboard Workspace */}
          <div
            className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]"
            style={{ display: isDashboardPath ? "flex" : "none" }}
          >
            <AppWorkspace
              isDashboardOnly={isDashboardOnly}
              projectId={projectId}
              isGeneratingStoryboard={isGeneratingStoryboard}
              handleGenerateStoryboardAI={handleGenerateStoryboardAI}
              panels={panels}
              setPanels={setPanels}
              saveProject={saveProject}
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
              playStoryboardAudio={playStoryboardAudio}
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
              scrapeImages={scrapeImages}
              videoPlayerRef={videoPlayerRef}
              addNotification={addNotification}
              setErrorPopup={setErrorPopup}
              fetchWithInterceptor={fetchWithInterceptor}
              targetUrl={targetUrl}
              setTargetUrl={setTargetUrl}
              selectedSource={selectedSource}
              setSelectedSource={setSelectedSource}
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
              cropBackgroundMode={cropBackgroundMode}
              aspectRatioLock={aspectRatioLock}
              minPanelAreaPct={minPanelAreaPct}
              overlapMergeThreshold={overlapMergeThreshold}
              useLocalCV={useLocalCV}
              autoSplitTallStrips={autoSplitTallStrips}
              cropModel={cropModel}
              cropMinHeightPx={cropMinHeightPx}
              cropCannyLow={cropCannyLow}
              cropCannyHigh={cropCannyHigh}
              cropCloseKernelSize={cropCloseKernelSize}
              showScrapeConfirmModal={showScrapeConfirmModal}
              setShowScrapeConfirmModal={setShowScrapeConfirmModal}
            />
          </div>

          {/* PAGE VIEW 2: Advanced System Configuration Settings */}
          <div
            className="page-transition w-full flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6"
            style={{ display: isSettingsPath ? "flex" : "none" }}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  System Configuration Settings
                </h2>
                <p className="text-xs text-neutral-400 font-mono">
                  Manage voice synthesis, music composition, and output
                  rendering profiles
                </p>
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

          {/* PAGE VIEW 3: Real-Time Engine Logs Console */}
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

          {/* PAGE VIEW 4: Computational Diagnostics Status */}
          <div
            className="page-transition w-full flex-1 flex flex-col"
            style={{ display: isStatusPath ? "flex" : "none" }}
          >
            <StatusPage
              onNavigateHome={() => navigateTo("/")}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          </div>

          {/* PAGE VIEW 5: Global Shortcuts Configuration */}
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

          {/* PAGE VIEW 6: AI Video Optimizer */}
          {isOptimizerPath && (
            <AIOptimizerPage
              panels={panels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
              scrapedTitle={scrapedTitle}
              scrapedGenre={scrapedGenre}
              videoUrl={videoUrl}
            />
          )}

          {/* PAGE VIEW 7: AI Panel Editing Assistant */}
          {isPanelAssistantPath && (
            <PanelAssistantPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 8: AI Character Database */}
          {isCharacterPath && (
            <CharacterProfilePage
              panels={panels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 9: AI Translation Studio */}
          {isTranslationPath && (
            <TranslationStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 10: AI Audio Production Lab */}
          {isAudioLabPath && (
            <AudioLabPage
              panels={panels}
              setMusicTheme={setMusicTheme}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 11: AI Video Thumbnail Studio */}
          {isThumbnailPath && (
            <ThumbnailStudioPage
              panels={panels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
              scrapedTitle={scrapedTitle}
              scrapedGenre={scrapedGenre}
            />
          )}

          {/* PAGE VIEW 12: AI Community Engagement Studio */}
          {isEngagementPath && (
            <EngagementPage
              onNavigateHome={() => navigateTo("/")}
              scrapedTitle={scrapedTitle}
            />
          )}

          {/* PAGE VIEW 13: AI Voice Casting & Synthesizer */}
          {isVoicePath && (
            <VoiceStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
              scrapedGenre={scrapedGenre}
            />
          )}

          {/* PAGE VIEW 14: AI CTR Performance & Analytics */}
          {isAnalyticsPath && (
            <CTRAnalyticsPage
              onNavigateHome={() => navigateTo("/")}
              addNotification={addNotification}
              scrapedTitle={scrapedTitle}
              panels={panels}
            />
          )}

          {/* PAGE VIEW 15: User Profile & Account Settings */}
          {isProfilePath && (
            <ProfilePage
              user={user}
              projects={[]} // In a real app, fetch these
              onLogout={logout}
              onNavigateHome={() => navigateTo("/")}
              onRefreshUser={checkAuth}
            />
          )}

          {/* PAGE VIEW 16: Notification Center Hub */}
          {isNotificationsPath && (
            <NotificationsPage
              notifications={notifications}
              onNavigateHome={() => navigateTo("/")}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onDelete={deleteNotification}
              onClearAll={clearAllNotifications}
              notificationsMuted={notificationsMuted}
              onToggleMute={() => setNotificationsMuted(!notificationsMuted)}
            />
          )}

          {/* PAGE VIEW 17: Project Details Dashboard */}
          {isProjectDetailsPath && (
            <ProjectDetailsPage
              onNavigateHome={() => navigateTo("/")}
              navigateTo={navigateTo}
              setGlobalDirty={setProjectDetailsDirty}
              setGlobalSaveStatus={setProjectDetailsSaveStatus}
              registerSaveHandler={(handler) => {
                projectDetailsSaveRef.current = handler;
              }}
            />
          )}

          {/* PAGE VIEW 18: Batch Panel Auto Crop Page */}
          {isAutoCropPath && (
            <AutoCropModal
              isPage={true}
              onClose={() => navigateTo("/")}
              onApply={() => {
                console.log(
                  "App: Applying AutoCrop configuration parameter changes"
                );
                addNotification(
                  "Auto-crop configurations applied successfully!",
                  "success"
                );
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
              setSelectedScraped={setSelectedScraped}
              setConsoleLogs={setConsoleLogs}
              addNotification={addNotification}
              cropGuidance={cropGuidance}
              setCropGuidance={setCropGuidance}
              cropFocusMode={cropFocusMode}
              setCropFocusMode={setCropFocusMode}
            />
          )}

          {/* PAGE VIEW 19: Batch Speech Bubble Cleaner Page */}
          {isBubbleCleanerPath && (
            <BubbleCleanerModal
              isPage={true}
              onClose={() => navigateTo("/")}
              onApply={() => {
                console.log(
                  "App: Applying BubbleCleaner configuration parameter changes"
                );
                addNotification(
                  "Speech bubble cleanup configurations applied successfully!",
                  "success"
                );
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
              setSelectedScraped={setSelectedScraped}
              addNotification={addNotification}
              handleMergeWithNext={handleStitchWithNext}
              mergingIndices={mergingIndices}
            />
          )}

          {/* PAGE VIEW 20: Advanced Crop & Trim Editor Page */}
          {isEditorPath && !isPipMode && editingImageIdx !== null && (
            <CropEditorModal
              isPage={true}
              appLogic={{ ...appLogic, isPipMode, setIsPipMode }}
            />
          )}

          {/* FALLBACK VIEW: 404 Route Not Found */}
          {!isDashboardPath &&
            !isSettingsPath &&
            !isAutoCropPath &&
            !isBubbleCleanerPath &&
            !isEditorPath &&
            !isLogsPath &&
            !isStatusPath &&
            !isShortcutsPath &&
            !isOptimizerPath &&
            !isPanelAssistantPath &&
            !isCharacterPath &&
            !isTranslationPath &&
            !isAudioLabPath &&
            !isThumbnailPath &&
            !isEngagementPath &&
            !isVoicePath &&
            !isAnalyticsPath &&
            !isProfilePath &&
            !isNotificationsPath &&
            !isProjectDetailsPath && (
              <PageNotFound onNavigateHome={() => navigateTo("/")} />
            )}
        </div>

        {/* --- Global Workspace Footer --- */}
        <footer
          id="footer_pane"
          className="border-t border-neutral-900 bg-neutral-950/20 py-6 text-center text-xs text-neutral-500"
        >
          <p className="font-mono">
            Webtoon-to-Video compilation dashboard &bull; Real-time Scraper
            Integration
          </p>
        </footer>
      </div>

      {/* --------------------------------------------------------------------------
      // SUB-SECTION 2.5: GLOBAL MODALS & FLOATERS LAYER
      // -------------------------------------------------------------------------- */}

      {/* Global Toast Stack */}
      <NotificationStack
        notifications={notifications}
        removeNotification={removeNotification}
        notificationsMuted={notificationsMuted}
      />

      {/* Dashboard Modal: Batch Panel Auto Crop */}
      {isDashboardPath && showAutoCropModal && (
        <AutoCropModal
          isPage={false}
          onClose={() => setShowAutoCropModal(false)}
          onApply={() => {
            console.log(
              "App: Applying AutoCrop configuration parameter changes"
            );
            addNotification(
              "Auto-crop configurations applied successfully!",
              "success"
            );
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
          setSelectedScraped={setSelectedScraped}
          setConsoleLogs={setConsoleLogs}
          addNotification={addNotification}
          cropGuidance={cropGuidance}
          setCropGuidance={setCropGuidance}
          cropFocusMode={cropFocusMode}
          setCropFocusMode={setCropFocusMode}
        />
      )}

      {/* Dashboard Modal: Batch Speech Bubble Cleaner */}
      {isDashboardPath && showBubbleModal && (
        <BubbleCleanerModal
          isPage={false}
          onClose={() => setShowBubbleModal(false)}
          onApply={() => {
            console.log(
              "App: Applying BubbleCleaner configuration parameter changes"
            );
            addNotification(
              "Speech bubble cleanup configurations applied successfully!",
              "success"
            );
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
          setSelectedScraped={setSelectedScraped}
          addNotification={addNotification}
          handleMergeWithNext={handleStitchWithNext}
          mergingIndices={mergingIndices}
        />
      )}

      {/* Dashboard Modal: Advanced Crop & Trim Editor */}
      {isDashboardPath && !isPipMode && editingImageIdx !== null && (
        <CropEditorModal
          isPage={false}
          appLogic={{ ...appLogic, isPipMode, setIsPipMode }}
        />
      )}

      {/* Modal: Advanced Crop & Trim Editor (PIP Mode only) */}
      {isPipMode && editingImageIdx !== null && (
        <div
          className="fixed bottom-6 right-6 w-96 h-56 rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden bg-neutral-950/95 backdrop-blur-xl animate-fade-in cursor-pointer"
          onClick={() => {
            setIsPipMode(false);
            navigateTo(lastEditorPath);
          }}
        >
          <CropEditorModal
            appLogic={{ ...appLogic, isPipMode, setIsPipMode }}
          />
        </div>
      )}

      {/* Navigation Confirmation Modal */}
      {pendingNavigationPath &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setPendingNavigationPath(null)}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
              {/* Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-rose-500 blur-[1px]" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/10 rounded-xl text-rose-450 animate-pulse">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Unsaved Changes
                    </h2>
                    <p className="text-[10px] text-neutral-450 font-mono">
                      Warning: Navigation will lose current edits
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingNavigationPath(null)}
                  className="text-neutral-450 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  You have unsaved changes. Are you sure you want to navigate
                  away? Your changes will be lost.
                </p>

                <div className="bg-rose-950/15 border border-rose-950/30 rounded-2xl p-4 flex gap-3 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-rose-300 font-mono truncate">
                      Destination: {pendingNavigationPath}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setPendingNavigationPath(null)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
                >
                  Stay on Page
                </button>
                <button
                  onClick={() => {
                    const target = pendingNavigationPath;
                    setPendingNavigationPath(null);
                    window.history.pushState({}, "", target);
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 border border-red-550/30 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Leave Anyway</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {confirmDialog && confirmDialog.isOpen && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          accentColor={confirmDialog.accentColor}
          onConfirm={() => {
            confirmDialog.resolve(true);
            setConfirmDialog(null);
          }}
          onCancel={() => {
            confirmDialog.resolve(false);
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
}
