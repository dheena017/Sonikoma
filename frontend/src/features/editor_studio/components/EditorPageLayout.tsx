import React, { useEffect } from "react";
import EditorSidebar from "@/features/editor_studio/components/EditorSidebar";
import EditorMiniSidebar from "@/features/editor_studio/components/EditorMiniSidebar";
import EditorPageHeader from "@/features/editor_studio/components/EditorPageHeader";

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
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0A0A0A] text-[#E5E5E5] relative">

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
        className={`flex flex-1 flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] custom-purple-scrollbar overflow-y-auto overflow-x-hidden ${
          isFocusMode
            ? "h-screen pl-0 pr-0"
            : "h-screen pt-16 pl-0 pr-0 md:pl-20 md:pr-0"
        }`}
      >
        <div className="relative flex-1 w-full min-w-0">
          <div className="w-full flex flex-col min-w-0 pb-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LayoutEditorPage);
