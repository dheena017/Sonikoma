import React from "react";
import { Sliders, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "@/shared/types";
import { getHumanEditorPath } from "@/shared/utils/workspaceNavigation";

// --- Custom Logic Hooks ---
import { DEFAULT_SHORTCUTS } from "@/features/platform/shortcuts/hooks/useGlobalShortcuts";

// --- Processing & Feedback Components ---
import PageNotFound from "@/shared/ui/feedback/PageNotFound";
import LoadingPage from "@/features/platform/shell/components/LoadingPage";
import RouteLoadingFallback from "@/shared/ui/feedback/RouteLoadingFallback";

// --- Authentication & Landing Views (Direct Imports for Instant Rendering) ---
import LandingPage from "@/features/landing/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import AuthSuccessPage from "@/features/auth/pages/AuthSuccessPage";

// --- Lazy Loaded Feature Pages & Modals ---
const ScraperPage = React.lazy(
  () => import("@/features/platform/scraper/pages/ScraperPage")
);
const EditorPage = React.lazy(
  () => import("@/features/workspace/shell/pages/EditorPage")
);
const AutoCropSettingsModal = React.lazy(
  () => import("@/features/image-editor/auto-crop/components/AutoCropSettingsModal")
);
const AutoCropPreviewPage = React.lazy(
  () => import("@/features/image-editor/auto-crop/pages/AutoCropPreviewPage")
);
const ProjectsPage = React.lazy(
  () => import("@/features/platform/projects/pages/ProjectsPage")
);
const SeriesDetailsPage = React.lazy(
  () => import("@/features/platform/projects/pages/SeriesDetailsPage")
);
const AISeriesStudioPage = React.lazy(
  () => import("@/features/intelligence/series/pages/AISeriesStudioPage")
);
const ShortcutsPage = React.lazy(
  () => import("@/features/platform/shortcuts/pages/ShortcutsPage")
);
const CreativeSuiteLayout = React.lazy(
  () => import("@/features/creative/suite/components/CreativeSuiteLayout")
);
const DashboardPage = React.lazy(
  () => import("@/features/platform/dashboard/pages/DashboardPage")
);
const ImageEditorPage = React.lazy(
  () => import("@/features/image-editor/canvas/pages/ImageEditorPage")
);
const YouTubePage = React.lazy(
  () => import("@/features/creative/youtube/pages/YouTubePage")
);
const TranslationPage = React.lazy(
  () => import("@/features/creative/translation/pages/TranslationPage")
);
const CreativeAgentPage = React.lazy(
  () => import("@/features/creative/agent/pages/CreativeAgentPage")
);
const CreativeThumbnailPage = React.lazy(
  () => import("@/features/creative/thumbnails/pages/CreativeThumbnailPage")
);
const ProfilePage = React.lazy(
  () => import("@/features/profile/pages/ProfilePage")
);
const SettingsAccountPage = React.lazy(
  () => import("@/features/profile/settings/pages/SettingsAccountPage")
);
const AudioSettingsPage = React.lazy(
  () => import("@/features/video-editor/audio/pages/AudioSettingsPage")
);
const NotificationsPage = React.lazy(
  () => import("@/features/platform/notifications/pages/NotificationsPage")
);
const CreativeSuiteDashboardPage = React.lazy(
  () => import("@/features/creative/suite/pages/CreativeSuiteDashboardPage")
);
const ChapterScraperPage = React.lazy(() =>
  import(
    "@/features/platform/scraper/chapter-scraper/pages/ChapterScraperPage"
  ).then((m) => ({ default: m.ChapterScraperPage }))
);
const AdminPage = React.lazy(
  () => import("@/features/admin/pages/AdminPage")
);
const AdminDashboardPage = React.lazy(
  () => import("@/features/admin/pages/AdminDashboardPage")
);
const VideoEditorPage = React.lazy(
  () => import("@/features/video-editor/video/pages/VideoEditorPage")
);

// --- AI Core Suite (Lazy Loaded) ---
const AICoreLayout = React.lazy(
  () => import("@/features/intelligence/core/components/AICoreLayout")
);
const AICoreOverviewPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AICoreOverviewPage")
);
const AIAPIKeysPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AIAPIKeysPage")
);
const AIRateLimitsPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AIRateLimitsPage")
);
const AIUsageAnalyticsPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AIUsageAnalyticsPage")
);
const AIRoutingPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AIRoutingPage")
);
const AICreditWalletPage = React.lazy(
  () => import("@/features/intelligence/core/pages/AICreditWalletPage")
);
import MainLayout from "@/features/platform/shell/components/MainLayout";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";

