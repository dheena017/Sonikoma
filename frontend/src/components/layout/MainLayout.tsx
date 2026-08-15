import React, { useEffect, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import * as api from "@/api";

import Header from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/MainSidebar";
import MiniSidebar from "@/components/layout/MainMiniSidebar";
import NotificationStack from "@/features/app_notification/components/NotificationStack";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { LandingAnimeScene } from "@/features/app_landing/components/LandingAnimeScene";
import { useProjectStore } from "@/store/useProjectStore";

// --- Lazy Loaded Heavy Conditional Components ---
const ProjectConfirmModal = React.lazy(() => import("@/shared/ui/modal/ProjectConfirmModal"));
const ConfirmModal = React.lazy(() => import("@/shared/ui/modal/ConfirmModal"));
const TerminalLogs = React.lazy(() => import("@/features/system_terminal/components/TerminalLogs"));
const AdminSidebar = React.lazy(() => import("@/features/system_admin/components/AdminSidebar"));
const AdminMiniSidebar = React.lazy(() => import("@/features/system_admin/components/AdminMiniSidebar"));
const AdminHeaderPage = React.lazy(() => import("@/features/system_admin/pages/AdminHeaderPage"));
const CreativeSuiteHeader = React.lazy(() => import("@/features/creative_suite/components/CreativeSuiteHeader"));
const CreativeSuiteSidebar = React.lazy(() => import("@/features/creative_suite/components/CreativeSuiteSidebar"));
const CreativeSuiteMiniSidebar = React.lazy(() => import("@/features/creative_suite/components/CreativeSuiteMiniSidebar"));
const ActiveProjectSelectorDrawer = React.lazy(() => import("@/components/layout/ActiveProjectSelectorDrawer"));
const AutoCropModal = React.lazy(() => import("@/features/editor_auto_crop/components/AutoCropModal"));


export interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  isAnyAdmin: boolean;
  isCreativeSuitePath: boolean;
  isImageEditorPage: boolean;
  isProEditorPage: boolean;
  isVideoEditorPage: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (open: boolean) => void;
  backendStatus: any;
  recheckBackend: () => void;
  themeMode: any;
  toggleThemeMode: () => void;
  isStartingBackend: boolean;
  setIsStartingBackend: (starting: boolean) => void;
  startBackendError: string | null;
  setStartBackendError: (err: string | null) => void;
  startBackend: () => void;
  alertDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    accentColor?: string;
    resolve: () => void;
  } | null;
  setAlertDialog: (dialog: any) => void;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    accentColor?: string;
    resolve: (val: boolean) => void;
  } | null;
  setConfirmDialog: (dialog: any) => void;
  showScrapeConfirmModal: boolean;
  setShowScrapeConfirmModal: (show: boolean) => void;
  handleProjectConfirm: any;
  user: any;
  panels: any[];
  scrapedImages: any[];
  totalCalculatedDuration: number;
  editingImageIdx: number;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  cleanProgress?: { current: number; total: number } | null;
  batchProgress?: { current: number; total: number } | null;
  projectId: string | null;
  isWorkspaceDirty: boolean;
  notifications: any[];
  notificationsMuted: boolean;
  setNotificationsMuted: (muted: boolean) => void;
  markNotificationAsRead: any;
  markAllNotificationsAsRead: () => void;
  deleteNotification: any;
  clearAllNotifications: () => void;
  removeNotification: any;
  fetchWithInterceptor: any;
  narrationStyle: string;
  setNarrationStyle: (style: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  volume: number;
  setVolume: (vol: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  autoPlayAudio: boolean;
  setAutoPlayAudio: (play: boolean) => void;
  appLogic: any;
  headerProjectId: string | null;
  headerSaveStatus: string;
  headerIsDirty: boolean;
  headerOnSave: () => void;
  cropSensitivity: number;
  setCropSensitivity: (val: number) => void;
  cropPaddingPx: number;
  setCropPaddingPx: (val: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (val: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (val: boolean) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (val: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (val: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (val: number) => void;
  useLocalCV: boolean;
  setUseLocalCV: (val: boolean) => void;
  cropModel: string;
  setCropModel: (val: string) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (val: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (val: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (val: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (val: number) => void;
  activeAutoCropTab: string;
  setActiveAutoCropTab: (val: string) => void;
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: (val: any) => void;
  addNotification: any;
  cropGuidance: string;
  setCropGuidance: (val: string) => void;
  cropFocusMode: string;
  setCropFocusMode: (val: string) => void;
  handleAutoCropClose: () => void;
  handleAutoCropApply: () => void;
  seriesTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  scrapedGenre: string;
  seriesAuthor: string;
  seriesCoverImage: string;
  seriesSynopsis: string;
  consoleLogs: any[];
  seriesSlugState: string | null;
  chapterSlugState: string | null;
  showAutoCropModal: boolean;
  showBubbleModal?: boolean;
}

export default function MainLayout(props: MainLayoutProps) {
  const {
    children,
    currentPath,
    navigateTo,
    isAnyAdmin,
    isCreativeSuitePath,
    isImageEditorPage,
    isProEditorPage,
    isVideoEditorPage,
    isSidebarOpen,
    setIsSidebarOpen,
    isTerminalOpen,
    setIsTerminalOpen,
    backendStatus,
    recheckBackend,
    themeMode,
    toggleThemeMode,
    isStartingBackend,
    setIsStartingBackend,
    startBackendError,
    setStartBackendError,
    startBackend,
    alertDialog,
    setAlertDialog,
    confirmDialog,
    setConfirmDialog,
    showScrapeConfirmModal,
    setShowScrapeConfirmModal,
    handleProjectConfirm,
    user,
    panels,
    scrapedImages,
    totalCalculatedDuration,
    editingImageIdx,
    lastEditorPath,
    isBatchCropping,
    isCleaningBubbles,
    cleanProgress,
    batchProgress,
    projectId,
    isWorkspaceDirty,
    notifications,
    notificationsMuted,
    setNotificationsMuted,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    removeNotification,
    fetchWithInterceptor,
    narrationStyle,
    setNarrationStyle,
    selectedModel,
    setSelectedModel,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    autoPlayAudio,
    setAutoPlayAudio,
    appLogic,
    headerProjectId,
    headerSaveStatus,
    headerIsDirty,
    headerOnSave,
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
    selectedScraped,
    setSelectedScraped,
    setConsoleLogs,
    addNotification,
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,
    handleAutoCropClose,
    handleAutoCropApply,
    seriesTitle,
    chapterNumber,
    chapterTitle,
    scrapedGenre,
    seriesAuthor,
    seriesCoverImage,
    seriesSynopsis,
    consoleLogs,
    seriesSlugState,
    chapterSlugState,
    showAutoCropModal,
    showBubbleModal = false,
  } = props;

  const isWorkspacePath =
    currentPath === "/scraper" ||
    (currentPath.match(/\/series\/[^\/]+\/chapters\/([^\/]+)/) !== null &&
      !currentPath.endsWith("/details") &&
      !currentPath.startsWith("/scraper/editor/"));

  const isAdminRestricted = isAnyAdmin && (!user || user.creator_role !== "admin");
  const showTopHeader = !isSidebarOpen && !isProEditorPage && !isImageEditorPage && !isVideoEditorPage;

  useEffect(() => {
    if (currentPath !== "/auto-crop" && showAutoCropModal) {
      if (appLogic?.setShowAutoCropModal) {
        appLogic.setShowAutoCropModal(false);
      }
    }
  }, [currentPath, showAutoCropModal, appLogic]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProjectId = params.get("project_id");
    if (urlProjectId) {
      useProjectStore.getState().setActiveProjectId(urlProjectId);
      useProjectStore.getState().hydrateActiveProject(urlProjectId, fetchWithInterceptor);
    } else {
      const storeState = useProjectStore.getState();
      if (storeState.activeProjectId && !storeState.activeProjectData) {
        storeState.hydrateActiveProject(null, fetchWithInterceptor);
      }
    }
  }, [currentPath, fetchWithInterceptor]);

  const isDrawerOpen = useProjectStore((s) => s.isDrawerOpen);
  const animeThemeMode = themeMode === "light" ? "light" : "dark";

  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), [setIsSidebarOpen]);
  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), [setIsSidebarOpen]);
  const handleToggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen, setIsSidebarOpen]);

  return (
    <div
      id="app_root"
      className={`app-anime-shell h-screen max-h-screen overflow-hidden max-w-full bg-neutral-955 text-neutral-100 flex flex-col selection:text-white relative ${isAnyAdmin ? "selection:bg-violet-600" : "selection:bg-purple-600"
        }`}
    >
      <LandingAnimeScene themeMode={animeThemeMode} variant="app" />

      {/* --- Page Navigation Sidebar --- */}
      <React.Suspense fallback={null}>
        {isAdminRestricted ? null : isAnyAdmin ? (
          <>
            <AdminSidebar
              currentPath={currentPath}
              navigateTo={navigateTo}
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
            />
            {!isSidebarOpen && !isDrawerOpen && (
              <AdminMiniSidebar
                currentPath={currentPath}
                navigateTo={navigateTo}
                onOpenSidebar={handleOpenSidebar}
              />
            )}
          </>
        ) : isCreativeSuitePath ? (
          <>
            <CreativeSuiteSidebar
              currentPath={currentPath}
              navigateTo={navigateTo}
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
              panels={panels}
            />
            {!isSidebarOpen && !isDrawerOpen && (
              <CreativeSuiteMiniSidebar
                currentPath={currentPath}
                navigateTo={navigateTo}
                onOpenSidebar={handleOpenSidebar}
                panels={panels}
              />
            )}
          </>
        ) : isImageEditorPage ? (
          <Sidebar
            isProcessing={appLogic.isProcessing}
            panels={panels}
            scrapedImages={scrapedImages}
            totalCalculatedDuration={totalCalculatedDuration}
            currentPath={currentPath}
            editingImageIdx={editingImageIdx}
            lastEditorPath={lastEditorPath}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
            projectId={projectId}
            isDirty={isWorkspaceDirty}
            navigateTo={navigateTo}
            notifications={notifications}
            seriesSlug={seriesSlugState}
            chapterSlug={chapterSlugState}
          />
        ) : (
          <>
            <Sidebar
              isProcessing={appLogic.isProcessing}
              panels={panels}
              scrapedImages={scrapedImages}
              totalCalculatedDuration={totalCalculatedDuration}
              currentPath={currentPath}
              editingImageIdx={editingImageIdx}
              lastEditorPath={lastEditorPath}
              isBatchCropping={isBatchCropping}
              isCleaningBubbles={isCleaningBubbles}
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
              projectId={projectId}
              isDirty={isWorkspaceDirty}
              navigateTo={navigateTo}
              notifications={notifications}
              seriesSlug={seriesSlugState}
              chapterSlug={chapterSlugState}
            />
            {!isSidebarOpen && !isDrawerOpen && !isProEditorPage && !isVideoEditorPage && !isAnyAdmin && (
              <MiniSidebar
                currentPath={currentPath}
                navigateTo={navigateTo}
                notificationsCount={notifications.filter((n) => !n.isRead).length}
                projectId={projectId}
                seriesSlug={seriesSlugState}
                chapterSlug={chapterSlugState}
              />
            )}
          </>
        )}
      </React.Suspense>

      {/* --- Main Contents Controller & Router --- */}
      <div
        id="main-content-layout"
        className={`relative z-10 h-screen max-h-screen overflow-hidden flex-grow flex-1 flex flex-col max-w-full justify-between ${showAutoCropModal || showBubbleModal
          ? "overflow-hidden"
          : ""
          }`}
      >
        {/* Top Header */}
        {showTopHeader && (
          <React.Suspense fallback={null}>
            {isAnyAdmin ? (
              <AdminHeaderPage
                currentPath={currentPath}
                navigateTo={navigateTo}
                fetchWithInterceptor={fetchWithInterceptor}
                onToggleSidebar={handleToggleSidebar}
                notifications={notifications}
                markNotificationAsRead={markNotificationAsRead as any}
                markAllNotificationsAsRead={markAllNotificationsAsRead}
                deleteNotification={deleteNotification as any}
                clearAllNotifications={clearAllNotifications}
                notificationsMuted={notificationsMuted}
                setNotificationsMuted={setNotificationsMuted}
                isSidebarOpen={isSidebarOpen}
                user={user}
                addNotification={addNotification}
              />
            ) : isCreativeSuitePath ? (
              <CreativeSuiteHeader
                currentPath={currentPath}
                navigateTo={navigateTo}
                fetchWithInterceptor={fetchWithInterceptor}
                onToggleSidebar={handleToggleSidebar}
                notifications={notifications}
                markNotificationAsRead={markNotificationAsRead as any}
                markAllNotificationsAsRead={markAllNotificationsAsRead}
                deleteNotification={deleteNotification as any}
                clearAllNotifications={clearAllNotifications}
                notificationsMuted={notificationsMuted}
                setNotificationsMuted={setNotificationsMuted}
                isSidebarOpen={isSidebarOpen}
                user={user}
                addNotification={addNotification}
              />
            ) : (
              <Header
                isProcessing={appLogic.isProcessing}
                panels={panels}
                totalCalculatedDuration={totalCalculatedDuration}
                currentPath={currentPath}
                editingImageIdx={editingImageIdx}
                lastEditorPath={lastEditorPath}
                isBatchCropping={isBatchCropping}
                isCleaningBubbles={isCleaningBubbles}
                cleanProgress={cleanProgress}
                batchProgress={batchProgress}
                onToggleSidebar={handleToggleSidebar}
                isSidebarOpen={isSidebarOpen}
                backendStatus={backendStatus as any}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                volume={volume}
                setVolume={setVolume}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                user={user}
                notifications={notifications}
                markNotificationAsRead={markNotificationAsRead as any}
                markAllNotificationsAsRead={markAllNotificationsAsRead}
                deleteNotification={deleteNotification as any}
                clearAllNotifications={clearAllNotifications}
                projectId={headerProjectId}
                saveStatus={headerSaveStatus}
                isDirty={headerIsDirty}
                onSave={headerOnSave}
                navigateTo={navigateTo}
                notificationsMuted={notificationsMuted}
                setNotificationsMuted={setNotificationsMuted}
                fetchWithInterceptor={fetchWithInterceptor}
              />
            )}
          </React.Suspense>
        )}

        {/* Global Floating Toast Notifications */}
        <NotificationStack
          notifications={notifications}
          removeNotification={removeNotification}
          notificationsMuted={notificationsMuted}
        />

        {/* Scrollable Main Children Page Area */}
        <div
          id="main-scrollable-area"
          className={`flex-1 flex flex-col w-full relative ${showTopHeader ? "pt-20" : ""} ${
            isImageEditorPage || isProEditorPage || isVideoEditorPage
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          {/* Admin Back to Admin Bar */}
          {localStorage.getItem("sonikoma_admin_token") && (
            <div className="bg-amber-600/90 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-between shadow-md z-40 w-full">
              <span>You are viewing Sonikoma in user mode via Admin Impersonation.</span>
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

          {/* Children Page Views */}
          <div
            key={currentPath}
            className={`w-full max-w-full min-w-0 flex-1 flex flex-col ${
              isImageEditorPage || isProEditorPage || isVideoEditorPage
                ? "p-0"
                : !isSidebarOpen
                ? "px-4 sm:px-6 lg:px-8 lg:pl-28 pb-12 md:pb-16 page-view-transition stagger-container"
                : "px-4 sm:px-6 lg:px-8 pb-12 md:pb-16 page-view-transition stagger-container"
            }`}
          >
            {showAutoCropModal && !isProEditorPage && !isImageEditorPage ? (
              <React.Suspense fallback={null}>
                <AutoCropModal
                  isPage={false}
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
              </React.Suspense>
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      <React.Suspense fallback={null}>
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

        {showScrapeConfirmModal && (
          <ProjectConfirmModal
            isOpen={showScrapeConfirmModal}
            onClose={() => setShowScrapeConfirmModal(false)}
            onConfirm={handleProjectConfirm}
            initialDetails={{
              seriesTitle,
              chapterNumber,
              chapterTitle,
              scrapedGenre,
              seriesAuthor,
              seriesCoverImage,
              seriesSynopsis,
            }}
          />
        )}

        {/* --- Terminal Floating Interface --- */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
          {isTerminalOpen && (
            <div className="w-[90vw] md:w-[600px] max-h-[70vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-2">
                <TerminalLogs
                  consoleLogs={consoleLogs}
                  setConsoleLogs={setConsoleLogs}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer border ${isTerminalOpen
              ? "bg-rose-600 border-rose-500 text-white rotate-90"
              : "bg-purple-600 border-purple-500 text-white hover:bg-purple-500"
              }`}
            title={isTerminalOpen ? "Close Terminal" : "Open System Terminal"}
          >
            {isTerminalOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Global Active Project Activation Drawer */}
        <ActiveProjectSelectorDrawer
          fetchWithInterceptor={fetchWithInterceptor}
          navigateTo={navigateTo}
        />
      </React.Suspense>
    </div>
  );
}
