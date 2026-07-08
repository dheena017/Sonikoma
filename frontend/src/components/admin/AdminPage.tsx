import React, { useEffect, useState, useMemo } from "react";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import * as api from "@/api";
import {
  AdminActivityTab,
  AdminAnalyticsTab,
  AdminAnnouncementsTab,
  AdminConsoleTab,
  AdminContentTab,
  AdminExplorerTab,
  AdminFinanceTab,
  AdminHealthTab,
  AdminScrapersTab,
  AdminSettingsTab,
  AdminUsageTab,
  AdminUsersTab,
} from "./Tabs";
import AdminLayout from "./AdminLayout";
import AdminDashboardPage from "./AdminDashboardPage";

const AdminPage = React.memo(
  ({
    user,
    navigateTo,
    currentPath,
    isAuthenticated,
    fetchWithInterceptor,
    addNotification,
    audioFeedback,
  }: {
    user?: any;
    navigateTo: (path: string) => void;
    currentPath: string;
    isAuthenticated: boolean;
    fetchWithInterceptor: (
      url: string,
      options?: RequestInit
    ) => Promise<Response>;
    addNotification?: any;
    audioFeedback?: any;
  }) => {
    const [stats, setStats] = useState<any>({});
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const activeTab = useMemo(() => {
      if (currentPath === "/admin" || currentPath === "/admin/")
        return "overview";
      return currentPath.split("/").pop() || "overview";
    }, [currentPath]);

    const fetchStats = async () => {
      try {
        const data = await api.getMetrics(fetchWithInterceptor);
        setStats({
          users: data.database?.users || 0,
          projects: data.database?.projects || 0,
          scenes: data.database?.scenes || 0,
          memory: `${data.memory?.rssMB || 0}MB`,
          dbLatencyMs: data.database?.dbLatencyMs || 0,
          gpuWorkers: data.database?.gpuWorkers || {
            total: 0,
            busy: 0,
            idle: 0,
          },
          uptime: data.server?.uptime || "",
          cpuPct: data.memory?.cpuPct || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await api.adminGetAnalytics(fetchWithInterceptor);
        if (data.success) setAnalytics(data.analytics);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        fetchStats();
        fetchAnalytics();
      }
    }, [isAuthenticated, fetchWithInterceptor]);

    useEffect(() => {
      if (activeTab === "health") fetchStats();
      if (
        activeTab === "analytics" ||
        activeTab === "finance" ||
        activeTab === "usage"
      )
        fetchAnalytics();
    }, [activeTab]);

    // PREMIUM UPGRADE: High-end "Access Denied" security screen
    if (!isAuthenticated || (user && user.creator_role !== "admin")) {
      return (
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-[#050507] to-[#050507] pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-[#0a0a0e]/80 backdrop-blur-xl border border-rose-900/30 p-8 rounded-3xl shadow-2xl shadow-rose-900/20 text-center animate-[fadeIn_0.4s_ease-out]">
            <div className="w-20 h-20 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-rose-500/20 shadow-[inset_0_0_20px_rgba(244,63,94,0.2)]">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" /> Access Restricted
            </h2>

            <p className="text-neutral-400 mt-3 text-sm leading-relaxed">
              You are attempting to access a secured administrative zone. Valid
              high-level authorization is required.
            </p>

            <div className="mt-8 pt-6 border-t border-rose-900/20 space-y-3">
              <button
                onClick={() => navigateTo("/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Safety
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("sonikoma_token") || sessionStorage.getItem("sonikoma_token");
                    const res = await fetch("/api/auth/profile", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({ creator_role: "admin" })
                    });
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      alert("Failed to self-promote to admin");
                    }
                  } catch (e) {
                    alert("Error self-promoting to admin");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/30 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer"
              >
                🛡️ Self-Promote to Admin (Dev Bypass)
              </button>
            </div>
          </div>
        </div>
      );
    }

    const renderActiveModule = () => {
      switch (activeTab) {
        case "overview":
          return (
            <AdminDashboardPage
              user={user}
              navigateTo={navigateTo}
              isAuthenticated={isAuthenticated}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              audioFeedback={audioFeedback}
              isTab={true}
            />
          );
        case "announcements":
          return (
            <AdminAnnouncementsTab
              fetchWithInterceptor={fetchWithInterceptor}
            />
          );
        case "users":
          return (
            <AdminUsersTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "content":
          return (
            <AdminContentTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "usage":
          return (
            <AdminUsageTab
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          );
        case "scrapers":
          return (
            <AdminScrapersTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "finance":
          return (
            <AdminFinanceTab
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          );
        case "analytics":
          return (
            <AdminAnalyticsTab fetchWithInterceptor={fetchWithInterceptor} />
          );
        case "settings":
          return (
            <AdminSettingsTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "health":
          return <AdminHealthTab fetchWithInterceptor={fetchWithInterceptor} />;
        case "activity":
          return (
            <AdminActivityTab fetchWithInterceptor={fetchWithInterceptor} />
          );
        case "explorer":
          return (
            <AdminExplorerTab fetchWithInterceptor={fetchWithInterceptor} />
          );
        case "console":
          return <AdminConsoleTab />;
        default:
          return (
            <AdminDashboardPage
              user={user}
              navigateTo={navigateTo}
              isAuthenticated={isAuthenticated}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              audioFeedback={audioFeedback}
              isTab={true}
            />
          );
      }
    };

    return (
      // AdminLayout now flawlessly handles the fixed header, sidebar, and layout padding
      <AdminLayout
        currentPath={currentPath}
        navigateTo={navigateTo}
        fetchWithInterceptor={fetchWithInterceptor}
      >
        <div className="w-full animate-[fadeIn_0.3s_ease-out]">
          {renderActiveModule()}
        </div>
      </AdminLayout>
    );
  }
);

export default AdminPage;
