import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  PieChart,
  Zap,
  Activity,
  Calendar,
  Filter,
  FileText,
  Download,
  Tv,
} from "lucide-react";

interface AIAnalyticsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AIAnalyticsPage({ addNotification }: AIAnalyticsPageProps) {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "all">("7d");

  const loadAnalytics = async () => {
    try {
      const [sumRes, logsRes] = await Promise.all([
        fetch("/api/ai/analytics/summary"),
        fetch("/api/ai/analytics/logs?limit=30"),
      ]);

      if (sumRes.ok) {
        const json = await sumRes.json();
        setData(json);
      }
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setLogs(logsJson.logs || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setTimeout(() => {
      setIsRefreshing(false);
      addNotification?.("⚡ Real token telemetry re-synchronized!", "success");
    }, 400);
  };

  const handleExport = (format: "json" | "csv") => {
    window.open(`/api/ai/analytics/export?format=${format}`, "_blank");
    addNotification?.(`Downloading token ledger as ${format.toUpperCase()}...`, "info");
  };

  const totalTokens = data?.total_tokens ?? 0;
  const promptTokens = data?.total_prompt_tokens ?? 0;
  const completionTokens = data?.total_completion_tokens ?? 0;
  const avgLatency = data?.avg_latency_ms ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO HEADER BANNER (UNIFIED SUITE STYLE) ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Telemetry &amp; Accounting
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Live Database Ledger
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              AI Token Analytics &amp; Metering
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Real-time audit log of prompt in vs output out tokens, execution response latencies, and dollar cost distribution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Telemetry"}</span>
            </button>

            <button
              onClick={() => handleExport("csv")}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS METRIC RIBBON (4-CARD GRID) ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-purple-400 bg-purple-500/10 border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Total Volume</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">{Number(totalTokens).toLocaleString()}</div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Tokens Processed
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Across all active projects
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Prompt vs Output</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">
            {(promptTokens / (completionTokens || 1)).toFixed(1)} : 1
          </div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Prompt Ratio
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            {Number(promptTokens).toLocaleString()} In / {Number(completionTokens).toLocaleString()} Out
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Latency Avg</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">{avgLatency} ms</div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Response Speed
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Fast sub-second streaming
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-pink-400 bg-pink-500/10 border-pink-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Cost Accounting</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">
            ${Number(data?.estimated_cost_usd || 0).toFixed(4)}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Total Compute USD
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Direct API usage value
          </p>
        </div>
      </div>

      {/* ── TOKEN CONSUMPTION AUDIT TABLE ─────────────────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Granular Operation Ledger
            </h3>
            <span className="text-[10px] font-mono font-bold bg-neutral-950 px-2.5 py-0.5 rounded-full border border-neutral-800 text-neutral-400">
              {logs.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("json")}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-[11px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950/40">
                <th className="py-3 px-4">Feature / Task</th>
                <th className="py-3 px-4">Model Engine</th>
                <th className="py-3 px-4">Prompt In</th>
                <th className="py-3 px-4">Output Out</th>
                <th className="py-3 px-4">Total Tokens</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-850/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans">{log.feature}</td>
                  <td className="py-3 px-4 text-purple-300">{log.model}</td>
                  <td className="py-3 px-4 text-neutral-400">{log.prompt_tokens}</td>
                  <td className="py-3 px-4 text-neutral-400">{log.completion_tokens}</td>
                  <td className="py-3 px-4 font-bold text-purple-400">{log.total_tokens}</td>
                  <td className="py-3 px-4 text-neutral-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
