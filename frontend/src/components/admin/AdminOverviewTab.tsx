import React, { useState } from "react";
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
} from "lucide-react";

export function AdminOverviewTab({
  stats,
  fetchWithInterceptor,
  addNotification,
  setActiveTab,
}: {
  stats: any;
  fetchWithInterceptor: any;
  addNotification: any;
  setActiveTab: (tab: string) => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleClearCache = async () => {
    setProcessing("cache");
    try {
      const res = await fetchWithInterceptor("/api/health/metrics/purge-cache", {
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

  const handleEmergencyStop = async () => {
    if (!confirm("Are you sure? This will kill ALL active processing tasks."))
      return;
    setProcessing("stop");
    try {
      const res = await fetchWithInterceptor(
        "/api/health/metrics/emergency-stop",
        { method: "POST" }
      );
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

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Total Users</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.users?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Active Platform</span>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderGit2 className="w-16 h-16 text-blue-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Total Projects</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.projects?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Growth consistent</span>
          </div>
        </div>

        {/* Server Uptime Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">System Uptime</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1 truncate">
            {stats.uptime || "Online"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>All systems operational</span>
          </div>
        </div>

        {/* Resource Usage Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Resource Usage</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.cpuPct || "0"}% CPU
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <span>Memory: {stats.memory || "0MB"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity Feed */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Platform Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 text-neutral-300">
                System health check passed.
              </div>
              <div className="text-neutral-600">Just now</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="flex-1 text-neutral-300">
                Database synchronization complete.
              </div>
              <div className="text-neutral-600">12 mins ago</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="flex-1 text-neutral-300">
                New administrative login detected.
              </div>
              <div className="text-neutral-600">1 hour ago</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("announcements")}
              className="p-4 border border-neutral-800 rounded-lg hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left group"
            >
              <h4 className="text-neutral-200 font-medium group-hover:text-purple-400 transition-colors">
                Broadcast Message
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Send a global alert to all users
              </p>
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className="p-4 border border-neutral-800 rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
            >
              <h4 className="text-neutral-200 font-medium group-hover:text-emerald-400 transition-colors">
                Run Health Check
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Diagnose services and database
              </p>
            </button>
            <button
              onClick={handleExportLogs}
              className="p-4 border border-neutral-800 rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-medium group-hover:text-blue-400 transition-colors">
                  Export Logs
                </h4>
                <Download className="w-3 h-3 text-neutral-600 group-hover:text-blue-400" />
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Download recent audit logs as CSV
              </p>
            </button>
            <button
              onClick={handleClearCache}
              disabled={processing === "cache"}
              className="p-4 border border-neutral-800 rounded-lg hover:border-rose-500 hover:bg-rose-500/5 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-medium group-hover:text-rose-400 transition-colors">
                  {processing === "cache" ? "Clearing..." : "Clear Cache"}
                </h4>
                <Trash2 className="w-3 h-3 text-neutral-600 group-hover:text-rose-400" />
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Reset system memory cache
              </p>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-800/50">
            <button
              onClick={handleEmergencyStop}
              disabled={processing === "stop"}
              className="w-full p-4 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center justify-center gap-3 group"
            >
              <AlertCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-red-500 font-bold text-sm">
                  {processing === "stop" ? "STOPPING..." : "EMERGENCY STOP"}
                </div>
                <div className="text-[10px] text-red-500/60 font-medium uppercase tracking-wider">
                  Kill all active background processes
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
