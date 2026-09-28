import React, { useState } from "react";
import AISeriesHeader from "./AISeriesHeader";
import AISeriesMiniSidebar from "./AISeriesMiniSidebar";
import AISeriesSidebar from "./AISeriesSidebar";

interface AISeriesLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor?: any;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  user?: any;
  addNotification?: (message: string, type?: string) => void;
}

export const AISeriesLayout: React.FC<AISeriesLayoutProps> = ({
  children,
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationsMuted,
  setNotificationsMuted,
  user,
  addNotification,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col selection:bg-violet-600/30">
      {/* AI Series Suite Header */}
      <AISeriesHeader
        currentPath={currentPath}
        navigateTo={navigateTo}
        fetchWithInterceptor={fetchWithInterceptor}
        onToggleSidebar={toggleSidebar}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        deleteNotification={deleteNotification}
        clearAllNotifications={clearAllNotifications}
        notificationsMuted={notificationsMuted}
        setNotificationsMuted={setNotificationsMuted}
        isSidebarOpen={isSidebarOpen}
        user={user}
        addNotification={addNotification}
      />

      {/* AI Series Mini Sidebar (always visible on desktop, w-20 fixed) */}
      <AISeriesMiniSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        onOpenSidebar={toggleSidebar}
      />

      {/* AI Series Expandable Sidebar Drawer */}
      <AISeriesSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main page content container offset by header and mini-sidebar */}
      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
        <main className="flex-1 w-full flex flex-col">
          <div className="w-full h-full flex-1 flex flex-col animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AISeriesLayout;
