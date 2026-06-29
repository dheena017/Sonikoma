import React, { useEffect, useState } from "react";
import {
  Shield,
  LayoutGrid,
  Mail,
  Users,
  BarChart3,
  FolderGit2,
  Settings,
  Server,
  ActivitySquare,
  ShieldAlert,
  Database,
  Terminal,
  Cpu,
  Globe,
  DollarSign,
} from "lucide-react";

import { AdminOverviewTab } from "./admin/AdminOverviewTab";
import { AdminAnnouncementsTab } from "./admin/AdminAnnouncementsTab";
import { AdminUsersTab } from "./admin/AdminUsersTab";
import { AdminAnalyticsTab } from "./admin/AdminAnalyticsTab";
import { AdminContentTab } from "./admin/AdminContentTab";
import { AdminSettingsTab } from "./admin/AdminSettingsTab";
import { AdminHealthTab } from "./admin/AdminHealthTab";
import { AdminActivityTab } from "./admin/AdminActivityTab";
import { AdminExplorerTab } from "./admin/AdminExplorerTab";
import { AdminConsoleTab } from "./admin/AdminConsoleTab";
import { AdminUsageTab } from "./admin/AdminUsageTab";
import { AdminScrapersTab } from "./admin/AdminScrapersTab";
import { AdminFinanceTab } from "./admin/AdminFinanceTab";

export default function AdminPage({
  navigateTo,
  isAuthenticated,
  fetchWithInterceptor,
  addNotification,
}: {
  navigateTo: (path: string) => void;
  isAuthenticated: boolean;
  fetchWithInterceptor: any;
  addNotification: any;
}) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [stats, setStats] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetchWithInterceptor("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setStats({
          users: data.database?.users || 0,
          projects: data.database?.projects || 0,
          scenes: data.database?.scenes || 0,
          memory: `${data.memory?.rssMB || 0}MB`,
          dbLatencyMs: data.database?.dbLatencyMs || 0,
          uptime: data.server?.uptime || "",
          cpuPct: data.memory?.cpuPct || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-200">Access Denied</h2>
        <p className="text-neutral-400 mt-2">
          You must be logged in as an administrator to access this area.
        </p>
        <button
          onClick={() => navigateTo("/")}
          className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "announcements", label: "Announcements", icon: Mail },
    { id: "users", label: "Users", icon: Users },
    { id: "content", label: "Content", icon: FolderGit2 },
    { id: "usage", label: "Usage", icon: Cpu },
    { id: "scrapers", label: "Scrapers", icon: Globe },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "explorer", label: "Explorer", icon: Database },
    { id: "console", label: "Console", icon: Terminal },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "health", label: "Health", icon: Server },
    { id: "activity", label: "Audit Logs", icon: ActivitySquare },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-[fadeIn_0.3s_ease-out] pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Command Center
            </h1>
            <p className="text-neutral-400 mt-1">
              Platform administration, monitoring, and moderation.
            </p>
          </div>

          <div className="flex flex-wrap bg-[#111115] border border-neutral-800 rounded-xl p-1.5 shadow-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className={activeTab === tab.id ? "block" : "hidden xl:block"}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[600px]">
          {activeTab === "overview" && (
            <AdminOverviewTab
              stats={stats}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "announcements" && (
            <AdminAnnouncementsTab fetchWithInterceptor={fetchWithInterceptor} />
          )}
          {activeTab === "users" && (
            <AdminUsersTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          )}
          {activeTab === "content" && (
            <AdminContentTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          )}
          {activeTab === "usage" && (
            <AdminUsageTab
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          )}
          {activeTab === "scrapers" && (
            <AdminScrapersTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          )}
          {activeTab === "finance" && (
            <AdminFinanceTab
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          )}
          {activeTab === "analytics" && (
            <AdminAnalyticsTab fetchWithInterceptor={fetchWithInterceptor} />
          )}
          {activeTab === "settings" && (
            <AdminSettingsTab
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          )}
          {activeTab === "health" && (
            <AdminHealthTab fetchWithInterceptor={fetchWithInterceptor} />
          )}
          {activeTab === "activity" && (
            <AdminActivityTab fetchWithInterceptor={fetchWithInterceptor} />
          )}
          {activeTab === "explorer" && (
            <AdminExplorerTab fetchWithInterceptor={fetchWithInterceptor} />
          )}
          {activeTab === "console" && <AdminConsoleTab />}
        </div>
      </div>
    </div>
  );
}
