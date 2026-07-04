import React, { useState } from "react";
import AdminHeaderPage from "./AdminHeaderPage";
import AdminMiniSidebar from "./AdminMiniSidebar";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
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
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
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
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col selection:bg-violet-500/30">
      
      <AdminHeaderPage
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
        // Pass the state down so the header knows when to hide
        isSidebarOpen={isSidebarOpen} 
      />

      <AdminMiniSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
      />

      <AdminSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-violet-900/10 text-center bg-[#0a0a0e]/40 mt-auto">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] font-mono">
            Sonikoma Command Center &bull; Privileged Access Only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
