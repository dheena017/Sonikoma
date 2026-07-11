import React, { useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
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

  const activeTabRaw = currentPath.split("/").pop() || "overview";
  const activeTabName = activeTabRaw === "admin" ? "Overview" : activeTabRaw.charAt(0).toUpperCase() + activeTabRaw.slice(1);

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

      <AdminMiniSidebar currentPath={currentPath} navigateTo={navigateTo} />

      <AdminSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
        <main className="flex-1 px-6 pb-6 pt-0 md:px-8 md:pb-8 md:pt-0">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            {/* Standard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
                  <span
                    className="hover:text-purple-400 cursor-pointer"
                    onClick={() => navigateTo("/")}
                  >
                    Dashboard
                  </span>
                  <span>&gt;</span>
                  <span className="text-purple-400">Admin Command Center</span>
                  <span>&gt;</span>
                  <span className="text-purple-400">{activeTabName}</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="icon-pill icon-pill--purple">
                    <Shield className="h-5 w-5" />
                  </div>
                  Admin Command Center
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Manage platform users, inspect diagnostic telemetry, and run scraper actions
                </p>
              </div>

              <button
                onClick={() => navigateTo("/")}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30 self-start sm:self-center"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </div>
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
