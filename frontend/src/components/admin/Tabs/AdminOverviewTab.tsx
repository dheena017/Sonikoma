import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Server,
  FolderGit2,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Trash2,
  Download,
  AlertCircle,
  Wind,
  Database,
  DollarSign,
  Flame,
  CheckCircle2,
  HardDrive,
  RefreshCw,
} from "lucide-react";

export function AdminOverviewTab({
  stats,
  analytics,
  fetchWithInterceptor,
  addNotification,
  setActiveTab,
}: {
  stats: any;
  analytics?: any;
  fetchWithInterceptor: any;
  addNotification: any;
  setActiveTab: (tab: string) => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string>("Verifying...");
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentAuditLogs();
    verifyDatabaseConnection();
  }, []);

  const verifyDatabaseConnection = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/db/query?table=platform_settings&limit=1");
      if (res.ok) {
        setDbStatus("Healthy");
      } else {
        setDbStatus("Warning");
      }
    } catch {
      setDbStatus("Unreachable");
    }
  };

  const fetchRecentAuditLogs = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/audit-logs?limit=5");
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

  const handleClearCache = async () => {
    setProcessing("cache");
    try {
      const res = await fetchWithInterceptor("/api/metrics/purge-cache", {
        method: "POST",
      });
      if (res.ok) {
        addNotification("System cache cleared successfully", "success");
      }
    } catch (err) {
      addNotification("Failed to clear cache", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleFlushTemp = async () => {
    if (!confirm("Delete all temporary videos and exports?")) return;
    setProcessing("flush");
    try {
      const res = await fetchWithInterceptor("/api/metrics/flush-temp", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || "Temp files flushed", "success");
      }
    } catch (err) {
      addNotification("Failed to flush files", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm("Are you sure? This will kill ALL active processing tasks."))
      return;
    setProcessing("stop");
    try {
      const res = await fetchWithInterceptor("/api/metrics/emergency-stop", {
        method: "POST",
      });
      if (res.ok) {
        addNotification("Emergency stop executed", "warning");
      }
    } catch (err) {
      addNotification("Failed to execute emergency stop", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleExportLogs = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/activity/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString()}.csv`;
        a.click();
        addNotification("Audit logs exported", "success");
      }
    } catch (err) {
      addNotification("Failed to export logs", "error");
    }
  };

  const cpuLoad = stats.cpuPct || 0;
  const memoryUsageText = stats.memory || "0MB";
  const activeCompilesCount = stats.activeJobs || 0;

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Dynamic Alerts Banner */}
      {cpuLoad > 80 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 animate-bounce" />
          <div className="text-xs">
            <span className="font-bold">System Warning:</span> High CPU load detected ({cpuLoad}%). Core computational pipelines may experience latency.
          </div>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div 
          onClick={() => setActiveTab("users")}
          className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/50 hover:bg-[#15151b] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Total Creators</h3>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {stats.users?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active subscriber community</span>
          </div>
        </div>

        {/* Projects Card */}
        <div 
          onClick={() => setActiveTab("content")}
          className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/50 hover:bg-[#15151b] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderGit2 className="w-16 h-16 text-blue-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Total Projects</h3>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {stats.projects?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Content registry growing</span>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div 
          onClick={() => setActiveTab("finance")}
          className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 hover:bg-[#15151b] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Monthly Revenue</h3>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            ${(analytics?.mrr || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>{(analytics?.active_subscriptions || 0)} active paying plans</span>
          </div>
        </div>

        {/* Pipeline Success Rate */}
        <div 
          onClick={() => setActiveTab("analytics")}
          className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/50 hover:bg-[#15151b] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Pipeline Success</h3>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {analytics?.success_rate || 100}%
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Compiles output verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Administrative Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("announcements")}
              className="p-4 border border-neutral-800 rounded-xl hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left group"
            >
              <h4 className="text-neutral-200 font-bold group-hover:text-purple-400 transition-colors">
                Broadcast Announcement
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Display a global banner notification to all active webtoon creators.
              </p>
            </button>
            <button
              onClick={handleExportLogs}
              className="p-4 border border-neutral-800 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-bold group-hover:text-blue-400 transition-colors">
                  Export Security Logs
                </h4>
                <Download className="w-3.5 h-3.5 text-neutral-600 group-hover:text-blue-400" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Download the complete administrative audit logs history as a CSV file.
              </p>
            </button>
            <button
              onClick={handleClearCache}
              disabled={processing === "cache"}
              className="p-4 border border-neutral-800 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-bold group-hover:text-emerald-400 transition-colors">
                  {processing === "cache" ? "Clearing..." : "Clear Platform Cache"}
                </h4>
                <Trash2 className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Force clear scraped sessions and image compression storage buffers.
              </p>
            </button>
            <button
              onClick={handleFlushTemp}
              disabled={processing === "flush"}
              className="p-4 border border-neutral-800 rounded-xl hover:border-rose-500 hover:bg-rose-500/5 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-bold group-hover:text-rose-400 transition-colors">
                  {processing === "flush" ? "Flushing..." : "Flush Temporary Files"}
                </h4>
                <Wind className="w-3.5 h-3.5 text-neutral-600 group-hover:text-rose-400" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Wipe cached video exports, intermediate voice logs, and audio segments.
              </p>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-800/60">
            <button
              onClick={handleEmergencyStop}
              disabled={processing === "stop"}
              className="w-full p-4 bg-rose-550/5 border border-rose-550/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-550/40 transition-all flex items-center justify-center gap-3 group"
            >
              <Flame className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-rose-500 font-extrabold text-sm">
                  {processing === "stop" ? "STOPPING PICTORIAL ENGINES..." : "EMERGENCY HALT COMPILING"}
                </div>
                <div className="text-[10px] text-rose-550/60 font-bold uppercase tracking-wider">
                  Kill all active background video rendering and TTS audio processes
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Server & Infrastructure Uptime */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Uptime & Resources</h3>
          <div className="space-y-4">
            {/* CPU Performance Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-500 uppercase tracking-widest font-bold">CPU Core Load</span>
                <span className="text-neutral-200">{cpuLoad}%</span>
              </div>
              <div className="w-full bg-[#0b0b0e] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    cpuLoad > 85 ? "bg-rose-500" : cpuLoad > 50 ? "bg-amber-500" : "bg-purple-500"
                  }`}
                  style={{ width: `${cpuLoad}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-500 uppercase tracking-widest font-bold">RSS Memory</span>
                <span className="text-neutral-200">{memoryUsageText}</span>
              </div>
              <div className="w-full bg-[#0b0b0e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-1000"
                  style={{ width: "45%" }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">System Uptime</span>
                <span className="text-neutral-200 font-mono font-semibold">{stats.uptime || "Online"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Active Compiles</span>
                <span className="text-purple-400 font-mono font-bold">{activeCompilesCount} jobs in queue</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">DB Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                  dbStatus === "Healthy" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>{dbStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Infrastructure Pulse and Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infrastructure Pulse */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Infrastructure Pulse</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-200 uppercase tracking-tight">
                    Main DB Latency
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Atomic read/write operations
                  </div>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-blue-400">
                {stats.dbLatencyMs}ms
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-200 uppercase tracking-tight">
                    System Reliability
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Average success across pipeline
                  </div>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-purple-400">
                99.8%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" /> Recent Actions
              </h3>
              <button
                onClick={() => setActiveTab("activity")}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs italic">
                  No administrative actions logged yet.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#0b0b0e] border border-neutral-800/80 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-neutral-200">{log.action}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Admin: {log.email || "System"} | IP: {log.ip_address}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        log.status === "Success"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
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
  );
}
