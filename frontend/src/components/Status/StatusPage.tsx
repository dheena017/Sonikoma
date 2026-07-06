import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Cpu,
  Database,
  Award,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Video,
  Zap,
  Terminal,
  Trash2,
  Download,
} from "lucide-react";
import * as api from "../../api/index.js";

interface StatusPageProps {
  onNavigateHome: () => void;
  fetchWithInterceptor?: any;
  setSelectedModel?: (model: string) => void;
}

const StatusPage = React.memo(
  ({
    onNavigateHome,
    fetchWithInterceptor,
    setSelectedModel: setGlobalSelectedModel,
  }: StatusPageProps) => {
    const [loading, setLoading] = useState(false);
    const [healthData, setHealthData] = useState<any>(null);
    const [metricsData, setMetricsData] = useState<any>(null);
    const [ffmpegData, setFfmpegData] = useState<any>(null);
    const [online, setOnline] = useState<boolean | null>(null);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    const [isPurging, setIsPurging] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [purgeResult, setPurgeResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const [isStopping, setIsStopping] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [stopResult, setStopResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    // Live Logs state
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
      const container = document.getElementById("main-scroll-container");
      if (showPurgeModal || showStopModal) {
        document.body.style.overflow = "hidden";
        if (container) container.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
      };
    }, [showPurgeModal, showStopModal]);

    const activeFetch = fetchWithInterceptor || fetch;

    const executePurgeCache = async () => {
      setIsPurging(true);
      setPurgeResult(null);
      try {
        const data = await api.purgeCache(activeFetch);
        if (data) {
          setPurgeResult({
            success: true,
            message: "LRU Caches successfully purged!",
          });
          fetchDiagnostics(); // Refresh metrics
        } else {
          setPurgeResult({
            success: false,
            message: "Failed to purge caches.",
          });
        }
      } catch (err) {
        console.error(err);
        setPurgeResult({ success: false, message: "Error purging cache." });
      } finally {
        setIsPurging(false);
      }
    };

    const handlePurgeCacheClick = () => {
      setShowPurgeModal(true);
      setPurgeResult(null);
    };

    const executeEmergencyStop = async () => {
      setIsStopping(true);
      setStopResult(null);
      try {
        const data = await api.emergencyStop(activeFetch);
        if (data && data.success !== false) {
          setStopResult({
            success: true,
            message: data.message || "Background processes terminated.",
          });
        } else {
          setStopResult({
            success: false,
            message:
              data.detail || data.error || "Failed to execute emergency stop.",
          });
        }
      } catch (err) {
        console.error(err);
        setStopResult({
          success: false,
          message: "Error communicating with backend.",
        });
      } finally {
        setIsStopping(false);
      }
    };

    const handleEmergencyStopClick = () => {
      setShowStopModal(true);
      setStopResult(null);
    };

    const handleDownloadLogs = () => {
      if (logs.length === 0) return;
      const text = logs
        .map(
          (l) =>
            `[${new Date(l.timestamp * 1000).toISOString()}] [${
              l.level?.toUpperCase() || "INFO"
            }] ${l.message}`
        )
        .join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sonikoma-syslogs-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const fetchDiagnostics = useCallback(async () => {
      setLoading(true);
      try {
        // 1. Fetch Health Probe
        const healthJson = await api.checkHealth();

        // 2. Fetch Performance Metrics
        const metricsJson = await api.getMetrics();

        // 3. Fetch FFmpeg Diagnostics
        let ffmpegJson = null;
        try {
          ffmpegJson = await api.checkFfmpeg();
        } catch (e) {
          console.warn("FFmpeg check failed", e);
        }

        if (healthJson && metricsJson) {
          setHealthData(healthJson);
          setMetricsData(metricsJson);
          setFfmpegData(ffmpegJson);
          setOnline(true);
        } else {
          setOnline(false);
        }
      } catch (err) {
        console.error("[Diagnostics] Fetch failed:", err);
        setOnline(false);
      } finally {
        setLoading(false);
        setLastChecked(new Date().toLocaleTimeString());
      }
    }, [activeFetch]);

    useEffect(() => {
      fetchDiagnostics();
      // Auto-refresh metrics every 15 seconds
      const interval = setInterval(fetchDiagnostics, 15000);
      return () => clearInterval(interval);
    }, [fetchDiagnostics]);

    // Live Logs SSE Connection
    useEffect(() => {
      let eventSource: EventSource | null = null;

      if (typeof window !== "undefined" && "EventSource" in window) {
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");
        const url = token
          ? `/api/system-logs/stream?token=${encodeURIComponent(token)}`
          : "/api/system-logs/stream";
        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            const newLog = JSON.parse(event.data);
            setLogs((prev) => {
              // Keep the latest 50 logs
              const updated = [...prev, newLog];
              return updated.slice(Math.max(updated.length - 50, 0));
            });
          } catch (e) {
            // ignore parsing errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
        };
      }

      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    }, []);

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
        {/* Breadcrumb & Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Diagnostics Status</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--emerald animate-pulse">
                <Activity className="h-5 w-5" />
              </div>
              Computational Node Diagnostics
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Real-time CPU/memory statistics, external API status, and backend
              capability probes
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading ? "animate-spin text-purple-400" : ""
                }`}
              />
              Refresh Diagnostics
            </button>
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Main Grid: Server Status & Core Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Status, Memory, DB, API Keys */}
          <div className="lg:col-span-7 space-y-6">
            {/* Uptime and Server Connection Card */}
            <div
              className={`p-6 rounded-3xl border shadow-xl transition-all duration-300 ${
                online === true
                  ? "border-emerald-500/20 bg-emerald-950/5 shadow-emerald-950/5"
                  : online === false
                  ? "border-rose-500/20 bg-rose-950/5 shadow-rose-950/5"
                  : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-mono">
                    Computational Service Status
                  </p>
                  <h3
                    className={`text-2xl font-bold font-sans mt-1.5 tracking-tight ${
                      online === true
                        ? "text-emerald-400"
                        : online === false
                        ? "text-rose-450"
                        : "text-neutral-400"
                    }`}
                  >
                    {online === true
                      ? "ACTIVE / ONLINE"
                      : online === false
                      ? "OFFLINE / DISCONNECTED"
                      : "VERIFYING..."}
                  </h3>
                </div>
                {lastChecked && (
                  <div className="text-right font-mono text-[10px] text-neutral-500">
                    <p>LAST CHECK</p>
                    <p className="text-neutral-300 mt-1">{lastChecked}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-950/50 border border-neutral-850 p-4 rounded-2xl">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Uptime
                  </span>
                  <span className="text-xs font-semibold text-white mt-1.5 block font-mono">
                    {healthData?.uptime ?? metricsData?.server?.uptime ?? "—"}
                  </span>
                </div>
                <div className="bg-neutral-950/50 border border-neutral-850 p-4 rounded-2xl">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Platform Host
                  </span>
                  <span className="text-xs font-semibold text-white mt-1.5 block font-mono truncate">
                    {healthData?.platform ??
                      metricsData?.server?.platform ??
                      "—"}
                  </span>
                </div>
                <div className="bg-neutral-950/50 border border-neutral-850 p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Python Core
                  </span>
                  <span className="text-xs font-semibold text-white mt-1.5 block font-mono">
                    v
                    {healthData?.python ??
                      metricsData?.server?.pythonVersion ??
                      "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance: CPU & Memory Usage */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Cpu className="h-4 w-4 text-purple-400" />
                Node Memory Allocation
              </h3>

              <div className="space-y-4">
                {/* Memory Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">
                      Process Memory Usage (RSS)
                    </span>
                    <span className="text-white font-semibold">
                      {metricsData?.memory?.rssMB
                        ? `${metricsData.memory.rssMB} MB`
                        : "—"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                      style={{
                        width:
                          metricsData?.memory?.rssMB &&
                          metricsData?.memory?.systemTotalMB
                            ? `${Math.min(
                                100,
                                (metricsData.memory.rssMB /
                                  metricsData.memory.systemTotalMB) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>
                      System Capacity:{" "}
                      {metricsData?.memory?.systemTotalMB
                        ? `${metricsData.memory.systemTotalMB} MB`
                        : "—"}
                    </span>
                    <span>
                      Usage: {metricsData?.memory?.systemUsedPct ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      CPU Load
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        {metricsData?.memory?.cpuPct ?? 0}%
                      </span>
                      <span className="text-[9px] text-neutral-500">
                        ({metricsData?.memory?.cpuCores || 1} Cores)
                      </span>
                    </div>
                  </div>

                  {metricsData?.database && (
                    <div className="flex flex-col gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="h-3 w-3" /> Database Stats
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-neutral-500">
                            Users
                          </span>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            {metricsData.database.users || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-neutral-500">
                            Projects
                          </span>
                          <span className="text-xs text-blue-400 font-mono font-bold">
                            {metricsData.database.projects || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-neutral-500">
                            Scenes
                          </span>
                          <span className="text-xs text-purple-400 font-mono font-bold">
                            {metricsData.database.scenes || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-neutral-500">
                            Active Jobs
                          </span>
                          <span className="text-xs text-amber-400 font-mono font-bold">
                            {metricsData.database.activeJobs || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Storage capacity Widget */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <HardDrive className="h-4 w-4 text-purple-400" />
                File System Storage
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Cache Storage Used</span>
                  <span className="text-white font-semibold">
                    {metricsData?.storage?.usedBytes !== undefined
                      ? `${(
                          metricsData.storage.usedBytes /
                          1024 /
                          1024
                        ).toFixed(2)} MB`
                      : "—"}
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                    style={{
                      width:
                        metricsData?.storage?.usedBytes &&
                        metricsData?.storage?.limitBytes
                          ? `${Math.min(
                              100,
                              (metricsData.storage.usedBytes /
                                metricsData.storage.limitBytes) *
                                100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>
                    Quota Limit:{" "}
                    {metricsData?.storage?.limitBytes
                      ? `${(
                          metricsData.storage.limitBytes /
                          1024 /
                          1024 /
                          1024
                        ).toFixed(2)} GB`
                      : "—"}
                  </span>
                  <span>
                    {metricsData?.storage?.usedBytes &&
                    metricsData?.storage?.limitBytes
                      ? `${(
                          (metricsData.storage.usedBytes /
                            metricsData.storage.limitBytes) *
                          100
                        ).toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Info Card */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Database className="h-4 w-4 text-purple-400" />
                Database Connector Matrix
              </h3>

              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    ACTIVE SOURCE
                  </span>
                  <span className="text-sm font-bold text-white mt-1.5 block">
                    {healthData?.db_type ?? "SQLite (local)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      healthData?.database === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-xs font-mono text-neutral-300 font-semibold uppercase">
                    {healthData?.database === "connected"
                      ? "CONNECTED"
                      : "WARNING / OFFLINE"}
                  </span>
                </div>
              </div>

              {healthData?.db_stats && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-850 font-mono text-xs">
                  <div className="bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-850">
                    <span className="text-[9px] text-neutral-500 block uppercase">
                      TOTAL STORIES
                    </span>
                    <span className="text-xs font-bold text-neutral-300 block mt-1">
                      {healthData.db_stats.stories ?? 0}
                    </span>
                  </div>
                  <div className="bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-850">
                    <span className="text-[9px] text-neutral-500 block uppercase">
                      TOTAL STORYBOARDS
                    </span>
                    <span className="text-xs font-bold text-neutral-300 block mt-1">
                      {healthData.db_stats.storyboards ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Server Cache Efficiency */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  LRU Response Cache Metrics
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePurgeCacheClick}
                    disabled={isPurging}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-400 border border-neutral-500/20 rounded-xl text-[10px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Force purge all disk and memory caches"
                  >
                    <Trash2 className="h-3 w-3" />
                    Purge
                  </button>
                  <button
                    onClick={handleEmergencyStopClick}
                    disabled={isStopping}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Kill all background renders and image processing"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    EMERGENCY STOP
                  </button>
                </div>
              </div>
              {metricsData?.cache &&
              Object.keys(metricsData.cache).length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {Object.entries(metricsData.cache).map(
                    ([cacheName, stats]: any) => {
                      const total = stats.hits + stats.misses;
                      const hitRate =
                        total > 0 ? ((stats.hits / total) * 100).toFixed(1) : 0;
                      return (
                        <div
                          key={cacheName}
                          className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850"
                        >
                          <span
                            className="text-[10px] text-neutral-500 uppercase block mb-2 truncate"
                            title={cacheName}
                          >
                            {cacheName.split(".").pop()}
                          </span>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-neutral-400">Hits</span>
                            <span className="text-emerald-400 font-bold">
                              {stats.hits}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-neutral-400">Misses</span>
                            <span className="text-rose-400 font-bold">
                              {stats.misses}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-neutral-800 mt-2">
                            <span className="text-[9px] text-neutral-500 uppercase">
                              Size
                            </span>
                            <span className="text-cyan-400 font-bold">
                              {stats.size}/{stats.maxSize || "∞"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-neutral-500 font-mono">
                  No active caches detected.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Capabilities & Security keys */}
          <div className="lg:col-span-5 space-y-6">
            {/* Capabilities Grid */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Award className="h-4 w-4 text-purple-400" />
                Vision Engine Capabilities
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono">
                Checks if necessary compilation binary libraries are imported
                successfully
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {healthData?.capabilities ? (
                  Object.entries(healthData.capabilities).map(([mod, ok]) => (
                    <div
                      key={mod}
                      className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs ${
                        ok
                          ? "border-emerald-500/10 bg-emerald-950/10 text-emerald-350"
                          : "border-rose-500/10 bg-rose-950/10 text-rose-350"
                      }`}
                    >
                      <span className="font-semibold">{mod}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase select-none bg-black/40 border border-white/5">
                        {ok ? "YES" : "NO"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-6 text-xs text-neutral-500 font-mono">
                    Loading capability probes...
                  </div>
                )}
              </div>
            </div>

            {/* FFmpeg Video Engine Status */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Video className="h-4 w-4 text-purple-400" />
                Rendering Engine (FFmpeg)
              </h3>

              {ffmpegData ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                    <span className="text-neutral-400">CLI Access</span>
                    <span className="flex items-center gap-1 text-emerald-450 font-bold text-[10px]">
                      <ShieldCheck className="h-3.5 w-3.5" /> READY
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                    <span className="text-neutral-500 text-[9px] uppercase block mb-1">
                      Version Header
                    </span>
                    <span className="text-cyan-400 font-bold break-all">
                      {ffmpegData.version || "Unknown"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-950/10 text-rose-350 text-xs font-mono text-center">
                  FFmpeg executable not found or errored. Video rendering will
                  fail!
                </div>
              )}
            </div>

            {/* API Credentials Check */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                API Environment Keys
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                  <span>GEMINI_API_KEY</span>
                  {healthData?.env?.GEMINI_API_KEY ? (
                    <span className="flex items-center gap-1 text-emerald-450 font-bold text-[10px]">
                      <ShieldCheck className="h-3.5 w-3.5" /> DETECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-455 font-bold text-[10px]">
                      <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />{" "}
                      MISSING
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                  <span>HUGGINGFACE_API_KEY</span>
                  {healthData?.env?.HUGGINGFACE_API_KEY ? (
                    <span className="flex items-center gap-1 text-emerald-450 font-bold text-[10px]">
                      <ShieldCheck className="h-3.5 w-3.5" /> DETECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500 font-bold text-[10px]">
                      <ShieldAlert className="h-3.5 w-3.5" /> MISSING
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                  <span>OPENAI_API_KEY</span>
                  {healthData?.env?.OPENAI_API_KEY ? (
                    <span className="flex items-center gap-1 text-emerald-450 font-bold text-[10px]">
                      <ShieldCheck className="h-3.5 w-3.5" /> DETECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500 font-bold text-[10px]">
                      <ShieldAlert className="h-3.5 w-3.5" /> MISSING
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                  <span>ANTHROPIC_API_KEY</span>
                  {healthData?.env?.ANTHROPIC_API_KEY ? (
                    <span className="flex items-center gap-1 text-emerald-450 font-bold text-[10px]">
                      <ShieldCheck className="h-3.5 w-3.5" /> DETECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500 font-bold text-[10px]">
                      <ShieldAlert className="h-3.5 w-3.5" /> MISSING
                    </span>
                  )}
                </div>

                <p className="text-[9px] text-neutral-500 leading-3.5">
                  Note: A missing Gemini API Key disables the smart timeline
                  generation. Missing Hugging Face, OpenAI, or Anthropic keys
                  disable optional models and benchmarks for those providers.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Full-Width: Live Terminal Widget */}
          <div className="lg:col-span-12 mt-6">
            <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  Live Backend Console
                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                    Live Stream
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogs([])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-[10px] font-mono transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                  <button
                    onClick={handleDownloadLogs}
                    disabled={logs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/30"
                  >
                    <Download className="h-3 w-3" /> Export Logs
                  </button>
                </div>
              </div>

              <div className="bg-black border border-neutral-800 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-[10px] sm:text-xs">
                {logs.length === 0 ? (
                  <div className="text-neutral-600 flex items-center justify-center h-full animate-pulse">
                    Waiting for backend output...
                  </div>
                ) : (
                  <div className="space-y-1.5 flex flex-col justify-end min-h-full">
                    {logs.map((log, idx) => {
                      const isErr = log.level?.toUpperCase() === "ERROR";
                      const isWarn = log.level?.toUpperCase() === "WARNING";

                      return (
                        <div
                          key={idx}
                          className="flex gap-3 hover:bg-white/5 p-1 -mx-1 rounded"
                        >
                          <span className="text-neutral-600 shrink-0 select-none">
                            {new Date(log.timestamp * 1000).toLocaleTimeString(
                              [],
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }
                            )}
                          </span>
                          <span
                            className={`shrink-0 font-bold w-12 ${
                              isErr
                                ? "text-rose-500"
                                : isWarn
                                ? "text-amber-400"
                                : "text-emerald-500"
                            }`}
                          >
                            {log.level?.toUpperCase() || "INFO"}
                          </span>
                          <span
                            className={`break-all ${
                              isErr
                                ? "text-rose-200"
                                : isWarn
                                ? "text-amber-200"
                                : "text-neutral-300"
                            }`}
                          >
                            {log.message}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showPurgeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-rose-950/20 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Trash2 className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Purge System Caches?
                </h3>
              </div>

              {!purgeResult ? (
                <>
                  <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                    Are you sure you want to forcibly clear all memory and disk
                    caches? This will free up space but may slow down initial
                    re-renders.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowPurgeModal(false)}
                      className="px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executePurgeCache}
                      disabled={isPurging}
                      className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                      {isPurging ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {isPurging ? "Purging..." : "Confirm Purge"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    {purgeResult.success ? (
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                        <ShieldAlert className="h-6 w-6 text-rose-400" />
                      </div>
                    )}
                    <p
                      className={`text-sm font-bold text-center mb-6 ${
                        purgeResult.success
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {purgeResult.message}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPurgeModal(false)}
                      className="px-4 py-2 w-full text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showStopModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-rose-950/20 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  EMERGENCY STOP
                </h3>
              </div>

              {!stopResult ? (
                <>
                  <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                    Are you sure you want to forcibly terminate all running
                    background renders, FFmpeg processes, and AI operations? Any
                    in-progress jobs will be marked as failed.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowStopModal(false)}
                      className="px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeEmergencyStop}
                      disabled={isStopping}
                      className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-red-900/50"
                    >
                      {isStopping ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                      {isStopping ? "Terminating..." : "KILL PROCESSES"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    {stopResult.success ? (
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                        <ShieldAlert className="h-6 w-6 text-rose-400" />
                      </div>
                    )}
                    <p
                      className={`text-sm font-bold text-center mb-6 ${
                        stopResult.success
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {stopResult.message}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowStopModal(false)}
                      className="px-4 py-2 w-full text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default StatusPage;
