import React, { useEffect, useState, useMemo } from "react";
import { ShieldAlert } from "lucide-react";

import { AdminOverviewTab } from "./admin/AdminOverviewTab";
import { AdminAnnouncementsTab } from "./admin/AdminAnnouncementsTab";
import * as api from "../api/index.js";
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
import AdminLayout from "./admin/AdminLayout";

const AdminPage = React.memo(({
  navigateTo,
  currentPath,
  isAuthenticated,
  fetchWithInterceptor,
  addNotification,
  audioFeedback,
}: {
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
    if (currentPath === "/admin" || currentPath === "/admin/") return "overview";
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
    if (activeTab === "analytics" || activeTab === "finance" || activeTab === "usage") fetchAnalytics();
  }, [activeTab]);

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

  const renderActiveModule = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AdminOverviewTab
            stats={stats}
            fetchWithInterceptor={fetchWithInterceptor}
            addNotification={addNotification}
            setActiveTab={(tab) => navigateTo(`/admin/${tab}`)}
          />
        );
      case "announcements":
        return <AdminAnnouncementsTab fetchWithInterceptor={fetchWithInterceptor} />;
      case "users":
        return <AdminUsersTab fetchWithInterceptor={fetchWithInterceptor} addNotification={addNotification} />;
      case "content":
        return <AdminContentTab fetchWithInterceptor={fetchWithInterceptor} addNotification={addNotification} />;
      case "usage":
        return <AdminUsageTab fetchWithInterceptor={fetchWithInterceptor} analytics={analytics} />;
      case "scrapers":
        return <AdminScrapersTab fetchWithInterceptor={fetchWithInterceptor} addNotification={addNotification} />;
      case "finance":
        return <AdminFinanceTab fetchWithInterceptor={fetchWithInterceptor} analytics={analytics} />;
      case "analytics":
        return <AdminAnalyticsTab fetchWithInterceptor={fetchWithInterceptor} />;
      case "settings":
        return <AdminSettingsTab fetchWithInterceptor={fetchWithInterceptor} addNotification={addNotification} />;
      case "health":
        return <AdminHealthTab fetchWithInterceptor={fetchWithInterceptor} />;
      case "activity":
        return <AdminActivityTab fetchWithInterceptor={fetchWithInterceptor} />;
      case "explorer":
        return <AdminExplorerTab fetchWithInterceptor={fetchWithInterceptor} />;
      case "console":
        return <AdminConsoleTab />;
      default:
        return (
          <AdminOverviewTab
            stats={stats}
            fetchWithInterceptor={fetchWithInterceptor}
            addNotification={addNotification}
            setActiveTab={(tab) => navigateTo(`/admin/${tab}`)}
          />
        );
    }
  };

  return (
    <AdminLayout
      currentPath={currentPath}
      navigateTo={navigateTo}
      fetchWithInterceptor={fetchWithInterceptor}
    >
      <div className="min-h-[600px]">
        {renderActiveModule()}
      </div>
    </AdminLayout>
  );
});

export default AdminPage;
