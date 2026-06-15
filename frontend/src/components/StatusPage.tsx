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
} from "lucide-react";

interface StatusPageProps {
  onNavigateHome: () => void;
  fetchWithInterceptor?: any;
}

export default function StatusPage({
  onNavigateHome,
  fetchWithInterceptor,
}: StatusPageProps) {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const activeFetch = fetchWithInterceptor || fetch;

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Health Probe
      const healthRes = await activeFetch("/api/health");
      const healthJson = await healthRes.json();

      // 2. Fetch Performance Metrics
      const metricsRes = await activeFetch("/api/metrics");
      const metricsJson = await metricsRes.json();

      if (healthJson && metricsJson) {
        setHealthData(healthJson);
        setMetricsData(metricsJson);
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
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-emerald-450 animate-pulse" />
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
        {/* Left Column: Live Status, Memory, DB */}
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
                  {healthData?.platform ?? metricsData?.server?.platform ?? "—"}
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
                  <span className="flex items-center gap-1 text-rose-450 font-bold text-[10px]">
                    <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />{" "}
                    MISSING
                  </span>
                )}
              </div>
              <p className="text-[9px] text-neutral-500 leading-3.5">
                Note: A missing Gemini API Key disables AI-driven storyboard
                generation and defaults image crop actions to the local OpenCV
                bounding-box slicer engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
