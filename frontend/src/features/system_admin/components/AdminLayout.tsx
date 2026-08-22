import React, { useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-transparent text-white flex flex-col selection:bg-purple-500/30">
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
            {/* Rich Subpage Header for non-overview admin tabs */}
            {!isOverview && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/5 pb-5 mb-6">
                <div className="space-y-2.5 max-w-2xl text-left">
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigateTo("/dashboard")}
                      className="px-2.5 py-0.5 rounded-md bg-neutral-900/80 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
                    >
                      Main App
                    </button>
                    <span className="text-neutral-600 font-bold">&rsaquo;</span>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin")}
                      className="px-2.5 py-0.5 rounded-md bg-neutral-900/80 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
                    >
                      Admin
                    </button>
                    <span className="text-neutral-600 font-bold">&rsaquo;</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                      {currentTabInfo.title}
                    </span>
                  </div>

                  {/* Title & Badge */}
                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="relative group shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30 group-hover:scale-105 transition-transform">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <span className="absolute -inset-0.5 rounded-2xl border border-purple-500/40 pointer-events-none animate-pulse" />
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                        {currentTabInfo.title}
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                          {currentTabInfo.badge}
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        {currentTabInfo.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side: Quick Tab Switcher & Exit button */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                  <div className="hidden xl:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "overview" || activeTabRaw === "admin"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/users")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "users"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Users
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/credits")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "credits"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/announcements")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "announcements"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Broadcasts
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/health")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "health"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Health
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/scrapers")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "scrapers"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Scrapers
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/settings")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeTabRaw === "settings"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Settings
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo("/dashboard")}
                    className="group flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-200 hover:text-white border border-white/10 hover:border-purple-500/30 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md hover:shadow-lg active:scale-95"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform text-purple-400" />
                    <span>Main App</span>
                  </button>
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
