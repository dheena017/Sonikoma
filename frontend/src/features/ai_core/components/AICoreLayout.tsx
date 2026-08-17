import React, { useState } from "react";
import AICoreHeader from "./AICoreHeader";
import AICoreSidebar from "./AICoreSidebar";
import AICoreMiniSidebar from "./AICoreMiniSidebar";

export interface AICoreLayoutProps {
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

export default function AICoreLayout({
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
}: AICoreLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07080c] text-white font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* 1. FIXED HEADER (TOP 16 HEIGHT) */}
      <AICoreHeader
        currentPath={currentPath}
        navigateTo={navigateTo}
        fetchWithInterceptor={fetchWithInterceptor}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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

      {/* 2. FIXED MINI SIDEBAR (LEFT 20 WIDTH RAIL) */}
      <AICoreMiniSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* 3. FULL SIDEBAR DRAWER */}
      <AICoreSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 4. MAIN SCROLLABLE CONTENT VIEWPORT WITH HEADER & MINI-SIDEBAR OFFSETS */}
      <div className="pt-16 lg:pl-20 min-h-screen flex flex-col bg-gradient-to-b from-[#07080c] via-[#090a10] to-[#050608]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
