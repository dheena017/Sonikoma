import React, { useState } from "react";
import AdminHeaderPage from "@/features/system_admin/pages/AdminHeaderPage";
import AdminMiniSidebar from "@/features/system_admin/components/AdminMiniSidebar";
import AdminSidebar from "@/features/system_admin/components/AdminSidebar";

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
  user?: any;
  addNotification?: (message: string, type?: string) => void;
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
  user,
  addNotification,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const activeTabRaw = currentPath.split("/").pop() || "overview";
  const isOverview = activeTabRaw === "admin" || activeTabRaw === "overview";

  const tabMetadata: Record<
    string,
    { title: string; desc: string; badge: string }
  > = {
    overview: {
      title: "Root Telemetry Dashboard",
      desc: "Real-time infrastructure, pipeline telemetry & active creator metrics",
      badge: "Live Pulse",
    },
    users: {
      title: "User Accounts & Role Management",
      desc: "Inspect user accounts, manage creator roles, permissions, and security status",
      badge: "Access Control",
    },
    credits: {
      title: "Credits & Economy Control",
      desc: "Manage studio generation credits, transaction ledger, and top-ups",
      badge: "Ledger",
    },
    announcements: {
      title: "System Broadcasts & Alerts",
      desc: "Publish platform-wide broadcast alerts and scheduled maintenance notices",
      badge: "Broadcast",
    },
    jobs: {
      title: "Background Processing Jobs",
      desc: "Monitor active async jobs, video renders, and panel extraction queue",
      badge: "Workers",
    },
    scrapers: {
      title: "Webtoon Engine Configuration",
      desc: "Tune scraper workers, domain proxies, selectors, and rate limiting",
      badge: "Engine",
    },
    health: {
      title: "Infrastructure & Server Health",
      desc: "Host CPU, GPU worker nodes, memory pools, and database connection latency",
      badge: "Telemetry",
    },
    activity: {
      title: "System Audit & Security Logs",
      desc: "Real-time administrative actions, authentication attempts, and event trail",
      badge: "Security Audit",
    },
    analytics: {
      title: "Platform Growth Analytics",
      desc: "User acquisition funnels, retention cohorts, and project creation velocity",
      badge: "BI Insights",
    },
    finance: {
      title: "Revenue & Subscription Ledger",
      desc: "Track Monthly Recurring Revenue (MRR), subscription churn, and payouts",
      badge: "Financials",
    },
    usage: {
      title: "Resource Consumption & Quotas",
      desc: "AI generation tokens, image rendering compute, and bandwidth utilization",
      badge: "Quotas",
    },
    settings: {
      title: "Platform Global Settings",
      desc: "Tune AI model endpoints, webhook secrets, rate limits, and server environment",
      badge: "System Config",
    },
    explorer: {
      title: "Database Query Explorer",
      desc: "Direct read-only schema navigation and table query workbench",
      badge: "Database",
    },
    console: {
      title: "Superuser Interactive Terminal",
      desc: "Direct command execution and server process diagnostics console",
      badge: "CLI Terminal",
    },
  };

  const currentTabInfo = tabMetadata[activeTabRaw] || {
    title: activeTabRaw.charAt(0).toUpperCase() + activeTabRaw.slice(1),
    desc: "Administrative management module and system telemetry workbench",
    badge: "Admin",
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col selection:bg-[#3B82F6]/30">
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
        user={user}
        addNotification={addNotification}
        isSidebarOpen={isSidebarOpen}
      />

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

      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
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
