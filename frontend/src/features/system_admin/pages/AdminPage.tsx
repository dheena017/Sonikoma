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
  AdminCreditsTab,
} from "@/features/system_admin/components/Tabs";
import AdminLayout from "@/features/system_admin/components/AdminLayout";
import AdminDashboardPage from "@/features/system_admin/pages/AdminDashboardPage";

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
    const isUserAdmin = user?.creator_role === "admin" || user?.role === "admin";
    if (!isAuthenticated || (user && !isUserAdmin)) {
      return (
        <div className="fixed inset-0 z-50 w-full h-full bg-[#050507] flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-rose-500/30">
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

    const isOverview = activeTab === "overview";

    const tabMetadata: Record<string, { title: string; desc: string; badge: string }> = {
      overview: { title: "Root Telemetry Dashboard", desc: "Real-time infrastructure, pipeline telemetry & active creator metrics", badge: "Live Pulse" },
      users: { title: "User Accounts & Role Management", desc: "Inspect user accounts, manage creator roles, permissions, and security status", badge: "Access Control" },
      credits: { title: "Credits & Economy Control", desc: "Manage studio generation credits, transaction ledger, and top-ups", badge: "Ledger" },
      announcements: { title: "System Broadcasts & Alerts", desc: "Publish platform-wide broadcast alerts and scheduled maintenance notices", badge: "Broadcast" },
      content: { title: "Content Moderation & Projects", desc: "Inspect public and private storyboards, project status, and storage quotas", badge: "Assets" },
      scrapers: { title: "Webtoon Engine Configuration", desc: "Tune scraper workers, domain proxies, selectors, and rate limiting", badge: "Engine" },
      health: { title: "Infrastructure & Server Health", desc: "Host CPU, GPU worker nodes, memory pools, and database connection latency", badge: "Telemetry" },
      activity: { title: "System Audit & Security Logs", desc: "Real-time administrative actions, authentication attempts, and event trail", badge: "Security Audit" },
      analytics: { title: "Platform Growth Analytics", desc: "User acquisition funnels, retention cohorts, and project creation velocity", badge: "BI Insights" },
      finance: { title: "Revenue & Subscription Ledger", desc: "Track Monthly Recurring Revenue (MRR), subscription churn, and payouts", badge: "Financials" },
      usage: { title: "Resource Consumption & Quotas", desc: "AI generation tokens, image rendering compute, and bandwidth utilization", badge: "Quotas" },
      settings: { title: "Platform Global Settings", desc: "Tune AI model endpoints, webhook secrets, rate limits, and server environment", badge: "System Config" },
      explorer: { title: "Database Query Explorer", desc: "Direct read-only schema navigation and table query workbench", badge: "Database" },
      console: { title: "Superuser Interactive Terminal", desc: "Direct command execution and server process diagnostics console", badge: "CLI Terminal" },
    };

    const currentTabInfo = tabMetadata[activeTab] || {
      title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
      desc: "Administrative management module and system telemetry workbench",
      badge: "Admin",
    };

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
        case "credits":
          return (
            <AdminCreditsTab
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
      <div className="w-full max-w-7xl mx-auto py-6 space-y-6 animate-fade-in relative z-10">
        {!isOverview && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/5 pb-5">
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
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute -inset-0.5 rounded-2xl border border-purple-500/40 pointer-events-none animate-pulse" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    {currentTabInfo.title}
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                      {currentTabInfo.badge}
                    </span>
                  </h1>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    {currentTabInfo.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tab Switcher Strip & Action */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
              <div className="hidden xl:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => navigateTo("/admin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === "overview"
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
                    activeTab === "users"
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
                    activeTab === "credits"
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
                    activeTab === "announcements"
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
                    activeTab === "health"
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
                    activeTab === "scrapers"
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
                    activeTab === "settings"
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
                className="group flex items-center gap-2 px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-200 hover:text-white border border-white/10 hover:border-purple-500/30 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md hover:shadow-lg active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform text-purple-400" />
                <span>Main App</span>
              </button>
            </div>
          </div>
        )}
        {renderActiveModule()}
      </div>
    );
  }
);

export default AdminPage;
