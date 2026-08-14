import React from "react";
import { Sliders, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "@/types";

// --- Custom Logic Hooks ---
import { DEFAULT_SHORTCUTS } from "@/shared/hooks/useGlobalShortcuts";

// --- Processing & Feedback Components ---
import PageNotFound from "@/components/feedback/PageNotFound";
import LoadingPage from "@/components/feedback/LoadingPage";

// --- Authentication & Landing Views (Lazy Loaded) ---
const LandingPage = React.lazy(() => import("@/features/app_landing/pages/LandingPage"));
const LoginPage = React.lazy(() => import("@/features/app_auth/pages/LoginPage"));
const RegisterPage = React.lazy(() => import("@/features/app_auth/pages/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("@/features/app_auth/pages/ForgotPasswordPage"));

// --- Lazy Loaded Feature Pages & Modals ---
const ScraperPage = React.lazy(() => import("@/features/workspace_scraper/pages/ScraperPage"));
const EditorPage = React.lazy(() => import("@/features/editor_studio/pages/EditorPage"));
const AutoCropModal = React.lazy(() => import("@/features/editor_auto_crop/components/AutoCropModal"));
const ProjectsPage = React.lazy(() => import("@/features/workspace_projects/pages/ProjectsPage"));
const SeriesDetailsPage = React.lazy(() => import("@/features/workspace_projects/pages/SeriesDetailsPage"));
const ShortcutsPage = React.lazy(() => import("@/features/app_shortcuts/pages/ShortcutsPage"));
const CreativeSuiteLayout = React.lazy(() => import("@/features/creative_suite/components/CreativeSuiteLayout"));
const DashboardPage = React.lazy(() => import("@/features/app_dashboard/pages/DashboardPage"));
const ImageEditorPage = React.lazy(() => import("@/features/editor_image/pages/ImageEditorPage"));
const YouTubePage = React.lazy(() => import("@/features/creative_youtube/pages/YouTubePage"));
const VoiceStudioPage = React.lazy(() => import("@/features/creative_voice/pages/VoiceStudioPage"));
const AIOptimizerPage = React.lazy(() => import("@/features/creative_optimizer/pages/AIOptimizerPage"));
const PanelAssistantPage = React.lazy(() => import("@/features/creative_panel_assistant/pages/PanelAssistantPage"));
const ProfilePage = React.lazy(() => import("@/features/user_profile/pages/ProfilePage"));
const SettingsAccountPage = React.lazy(() => import("@/features/user_settings/pages/SettingsAccountPage"));
const AudioSettingsPage = React.lazy(() => import("@/features/editor_audio/pages/AudioSettingsPage"));
const NotificationsPage = React.lazy(() => import("@/features/app_notification/pages/NotificationsPage"));
const CreativeSuiteDashboardPage = React.lazy(() => import("@/features/creative_suite/pages/CreativeSuiteDashboardPage"));
const EpisodeScraperPage = React.lazy(() => import("@/features/workspace_scraper/episode-scraper/pages/EpisodeScraperPage").then(m => ({ default: m.EpisodeScraperPage })));
const AdminPage = React.lazy(() => import("@/features/system_admin/pages/AdminPage"));
const AdminDashboardPage = React.lazy(() => import("@/features/system_admin/pages/AdminDashboardPage"));
const VideoEditorPage = React.lazy(() => import("@/features/editor_video/pages/VideoEditorPage"));


import MainLayout from "@/components/layout/MainLayout";

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
  setFrameRate: (rate: number | null) => void;
  addNotification: any;
  voiceActor: string;
  musicTheme: string;
  aspectRatio: string;
  frameRate: number | null;
  isWorkspaceDirty: boolean;
  appLogic: any;
  saveProject: any;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  consoleLogs: any[];
  setConsoleLogs: (logs: any) => void;
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
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
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
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
    saveStatus,
    isDirty,
  } = props;

  // --------------------------------------------------------------------------
  // AUTHENTICATION GUARDS & EARLY RETURNS
  // --------------------------------------------------------------------------

  // Detect whether we have a saved auth token in local or session storage
  const hasSavedToken = Boolean(
    typeof window !== "undefined" &&
      (localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token"))
  );

  const isPublicAuthRoute =
    currentPath === "/" ||
    currentPath === "/landing" ||
    currentPath === "" ||
    currentPath === "/index.html" ||
    currentPath === "/login" ||
    currentPath === "/register" ||
    currentPath === "/forgot-password";

  // --- Guard: Session Initialization loading state ---
  // Only show full-screen initializing loader if we are on a protected route or have a saved token being validated
  if ((isInitializing || authLoading) && (!isPublicAuthRoute || hasSavedToken)) {
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
      <React.Suspense fallback={<LoadingPage status="Loading Sonikoma..." themeMode={themeMode} />}>
        <LandingPage
          onGetStarted={() => navigateTo("/register")}
          onLogin={() => navigateTo("/login")}
          themeMode={themeMode}
          toggleThemeMode={toggleThemeMode}
        />
      </React.Suspense>
    );
  }

  // --- Guard: Login Screen ---
  if (currentPath === "/login") {
    return (
      <React.Suspense fallback={<LoadingPage status="Loading Login..." themeMode={themeMode} />}>
        <LoginPage
          onLogin={login}
          onNavigateToRegister={() => navigateTo("/register")}
          onNavigateToForgotPassword={() => navigateTo("/forgot-password")}
          onNavigateHome={() => navigateTo("/")}
        />
      </React.Suspense>
    );
  }

  // --- Guard: Registration Screen ---
  if (currentPath === "/register") {
    return (
      <React.Suspense fallback={<LoadingPage status="Loading Registration..." themeMode={themeMode} />}>
        <RegisterPage
          onRegister={register}
          onNavigateToLogin={() => navigateTo("/login")}
          onNavigateHome={() => navigateTo("/")}
        />
      </React.Suspense>
    );
  }

  // --- Guard: Password Recovery Screen ---
  if (currentPath === "/forgot-password") {
    return (
      <React.Suspense fallback={<LoadingPage status="Loading Recovery..." themeMode={themeMode} />}>
        <ForgotPasswordPage
          onForgotPassword={forgotPassword}
          onNavigateToLogin={() => navigateTo("/login")}
          onNavigateHome={() => navigateTo("/")}
        />
      </React.Suspense>
    );
  }

  // --- Guard: Protected Route Redirect ---
  if (
    !isAuthenticated &&
    currentPath !== "/scraper" &&
    !currentPath.startsWith("/scraper/editor")
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
      /^\/scraper\/editor\/series\/([^\/]+)\/chapters\/([^\/]+)(?:\/image-editor)?\/?$/
    );
    const isDetailsMode = currentPath.endsWith("/details");
    const isImageEditorPage =
      currentPath === "/image-editor" ||
      currentPath === "/image-editor/" ||
      currentPath.startsWith("/image-editor/") ||
      currentPath.endsWith("/image-editor") ||
      currentPath.endsWith("/image-editor/") ||
      currentPath.includes("/image-editor");

    const isWorkspacePath =
      currentPath === "/scraper" ||
      (chapterPathMatch !== null &&
        !isDetailsMode &&
        !currentPath.startsWith("/scraper/editor/"));

    return {
      chapterPathMatch,
      isDetailsMode,
      isWorkspacePath,
      isWorkspaceOnly: isWorkspacePath,
      isDashboardOverviewPath: currentPath === "/dashboard" || currentPath === "/",
      isProjectsPath: currentPath === "/projects",      isSettingsAccountPath:
        currentPath === "/settings/account" ||
        currentPath === "/settings/account/",
      isAutoCropPath: currentPath === "/auto-crop",
      isEpisodeScraperPath: currentPath === "/episode-scraper" || currentPath === "/scraper/episode-scraper",
      isEditorPath:
        currentPath.startsWith("/editor") ||
        currentPath === "/scraper/editor" ||
        currentPath === "/scraper/editor/" ||
        currentPath.startsWith("/scraper/editor/"),      isShortcutsPath: currentPath === "/shortcuts",
      isAudioSettingsPath: currentPath === "/scraper/audio-settings",
      isOptimizerPath:
        currentPath === "/creative-suite/ai-optimizer" ||
        currentPath.startsWith("/creative-suite/ai-optimizer?") ||
        currentPath.startsWith("/creative-suite/ai-optimizer/") ||
        currentPath === "/ai-optimizer",
      isPanelAssistantPath:
        currentPath.startsWith("/creative-suite/panel-assistant") ||
        currentPath.startsWith("/panel-assistant"),
      isCharacterPath:
        currentPath === "/creative-suite/ai-characters" ||
        currentPath.startsWith("/creative-suite/ai-characters?") ||
        currentPath.startsWith("/creative-suite/ai-characters/") ||
        currentPath === "/ai-characters",
      isVoicePath:
        currentPath === "/creative-suite/ai-voice" ||
        currentPath.startsWith("/creative-suite/ai-voice?") ||
        currentPath.startsWith("/creative-suite/ai-voice/") ||
        currentPath === "/ai-voice",
      isYouTubePath:
        currentPath === "/creative-suite/youtube" ||
        currentPath.startsWith("/creative-suite/youtube?") ||
        currentPath.startsWith("/creative-suite/youtube/") ||
        currentPath === "/youtube",
      isProfilePath:
        currentPath === "/profile" ||
        currentPath.startsWith("/profile?") ||
        currentPath.startsWith("/profile/"),
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
        currentPath.startsWith("/projects/") && !currentPath.includes("/chapter/"),
      isCreativeSuiteDashboardPath:
        currentPath === "/creative-suite" ||
        currentPath === "/creative-suite/" ||
        currentPath === "/creative-suite-dashboard",
      isCreativeSuiteSettingsPath: false,
      isCreativeSuitePath:
        currentPath === "/creative-suite" ||
        currentPath === "/creative-suite/" ||
        currentPath === "/creative-suite-dashboard" ||
        currentPath.startsWith("/creative-suite/") ||
        currentPath === "/ai-optimizer" ||
        currentPath === "/panel-assistant" ||
        currentPath === "/ai-characters" ||
        currentPath === "/ai-thumbnails" ||
        currentPath === "/ai-voice" ||
        currentPath === "/ai-analytics" ||
        currentPath === "/youtube",
      editorRouteMatch,
      isImageEditorPage,
      isVideoEditorPath:
        currentPath === "/video-editor" ||
        currentPath === "/video-editor/" ||
        currentPath.startsWith("/video-editor/"),
    };
  }, [currentPath]);

  const {
    isWorkspacePath,
    isWorkspaceOnly,
    isDashboardOverviewPath,
    isProjectsPath,    isSettingsAccountPath,
    isAutoCropPath,
    isEpisodeScraperPath,
    isEditorPath,    isShortcutsPath,
    isAudioSettingsPath,
    isOptimizerPath,
    isPanelAssistantPath,
    isCharacterPath,
    isVoicePath,
    isYouTubePath,
    isProfilePath,
    isNotificationsPath,
    isAdminPath,
    isAdminDashboardPath,
    isChapterDetailsPath,
    isSeriesDetailsPath,
    isCreativeSuitePath,
    isCreativeSuiteDashboardPath,
    isCreativeSuiteSettingsPath,
    isImageEditorPage,
    isVideoEditorPath,
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
    (Boolean(pathFlags.editorRouteMatch) ||
      currentPath === "/editor" ||
      currentPath === "/editor/" ||
      currentPath === "/scraper/editor" ||
      currentPath === "/scraper/editor/" ||
      currentPath.startsWith("/scraper/editor/")) &&
    !pathFlags.isImageEditorPage;

  const editorSeriesSlug = pathFlags.editorRouteMatch?.[1] || seriesSlugState || null;
  const editorChapterSlug = pathFlags.editorRouteMatch?.[2] || chapterSlugState || null;

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
  const headerIsDirty = isChapterDetailsPath ? projectDetailsDirty : isDirty;
  const headerSaveStatus = isChapterDetailsPath
    ? projectDetailsSaveStatus
    : saveStatus;

  const handleNavigateHome = React.useCallback(() => {
    if (projectId) {
      if (seriesSlugState && chapterSlugState) {
        navigateTo(
          `/scraper/editor/series/${seriesSlugState}/chapters/${chapterSlugState}`
        );
      } else {
        navigateTo(`/scraper?id=${projectId}`);
      }
    } else {
      navigateTo("/dashboard");
    }
  }, [navigateTo, projectId, seriesSlugState, chapterSlugState]);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);

  // Cleanly redirect legacy /workspace URLs to /scraper
  React.useEffect(() => {
    if (currentPath.startsWith("/workspace")) {
      const newPath = currentPath.replace(/^\/workspace/, "/scraper");
      const search = window.location.search;
      navigateTo(`${newPath}${search}`);
    }
  }, [currentPath, navigateTo]);

  React.useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      const container = document.getElementById("main-scroll-container");
      if (container) container.style.overflow = "";
    };
  }, []);

  const headerOnSave = React.useCallback(() => {
    if (isChapterDetailsPath) {
      projectDetailsSaveRef.current?.();
    } else {
      setShowScrapeConfirmModal(true);
    }
  }, [isChapterDetailsPath, setShowScrapeConfirmModal, projectDetailsSaveRef]);

  return (
    <MainLayout
      isVideoEditorPage={isVideoEditorPath}
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
      showBubbleModal={showBubbleModal}
    >
      <React.Suspense fallback={<LoadingPage status="Loading Studio..." themeMode={themeMode} />}>
        {/* PAGE VIEW 1: Main Editor Workspace */}
        <div
        className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]"
        style={{ display: isWorkspacePath ? "flex" : "none" }}
      >
        <ScraperPage
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
      {(isDashboardOverviewPath || currentPath === "/") && (
        <div className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]">
          <DashboardPage />
        </div>
      )}

      {/* PAGE VIEW 1.75: Projects Overview */}
      {isProjectsPath && (
        <div className="page-transition w-full flex-1 flex flex-col">
          <ProjectsPage />
        </div>
      )}



      {/* PAGE VIEW 2.25: SaaS Profile & Account Settings */}
      {isSettingsAccountPath && (
        <ProfilePage
          user={user}
          projects={[]}
          onLogout={logout}
          onNavigateHome={handleNavigateHome}
          onRefreshUser={checkAuth}
          themeMode={themeMode}
          toggleThemeMode={toggleThemeMode}
          navigateTo={navigateTo}
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          initialTab="account"
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
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
            <CreativeSuiteDashboardPage navigateTo={navigateTo} panels={panels} setPanels={setPanels} />
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
          ) : isVoicePath ? (
            <VoiceStudioPage
              panels={panels}
              setPanels={setPanels}
              onNavigateHome={handleNavigateHome}
              addNotification={addNotification}
              scrapedGenre={scrapedGenre}
              setMusicTheme={setMusicTheme}
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
          navigateTo={navigateTo}
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
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
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-[#050507] text-neutral-400 text-sm">
              Loading Episode Scraper...
            </div>
          }
        >
          <EpisodeScraperPage
            addNotification={addNotification}
            fetchWithInterceptor={fetchWithInterceptor}
            navigateTo={navigateTo}
            lastEditorPath={lastEditorPath}
          />
        </React.Suspense>
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
      {isEditorPath && !isPipMode && isProEditorPage && !isImageEditorPage && (
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

      {/* PAGE VIEW 23: Video Editor Studio */}
      {isVideoEditorPath && (
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#050507] text-neutral-400 text-sm">Loading Video Editor...</div>}>
          <VideoEditorPage
            appLogic={memoizedAppLogic}
            navigateTo={navigateTo}
            onBackToApp={handleNavigateHome}
          />
        </React.Suspense>
      )}

      {/* FALLBACK VIEW: 404 Route Not Found */}
      {!isWorkspacePath &&
        !isDashboardOverviewPath &&
        !isProjectsPath &&
        !isAutoCropPath &&
        !isEditorPath &&
        !isShortcutsPath &&
        !isAudioSettingsPath &&
        !isOptimizerPath &&
        !isPanelAssistantPath &&
        !isCharacterPath &&
        !isVoicePath &&
        !isYouTubePath &&
        !isProfilePath &&
        !isNotificationsPath &&
        !isAdminPath &&
        !isAdminDashboardPath &&
        !isSeriesDetailsPath &&
        !isEpisodeScraperPath &&
        !isCreativeSuitePath &&
        !isCreativeSuiteDashboardPath &&
        !isVideoEditorPath && (
          <PageNotFound onNavigateHome={() => navigateTo("/")} />
        )}
      </React.Suspense>
    </MainLayout>
  );
}
