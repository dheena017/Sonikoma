import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Activity,
  Server,
  FolderGit2,
  TrendingUp,
  Clock,
  Zap,
  Trash2,
  Download,
  AlertCircle,
  Wind,
  Database,
  DollarSign,
  Flame,
  CheckCircle2,
  RefreshCw,
  Mail,
  Search,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import * as api from "@/api";
import AdminLayout from "@/features/system_admin/components/AdminLayout";
import BackendStatusPanel from "@/components/feedback/BackendStatusPanel";
import { DashboardStatsSkeleton } from "@/shared/ui/loading";

const AdminDashboardPage = React.memo(
  ({
    user,
    navigateTo,
    isAuthenticated,
    fetchWithInterceptor,
    addNotification,
    audioFeedback,
    isTab = false,
  }: {
    user?: any;
    navigateTo: (path: string) => void;
    isAuthenticated: boolean;
    fetchWithInterceptor: (
      url: string,
      options?: RequestInit
    ) => Promise<Response>;
    addNotification?: any;
    audioFeedback?: any;
    isTab?: boolean;
  }) => {
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
          "/api/auth/admin/audit-logs?limit=8"
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
          "/api/auth/admin/db/query?table=platform_settings&limit=1"
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

    // Quick Actions
    const handleClearCache = async () => {
      setProcessingAction("cache");
      try {
        const res = await fetchWithInterceptor("/api/metrics/purge-cache", {
          method: "POST",
        });
        if (res.ok) {
          if (addNotification)
            addNotification(
              "System memory cache cleared successfully",
              "success"
            );
          fetchRecentAuditLogs();
        }
      } catch (err) {
        if (addNotification)
          addNotification("Failed to clear system cache", "error");
      } finally {
        setProcessingAction(null);
      }
    };

    const handleFlushTemp = async () => {
      if (
        !confirm(
          "Wipe all temporary audio tracks, scene segments, and draft exports?"
        )
      )
        return;
      setProcessingAction("flush");
      try {
        const res = await fetchWithInterceptor("/api/metrics/flush-temp", {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          if (addNotification)
            addNotification(
              data.message || "Temporary files purged successfully",
              "success"
            );
          fetchStats();
          fetchRecentAuditLogs();
        }
      } catch (err) {
        if (addNotification)
          addNotification("Failed to flush temporary files", "error");
      } finally {
        setProcessingAction(null);
      }
    };

    const handleEmergencyStop = async () => {
      if (
        !confirm(
          "CRITICAL WARNING: This will terminate all active FFmpeg render operations and AI pipeline tasks immediately. Continue?"
        )
      )
        return;
      setProcessingAction("stop");
      try {
        const res = await fetchWithInterceptor("/api/metrics/emergency-stop", {
          method: "POST",
        });
        if (res.ok) {
          if (addNotification)
            addNotification("Emergency compilation halt executed!", "warning");
          fetchStats();
          fetchRecentAuditLogs();
        }
      } catch (err) {
        if (addNotification)
          addNotification("Failed to execute emergency halt", "error");
      } finally {
        setProcessingAction(null);
      }
    };

    const handleExportLogs = async () => {
      try {
        const res = await fetchWithInterceptor(
          "/api/auth/admin/activity/export"
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
      } catch (err) {
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
          "/api/auth/admin/announcements",
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
      } catch (err) {
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
          `/api/auth/admin/impersonate/${userId}`,
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
      } catch (err) {
        if (addNotification)
          addNotification("Failed to impersonate user", "error");
      }
    };

    // Format ISO/SQLite date strings into a readable local date+time
    const formatDate = (raw: string | undefined | null): string => {
      if (!raw) return "—";
      try {
        const d = new Date(
          raw.includes("T") ? raw : raw.replace(" ", "T") + "Z"
        );
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return raw;
      }
    };

    // Filters and search logic
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

    // Custom SVG Multi-line Chart Renderer
    const signupChartData = analytics?.signups_chart || [];
    const projectChartData = analytics?.projects_chart || [];

    const renderedChart = useMemo(() => {
      if (signupChartData.length === 0 && projectChartData.length === 0) {
        return (
          <div className="h-[220px] flex items-center justify-center text-xs text-neutral-500 italic">
            Telemetry trend history is gathering...
          </div>
        );
      }

      // Max value for scaling
      const maxVal =
        Math.max(
          ...signupChartData.map((d: any) => d.count || 0),
          ...projectChartData.map((d: any) => d.count || 0),
          10 // default min height scale
        ) * 1.15;

      const chartWidth = 500;
      const chartHeight = 180;
      const padding = { left: 40, right: 20, top: 15, bottom: 25 };

      const getCoords = (data: any[]) => {
        if (data.length === 0) return [];
        const stepX =
          (chartWidth - padding.left - padding.right) /
          Math.max(data.length - 1, 1);
        return data.map((item, index) => {
          const x = padding.left + index * stepX;
          const y =
            chartHeight -
            padding.bottom -
            ((item.count || 0) / maxVal) *
              (chartHeight - padding.top - padding.bottom);
          return { x, y, value: item.count, label: item.date };
        });
      };

      const signupCoords = getCoords(signupChartData);
      const projectCoords = getCoords(projectChartData);

      const makePath = (coords: any[]) => {
        if (coords.length === 0) return "";
        return coords.reduce((acc, coord, idx) => {
          if (idx === 0) return `M ${coord.x} ${coord.y}`;
          // Smooth bezier curve control points
          const prev = coords[idx - 1];
          const cpX1 = prev.x + (coord.x - prev.x) / 3;
          const cpY1 = prev.y;
          const cpX2 = prev.x + (2 * (coord.x - prev.x)) / 3;
          const cpY2 = coord.y;
          return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coord.x} ${coord.y}`;
        }, "");
      };

      const makeAreaPath = (coords: any[]) => {
        if (coords.length === 0) return "";
        const linePath = makePath(coords);
        return `${linePath} L ${coords[coords.length - 1].x} ${
          chartHeight - padding.bottom
        } L ${coords[0].x} ${chartHeight - padding.bottom} Z`;
      };

      const signupPath = makePath(signupCoords);
      const projectPath = makePath(projectCoords);
      const signupArea = makeAreaPath(signupCoords);
      const projectArea = makeAreaPath(projectCoords);

      return (
        <div className="relative w-full h-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full text-xs font-mono"
          >
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="projectGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
              const y =
                padding.top + p * (chartHeight - padding.top - padding.bottom);
              const gridVal = Math.round(maxVal * (1 - p));
              return (
                <g key={i} className="opacity-10">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="white"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="white"
                    className="text-[9px]"
                  >
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {/* Area gradients */}
            {signupArea && <path d={signupArea} fill="url(#signupGrad)" />}
            {projectArea && <path d={projectArea} fill="url(#projectGrad)" />}

            {/* Lines */}
            {signupPath && (
              <path
                d={signupPath}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
                className="drop-shadow-[0_2px_8px_rgba(167,139,250,0.4)]"
              />
            )}
            {projectPath && (
              <path
                d={projectPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                className="drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]"
              />
            )}

            {/* Dots & Labels */}
            {signupCoords.map((coord, idx) => (
              <g key={`signup-${idx}`} className="group/dot">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#0a0a0f"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="8"
                  fill="#a78bfa"
                  className="opacity-0 group-hover/dot:opacity-20 cursor-pointer animate-ping"
                />
              </g>
            ))}

            {projectCoords.map((coord, idx) => (
              <g key={`project-${idx}`} className="group/dot">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#0a0a0f"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="8"
                  fill="#3b82f6"
                  className="opacity-0 group-hover/dot:opacity-20 cursor-pointer animate-ping"
                />
              </g>
            ))}

            {/* X Axis Date labels */}
            {signupCoords.map((coord, idx) => {
              // Only draw 4 labels to avoid clustering
              if (idx % 2 !== 0 && idx !== signupCoords.length - 1) return null;
              const dateStr = coord.label.substring(5); // MM-DD
              return (
                <text
                  key={`label-${idx}`}
                  x={coord.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill="#737373"
                  className="text-[9px] font-bold"
                >
                  {dateStr}
                </text>
              );
            })}
          </svg>
          <div className="flex gap-4 items-center justify-center text-[10px] mt-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
              <span className="text-neutral-400 font-bold">New Creators</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-neutral-400 font-bold">New Chapter</span>
            </div>
          </div>
        </div>
      );
    }, [signupChartData, projectChartData]);

    const cpuLoad = stats.cpuPct || 0;
    const activeJobsCount = stats.activeJobs || 0;

    // Developer bypass screen if unauthorized
    const isUserAdmin =
      user?.creator_role === "admin" || user?.role === "admin";
    if (!isAuthenticated || (user && !isUserAdmin)) {
      return (
        <div className="fixed inset-0 z-50 w-full h-full bg-[#050507] flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-[#050507] to-[#050507] pointer-events-none" />
          <div className="relative z-10 max-w-md w-full bg-[#0a0a0e]/80 backdrop-blur-xl border border-rose-900/30 p-8 rounded-3xl shadow-2xl shadow-rose-900/20 text-center">
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
                  try {
                    const token =
                      localStorage.getItem("sonikoma_token") ||
                      sessionStorage.getItem("sonikoma_token");
                    const res = await fetch("/api/auth/profile", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ creator_role: "admin" }),
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
                className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold cursor-pointer"
              >
                🛡️ Self-Promote to Admin (Dev Bypass)
              </button>
            </div>
          </div>
        </div>
      );
    }

    const dashboardContent = (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 text-left text-[#E5E5E5] animate-fade-in">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          {/* Admin Header with Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#2F2F2F] pb-5">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-[#E5E5E5] tracking-tight leading-tight">
                Admin Console
              </h1>
              <p className="text-[#9CA3AF] text-xs mt-0.5">
                Monitor system health, database latency, active worker jobs, and user accounts
              </p>
            </div>

          {/* Header Right Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleClearCache}
              disabled={processingAction === "cache"}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold disabled:opacity-40"
            >
              <Wind className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>
                {processingAction === "cache" ? "Purging..." : "Purge Cache"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleFlushTemp}
              disabled={processingAction === "flush"}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Flush Temp</span>
            </button>

            <button
              type="button"
              onClick={refreshData}
              disabled={loadingStats}
              className="btn-primary flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`}
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
        {loadingStats ? (
          <DashboardStatsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all shadow-sm text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-16 h-16 text-[#3B82F6]" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
                  Total Creators
                </h3>
              </div>
              <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
                {stats.users?.toLocaleString() || "0"}
              </div>
              <p className="text-[10px] text-[#3B82F6] font-bold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active platform subscription tier</span>
              </p>
            </div>

            <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all shadow-sm text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FolderGit2 className="w-16 h-16 text-[#3B82F6]" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
                  Total Projects
                </h3>
              </div>
              <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
                {stats.projects?.toLocaleString() || "0"}
              </div>
              <p className="text-[10px] text-[#10B981] font-bold flex items-center gap-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Storyboards compiled</span>
              </p>
            </div>

            <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#10B981]/50 transition-all shadow-sm text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign className="w-16 h-16 text-[#10B981]" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#10B981]/10 rounded-xl text-[#10B981] border border-[#10B981]/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
                  Revenue MRR
                </h3>
              </div>
              <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
                ${(analytics?.mrr || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-[#10B981] font-bold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {analytics?.active_subscriptions || 0} active paying plans
                </span>
              </p>
            </div>

            <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all shadow-sm text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-16 h-16 text-[#3B82F6]" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
                  Pipeline Health
                </h3>
              </div>
              <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
                {analytics?.success_rate || 100}%
              </div>
              <p className="text-[10px] text-[#3B82F6] font-bold flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Process compilation rate</span>
              </p>
            </div>
          </div>
        )}

        {/* Core Analytics SVG Trends Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-extrabold text-[#E5E5E5] flex items-center gap-2 font-mono">
                  <TrendingUp className="w-4 h-4 text-[#3B82F6]" /> Platform
                  Signups & Project Activity
                </h3>
                <button
                  onClick={refreshData}
                  className="btn-secondary p-1.5 rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-full relative py-2">{renderedChart}</div>
            </div>
          </div>

          {/* Performance status & Telemetry details */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 flex flex-col justify-between shadow-sm text-left">
            <div>
              <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2 font-mono">
                <Server className="w-4 h-4 text-[#3B82F6]" /> Infrastructure
                Pulse
              </h3>
              <div className="space-y-4">
                {/* CPU Load bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-neutral-500 uppercase tracking-widest">
                      CPU LOAD
                    </span>
                    <span className="text-neutral-300">{cpuLoad}%</span>
                  </div>
                  <div className="w-full bg-[#040406] h-1.5 rounded-full overflow-hidden border border-neutral-900">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        cpuLoad > 80
                          ? "bg-rose-500"
                          : cpuLoad > 50
                          ? "bg-amber-500"
                          : "bg-[#3B82F6]"
                      }`}
                      style={{ width: `${cpuLoad}%` }}
                    />
                  </div>
                </div>

                {/* RAM usage bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-neutral-500 uppercase tracking-widest">
                      RSS MEMORY
                    </span>
                    <span className="text-neutral-300">
                      {stats.memory || "0MB"}
                    </span>
                  </div>
                  <div className="w-full bg-[#040406] h-1.5 rounded-full overflow-hidden border border-neutral-900">
                    <div
                      className="bg-[#3B82F6] h-full transition-all duration-1000"
                      style={{ width: `${Math.min(((parseFloat(stats.memory) || 0) / 512) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800/60 space-y-2 text-xs font-medium">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">System Uptime</span>
                    <span className="text-neutral-300 font-mono font-bold">
                      {stats.uptime || "Online"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Active Compiles</span>
                    <span className="text-[#3B82F6] font-mono font-bold">
                      {activeJobsCount} jobs in queue
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">DB Host Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                        dbStatus === "Healthy"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {dbStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">DB IO Latency</span>
                    <span className="text-blue-400 font-mono font-bold">
                      {stats.dbLatencyMs || 0}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel & Announcements Broadcaster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 lg:col-span-2 shadow-xl text-left">
            <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3B82F6]" /> Executive Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleClearCache}
                disabled={processingAction === "cache"}
                className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all text-left group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#3B82F6] transition-colors">
                    {processingAction === "cache"
                      ? "Clearing..."
                      : "Purge RAM Cache"}
                  </h4>
                  <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Force garbage collect and invalidate platform key caches.
                </p>
              </button>

              <button
                onClick={handleFlushTemp}
                disabled={processingAction === "flush"}
                className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all text-left group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#F59E0B] transition-colors">
                    {processingAction === "flush"
                      ? "Flushing..."
                      : "Flush Temporary Files"}
                  </h4>
                  <Wind className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#F59E0B]" />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Remove intermediate frame logs, cached audio slices, and
                  exports.
                </p>
              </button>

              <button
                onClick={handleExportLogs}
                className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#3B82F6] transition-colors">
                    Export Audit Log CSV
                  </h4>
                  <Download className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Download the complete security audit events history as a file.
                </p>
              </button>

              <button
                onClick={() => navigateTo("/admin/jobs")}
                className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#3B82F6] transition-colors">
                    Manage Background Jobs
                  </h4>
                  <Activity className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Monitor live tasks, cancel queued workers, and purge completed jobs.
                </p>
              </button>

              <button
                onClick={handleEmergencyStop}
                disabled={processingAction === "stop"}
                className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl hover:bg-[#EF4444]/10 hover:border-[#EF4444]/40 transition-all text-left group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[#EF4444] font-bold text-xs">
                    {processingAction === "stop"
                      ? "STOPPING..."
                      : "EMERGENCY SHUTDOWN"}
                  </h4>
                  <Flame className="w-3.5 h-3.5 text-[#EF4444]/70 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[10px] text-[#EF4444]/80 mt-1">
                  Halt and kill all active child process compilation routines.
                </p>
              </button>
            </div>
          </div>

          {/* Broadcast announcements */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 shadow-xl text-left">
            <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#3B82F6]" /> Push Broadcast
            </h3>
            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
              <input
                type="text"
                placeholder="Headline/Title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
              />
              <textarea
                placeholder="Announcement message..."
                rows={2}
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={announcementType}
                  onChange={(e: any) => setAnnouncementType(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="info">💡 Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="error">🚨 Alert</option>
                </select>
                <button
                  type="submit"
                  disabled={processingAction === "broadcast"}
                  className="btn-primary flex-1 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {processingAction === "broadcast"
                    ? "Broadcasting..."
                    : "Publish Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Audit Logs and Users Impersonation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Impersonation Table */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 flex flex-col justify-between shadow-xl text-left">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-extrabold text-[#E5E5E5] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3B82F6]" /> Creator
                  Switchboard
                </h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-[#121212] border border-[#2F2F2F] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] w-44"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {loadingUsers ? (
                  <div className="text-center py-6 text-xs text-[#6B7280] italic">
                    Fetching creators community...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#6B7280] italic">
                    No creators match search.
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-xl flex items-center justify-between group hover:border-[#3B82F6]/50 transition-all"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                        <div className="font-bold text-xs text-[#E5E5E5]">
                          {u.full_name || "Anonymous"}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono truncate">
                          {u.email}
                        </div>
                        <div className="text-[9px] text-[#6B7280] font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Joined {formatDate(u.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImpersonate(u.id)}
                        className="btn-secondary flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-[#3B82F6] hover:text-white border-[#3B82F6]/30 hover:bg-[#3B82F6]/10 rounded-lg"
                      >
                        Impersonate <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audit Logs list */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 flex flex-col justify-between shadow-xl text-left">
            <div>
              <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3B82F6]" /> Security
                Audit Events
              </h3>
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {recentLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#6B7280] italic">
                    No security audit events logs found.
                  </div>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-xl flex items-start justify-between text-xs hover:border-[#3B82F6]/40 transition-all gap-2"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="font-bold text-[#E5E5E5] text-xs">
                          {log.action}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF]">
                          {log.email || "System"} · {log.ip_address}
                        </div>
                        <div className="text-[9px] text-[#6B7280] font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 inline" />
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          log.status === "Success"
                            ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                            : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );

    return dashboardContent;
  }
);

export default AdminDashboardPage;
