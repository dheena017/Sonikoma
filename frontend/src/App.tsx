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
import { useThemeMode } from "./hooks/useThemeMode";
import * as api from "./api/index.js";

// --- Layout & Main Workspace Components ---
import Header from "./components/Header.js";
import Sidebar from "./components/Sidebar.js";
import { AppWorkspace } from "./components/AppWorkspace.js";
import PageNotFound from "./components/PageNotFound.js";
import AdvancedSettings from "./components/AdvancedSettings.js";
import LogsPage from "./components/LogsPage.js";
import StatusPage from "./components/StatusPage.js";
import AIModelsPage from "./components/AIModelsPage.js";
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
import ProjectEditorPage from "./components/ProjectEditorPage.js";
import SeriesDetailsPage from "./components/SeriesDetailsPage.js";
import DisplayPage from "./components/DisplayPage.js";
import DashboardPage from "./components/DashboardPage.js";
import ProjectsPage from "./components/ProjectsPage.js";

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
import AdminPage from "./components/AdminPage.js";
import YouTubePage from "./components/video/YouTubePage.js";

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
      const data = await api.startBackend();

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

  // --- Mobile Sidebar Toggle State ---
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      if (container) container.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (container) container.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (container) container.style.overflow = "";
    };
  }, [isSidebarOpen]);

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

  // --- Destructuring Logic Fields & Callbacks ---
  const {
    // Workspace & Panel states
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
    resetWorkspace,
    accumulatedTokens,
    setAccumulatedTokens,
  } = appLogic;

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
    accumulatedTokens,
    setAccumulatedTokens,
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
    projectId,
    seriesSlug: seriesSlugState,
    chapterSlug: chapterSlugState,
  });

  const handleNavigateHome = React.useCallback(() => {
    if (projectId) {
      if (seriesSlugState && chapterSlugState) {
        navigateTo(`/series/${seriesSlugState}/chapters/${chapterSlugState}`);
      } else {
        navigateTo(`/workspace?id=${projectId}`);
      }
    } else {
      navigateTo("/dashboard");
    }
  }, [navigateTo, projectId, seriesSlugState, chapterSlugState]);

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
  const detailsProjectId = (() => {
    const id = urlParams.get("id") || urlParams.get("project_id");
    if (id) return id;

    // Check if we are on a slug-based path: /series/:seriesSlug/chapters/:chapterSlug
    const match = currentPath.match(/\/series\/[^\/]+\/chapters\/([^\/]+)/);
    if (match) return match[1];

    // Or just /series/:seriesSlug
    const seriesMatch = currentPath.match(/\/series\/([^\/]+)$/);
    if (seriesMatch) return seriesMatch[1];

    return null;
  })();

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: ROUTING / NAVIGATION PATH CHECKS
  // --------------------------------------------------------------------------
  const chapterPathMatch = currentPath.match(
    /\/series\/[^\/]+\/chapters\/([^\/]+)/
  );
  const isDetailsMode = currentPath.endsWith("/details");

  const isWorkspacePath =
    currentPath === "/workspace" ||
    (chapterPathMatch !== null && !isDetailsMode);
  const isWorkspaceOnly = isWorkspacePath;
  const isDashboardOverviewPath = currentPath === "/dashboard";
  const isProjectsPath = currentPath === "/projects";
  const isSettingsPath = currentPath === "/settings";
  const isAutoCropPath = currentPath === "/auto-crop";
  const isBubbleCleanerPath = currentPath === "/bubble-cleaner";
  const isEditorPath = currentPath.startsWith("/editor");
  const isLogsPath = currentPath === "/logs";
  const isStatusPath = currentPath === "/status";
  const isAIModelsPath = currentPath === "/ai-models";
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
  const isYouTubePath = currentPath === "/youtube";
  const isProfilePath = currentPath === "/profile";
  const isNotificationsPath = currentPath === "/notifications";
  const isAdminPath = currentPath === "/admin";
  const isChapterDetailsPath =
    currentPath === "/project-details" ||
    (chapterPathMatch !== null && isDetailsMode);
  const isProjectEditorPath = currentPath === "/project-editor";
  const isSeriesDetailsPath =
    !chapterPathMatch && currentPath.match(/\/series\/([^\/]+)$/) !== null;

  const isLandingPath =
    currentPath === "/" ||
    currentPath === "/landing" ||
    currentPath === "" ||
    currentPath === "/index.html";
  const isLoginPath = currentPath === "/login";
  const isRegisterPath = currentPath === "/register";
  const isForgotPasswordPath = currentPath === "/forgot-password";
  const isDisplayPath = currentPath.startsWith("/display/");

  const headerProjectId = isChapterDetailsPath ? detailsProjectId : projectId;
  const headerIsDirty = isChapterDetailsPath ? projectDetailsDirty : isDirty;
  const headerSaveStatus = isChapterDetailsPath
    ? projectDetailsSaveStatus
    : saveStatus;
  const headerOnSave = isChapterDetailsPath
    ? () => {
        projectDetailsSaveRef.current?.();
      }
    : saveProject;

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: AUTHENTICATION GUARDS & EARLY RETURNS
  // --------------------------------------------------------------------------

  // --- Guard: Session Initialization loading state ---
  if (isInitializing || authLoading) {
    const loadingStatus = isInitializing
      ? "Initializing App..."
      : "Checking Authentication...";
    return <LoadingPage status={loadingStatus} themeMode={themeMode} />;
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

  // --- Guard: Public Display Page ---
  if (isDisplayPath) {
    const displayProjectId = currentPath.split("/")[2] || "";
    return <DisplayPage projectId={displayProjectId} />;
  }

  // --- Guard: Protected Route Redirect ---
  if (
    !isAuthenticated &&
    !isLandingPath &&
    !isLoginPath &&
    !isRegisterPath &&
    !isForgotPasswordPath &&
    !isDisplayPath &&
    currentPath !== "/workspace"
  ) {
    setTimeout(() => navigateTo("/"), 0);
    return <LoadingPage status="Redirecting to Landing Page..." />;
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
        seriesSlug={seriesSlugState}
        chapterSlug={chapterSlugState}
      />

      {/* --- Main Contents Controller & Router --- */}
      <div
        id="main-scroll-container"
        className={`flex-grow flex-1 flex flex-col min-h-screen lg:max-h-screen justify-between ${
          isSidebarOpen ? "overflow-hidden" : "lg:overflow-y-auto"
        }`}
      >
        <div>
          {/* Impersonation Banner */}
          {localStorage.getItem("sonikoma_admin_token") && (
            <div className="bg-rose-600 text-white text-center py-2 px-4 text-sm font-bold flex justify-center items-center gap-4 z-[100] relative shadow-md">
              <AlertTriangle className="w-4 h-4" />
              <span>
                You are currently impersonating {user?.email || "a user"}.
              </span>
              <button
                onClick={() => {
                  const adminToken = localStorage.getItem(
                    "sonikoma_admin_token"
                  );
                  if (adminToken) {
                    localStorage.setItem("sonikoma_token", adminToken);
                    localStorage.removeItem("sonikoma_admin_token");
                    sessionStorage.removeItem("sonikoma_token");
                    window.location.href = "/admin";
                  }
                }}
                className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded transition-colors"
              >
                Return to Admin
              </button>
            </div>
          )}

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
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />

          {/* PAGE VIEW 1: Main Editor Workspace */}
          <div
            className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]"
            style={{ display: isWorkspacePath ? "flex" : "none" }}
          >
            <AppWorkspace
              isDashboardOnly={isWorkspaceOnly}
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
              isRendering={isRendering}
              renderProgress={renderProgress}
              handleRenderFinalVideo={handleRenderFinalVideo}
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
              resetWorkspace={resetWorkspace}
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

          {/* PAGE VIEW 1.5: Dashboard Overview */}
          {isDashboardOverviewPath && (
            <div className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
              <DashboardPage />
            </div>
          )}

          {/* PAGE VIEW 1.75: Projects Overview */}
          {isProjectsPath && (
            <div className="page-transition w-full flex-1 flex flex-col overflow-y-auto">
              <ProjectsPage />
            </div>
          )}

          {/* PAGE VIEW 2: Advanced System Configuration Settings */}
          {isSettingsPath && (
            <div className="page-transition w-full flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6">
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
                  onClick={handleNavigateHome}
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
          )}

          {/* PAGE VIEW 3: Real-Time Engine Logs Console */}
          {isLogsPath && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <LogsPage
                consoleLogs={consoleLogs}
                setConsoleLogs={setConsoleLogs}
                onNavigateHome={handleNavigateHome}
              />
            </div>
          )}

          {/* PAGE VIEW 4: Computational Diagnostics Status */}
          {isStatusPath && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <StatusPage
                onNavigateHome={handleNavigateHome}
                fetchWithInterceptor={fetchWithInterceptor}
                setSelectedModel={setSelectedModel}
              />
            </div>
          )}

          {/* PAGE VIEW 4.1: Dedicated AI Model Hub & Playground */}
          {isAIModelsPath && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <AIModelsPage
                onNavigateHome={handleNavigateHome}
                fetchWithInterceptor={fetchWithInterceptor}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                addNotification={addNotification}
              />
            </div>
          )}

          {/* PAGE VIEW 5: Global Shortcuts Configuration */}
          {isShortcutsPath && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <ShortcutsPage
                shortcuts={shortcuts}
                setShortcuts={setShortcuts}
                defaultShortcuts={DEFAULT_SHORTCUTS}
                onNavigateHome={handleNavigateHome}
                addNotification={addNotification}
              />
            </div>
          )}

          {/* PAGE VIEW 6: AI Video Optimizer */}
          {isOptimizerPath && (
            <AIOptimizerPage
              panels={panels}
              onNavigateHome={handleNavigateHome}
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
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 8: AI Character Database */}
          {isCharacterPath && (
            <CharacterProfilePage
              panels={panels}
              characters={appLogic.characters}
              setCharacters={appLogic.setCharacters}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 9: AI Translation Studio */}
          {isTranslationPath && (
            <TranslationStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 10: AI Audio Production Lab */}
          {isAudioLabPath && (
            <AudioLabPage
              panels={panels}
              setMusicTheme={setMusicTheme}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 11: AI Video Thumbnail Studio */}
          {isThumbnailPath && (
            <ThumbnailStudioPage
              panels={panels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedTitle={scrapedTitle}
              scrapedGenre={scrapedGenre}
            />
          )}

          {/* PAGE VIEW 12: AI Community Engagement Studio */}
          {isEngagementPath && (
            <EngagementPage
              onNavigateHome={handleNavigateHome}
              scrapedTitle={scrapedTitle}
            />
          )}

          {/* PAGE VIEW 13: AI Voice Casting & Synthesizer */}
          {isVoicePath && (
            <VoiceStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedGenre={scrapedGenre}
            />
          )}

          {/* PAGE VIEW 14: AI CTR Performance & Analytics */}
          {isAnalyticsPath && (
            <CTRAnalyticsPage
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedTitle={scrapedTitle}
              panels={panels}
            />
          )}

          {/* PAGE VIEW 14.5: YouTube Publisher Studio */}
          {isYouTubePath && (
            <YouTubePage
              panels={panels}
              videoUrl={videoUrl}
              scrapedTitle={scrapedTitle}
              scrapedGenre={scrapedGenre}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 15: User Profile & Account Settings */}
          {isProfilePath && (
            <ProfilePage
              user={user}
              projects={[]} // In a real app, fetch these
              onLogout={logout}
              onNavigateHome={handleNavigateHome}
              onRefreshUser={checkAuth}
              themeMode={themeMode}
              toggleThemeMode={toggleThemeMode}
            />
          )}

          {/* PAGE VIEW 16: Notification Center Hub */}
          {isNotificationsPath && (
            <NotificationsPage
              notifications={notifications}
              onNavigateHome={handleNavigateHome}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onDelete={deleteNotification}
              onClearAll={clearAllNotifications}
              notificationsMuted={notificationsMuted}
              onToggleMute={() => setNotificationsMuted(!notificationsMuted)}
            />
          )}

          {/* PAGE VIEW 17: Project Details Dashboard */}
          {isChapterDetailsPath && (
            <ProjectDetailsPage
              onNavigateHome={handleNavigateHome}
              navigateTo={navigateTo}
              setGlobalDirty={setProjectDetailsDirty}
              setGlobalSaveStatus={setProjectDetailsSaveStatus}
              registerSaveHandler={(handler) => {
                projectDetailsSaveRef.current = handler;
              }}
              addNotification={addNotification}
            />
          )}

          {/* PAGE VIEW 17.5: Series Landing Page */}
          {isSeriesDetailsPath && (
            <SeriesDetailsPage
              onNavigateHome={handleNavigateHome}
              navigateTo={navigateTo}
            />
          )}

          {/* PAGE VIEW 18: Batch Panel Auto Crop Page */}
          {isAutoCropPath && (
            <AutoCropModal
              isPage={true}
              onClose={handleNavigateHome}
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
              onClose={handleNavigateHome}
              onApply={() => {
                console.log(
                  "App: Applying BubbleCleaner configuration parameter changes"
                );
                addNotification(
                  "Speech bubble cleanup configurations applied successfully!",
                  "success"
                );
                handleNavigateHome();
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
          {isEditorPath &&
            !isPipMode &&
            editingImageIdx !== null &&
            (scrapedImages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-neutral-400">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold font-mono text-purple-300">
                  Loading project storyboard panels...
                </p>
              </div>
            ) : (
              <CropEditorModal
                isPage={true}
                appLogic={{ ...appLogic, isPipMode, setIsPipMode }}
              />
            ))}

          {/* PAGE VIEW 21: Dedicated Project Workspace Editor Page */}
          {isProjectEditorPath &&
            (scrapedImages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-neutral-400">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold font-mono text-purple-300">
                  Loading project editor workspace...
                </p>
              </div>
            ) : (
              <ProjectEditorPage
                appLogic={appLogic}
                onNavigateHome={handleNavigateHome}
                navigateTo={navigateTo}
              />
            ))}

          {/* PAGE VIEW 22: Admin Dashboard */}
          {isAdminPath && (
            <AdminPage
              navigateTo={navigateTo}
              isAuthenticated={isAuthenticated}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}

          {/* FALLBACK VIEW: 404 Route Not Found */}
          {!isWorkspacePath &&
            !isDashboardOverviewPath &&
            !isProjectsPath &&
            !isSettingsPath &&
            !isAutoCropPath &&
            !isBubbleCleanerPath &&
            !isEditorPath &&
            !isProjectEditorPath &&
            !isLogsPath &&
            !isStatusPath &&
            !isAIModelsPath &&
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
            !isYouTubePath &&
            !isProfilePath &&
            !isNotificationsPath &&
            !isAdminPath &&
            !isChapterDetailsPath &&
            !isSeriesDetailsPath && (
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
      {isWorkspacePath && showAutoCropModal && (
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
      {isWorkspacePath && showBubbleModal && (
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
      {isWorkspacePath && !isPipMode && editingImageIdx !== null && (
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

      {alertDialog && alertDialog.isOpen && (
        <ConfirmModal
          title={alertDialog.title}
          message={alertDialog.message}
          accentColor={alertDialog.accentColor}
          isAlert={true}
          onConfirm={() => {
            alertDialog.resolve();
            setAlertDialog(null);
          }}
          onCancel={() => {
            alertDialog.resolve();
            setAlertDialog(null);
          }}
        />
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
