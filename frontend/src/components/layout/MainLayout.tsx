import React from "react";
import { AlertTriangle, X } from "lucide-react";
import * as api from "../../api";

import Header from "../MainHeader";
import Sidebar from "../MainSidebar";
import ProjectConfirmPanel from "../confirmationmodels/ProjectConfirmPanel";
import { useImageEditorStore } from "../../hooks/useImageEditorState";
import AutoCropModal from "../Feature/processing/AutoCropModal";
import NotificationStack from "../notification/NotificationStack";
import ConfirmModal from "../confirmationmodels/ConfirmModal";
import { TerminalLogs } from "../Feature/terminal";
import { AdminSidebar, AdminMiniSidebar } from "../admin";
import MiniSidebar from "../MainMiniSidebar";
import {
  CreativeSuiteHeader,
  CreativeSuiteSidebar,
  CreativeSuiteMiniSidebar,
} from "../creative";

export interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  isAnyAdmin: boolean;
  isCreativeSuitePath: boolean;
  isImageEditorPage: boolean;
  isProEditorPage: boolean;
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
  selectedScraped: any[];
  setSelectedScraped: (val: any[]) => void;
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
  } = props;

  const isWorkspacePath =
    currentPath === "/workspace" ||
    (currentPath.match(/\/series\/[^\/]+\/chapters\/([^\/]+)/) !== null &&
      !currentPath.endsWith("/details") &&
      !currentPath.startsWith("/workspace/editor/"));

  return (
    <div
      id="app_root"
      className={`min-h-screen bg-neutral-955 text-neutral-100 flex flex-col selection:text-white relative ${
        isAnyAdmin ? "selection:bg-violet-600" : "selection:bg-purple-600"
      }`}
    >
      {/* --- Page Navigation Sidebar --- */}
      {isAnyAdmin ? (
        <>
          <AdminSidebar
            currentPath={currentPath}
            navigateTo={navigateTo}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          {!isSidebarOpen && (
            <AdminMiniSidebar
              currentPath={currentPath}
              navigateTo={navigateTo}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          )}
        </>
      ) : isCreativeSuitePath ? (
        <>
          <CreativeSuiteSidebar
            currentPath={currentPath}
            navigateTo={navigateTo}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            panels={panels}
          />
          {!isSidebarOpen && (
            <CreativeSuiteMiniSidebar
              currentPath={currentPath}
              navigateTo={navigateTo}
              panels={panels}
              onOpenSidebar={() => setIsSidebarOpen(true)}
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
          onClose={() => setIsSidebarOpen(false)}
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
            onClose={() => setIsSidebarOpen(false)}
            projectId={projectId}
            isDirty={isWorkspaceDirty}
            navigateTo={navigateTo}
            notifications={notifications}
            seriesSlug={seriesSlugState}
            chapterSlug={chapterSlugState}
          />
          {!isSidebarOpen && !isProEditorPage && (
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

      {/* --- Main Contents Controller & Router --- */}
      <div
        id="main-scroll-container"
        className={`flex-grow flex-1 flex flex-col min-h-screen lg:max-h-screen justify-between transition-all duration-300 ${
          !isAnyAdmin ? "lg:overflow-y-auto" : "overflow-y-auto"
        } ${!isAnyAdmin && isSidebarOpen ? "overflow-hidden" : ""}`}
      >
        {/* Top Header */}
        {!isSidebarOpen && !isProEditorPage && !isAnyAdmin && !isImageEditorPage && (
          isCreativeSuitePath ? (
            <CreativeSuiteHeader
              currentPath={currentPath}
              navigateTo={navigateTo}
              fetchWithInterceptor={fetchWithInterceptor}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead as any}
              markAllNotificationsAsRead={markAllNotificationsAsRead}
              deleteNotification={deleteNotification as any}
              clearAllNotifications={clearAllNotifications}
              notificationsMuted={notificationsMuted}
              setNotificationsMuted={setNotificationsMuted}
              isSidebarOpen={isSidebarOpen}
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
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              backendStatus={backendStatus as any}
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
              sfxVolume={appLogic.sfxVolume}
              setSfxVolume={appLogic.setSfxVolume}
              sfxEnabled={appLogic.sfxEnabled}
              setSfxEnabled={appLogic.setSfxEnabled}
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
              themeMode={themeMode as any}
              toggleThemeMode={toggleThemeMode}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )
        )}

        <div
          className={`${!isSidebarOpen && !isImageEditorPage ? "lg:pl-20" : ""} ${
            !isSidebarOpen && !isProEditorPage && !isImageEditorPage
              ? "pt-[59px] min-h-[calc(100vh-59px)]"
              : "min-h-screen"
          } flex-grow flex-1 flex flex-col transition-all duration-300`}
        >
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

          {/* Children Page Views */}
          {children}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
      // GLOBAL MODALS & FLOATERS LAYER
      // -------------------------------------------------------------------------- */}

      {/* Global Toast Stack */}
      <NotificationStack
        notifications={notifications}
        removeNotification={removeNotification as any}
        notificationsMuted={notificationsMuted}
      />

      {/* Dashboard / Editor Modal: Batch Panel Auto Crop */}
      {(isWorkspacePath || !isProEditorPage || isProEditorPage) && showAutoCropModal && (
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

      <ProjectConfirmPanel
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
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer border ${
            isTerminalOpen
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
    </div>
  );
}
