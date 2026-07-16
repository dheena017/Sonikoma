import React from "react";
import { Sliders, ArrowLeft } from "lucide-react";

// --- Custom Logic Hooks ---
import { DEFAULT_SHORTCUTS } from "../hooks/useGlobalShortcuts";

// --- Layout & Main Workspace Components ---
import AppWorkspace from "./Workspace/AppWorkspace";
import { EditorPage } from "./Feature/editor";
import PageNotFound from "./PageNotFound";
import AdvancedSettings from "./Feature/video/AdvancedSettings";
import StatusPage from "./Status/StatusPage";
import AIModelsPage from "./Feature/ai_models/AIModelsPage";
import ModelTrainingPage from "./Feature/training/ModelTrainingPage";
import ShortcutsPage from "./Shortcuts/ShortcutsPage";

// --- Processing & Editor Modals ---
import AutoCropModal from "./Feature/processing/AutoCropModal";

// --- Authentication & Landing Views ---
import LandingPage from "./landing/LandingPage";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./auth";
import ProfilePage from "./profile/ProfilePage";
import SettingsAccountPage from "./settings/SettingsAccountPage";
import LoadingPage from "./LoadingPage";
import DisplayPage from "./DisplayPage";
import DashboardPage from "./Dashboard/DashboardPage";
import { ProjectsPage } from "./Project";

// --- AI Creator & Engagement Suite Views ---
import AIOptimizerPage from "./Feature/optimizer/AIOptimizerPage";
import PanelAssistantPage from "./Feature/panel_assistant/PanelAssistantPage";
import CharacterProfilePage from "./Feature/characters/CharacterProfilePage";
import TranslationStudioPage from "./Feature/translation/TranslationStudioPage";
import AudioLabPage from "./Feature/audio_lab/AudioLabPage";
import AudioSettingsPage from "./Feature/audio_settings/AudioSettingsPage";
import ThumbnailStudioPage from "./Feature/thumbnails/ThumbnailStudioPage";
import VoiceStudioPage from "./Feature/voice/VoiceStudioPage";
import CTRAnalyticsPage from "./Feature/analytics/CTRAnalyticsPage";
import NotificationsPage from "./notification/NotificationsPage";
import { AdminPage, AdminDashboardPage } from "./admin";
import { EpisodeScraperPage } from "./Feature/episode-scraper/EpisodeScraperPage";
import YouTubePage from "./Feature/youtube/YouTubePage";
import SeriesDetailsPage from "./SeriesDetailsPage";
import {
  CreativeSuiteLayout,
  CreativeSuiteDashboardPage,
} from "./creative";
import ImageEditorPage from "./Feature/editor/Tools/ImageEditor/ImageEditorPage";

import MainLayout from "./layout/MainLayout";

