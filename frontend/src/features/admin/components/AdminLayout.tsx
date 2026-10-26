import React, { useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminMiniSidebar from "./AdminMiniSidebar";
import AdminSidebar from "./AdminSidebar";
import { getTabMetadata } from "../utils/adminConstants";

export interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
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

export const AdminLayout: React.FC<AdminLayoutProps> = ({
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

  const activeTabRaw = currentPath.split("/").pop() || "overview";
  const isOverview = activeTabRaw === "admin" || activeTabRaw === "overview";
  const currentTabInfo = getTabMetadata(activeTabRaw);

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col selection:bg-[#3B82F6]/30 relative">
      <AdminMiniSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        onOpenSidebar={toggleSidebar}
      />

      <AdminSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col lg:pl-14 min-h-screen transition-all duration-300">
        <AdminHeader
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
          user={user}
          addNotification={addNotification}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pb-8 md:pt-4 max-w-7xl mx-auto w-full">
          <div className="w-full animate-[fadeIn_0.3s_ease-out]">
            {/* Subpage Header for non-overview admin tabs */}
            {!isOverview && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentTabInfo.title}
                  </h1>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {currentTabInfo.desc}
                  </p>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>

        <footer className="py-5 px-8 border-t border-white/5 text-center bg-neutral-950/40 backdrop-blur-md mt-auto">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.3em] font-mono">
            Sonikoma Superuser Console &bull; High-Privilege Administration Zone
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