/**
 * Validates whether an incoming path matches any registered app route.
 * Returns false for unknown / undefined URLs so the 404 page is rendered.
 */
export function isKnownRoute(path: string): boolean {
  if (!path) return true;
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  // 1. Landing & Public Auth Routes
  if (
    clean === "/" ||
    clean === "/landing" ||
    clean === "/index.html" ||
    clean === "/login" ||
    clean === "/register" ||
    clean === "/forgot-password" ||
    clean === "/auth-success" ||
    clean.startsWith("/auth-success") ||
    clean.startsWith("/auth/")
  ) {
    return true;
  }

  // 2. Scraper & Chapter Workspaces
  if (
    clean === "/scraper" ||
    clean === "/chapter-scraper" ||
    clean === "/episode-scraper" ||
    clean === "/scraper/chapter-scraper" ||
    clean === "/scraper/episode-scraper" ||
    clean === "/scraper/audio-settings" ||
    clean.startsWith("/scraper/editor") ||
    clean.startsWith("/scraper/series/") ||
    clean.startsWith("/scraper/")
  ) {
    return true;
  }

  // 3. Studio Editors & Processing
  if (
    clean === "/editor" ||
    clean.startsWith("/editor/") ||
    clean.includes("/chapters/") ||
    clean === "/image-editor" ||
    clean.startsWith("/image-editor/") ||
    clean === "/video-editor" ||
    clean.startsWith("/video-editor/") ||
    clean === "/auto-crop"
  ) {
    return true;
  }

  // 4. Projects & Series Details
  if (clean === "/projects" || clean.startsWith("/projects/")) {
    return true;
  }

  // 5. System, Settings & User Profile
  if (
    clean === "/dashboard" ||
    clean === "/shortcuts" ||
    clean === "/profile" ||
    clean.startsWith("/profile/") ||
    clean === "/settings/account" ||
    clean.startsWith("/settings/") ||
    clean === "/notifications" ||
    clean === "/admin" ||
    clean === "/admin-dashboard" ||
    clean.startsWith("/admin/")
  ) {
    return true;
  }

  // 6. Creative Suite
  if (
    clean === "/creative-suite" ||
    clean === "/creative-suite-dashboard" ||
    clean.startsWith("/creative-suite/") ||
    clean === "/creative-agent" ||
    clean.startsWith("/creative-agent/") ||
    clean === "/translation" ||
    clean.startsWith("/translation/") ||
    clean === "/panel-assistant" ||
    clean.startsWith("/panel-assistant/") ||
    clean === "/ai-characters" ||
    clean.startsWith("/ai-characters/") ||
    clean === "/ai-thumbnails" ||
    clean.startsWith("/ai-thumbnails/") ||
    clean === "/thumbnails" ||
    clean.startsWith("/thumbnails/") ||
    clean === "/thumbnail-generator" ||
    clean.startsWith("/thumbnail-generator/") ||
    clean === "/youtube" ||
    clean.startsWith("/youtube/")
  ) {
    return true;
  }

  // 7. AI Core Suite
  if (
    clean === "/ai-core" ||
    clean === "/ai-core/overview" ||
    clean === "/ai-core/api-keys" ||
    clean === "/ai-core/limits" ||
    clean === "/ai-core/rate-limits" ||
    clean === "/ai-core/safety-quotas" ||
    clean === "/ai-core/tokens" ||
    clean === "/ai-core/usage" ||
    clean === "/ai-core/charts" ||
    clean === "/ai-core/analytics" ||
    clean === "/ai-core/routing" ||
    clean === "/ai-core/models" ||
    clean === "/ai-core/wallet" ||
    clean === "/ai-core/billing" ||
    clean === "/ai-core/playground" ||
    clean === "/ai-core/arena" ||
    clean.startsWith("/ai-core/")
  ) {
    return true;
  }

  // 8. AI Generated Series Ecosystem
  if (
    clean === "/ai-series" ||
    clean.startsWith("/ai-series/") ||
    clean.startsWith("/ai-series") ||
    clean === "/series-generator" ||
    clean.startsWith("/series-generator/") ||
    clean.startsWith("/studio/") ||
    clean.startsWith("/series/") ||
    clean.startsWith("/watch/") ||
    clean.startsWith("/read/")
  ) {
    return true;
  }

  return false;
}


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

  // --- Guard: Legacy AI Suite Redirects (Optimizer & Voice) ---
  if (
    currentPath === "/creative-suite/ai-optimizer" ||
    currentPath.startsWith("/creative-suite/ai-optimizer") ||
    currentPath === "/ai-optimizer" ||
    currentPath.startsWith("/ai-optimizer") ||
    currentPath === "/creative-suite/ai-voice" ||
    currentPath.startsWith("/creative-suite/ai-voice") ||
    currentPath === "/ai-voice" ||
    currentPath.startsWith("/ai-voice")
  ) {
    setTimeout(() => navigateTo("/creative-suite"), 0);
    return <RouteLoadingFallback />;
  }

  // --- Guard: OAuth Callback Launch Screen ---
  if (
    currentPath === "/auth-success" ||
    currentPath.startsWith("/auth-success") ||
    currentPath.startsWith("/auth/callback") ||
    currentPath.startsWith("/auth/redirect") ||
    currentPath.startsWith("/auth/google/callback") ||
    currentPath.startsWith("/auth/launch")
  ) {
    return <AuthSuccessPage navigateTo={navigateTo} checkAuth={checkAuth} />;
  }

  // --- Guard: Route Not Found (404) for Public / Unauthenticated Visitors ---
  if (!isKnownRoute(currentPath)) {
    if (!isAuthenticated && !authLoading && !isInitializing) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e] p-4">
          <PageNotFound onNavigateHome={() => navigateTo("/")} />
        </div>
      );
    }
  }

  // --- Guard: Wait for Auth Resolution if loading or token present ---
  if ((authLoading || isInitializing) && hasSavedToken) {
    return <RouteLoadingFallback />;
  }

  // --- Guard: Protected Route Redirect (Only for valid authenticated routes once fully resolved) ---
  if (
    !isAuthenticated &&
    !authLoading &&
    !isInitializing &&
    !hasSavedToken &&
    currentPath !== "/scraper" &&
    !currentPath.startsWith("/editor") &&
    !currentPath.startsWith("/scraper/editor") &&
    !currentPath.startsWith("/ai-series") &&
    !currentPath.startsWith("/series-generator") &&
    !currentPath.startsWith("/studio/") &&
    !currentPath.startsWith("/series/") &&
    !currentPath.startsWith("/watch/") &&
    !currentPath.startsWith("/read/") &&
    !currentPath.startsWith("/creative-suite") &&
    !currentPath.startsWith("/creative-agent") &&
    !currentPath.startsWith("/thumbnails")
  ) {
    setTimeout(() => navigateTo("/"), 0);
    return null;
  }


  // --------------------------------------------------------------------------
  // ROUTING / NAVIGATION PATH CHECKS
  // --------------------------------------------------------------------------
  const pathFlags = React.useMemo(() => {
    const chapterPathMatch = currentPath.match(
      /\/series\/[^\/]+\/chapters\/([^\/]+)/
    );
    const editorRouteMatch = currentPath.match(
      /^\/scraper\/(?:editor\/)?series\/([^\/]+)\/chapters\/([^\/]+)(?:\/image-editor)?\/?$/
    );
    const isDetailsMode = currentPath.endsWith("/details");
    const isImageEditorPage =
      currentPath === "/image-editor" ||
      currentPath === "/image-editor/" ||
      currentPath.startsWith("/image-editor/") ||
      currentPath.endsWith("/image-editor") ||
      currentPath.endsWith("/image-editor/") ||
      currentPath.includes("/image-editor");

    const isChapterScraperWithSeries =
      currentPath.startsWith("/scraper/") &&
      currentPath !== "/scraper" &&
      currentPath !== "/scraper/" &&
      !currentPath.startsWith("/scraper/editor") &&
      !currentPath.includes("/chapters/") &&
      !currentPath.startsWith("/scraper/audio-settings");

    const isWorkspacePath =
      (currentPath === "/scraper" || currentPath === "/scraper/") &&
      chapterPathMatch === null;

    return {
      chapterPathMatch,
      isDetailsMode,
      isWorkspacePath,
      isWorkspaceOnly:
        currentPath === "/scraper" || currentPath === "/scraper/",
      isDashboardOverviewPath:
        currentPath === "/dashboard" || currentPath === "/",
      isProjectsPath: currentPath === "/projects",
      isSettingsAccountPath:
        currentPath === "/settings/account" ||
        currentPath === "/settings/account/",
      isAutoCropPath: currentPath === "/auto-crop",
      isEpisodeScraperPath:
        isChapterScraperWithSeries ||
        currentPath === "/chapter-scraper" ||
        currentPath === "/scraper/chapter-scraper" ||
        currentPath === "/episode-scraper" ||
        currentPath === "/scraper/episode-scraper",
      isAISeriesStudioPath:
        currentPath.startsWith("/ai-series") ||
        currentPath.startsWith("/studio/ai-series") ||
        /^\/series\/[^/]+\/(manhwa|comic|anime)\/?$/.test(currentPath),
      isEditorPath:
        !currentPath.startsWith("/ai-series") &&
        !currentPath.startsWith("/studio/ai-series") &&
        !/^\/series\/[^/]+\/(manhwa|comic|anime)\/?$/.test(currentPath) &&
        (currentPath.startsWith("/editor") ||
          currentPath.startsWith("/scraper/editor") ||
          (currentPath.startsWith("/studio/") && !currentPath.startsWith("/studio/ai-series")) ||
          (chapterPathMatch !== null && !isDetailsMode)),
      isShortcutsPath: currentPath === "/shortcuts",
      isAudioSettingsPath: currentPath === "/scraper/audio-settings",
      isPanelAssistantPath:
        currentPath.startsWith("/creative-suite/translation") ||
        currentPath.startsWith("/translation") ||
        currentPath.startsWith("/creative-suite/panel-assistant") ||
        currentPath.startsWith("/panel-assistant"),
      isCreativeAgentPath:
        currentPath.startsWith("/creative-suite/agent") ||
        currentPath.startsWith("/creative-agent"),
      isThumbnailStudioPath:
        currentPath.startsWith("/creative-suite/thumbnails") ||
        currentPath.startsWith("/creative-suite/thumbnail-generator") ||
        currentPath.startsWith("/thumbnails"),
      isCharacterPath:
        currentPath === "/creative-suite/ai-characters" ||
        currentPath.startsWith("/creative-suite/ai-characters?") ||
        currentPath.startsWith("/creative-suite/ai-characters/") ||
        currentPath === "/ai-characters",
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
        currentPath.startsWith("/projects/") &&
        !currentPath.includes("/chapter/"),
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
        currentPath === "/creative-agent" ||
        currentPath.startsWith("/creative-agent/") ||
        currentPath === "/translation" ||
        currentPath === "/panel-assistant" ||
        currentPath === "/ai-characters" ||
        currentPath === "/ai-thumbnails" ||
        currentPath === "/thumbnails" ||
        currentPath.startsWith("/thumbnails/") ||
        currentPath === "/thumbnail-generator" ||
        currentPath.startsWith("/thumbnail-generator/") ||
        currentPath === "/youtube",
      isAICorePath:
        currentPath === "/ai-core" ||
        currentPath === "/ai-core/" ||
        currentPath.startsWith("/ai-core/"),
      isAICoreDashboardPath:
        currentPath === "/ai-core" ||
        currentPath === "/ai-core/" ||
        currentPath === "/ai-core/overview",
      isAIAPIKeysPath:
        currentPath === "/ai-core/api-keys" ||
        currentPath.startsWith("/ai-core/api-keys"),
      isAIRateLimitsPath:
        currentPath === "/ai-core/limits" ||
        currentPath === "/ai-core/rate-limits" ||
        currentPath.startsWith("/ai-core/rate-limits") ||
        currentPath.startsWith("/ai-core/limits") ||
        currentPath === "/ai-core/safety-quotas" ||
        currentPath === "/ai-core/tokens",
      isAIUsagePath:
        currentPath === "/ai-core/usage" ||
        currentPath === "/ai-core/charts" ||
        currentPath === "/ai-core/analytics" ||
        currentPath.startsWith("/ai-core/analytics") ||
        currentPath.startsWith("/ai-core/usage"),
      isAIRoutingPath:
        currentPath === "/ai-core/routing" ||
        currentPath === "/ai-core/models" ||
        currentPath.startsWith("/ai-core/routing") ||
        currentPath.startsWith("/ai-core/models"),
      isAIWalletPath:
        currentPath === "/ai-core/wallet" ||
        currentPath === "/ai-core/billing" ||
        currentPath.startsWith("/ai-core/wallet") ||
        currentPath.startsWith("/ai-core/billing"),

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
    isProjectsPath,
    isSettingsAccountPath,
    isAutoCropPath,
    isEpisodeScraperPath,
    isAISeriesStudioPath,
    isEditorPath,
    isShortcutsPath,
    isAudioSettingsPath,
    isPanelAssistantPath,
    isCreativeAgentPath,
    isThumbnailStudioPath,
    isCharacterPath,
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
    isAICorePath,
    isAICoreDashboardPath,
    isAIAPIKeysPath,
    isAIRateLimitsPath,
    isAIUsagePath,
    isAIRoutingPath,
    isAIWalletPath,
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
      currentPath.startsWith("/editor") ||
      currentPath.startsWith("/scraper/editor") ||
      currentPath.startsWith("/studio/") ||
      /^\/series\/[^/]+\/(manhwa|comic|anime)\/?$/.test(currentPath) ||
      Boolean(pathFlags.chapterPathMatch && !pathFlags.isDetailsMode)) &&
    !pathFlags.isImageEditorPage;

  const editorSeriesSlug =
    pathFlags.editorRouteMatch?.[1] || seriesSlugState || null;
  const editorChapterSlug =
    pathFlags.editorRouteMatch?.[2] || chapterSlugState || null;

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

  // Cleanly redirect legacy /workspace or duplicate /scraper/scraper URLs to canonical routes
  React.useEffect(() => {
    if (currentPath.startsWith("/workspace")) {
      const newPath = currentPath.startsWith("/workspace/scraper")
        ? currentPath.replace(/^\/workspace\/scraper/, "/scraper")
        : currentPath.replace(/^\/workspace/, "/scraper");
      const search = window.location.search;
      navigateTo(`${newPath}${search}`);
      return;
    }

    if (
      currentPath === "/scraper/scraper" ||
      currentPath.startsWith("/scraper/scraper/")
    ) {
      const newPath = currentPath.replace(/^\/scraper\/scraper/, "/scraper");
      const search = window.location.search;
      navigateTo(`${newPath}${search}`);
      return;
    }

    // Cleanly redirect legacy /auth/callback URLs to canonical /auth-success
    if (
      currentPath === "/auth/callback" ||
      currentPath.startsWith("/auth/callback") ||
      currentPath.startsWith("/auth/redirect") ||
      currentPath.startsWith("/auth/launch")
    ) {
      const search = window.location.search;
      navigateTo(`/auth-success${search}`);
      return;
    }
  }, [currentPath, navigateTo]);

  // Redirect legacy /editor or draft URLs back to canonical /scraper/editor routes
  React.useEffect(() => {
    if (
      currentPath.startsWith("/editor/draft-") ||
      currentPath === "/editor/draft" ||
      currentPath === "/editor" ||
      currentPath === "/editor/"
    ) {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      if (params.has("series_id") || params.has("seriesId")) {
        navigateTo(`/scraper/editor${search}`);
        return;
      }

      const activeProjId =
        projectId ||
        (typeof window !== "undefined"
          ? localStorage.getItem("active_project_id")
          : null);
      if (activeProjId) {
        if (seriesSlugState && chapterSlugState) {
          navigateTo(
            `/scraper/editor/series/${seriesSlugState}/chapters/${chapterSlugState}?project_id=${encodeURIComponent(
              activeProjId
            )}`
          );
        } else {
          navigateTo(`/scraper/editor?id=${encodeURIComponent(activeProjId)}`);
        }
      } else {
        navigateTo(`/scraper/editor${search}`);
      }
      return;
    }

    // Redirect legacy /editor/:series/:chapter to canonical /scraper/editor/series/:series/chapters/:chapter
    if (
      currentPath.startsWith("/editor/") &&
      !currentPath.startsWith("/editor/draft")
    ) {
      const match = currentPath.match(/^\/editor\/([^\/]+)\/([^\/]+)\/?$/);
      if (match) {
        const [, sSlug, cSlug] = match;
        const search = window.location.search;
        navigateTo(
          `/scraper/editor/series/${sSlug}/chapters/${cSlug}${search}`
        );
        return;
      }
    }

    // Cleanly normalize series / chapters to /scraper/editor/series/.../chapters/..., preserving query params
    if (
      (currentPath.startsWith("/scraper/series/") ||
        (currentPath.startsWith("/scraper/editor") &&
          seriesSlugState &&
          chapterSlugState)) &&
      !currentPath.includes("/image-editor")
    ) {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      if (params.has("series_id") || params.has("seriesId")) {
        return;
      }
      const projId = params.get("id") || params.get("project_id") || projectId;

      // Guard: Ensure store data is hydrated and actually matches the target project before normalising
      const activeData = useProjectStore.getState().activeProjectData;
      if (
        projId &&
        activeData?.project?.project_id &&
        activeData.project.project_id !== projId
      ) {
        return;
      }

      const activeSeriesSlug =
        activeData?.project?.series_slug || seriesSlugState;
      const activeChapterSlug =
        activeData?.project?.chapter_slug || chapterSlugState;

      if (!activeSeriesSlug || !activeChapterSlug) {
        return;
      }

      const humanPath = getHumanEditorPath({
        projectId: projId,
        seriesSlug: activeSeriesSlug,
        chapterSlug: activeChapterSlug,
        jobId: params.get("job_id"),
      });

      const currentFullUrl = window.location.pathname + window.location.search;
      if (
        humanPath &&
        humanPath !== currentFullUrl &&
        !humanPath.includes("/draft-")
      ) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, humanPath);
        } else {
          navigateTo(humanPath);
        }
      }
    }
  }, [currentPath, projectId, seriesSlugState, chapterSlugState, navigateTo]);

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
      isAICorePath={isAICorePath}
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
      <React.Suspense fallback={<RouteLoadingFallback />}>
        {/* PAGE VIEW 1: Main Editor Workspace */}
        {isWorkspacePath && (
          <div className="page-transition w-full flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]">
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
        )}

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

       {isSettingsAccountPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
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
          <div className="page-transition w-full flex-1 flex flex-col">
            <CreativeSuiteLayout
              hideSidebarAndHeader={true}
              currentPath={currentPath}
              navigateTo={navigateTo}
              fetchWithInterceptor={fetchWithInterceptor}
              panels={panels}
            >
              {isCreativeSuiteDashboardPath ? (
                <CreativeSuiteDashboardPage
                  navigateTo={navigateTo}
                  panels={panels}
                  setPanels={setPanels}
                />
              ) : isCreativeAgentPath ? (
                <CreativeAgentPage
                  fetchWithInterceptor={fetchWithInterceptor}
                  addNotification={addNotification}
                  navigateTo={navigateTo}
                />
              ) : isThumbnailStudioPath ? (
                <CreativeThumbnailPage
                  fetchWithInterceptor={fetchWithInterceptor}
                  panels={panels}
                  addNotification={addNotification}
                  navigateTo={navigateTo}
                />
              ) : isPanelAssistantPath ? (
                <TranslationPage
                  panels={panels}
                  setPanels={setPanels}
                  onNavigateHome={handleNavigateHome}
                  addNotification={addNotification}
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
              ) : (
                <PageNotFound
                  onNavigateHome={() => navigateTo("/creative-suite")}
                />
              )}
            </CreativeSuiteLayout>
          </div>
        )}

        {/* ── AI CORE SUITE (STANDALONE DEDICATED WORKSPACE) ── */}
        {isAICorePath && (
          <div className="page-transition w-full flex-1 flex flex-col min-h-0">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {isAIAPIKeysPath ? (
                <AIAPIKeysPage addNotification={addNotification} />
              ) : isAIRateLimitsPath ? (
                <AIRateLimitsPage addNotification={addNotification} />
              ) : isAIUsagePath ? (
                <AIUsageAnalyticsPage addNotification={addNotification} />
              ) : isAIRoutingPath ? (
                <AIRoutingPage addNotification={addNotification} />
              ) : isAIWalletPath ? (
                <AICreditWalletPage addNotification={addNotification} />
              ) : (
                <AICoreOverviewPage addNotification={addNotification} />
              )}
            </div>
          </div>
        )}

        {/* PAGE VIEW 15: User Profile & Account Settings */}
        {isProfilePath && (
          <div className="page-transition w-full flex-1 flex flex-col">
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
          </div>
        )}

        {/* PAGE VIEW 16: Notification Center Hub */}
        {isNotificationsPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
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
          </div>
        )}

        {/* PAGE VIEW 16.5: Dedicated Chapter Scraper Page */}
        {isEpisodeScraperPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <ChapterScraperPage
                addNotification={addNotification}
                fetchWithInterceptor={fetchWithInterceptor}
                navigateTo={navigateTo}
                lastEditorPath={lastEditorPath}
                scrapeImages={scrapeImages}
                setSeriesTitle={setSeriesTitle}
                setChapterNumber={setChapterNumber}
                setChapterTitle={setChapterTitle}
                setSeriesAuthor={setSeriesAuthor}
                setSeriesCoverImage={setSeriesCoverImage}
              />
            </React.Suspense>
          </div>
        )}

        {/* PAGE VIEW 17.5: Series Landing Page */}
        {isSeriesDetailsPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <SeriesDetailsPage
              onNavigateHome={handleNavigateHome}
              navigateTo={navigateTo}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          </div>
        )}

        {/* PAGE VIEW 18: Batch Panel Auto Crop Page */}
        {isAutoCropPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <AutoCropPreviewPage
              onClose={handleAutoCropClose}
              onConfirm={async (confirmedResults) => {
                if (
                  confirmedResults &&
                  Object.keys(confirmedResults).length > 0
                ) {
                  appLogic?.setScrapedImages?.((prev: string[]) => {
                    const copy: string[] = [];
                    prev.forEach((img) => {
                      if (confirmedResults[img]) {
                        copy.push(...confirmedResults[img]);
                      } else {
                        copy.push(img);
                      }
                    });
                    return copy;
                  });
                  setSelectedScraped([]);
                  addNotification?.(
                    "Successfully sliced & auto-cropped panels!",
                    "success"
                  );
                } else {
                  await handleAutoCropSelected();
                }
                handleAutoCropClose();
              }}
              scrapedImages={scrapedImages}
              selectedScraped={selectedScraped}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              sensitivity={cropSensitivity}
              padding={cropPaddingPx}
              backgroundColorMode={cropBackgroundMode}
              autoSplitTallStrips={autoSplitTallStrips}
              aspectRatioLock={aspectRatioLock}
              overlapMergeThreshold={overlapMergeThreshold}
              minPanelHeightPx={cropMinHeightPx}
              isApplying={isBatchCropping}
            />
          </div>
        )}

        {/* PAGE VIEW 18.5: Dedicated AI Series Master Studio */}
        {isAISeriesStudioPath && !isPipMode && (
          <div className="page-transition w-full flex-1 flex flex-col h-full min-h-0 max-h-full overflow-hidden">
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <AISeriesStudioPage
                seriesIdFromRoute={currentPath.match(/^\/ai-series\/([^/?#]+)/)?.[1]}
                navigateTo={navigateTo}
                addNotification={addNotification}
                fetchWithInterceptor={fetchWithInterceptor as typeof fetch}
              />
            </React.Suspense>
          </div>
        )}

        {/* PAGE VIEW 19: Full Editor Page */}
        {isEditorPath &&
          !isPipMode &&
          isProEditorPage &&
          !isImageEditorPage && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <React.Suspense fallback={<RouteLoadingFallback />}>
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
              </React.Suspense>
            </div>
          )}

        {/* PAGE VIEW 20: Advanced Crop & Trim Editor Page */}
        {(isImageEditorPage || (isEditorPath && !isProEditorPage)) &&
          !isPipMode && (
            <div className="page-transition w-full flex-1 flex flex-col">
              <React.Suspense fallback={<RouteLoadingFallback />}>
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
              </React.Suspense>
            </div>
          )}

        {/* PAGE VIEW 21: Admin Dashboard */}
        {isAdminPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <AdminPage
                user={user}
                navigateTo={navigateTo}
                currentPath={currentPath}
                isAuthenticated={isAuthenticated}
                fetchWithInterceptor={fetchWithInterceptor}
                addNotification={addNotification}
                audioFeedback={audioFeedback}
              />
            </React.Suspense>
          </div>
        )}

        {/* PAGE VIEW 22: New Standalone Admin Dashboard Page */}
        {isAdminDashboardPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <AdminDashboardPage
                user={user}
                navigateTo={navigateTo}
                isAuthenticated={isAuthenticated}
                fetchWithInterceptor={fetchWithInterceptor}
                addNotification={addNotification}
                audioFeedback={audioFeedback}
              />
            </React.Suspense>
          </div>
        )}

        {/* PAGE VIEW 23: Video Editor Studio */}
        {isVideoEditorPath && (
          <div className="page-transition w-full flex-1 flex flex-col">
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <VideoEditorPage
                appLogic={memoizedAppLogic}
                navigateTo={navigateTo}
                onBackToApp={handleNavigateHome}
                user={user}
              />
            </React.Suspense>
          </div>
        )}

        {/* FALLBACK VIEW: 404 Route Not Found */}
        {!isKnownRoute(currentPath) && (
          <PageNotFound
            onNavigateHome={() =>
              navigateTo(isAuthenticated ? "/dashboard" : "/")
            }
          />
        )}
      </React.Suspense>
    </MainLayout>
  );
}