export interface AppRouterProps {
  currentPath: string;
  lastEditorPath: string;
  activeTheme: any;
  setActiveTheme: any;
  isPipMode: boolean;
  setIsPipMode: (pip: boolean) => void;
  navigateTo: (path: string) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  isInitializing: boolean;
  user: any;
  projectId: string | null;
  seriesSlugState: string | null;
  chapterSlugState: string | null;
  themeMode: any;
  toggleThemeMode: () => void;
  login: any;
  register: any;
  logout: any;
  forgotPassword: any;
  checkAuth: any;
  scrapedImages: any[];
  panels: any[];
  editingImageIdx: number;
  setEditingImageIdx: (idx: number) => void;
  setShowAutoCropModal: (show: boolean) => void;
  setShowBubbleModal: (show: boolean) => void;
  setTargetUrl: (url: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedSource: (source: string) => void;
  setVoiceActor: (actor: string) => void;
  setMusicTheme: (theme: string) => void;
  setAspectRatio: any;
  setFrameRate: (rate: number) => void;
  addNotification: any;
  voiceActor: string;
  musicTheme: string;
  aspectRatio: string;
  frameRate: number;
  isWorkspaceDirty: boolean;
  appLogic: any;
  saveProject: any;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  consoleLogs: any[];
  setConsoleLogs: (logs: any) => void;
  selectedScraped: any[];
  setSelectedScraped: (selected: any[]) => void;
  activePreviewTab: any;
  setActivePreviewTab: any;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  isRendering: boolean;
  renderProgress: number;
  handleRenderFinalVideo: any;
  setEditAutoTrim: (val: boolean) => void;
  showBubbleModal: boolean;
  playStoryboardAudio: any;
  isCleaningBubbles: boolean;
  cleanProgress: any;
  bubbleCroppingImgUrl: string;
  showAutoCropModal: boolean;
  isBatchCropping: boolean;
  batchProgress: any;
  croppingImgUrl: string;
  resetWorkspace: any;
  handleAutoCropSelected: any;
  handleCleanBubblesSelected: any;
  scrapeImages: any;
  videoPlayerRef: any;
  setErrorPopup: any;
  fetchWithInterceptor: any;
  targetUrl: string;
  selectedSource: string;
  seriesTitle: string;
  setSeriesTitle: (title: string) => void;
  chapterNumber: string;
  setChapterNumber: (num: string) => void;
  chapterTitle: string;
  setChapterTitle: (title: string) => void;
  scrapedGenre: string;
  setScrapedGenre: (genre: string) => void;
  seriesAuthor: string;
  setSeriesAuthor: (author: string) => void;
  seriesCoverImage: string;
  setSeriesCoverImage: (img: string) => void;
  seriesSynopsis: string;
  setSeriesSynopsis: (syn: string) => void;
  selectedModel: string;
  isProcessing: boolean;
  handleGenerateVideo: any;
  isScraping: boolean;
  mergingIndices: number[];
  handleStitchWithNext: any;
  addPanelsToStoryboard: any;
  progressStatus: string;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  playbackTime: number;
  setPlaybackTime: (time: number) => void;
  reprocessingPanelId: any;
  storyboardPlaying: boolean;
  toggleStoryboardPlayback: any;
  resetStoryboardPlayback: any;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  totalCalculatedDuration: number;
  autoPlayAudio: boolean;
  setAutoPlayAudio: (play: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
  narrationStyle: string;
  setNarrationStyle: (style: string) => void;
  smartSlice: boolean;
  setSmartSlice: (slice: boolean) => void;
  bubbleSensitivity: number;
  bubbleDetectionStyle: string;
  bubbleEraseMethod: string;
  bubbleDilation: number;
  bubbleInpaintRadius: number;
  cropSensitivity: number;
  setCropSensitivity: (sens: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (mode: string) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (lock: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (pct: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (thresh: number) => void;
  useLocalCV: boolean;
  setUseLocalCV: (local: boolean) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (split: boolean) => void;
  cropModel: string;
  setCropModel: (model: string) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (px: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (low: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (high: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (size: number) => void;
  showScrapeConfirmModal: boolean;
  setShowScrapeConfirmModal: (show: boolean) => void;
  audioFeedback: any;
  setPanels: (panels: any[]) => void;
  narrationVolume: number;
  setNarrationVolume: (vol: number) => void;
  bgmVolume: number;
  setBgmVolume: (vol: number) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
  audioDucking: boolean;
  setAudioDucking: (duck: boolean) => void;
  audioReactiveShake: boolean;
  setAudioReactiveShake: (shake: boolean) => void;
  shakeIntensity: any;
  setShakeIntensity: any;
  videoFormat: string;
  setVideoFormat: any;
  backgroundStyle: string;
  setBackgroundStyle: any;
  subtitlesStyle: string;
  setSubtitlesStyle: any;
  shortcuts: any;
  setShortcuts: (sc: any) => void;
  notifications: any[];
  notificationsMuted: boolean;
  setNotificationsMuted: (muted: boolean) => void;
  markNotificationAsRead: any;
  markAllNotificationsAsRead: () => void;
  deleteNotification: any;
  clearAllNotifications: () => void;
  removeNotification: any;
  scrapedRating: number | undefined;
  scrapedLikes: string | undefined;
  scrapedViews: number | undefined;
  isStartingBackend: boolean;
  setIsStartingBackend: (starting: boolean) => void;
  startBackendError: string | null;
  setStartBackendError: (err: string | null) => void;
  startBackend: () => void;
  recheckBackend: () => void;
  backendStatus: string;
  alertDialog: any;
  setAlertDialog: (dialog: any) => void;
  confirmDialog: any;
  setConfirmDialog: (dialog: any) => void;
  handleProjectConfirm: any;
  cropPaddingPx: number;
  setCropPaddingPx: (px: number) => void;
  activeAutoCropTab: string;
  setActiveAutoCropTab: (tab: string) => void;
  cropGuidance: string;
  setCropGuidance: (guid: string) => void;
  cropFocusMode: string;
  setCropFocusMode: (mode: string) => void;
  handleAutoCropClose: () => void;
  handleAutoCropApply: () => void;
  projectDetailsDirty: boolean;
  projectDetailsSaveStatus: "idle" | "saving" | "saved" | "error";
  registerProjectDetailsSaveHandler: (handler: () => Promise<void>) => void;
  projectDetailsSaveRef: React.MutableRefObject<(() => Promise<void>) | null>;
  isStartingBackendRef?: any;
}

export default function AppRouter(props: AppRouterProps) {
  const {
    currentPath,
    lastEditorPath,
    activeTheme,
    setActiveTheme,
    isPipMode,
    setIsPipMode,
    navigateTo,
    isAuthenticated,
    authLoading,
    isInitializing,
    user,
    projectId,
    seriesSlugState,
    chapterSlugState,
    themeMode,
    toggleThemeMode,
    login,
    register,
    logout,
    forgotPassword,
    checkAuth,
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
    isWorkspaceDirty,
    appLogic,
    saveProject,
    videoUrl,
    setVideoUrl,
    consoleLogs,
    setConsoleLogs,
    selectedScraped,
    setSelectedScraped,
    activePreviewTab,
    setActivePreviewTab,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    isRendering,
    renderProgress,
    handleRenderFinalVideo,
    setEditAutoTrim,
    showBubbleModal,
    playStoryboardAudio,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    showAutoCropModal,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    resetWorkspace,
    handleAutoCropSelected,
    handleCleanBubblesSelected,
    scrapeImages,
    videoPlayerRef,
    setErrorPopup,
    fetchWithInterceptor,
    targetUrl,
    selectedSource,
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
    selectedModel,
    isProcessing,
    handleGenerateVideo,
    isScraping,
    mergingIndices,
    handleStitchWithNext,
    addPanelsToStoryboard,
    progressStatus,
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    reprocessingPanelId,
    storyboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    narrationStyle,
    setNarrationStyle,
    smartSlice,
    setSmartSlice,
    bubbleSensitivity,
    bubbleDetectionStyle,
    bubbleEraseMethod,
    bubbleDilation,
    bubbleInpaintRadius,
    cropSensitivity,
    setCropSensitivity,
    cropBackgroundMode,
    setCropBackgroundMode,
    aspectRatioLock,
    setAspectRatioLock,
    minPanelAreaPct,
    setMinPanelAreaPct,
    overlapMergeThreshold,
    setOverlapMergeThreshold,
    useLocalCV,
    setUseLocalCV,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
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
    showScrapeConfirmModal,
    setShowScrapeConfirmModal,
    audioFeedback,
    setPanels,
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
    shortcuts,
    setShortcuts,
    notifications,
    notificationsMuted,
    setNotificationsMuted,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    removeNotification,
    scrapedRating,
    scrapedLikes,
    scrapedViews,
    isStartingBackend,
    setIsStartingBackend,
    startBackendError,
    setStartBackendError,
    startBackend,
    recheckBackend,
    backendStatus,
    alertDialog,
    setAlertDialog,
    confirmDialog,
    setConfirmDialog,
    handleProjectConfirm,
    cropPaddingPx,
    setCropPaddingPx,
    activeAutoCropTab,
    setActiveAutoCropTab,
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,
    handleAutoCropClose,
    handleAutoCropApply,
    projectDetailsDirty,
    projectDetailsSaveStatus,
    registerProjectDetailsSaveHandler,
    projectDetailsSaveRef,
    totalCalculatedDuration,
    autoPlayAudio,
    setAutoPlayAudio,
  } = props;

  // --------------------------------------------------------------------------
  // AUTHENTICATION GUARDS & EARLY RETURNS
  // --------------------------------------------------------------------------

  // --- Guard: Session Initialization loading state ---
  if (isInitializing || authLoading) {
    const loadingStatus = isInitializing
      ? "Initializing App..."
      : "Checking Authentication...";
    return <LoadingPage status={loadingStatus} themeMode={themeMode} />;
  }

  // --- Guard: Public Landing Page ---
  if (
    currentPath === "/" ||
    currentPath === "/landing" ||
    currentPath === "" ||
    currentPath === "/index.html"
  ) {
    return (
      <LandingPage
        onGetStarted={() => navigateTo("/register")}
        onLogin={() => navigateTo("/login")}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
      />
    );
  }

  // --- Guard: Login Screen ---
  if (currentPath === "/login") {
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
  if (currentPath === "/register") {
    return (
      <RegisterPage
        onRegister={register}
        onNavigateToLogin={() => navigateTo("/login")}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  // --- Guard: Password Recovery Screen ---
  if (currentPath === "/forgot-password") {
    return (
      <ForgotPasswordPage
        onForgotPassword={forgotPassword}
        onNavigateToLogin={() => navigateTo("/login")}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  // --- Guard: Public Display Page ---
  if (currentPath.startsWith("/display/")) {
    const displayProjectId = currentPath.split("/")[2] || "";
    return <DisplayPage projectId={displayProjectId} />;
  }

  // --- Guard: Protected Route Redirect ---
  if (
    !isAuthenticated &&
    currentPath !== "/workspace" &&
    !currentPath.startsWith("/workspace/editor")
  ) {
    setTimeout(() => navigateTo("/"), 0);
    return <LoadingPage status="Redirecting to Landing Page..." />;
  }

  // --------------------------------------------------------------------------
  // ROUTING / NAVIGATION PATH CHECKS
  // --------------------------------------------------------------------------
  const pathFlags = React.useMemo(() => {
    const chapterPathMatch = currentPath.match(
      /\/series\/[^\/]+\/chapters\/([^\/]+)/
    );
    const editorRouteMatch = currentPath.match(
      /^\/workspace\/editor\/series\/([^\/]+)\/chapters\/([^\/]+)(?:\/image-editor)?\/?$/
    );
    const isDetailsMode = currentPath.endsWith("/details");
    const isImageEditorPage =
      currentPath === "/image-editor" ||
      currentPath === "/image-editor/" ||
      currentPath.startsWith("/image-editor/") ||
      currentPath.endsWith("/image-editor") ||
      currentPath.endsWith("/image-editor/");

    const isWorkspacePath =
      currentPath === "/workspace" ||
      (chapterPathMatch !== null &&
        !isDetailsMode &&
        !currentPath.startsWith("/workspace/editor/"));

    return {
      chapterPathMatch,
      isDetailsMode,
      isWorkspacePath,
      isWorkspaceOnly: isWorkspacePath,
      isDashboardOverviewPath: currentPath === "/dashboard",
      isProjectsPath: currentPath === "/projects",
      isSettingsPath: currentPath === "/settings",
      isSettingsAccountPath:
        currentPath === "/settings/account" ||
        currentPath === "/settings/account/",
      isAutoCropPath: currentPath === "/auto-crop",
      isEpisodeScraperPath: currentPath === "/episode-scraper",
      isEditorPath:
        currentPath.startsWith("/editor") ||
        currentPath === "/workspace/editor" ||
        currentPath === "/workspace/editor/" ||
        currentPath.startsWith("/workspace/editor/"),
      isLogsPath: currentPath === "/logs",
      isStatusPath: currentPath === "/status",
      isAIModelsPath: currentPath === "/ai-models",
      isModelTrainingPath: currentPath === "/model-training",
      isShortcutsPath: currentPath === "/shortcuts",
      isAudioSettingsPath: currentPath === "/workspace/audio-settings",
      isOptimizerPath: currentPath === "/ai-optimizer",
      isPanelAssistantPath: currentPath.startsWith("/panel-assistant"),
      isCharacterPath: currentPath === "/ai-characters",
      isTranslationPath: currentPath === "/ai-translation",
      isAudioLabPath: currentPath === "/ai-audio-lab",
      isThumbnailPath: currentPath === "/ai-thumbnails",
      isVoicePath: currentPath === "/ai-voice",
      isAnalyticsPath: currentPath === "/ai-analytics",
      isYouTubePath: currentPath === "/youtube",
      isProfilePath: currentPath === "/profile",
      isNotificationsPath: currentPath === "/notifications",
      isAdminDashboardPath:
        currentPath === "/admin" ||
        currentPath === "/admin/" ||
        currentPath === "/admin-dashboard",
      isAdminPath:
        currentPath.startsWith("/admin/") && currentPath !== "/admin/",
      isChapterDetailsPath: false,
      isProjectEditorPath: false,
      isSeriesDetailsPath:
        !chapterPathMatch && currentPath.match(/\/series\/([^\/]+)$/) !== null,
      isCreativeSuiteDashboardPath:
        currentPath === "/creative-suite" ||
        currentPath === "/creative-suite/" ||
        currentPath === "/creative-suite-dashboard",
      isCreativeSuitePath:
        currentPath === "/creative-suite" ||
        currentPath === "/creative-suite/" ||
        currentPath === "/creative-suite-dashboard" ||
        currentPath === "/ai-optimizer" ||
        currentPath === "/panel-assistant" ||
        currentPath === "/ai-characters" ||
        currentPath === "/ai-translation" ||
        currentPath === "/ai-audio-lab" ||
        currentPath === "/ai-thumbnails" ||
        currentPath === "/ai-voice" ||
        currentPath === "/ai-analytics" ||
        currentPath === "/youtube",
      editorRouteMatch,
      isImageEditorPage,
    };
  }, [currentPath]);

  const {
    isWorkspacePath,
    isWorkspaceOnly,
    isDashboardOverviewPath,
    isProjectsPath,
    isSettingsPath,
    isSettingsAccountPath,
    isAutoCropPath,
    isEpisodeScraperPath,
    isEditorPath,
    isLogsPath,
    isStatusPath,
    isAIModelsPath,
    isModelTrainingPath,
    isShortcutsPath,
    isAudioSettingsPath,
    isOptimizerPath,
    isPanelAssistantPath,
    isCharacterPath,
    isTranslationPath,
    isAudioLabPath,
    isThumbnailPath,
    isVoicePath,
    isAnalyticsPath,
    isYouTubePath,
    isProfilePath,
    isNotificationsPath,
    isAdminPath,
    isAdminDashboardPath,
    isChapterDetailsPath,
    isSeriesDetailsPath,
    isCreativeSuitePath,
    isCreativeSuiteDashboardPath,
    editorRouteMatch,
    isImageEditorPage,
  } = pathFlags;

  const isAnyAdmin = isAdminPath || isAdminDashboardPath;

  const memoizedAppLogic = React.useMemo(
    () => ({
      ...appLogic,
      isPipMode,
      setIsPipMode,
      activeTheme,
      setActiveTheme,
    }),
    [appLogic, isPipMode, activeTheme, setActiveTheme]
  );

  const isProEditorPage =
    (Boolean(editorRouteMatch) ||
      currentPath === "/editor" ||
      currentPath === "/editor/" ||
      currentPath === "/workspace/editor" ||
      currentPath === "/workspace/editor/" ||
      currentPath.startsWith("/workspace/editor/")) &&
    !isImageEditorPage;

  const editorSeriesSlug = editorRouteMatch?.[1] || seriesSlugState || null;
  const editorChapterSlug = editorRouteMatch?.[2] || chapterSlugState || null;

  const detailsProjectId = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id") || urlParams.get("project_id");
    if (id) return id;

    const match = currentPath.match(/\/series\/[^\/]+\/chapters\/([^\/]+)/);
    if (match) return match[1];

    const seriesMatch = currentPath.match(/\/series\/([^\/]+)$/);
    if (seriesMatch) return seriesMatch[1];

    return null;
  }, [currentPath]);

  const headerProjectId = isChapterDetailsPath ? detailsProjectId : projectId;
  const headerIsDirty = isChapterDetailsPath ? projectDetailsDirty : isWorkspaceDirty;
  const headerSaveStatus = isChapterDetailsPath
    ? projectDetailsSaveStatus
    : appLogic.saveStatus;

  const handleNavigateHome = React.useCallback(() => {
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
  }, [navigateTo, projectId, seriesSlugState, chapterSlugState]);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);

  React.useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (container) container.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (container) container.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (container) container.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const headerOnSave = React.useCallback(() => {
    if (isChapterDetailsPath) {
      projectDetailsSaveRef.current?.();
    } else {
      setShowScrapeConfirmModal(true);
    }
  }, [isChapterDetailsPath, setShowScrapeConfirmModal, projectDetailsSaveRef]);

  return (
    <MainLayout
      currentPath={currentPath}
      navigateTo={navigateTo}
      isAnyAdmin={isAnyAdmin}
      isCreativeSuitePath={isCreativeSuitePath}
      isImageEditorPage={isImageEditorPage}
      isProEditorPage={isProEditorPage}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      isTerminalOpen={isTerminalOpen}
      setIsTerminalOpen={setIsTerminalOpen}
      backendStatus={backendStatus}
      recheckBackend={recheckBackend}
      themeMode={themeMode}
      toggleThemeMode={toggleThemeMode}
      isStartingBackend={isStartingBackend}
      setIsStartingBackend={setIsStartingBackend}
      startBackendError={startBackendError}
      setStartBackendError={setStartBackendError}
      startBackend={startBackend}
      alertDialog={alertDialog}
      setAlertDialog={setAlertDialog}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      showScrapeConfirmModal={showScrapeConfirmModal}
      setShowScrapeConfirmModal={setShowScrapeConfirmModal}
      handleProjectConfirm={handleProjectConfirm}
      user={user}
      panels={panels}
      scrapedImages={scrapedImages}
      totalCalculatedDuration={totalCalculatedDuration}
      editingImageIdx={editingImageIdx}
      lastEditorPath={lastEditorPath}
      isBatchCropping={isBatchCropping}
      isCleaningBubbles={isCleaningBubbles}
      projectId={projectId}
      isWorkspaceDirty={isWorkspaceDirty}
      notifications={notifications}
      notificationsMuted={notificationsMuted}
      setNotificationsMuted={setNotificationsMuted}
      markNotificationAsRead={markNotificationAsRead}
      markAllNotificationsAsRead={markAllNotificationsAsRead}
      deleteNotification={deleteNotification}
      clearAllNotifications={clearAllNotifications}
      removeNotification={removeNotification}
      fetchWithInterceptor={fetchWithInterceptor}
      narrationStyle={narrationStyle}
      setNarrationStyle={setNarrationStyle}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      volume={volume}
      setVolume={setVolume}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      autoPlayAudio={autoPlayAudio}
      setAutoPlayAudio={setAutoPlayAudio}
      appLogic={appLogic}
      headerProjectId={headerProjectId}
      headerSaveStatus={headerSaveStatus}
      headerIsDirty={headerIsDirty}
      headerOnSave={headerOnSave}
      cropSensitivity={cropSensitivity}
      setCropSensitivity={setCropSensitivity}
      cropPaddingPx={cropPaddingPx}
      setCropPaddingPx={setCropPaddingPx}
      cropBackgroundMode={cropBackgroundMode}
      setCropBackgroundMode={setCropBackgroundMode}
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
      activeAutoCropTab={activeAutoCropTab}
      setActiveAutoCropTab={setActiveAutoCropTab}
      selectedScraped={selectedScraped}
      setSelectedScraped={setSelectedScraped}
      setConsoleLogs={setConsoleLogs}
      addNotification={addNotification}
      cropGuidance={cropGuidance}
      setCropGuidance={setCropGuidance}
      cropFocusMode={cropFocusMode}
      setCropFocusMode={setCropFocusMode}
      handleAutoCropClose={handleAutoCropClose}
      handleAutoCropApply={handleAutoCropApply}
      seriesTitle={seriesTitle}
      chapterNumber={chapterNumber}
      chapterTitle={chapterTitle}
      scrapedGenre={scrapedGenre}
      seriesAuthor={seriesAuthor}
      seriesCoverImage={seriesCoverImage}
      seriesSynopsis={seriesSynopsis}
      consoleLogs={consoleLogs}
      seriesSlugState={seriesSlugState}
      chapterSlugState={chapterSlugState}
      showAutoCropModal={showAutoCropModal}
    >
      {/* PAGE VIEW 1: Main Editor Workspace */}
      <div
        className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]"
        style={{ display: isWorkspacePath ? "flex" : "none" }}
      >
        <AppWorkspace
          isDashboardOnly={isWorkspaceOnly}
          projectId={projectId}
          seriesSlug={seriesSlugState}
          chapterSlug={chapterSlugState}
          isGeneratingStoryboard={appLogic.isGeneratingStoryboard}
          handleGenerateStoryboardAI={appLogic.handleGenerateStoryboardAI}
          panels={panels}
          setPanels={setPanels}
          saveProject={saveProject}
          videoUrl={videoUrl}
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
          scrapedImages={scrapedImages}
          setScrapedImages={appLogic.setScrapedImages}
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
          navigateTo={navigateTo}
          audioFeedback={audioFeedback}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
                <span
                  className="hover:text-purple-400 cursor-pointer"
                  onClick={handleNavigateHome}
                >
                  Dashboard
                </span>
                <span>&gt;</span>
                <span className="text-purple-400">Settings</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="icon-pill icon-pill--purple">
                  <Sliders className="h-5 w-5" />
                </div>
                System Configuration Settings
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Manage voice synthesis, music composition, and output rendering profiles
              </p>
            </div>
            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </button>
          </div>
          <AdvancedSettings
            voiceActor={voiceActor}
            setVoiceActor={setVoiceActor}
            musicTheme={musicTheme}
            setMusicTheme={setMusicTheme}
            aspectRatio={aspectRatio as any}
            setAspectRatio={setAspectRatio}
            frameRate={frameRate}
            setFrameRate={setFrameRate}
            activeTheme={activeTheme as any}
            setActiveTheme={setActiveTheme}
            targetUrl={targetUrl}
            selectedModel={selectedModel}
            selectedSource={selectedSource}
            addNotification={addNotification}
            fetchWithInterceptor={fetchWithInterceptor}
            audioReactiveShake={audioReactiveShake}
            setAudioReactiveShake={setAudioReactiveShake}
            shakeIntensity={shakeIntensity as any}
            setShakeIntensity={setShakeIntensity as any}
            videoFormat={videoFormat as any}
            setVideoFormat={setVideoFormat as any}
            backgroundStyle={backgroundStyle as any}
            setBackgroundStyle={setBackgroundStyle as any}
            subtitlesStyle={subtitlesStyle as any}
            setSubtitlesStyle={setSubtitlesStyle as any}
          />
        </div>
      )}

      {/* PAGE VIEW 2.25: SaaS Profile & Account Settings */}
      {isSettingsAccountPath && (
        <div className="page-transition w-full flex-1 flex flex-col">
          <SettingsAccountPage
            user={user}
            onRefreshUser={checkAuth}
            fetchWithInterceptor={fetchWithInterceptor}
            addNotification={addNotification}
            navigateTo={navigateTo}
          />
        </div>
      )}

      {/* PAGE VIEW 2.5: Dedicated Audio & TTS Mixer Settings */}
      {isAudioSettingsPath && (
        <div className="page-transition w-full flex-1 flex flex-col">
          <AudioSettingsPage
            projectId={projectId}
            onNavigateHome={handleNavigateHome}
            addNotification={addNotification}
            fetchWithInterceptor={fetchWithInterceptor}
            volume={volume}
            setVolume={setVolume}
            narrationVolume={narrationVolume}
            setNarrationVolume={setNarrationVolume}
            bgmVolume={bgmVolume}
            setBgmVolume={setBgmVolume}
            sfxVolume={sfxVolume}
            setSfxVolume={setSfxVolume}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            speechPitch={speechPitch}
            setSpeechPitch={setSpeechPitch}
            voiceActor={voiceActor}
            setVoiceActor={setVoiceActor}
            musicTheme={musicTheme}
            setMusicTheme={setMusicTheme}
            audioDucking={audioDucking}
            setAudioDucking={setAudioDucking}
          />
        </div>
      )}

      {/* PAGE VIEW 3: Real-Time Engine Logs Console */}
      {isLogsPath && (
        <div className="page-transition w-full flex-1 flex flex-col">
          <StatusPage
            onNavigateHome={handleNavigateHome}
            fetchWithInterceptor={fetchWithInterceptor}
            setSelectedModel={setSelectedModel}
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

      {/* PAGE VIEW 4.2: YOLO Model Fine-Tuning Hub */}
      {isModelTrainingPath && (
        <div className="page-transition w-full flex-1 flex flex-col">
          <ModelTrainingPage
            onNavigateHome={handleNavigateHome}
            fetchWithInterceptor={fetchWithInterceptor}
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
            audioFeedback={audioFeedback}
          />
        </div>
      )}

      {/* PAGE VIEW 6: Creative Suite Unified Views */}
      {isCreativeSuitePath && (
        <CreativeSuiteLayout
          hideSidebarAndHeader={true}
          currentPath={currentPath}
          navigateTo={navigateTo}
          fetchWithInterceptor={fetchWithInterceptor}
          panels={panels}
        >
          {isCreativeSuiteDashboardPath ? (
            <CreativeSuiteDashboardPage navigateTo={navigateTo} />
          ) : isOptimizerPath ? (
            <AIOptimizerPage
              panels={panels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedTitle={seriesTitle}
              scrapedGenre={scrapedGenre}
              videoUrl={videoUrl}
            />
          ) : isPanelAssistantPath ? (
            <PanelAssistantPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          ) : isCharacterPath ? (
            <CharacterProfilePage
              panels={panels}
              characters={appLogic.characters}
              setCharacters={appLogic.setCharacters}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          ) : isTranslationPath ? (
            <TranslationStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          ) : isAudioLabPath ? (
            <AudioLabPage
              panels={panels}
              setMusicTheme={setMusicTheme}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          ) : isThumbnailPath ? (
            <ThumbnailStudioPage
              panels={panels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedTitle={seriesTitle}
              scrapedGenre={scrapedGenre}
            />
          ) : isVoicePath ? (
            <VoiceStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedGenre={scrapedGenre}
            />
          ) : isAnalyticsPath ? (
            <CTRAnalyticsPage
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedTitle={seriesTitle}
              panels={panels}
            />
          ) : isYouTubePath ? (
            <YouTubePage
              panels={panels}
              videoUrl={videoUrl}
              scrapedTitle={seriesTitle}
              scrapedGenre={scrapedGenre}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
            />
          ) : null}
        </CreativeSuiteLayout>
      )}

      {/* PAGE VIEW 15: User Profile & Account Settings */}
      {isProfilePath && (
        <ProfilePage
          user={user}
          projects={[]}
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
          onMarkAsRead={markNotificationAsRead as any}
          onMarkAllAsRead={markAllNotificationsAsRead}
          onDelete={deleteNotification as any}
          onClearAll={clearAllNotifications}
          notificationsMuted={notificationsMuted}
          onToggleMute={() => setNotificationsMuted(!notificationsMuted)}
        />
      )}

      {/* PAGE VIEW 16.5: Dedicated WEBTOON Episode Scraper Page */}
      {isEpisodeScraperPath && (
        <EpisodeScraperPage
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          navigateTo={navigateTo}
          lastEditorPath={lastEditorPath}
        />
      )}

      {/* PAGE VIEW 17.5: Series Landing Page */}
      {isSeriesDetailsPath && (
        <SeriesDetailsPage
          onNavigateHome={handleNavigateHome}
          navigateTo={navigateTo}
          fetchWithInterceptor={fetchWithInterceptor}
        />
      )}

      {/* PAGE VIEW 18: Batch Panel Auto Crop Page */}
      {isAutoCropPath && (
        <AutoCropModal
          isPage={true}
          onClose={handleAutoCropClose}
          onApply={handleAutoCropApply}
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

      {/* PAGE VIEW 19: Full Editor Page */}
      {isEditorPath && !isPipMode && isProEditorPage && (
        <EditorPage
          appLogic={memoizedAppLogic}
          navigateTo={navigateTo}
          onRequestProjectConfirmation={headerOnSave}
          seriesSlug={editorSeriesSlug}
          chapterSlug={editorChapterSlug}
          rating={scrapedRating}
          likes={scrapedLikes}
          views={scrapedViews}
        />
      )}

      {/* PAGE VIEW 20: Advanced Crop & Trim Editor Page */}
      {(isImageEditorPage || (isEditorPath && !isProEditorPage)) && !isPipMode && (
        <ImageEditorPage
          appLogic={memoizedAppLogic}
          themeMode={themeMode as any}
          toggleThemeMode={toggleThemeMode}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          navigateTo={navigateTo}
          seriesSlug={editorSeriesSlug}
          chapterSlug={editorChapterSlug}
        />
      )}

      {/* PAGE VIEW 21: Admin Dashboard */}
      {isAdminPath && (
        <AdminPage
          user={user}
          navigateTo={navigateTo}
          currentPath={currentPath}
          isAuthenticated={isAuthenticated}
          fetchWithInterceptor={fetchWithInterceptor}
          addNotification={addNotification}
          audioFeedback={audioFeedback}
        />
      )}

      {/* PAGE VIEW 22: New Standalone Admin Dashboard Page */}
      {isAdminDashboardPath && (
        <AdminDashboardPage
          user={user}
          navigateTo={navigateTo}
          isAuthenticated={isAuthenticated}
          fetchWithInterceptor={fetchWithInterceptor}
          addNotification={addNotification}
          audioFeedback={audioFeedback}
        />
      )}

      {/* FALLBACK VIEW: 404 Route Not Found */}
      {!isWorkspacePath &&
        !isDashboardOverviewPath &&
        !isProjectsPath &&
        !isSettingsPath &&
        !isAutoCropPath &&
        !isEditorPath &&
        !isLogsPath &&
        !isStatusPath &&
        !isAIModelsPath &&
        !isModelTrainingPath &&
        !isShortcutsPath &&
        !isAudioSettingsPath &&
        !isOptimizerPath &&
        !isPanelAssistantPath &&
        !isCharacterPath &&
        !isTranslationPath &&
        !isAudioLabPath &&
        !isThumbnailPath &&
        !isVoicePath &&
        !isAnalyticsPath &&
        !isYouTubePath &&
        !isProfilePath &&
        !isNotificationsPath &&
        !isAdminPath &&
        !isAdminDashboardPath &&
        !isSeriesDetailsPath &&
        !isEpisodeScraperPath &&
        !isCreativeSuiteDashboardPath && (
          <PageNotFound onNavigateHome={() => navigateTo("/")} />
        )}
    </MainLayout>
  );
}
