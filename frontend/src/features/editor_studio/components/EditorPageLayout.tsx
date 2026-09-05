import React, { useEffect } from "react";
import { Film, Layout, Layers, Zap } from "lucide-react";
import EditorSidebar from "@/features/editor_studio/components/EditorSidebar";
import EditorMiniSidebar from "@/features/editor_studio/components/EditorMiniSidebar";
import EditorPageHeader from "@/features/editor_studio/components/EditorPageHeader";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";

interface LayoutEditorPageProps {
  children: React.ReactNode;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  currentSection: string;
  setCurrentSection: React.Dispatch<React.SetStateAction<string>>;
  onBackToApp: () => void;
  scrapedCount: number;
  panelsCount: number;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  title: string;
  subtitle?: string;
  onSave: () => void;
  isSaving: boolean;
  isDirty?: boolean;
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  navigateTo?: (path: string) => void;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  onNavigateToAll?: () => void;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  fetchWithInterceptor?: any;
  locationSearch?: string;
  user?: any;
}

const LayoutEditorPage: React.FC<LayoutEditorPageProps> = ({
  children,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  currentSection,
  setCurrentSection,
  onBackToApp,
  scrapedCount,
  panelsCount,
  isBatchCropping,
  isCleaningBubbles,
  title,
  subtitle,
  onSave,
  isSaving,
  isDirty,
  isFocusMode,
  setIsFocusMode,
  navigateTo,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationsMuted,
  setNotificationsMuted,
  onNavigateToAll,
  projectId,
  seriesSlug,
  chapterSlug,
  fetchWithInterceptor,
  locationSearch,
  user,
}) => {
  const isSidebarOpen = !isSidebarCollapsed && !isFocusMode;

  // Ensure background page remains scrollable
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#0A0A0A] text-[#E5E5E5] relative">

      {/* Blurred Background Overlay when expanded sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 transition-opacity animate-fade-in"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebars */}
      {!isFocusMode &&
        (isSidebarCollapsed ? (
          <EditorMiniSidebar
            projectId={projectId}
            seriesSlug={seriesSlug}
            chapterSlug={chapterSlug}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            currentSection={currentSection}
            setCurrentSection={setCurrentSection}
            onBackToApp={onBackToApp}
            scrapedCount={scrapedCount}
            panelsCount={panelsCount}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            navigateTo={navigateTo}
            locationSearch={locationSearch}
          />
        ) : (
          <EditorSidebar
            projectId={projectId}
            seriesSlug={seriesSlug}
            chapterSlug={chapterSlug}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            currentSection={currentSection}
            setCurrentSection={setCurrentSection}
            onBackToApp={onBackToApp}
            scrapedCount={scrapedCount}
            panelsCount={panelsCount}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            navigateTo={navigateTo}
            locationSearch={locationSearch}
          />
        ))}

      {/* Fixed Premium Header */}
      {!isFocusMode && (
        <EditorPageHeader
          title={title}
          subtitle={subtitle}
          onBackToApp={onBackToApp}
          onSave={onSave}
          isSaving={isSaving}
          isDirty={isDirty}
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          isSidebarOpen={isSidebarOpen}
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
          markAllNotificationsAsRead={markAllNotificationsAsRead}
          deleteNotification={deleteNotification}
          clearAllNotifications={clearAllNotifications}
          notificationsMuted={notificationsMuted}
          setNotificationsMuted={setNotificationsMuted}
          onNavigateToAll={onNavigateToAll}
          fetchWithInterceptor={fetchWithInterceptor}
          navigateTo={navigateTo}
          user={user}
        />
      )}

      {/* Main content sits directly below the fixed header without reserving extra blank space. */}
      <div
        id="main-scroll-container"
        className={`flex flex-1 flex-col min-w-0 transition-[padding] duration-300 ease-out custom-purple-scrollbar overflow-y-auto overflow-x-hidden [contain:layout_style] ${
          isFocusMode
            ? "h-screen pl-0 pr-0"
            : "h-screen pt-16 pl-0 pr-0 md:pl-20 md:pr-0"
        }`}
      >
        <div className="relative flex-1 w-full min-w-0 flex flex-col">
          <div className="w-full flex flex-col flex-1 min-h-0 min-w-0 pb-8">{children}</div>
        </div>
      </div>

      {/* ── Mobile Viewport Bottom Section Navigation Bar (< 1024px) ────────── */}
      {!isFocusMode && (
        <div className="flex lg:hidden items-center justify-around bg-[#0B0C0E] border-t border-white/10 pt-2 pb-4.5 px-3 shrink-0 z-40 select-none shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: true });
              setCurrentSection("monitor");
              const container = document.getElementById("main-scroll-container");
              if (container) container.scrollTo({ top: 0, behavior: "smooth" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-sans tracking-wide leading-none transition-all cursor-pointer min-w-[60px] ${
              currentSection === "monitor"
                ? "text-[#3B82F6] bg-[#3B82F6]/15 border border-[#3B82F6]/30 shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4 shrink-0" />
            <span className="leading-none mt-0.5">Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentSection("assets");
              const container = document.getElementById("main-scroll-container");
              if (container) container.scrollTo({ top: 0, behavior: "smooth" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-sans tracking-wide leading-none transition-all cursor-pointer min-w-[60px] ${
              currentSection === "assets" || currentSection === "raw-images"
                ? "text-[#3B82F6] bg-[#3B82F6]/15 border border-[#3B82F6]/30 shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layout className="w-4 h-4 shrink-0" />
            <span className="leading-none mt-0.5">Assets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentSection("storyboard");
              const container = document.getElementById("main-scroll-container");
              if (container) container.scrollTo({ top: 0, behavior: "smooth" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-sans tracking-wide leading-none transition-all cursor-pointer min-w-[60px] ${
              currentSection === "storyboard" || currentSection === "timeline"
                ? "text-[#3B82F6] bg-[#3B82F6]/15 border border-[#3B82F6]/30 shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="leading-none mt-0.5">Storyboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigateTo) {
                navigateTo("/video-editor");
              } else {
                window.history.pushState({}, "", "/video-editor");
                window.dispatchEvent(new Event("popstate"));
              }
            }}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-sans tracking-wide leading-none transition-all cursor-pointer min-w-[60px] text-neutral-400 hover:text-white"
          >
            <Zap className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="leading-none mt-0.5">Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(LayoutEditorPage);
