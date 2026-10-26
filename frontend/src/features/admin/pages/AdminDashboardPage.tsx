import React, { useEffect, useState, useMemo } from "react";
import { RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import * as api from "@/shared/api";
import type { FetchClient } from "@/shared/api/types";
import BackendStatusPanel from "@/shared/ui/status/BackendStatusPanel";
import { isUserAdmin, selfPromoteToAdmin } from "../utils/adminAuth";
import {
  AdminDashboardStats,
  AdminDashboardChart,
  AdminDashboardPulse,
  AdminDashboardQuickActions,
  AdminDashboardBroadcaster,
  AdminDashboardUsers,
  AdminDashboardAuditEvents,
} from "../components";

export interface AdminDashboardPageProps {
  user?: any;
  navigateTo: (path: string) => void;
  isAuthenticated: boolean;
  fetchWithInterceptor: FetchClient;
  addNotification?: any;
  audioFeedback?: any;
  isTab?: boolean;
}

const AdminDashboardPage = React.memo(
  ({
    user,
    navigateTo,
    isAuthenticated,
    fetchWithInterceptor,
    addNotification,
  }: AdminDashboardPageProps) => {
    // States
    const [stats, setStats] = useState<any>({});
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [dbStatus, setDbStatus] = useState<string>("Verifying...");
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [processingAction, setProcessingAction] = useState<string | null>(
      null
    );

    const [backendOnline, setBackendOnline] = useState<boolean>(true);
    const [backendMetrics, setBackendMetrics] = useState<any>(null);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    // Announcement broadcaster form state
    const [announcementTitle, setAnnouncementTitle] = useState("");
    const [announcementMsg, setAnnouncementMsg] = useState("");
    const [announcementType, setAnnouncementType] = useState<
      "info" | "warning" | "success" | "error"
    >("info");

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const data = await api.getBackendStatus(fetchWithInterceptor);
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
          activeJobs: data.database?.activeJobs || 0,
        });
        setBackendMetrics(data);
        setBackendOnline(
          data.status === "healthy" || data.status === "ok" || !!data.server
        );
        setLastChecked(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setBackendOnline(false);
        setLastChecked(new Date().toLocaleTimeString());
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await api.adminGetAnalytics(fetchWithInterceptor);
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    const fetchRecentAuditLogs = async () => {
      try {
        const res = await fetchWithInterceptor(
          "/api/v1/auth/admin/audit-logs?limit=8"
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRecentLogs(data.logs || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recent audit logs:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await api.adminGetUsers(fetchWithInterceptor);
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    const verifyDatabase = async () => {
      try {
        const res = await fetchWithInterceptor(
          "/api/v1/auth/admin/db/query?table=admin_settings&limit=1"
        );
        if (res.ok) {
          setDbStatus("Healthy");
        } else {
          setDbStatus("Warning");
        }
      } catch {
        setDbStatus("Unreachable");
      }
    };

    const refreshData = async () => {
      if (!isAuthenticated) return;
      await Promise.all([
        fetchStats(),
        fetchAnalytics(),
        fetchRecentAuditLogs(),
        fetchUsers(),
        verifyDatabase(),
      ]);
      if (addNotification) {
        addNotification("Dashboard telemetry updated", "success");
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        refreshData();
      }
    }, [isAuthenticated]);

    const handleExportLogs = async () => {
      try {
        const res = await fetchWithInterceptor(
          "/api/v1/auth/admin/activity/export"
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Sonikoma_Audit_Logs_${
            new Date().toISOString().split("T")[0]
          }.csv`;
          a.click();
          if (addNotification)
            addNotification("Security logs exported as CSV", "success");
        }
      } catch {
        if (addNotification)
          addNotification("Failed to export security logs", "error");
      }
    };

    const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!announcementTitle.trim() || !announcementMsg.trim()) {
        if (addNotification)
          addNotification("Announcement fields cannot be blank", "warning");
        return;
      }
      setProcessingAction("broadcast");
      try {
        const res = await fetchWithInterceptor(
          "/api/v1/auth/admin/announcements",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: announcementTitle,
              message: announcementMsg,
              type: announcementType,
            }),
          }
        );
        if (res.ok) {
          if (addNotification)
            addNotification("Broadcast announcement published!", "success");
          setAnnouncementTitle("");
          setAnnouncementMsg("");
          fetchRecentAuditLogs();
        } else {
          if (addNotification)
            addNotification("Failed to post announcement", "error");
        }
      } catch {
        if (addNotification)
          addNotification("Failed to publish announcement", "error");
      } finally {
        setProcessingAction(null);
      }
    };

    const handleImpersonate = async (userId: string) => {
      if (
        !confirm(
          "Impersonate this user? This will log you in as them. You can return back using the floating control."
        )
      )
        return;
      try {
        const res = await fetchWithInterceptor(
          `/api/v1/auth/admin/impersonate/${userId}`,
          { method: "POST" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const currentToken = localStorage.getItem("sonikoma_token");
            if (currentToken) {
              localStorage.setItem("sonikoma_admin_token", currentToken);
            }
            localStorage.setItem("sonikoma_token", data.access_token);
            window.location.href = "/";
          }
        }
      } catch {
        if (addNotification)
          addNotification("Failed to impersonate user", "error");
      }
    };

    // Filtered users search logic
    const filteredUsers = useMemo(() => {
      if (!userSearch.trim()) return users.slice(0, 5);
      return users
        .filter(
          (u) =>
            (u.full_name || "")
              .toLowerCase()
              .includes(userSearch.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.username || "").toLowerCase().includes(userSearch.toLowerCase())
        )
        .slice(0, 5);
    }, [users, userSearch]);

    // Trends Chart data extraction
    const signupChartData = useMemo(() => {
      if (analytics?.signups_by_day && analytics.signups_by_day.length > 0) {
        return analytics.signups_by_day.slice(-7);
      }
      return [
        { date: "Day 1", count: 2 },
        { date: "Day 2", count: 5 },
        { date: "Day 3", count: 3 },
        { date: "Day 4", count: 8 },
        { date: "Day 5", count: 12 },
        { date: "Day 6", count: 7 },
        { date: "Day 7", count: 15 },
      ];
    }, [analytics]);

    const projectChartData = useMemo(() => {
      if (analytics?.projects_by_day && analytics.projects_by_day.length > 0) {
        return analytics.projects_by_day.slice(-7);
      }
      return [
        { date: "Day 1", count: 4 },
        { date: "Day 2", count: 7 },
        { date: "Day 3", count: 6 },
        { date: "Day 4", count: 14 },
        { date: "Day 5", count: 18 },
        { date: "Day 6", count: 11 },
        { date: "Day 7", count: 22 },
      ];
    }, [analytics]);

    const cpuLoad = stats.cpuPct || 0;

    // Security screen if unauthorized
    const userIsAdmin = isUserAdmin(user);
    if (!isAuthenticated || (user && !userIsAdmin)) {
      return (
        <div className="fixed inset-0 z-50 w-full h-full bg-[#050507] flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-[#050507] to-[#050507] pointer-events-none" />
          <div className="relative z-10 max-w-md w-full bg-[#0a0a0e]/80 backdrop-blur-xl border border-rose-900/30 p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-rose-500/20">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              Access Restricted
            </h2>
            <p className="text-neutral-400 mt-3 text-sm leading-relaxed">
              Administrative high-level authorization required.
            </p>
            <div className="mt-8 pt-6 border-t border-rose-900/20 space-y-3">
              <button
                onClick={() => navigateTo("/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
              >
                Return to Safety
              </button>
              <button
                onClick={async () => {
                  const success = await selfPromoteToAdmin();
                  if (success) {
                    window.location.reload();
                  } else {
                    alert("Failed to self-promote to admin");
                  }
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold cursor-pointer"
              >
                🛡️ Self-Promote to Admin (Dev Bypass)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 text-left text-[#E5E5E5] animate-fade-in">
        {/* Main Cover Wrapper Card */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          {/* Header Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#2F2F2F] pb-5">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-[#E5E5E5] tracking-tight leading-tight">
                Admin Console
              </h1>
              <p className="text-[#9CA3AF] text-xs mt-0.5">
                Monitor system health, database latency, active worker jobs, and
                user accounts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={refreshData}
                disabled={loadingStats}
                className="btn-primary flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loadingStats ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Header Banner */}
          {cpuLoad > 85 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400 animate-pulse">
              <AlertCircle className="w-5 h-5" />
              <div className="text-xs font-semibold">
                Critical resource notice: Host CPU load exceeds 85%. Rendering
                pipelines may trigger latency.
              </div>
            </div>
          )}

          {/* Backend Status Panel */}
          <BackendStatusPanel
            online={backendOnline}
            metrics={backendMetrics}
            lastChecked={lastChecked}
            onRefresh={refreshData}
          />

          {/* Stats Ribbon */}
          <AdminDashboardStats
            stats={stats}
            analytics={analytics}
            loading={loadingStats}
          />

          {/* Analytics Chart & Pulse Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminDashboardChart
              signupChartData={signupChartData}
              projectChartData={projectChartData}
              onRefresh={refreshData}
            />
            <AdminDashboardPulse stats={stats} dbStatus={dbStatus} />
          </div>

          {/* Quick Actions & Announcement Broadcaster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminDashboardQuickActions
              onExportLogs={handleExportLogs}
              navigateTo={navigateTo}
            />
            <AdminDashboardBroadcaster
              title={announcementTitle}
              message={announcementMsg}
              type={announcementType}
              processing={processingAction === "broadcast"}
              onTitleChange={setAnnouncementTitle}
              onMessageChange={setAnnouncementMsg}
              onTypeChange={setAnnouncementType}
              onSubmit={handleBroadcastAnnouncement}
            />
          </div>

          {/* Active Creators & Audit Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminDashboardUsers
              users={filteredUsers}
              search={userSearch}
              loading={loadingUsers}
              onSearchChange={setUserSearch}
              onImpersonate={handleImpersonate}
            />
            <AdminDashboardAuditEvents logs={recentLogs} />
          </div>
        </div>
      </div>
    );
  }
);

export default AdminDashboardPage;
