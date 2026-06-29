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
  Wind,
  Database,
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
      const res = await fetchWithInterceptor(
        "/api/metrics/emergency-stop",
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
        {/* Quick Actions */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick System Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("announcements")}
              className="p-4 border border-neutral-800 rounded-lg hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left group"
            >
              <h4 className="text-neutral-200 font-medium group-hover:text-purple-400 transition-colors">
                Broadcast
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Global alert to all users
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
              <p className="text-[11px] text-neutral-500 mt-1">
                Download audit logs as CSV
              </p>
            </button>
            <button
              onClick={handleClearCache}
              disabled={processing === "cache"}
              className="p-4 border border-neutral-800 rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-medium group-hover:text-emerald-400 transition-colors">
                  {processing === "cache" ? "Clearing..." : "Clear Cache"}
                </h4>
                <Trash2 className="w-3 h-3 text-neutral-600 group-hover:text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Reset system LRU memory
              </p>
            </button>
            <button
              onClick={handleFlushTemp}
              disabled={processing === "flush"}
              className="p-4 border border-neutral-800 rounded-lg hover:border-rose-500 hover:bg-rose-500/5 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-neutral-200 font-medium group-hover:text-rose-400 transition-colors">
                   {processing === "flush" ? "Flushing..." : "Flush Storage"}
                </h4>
                <Wind className="w-3 h-3 text-neutral-600 group-hover:text-rose-400" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Wipe temp exports & assets
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

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-4">Infrastructure Pulse</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Database className="w-4 h-4" /></div>
                    <div>
                       <div className="text-xs font-bold text-neutral-200 uppercase tracking-tight">Main DB Latency</div>
                       <div className="text-[10px] text-neutral-500">Atomic read/write operations</div>
                    </div>
                 </div>
                 <div className="text-lg font-mono font-bold text-blue-400">{stats.dbLatencyMs}ms</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Activity className="w-4 h-4" /></div>
                    <div>
                       <div className="text-xs font-bold text-neutral-200 uppercase tracking-tight">System Reliability</div>
                       <div className="text-[10px] text-neutral-500">Average success across pipeline</div>
                    </div>
                 </div>
                 <div className="text-lg font-mono font-bold text-purple-400">99.8%</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
