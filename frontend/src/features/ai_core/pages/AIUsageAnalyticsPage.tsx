import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  Activity,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
  Coins,
  Cpu,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { DashboardStatsSkeleton } from "@/shared/ui/loading";

interface AIUsageAnalyticsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AIUsageAnalyticsPage({ addNotification }: AIUsageAnalyticsPageProps) {
  const [timeframe, setTimeframe] = useState<string>("24h");
  const [selectedModel, setSelectedModel] = useState<string>("All Models");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [timeseriesData, setTimeseriesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [resSummary, resMetrics] = await Promise.all([
        fetch(`/api/v1/ai/usage/summary?timeframe=${timeframe}`),
        fetch(`/api/v1/ai/usage/metrics?time_range=${timeframe}&model=${encodeURIComponent(selectedModel)}`),
      ]);

      if (resSummary.ok) {
        const sum = await resSummary.json();
        setSummaryData(sum);
      }

      if (resMetrics.ok) {
        const met = await resMetrics.json();
        setTimeseriesData(met);
      }
    } catch {
      // Fallback handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, selectedModel]);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/v1/ai/usage/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sonikoma_ai_usage_${timeframe}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification?.(`Exported usage data as ${format.toUpperCase()}`, "success");
      }
    } catch {
      addNotification?.("Failed to export usage data", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = summaryData?.kpis || {
    total_requests: summaryData?.total_requests || 0,
    total_tokens: summaryData?.total_tokens || 0,
    prompt_tokens: summaryData?.total_prompt_tokens || 0,
    completion_tokens: summaryData?.total_completion_tokens || 0,
    total_cost_usd: summaryData?.estimated_cost_usd || 0.0,
    available_credits: summaryData?.available_credits || 1000,
    avg_latency_ms: summaryData?.avg_latency_ms || 240,
    success_rate_percent: summaryData?.success_rate_percent || 100,
  };

  const timestamps = timeseriesData?.timestamps || ["12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  const inputTokens = timeseriesData?.input_tokens || [120, 340, 890, 450, 1100, 750];
  const outputTokens = timeseriesData?.output_tokens || [40, 90, 220, 110, 310, 190];

  const maxVal = Math.max(...inputTokens, ...outputTokens, 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
            AI Token{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Usage &amp; Spending
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
            Track token consumption, response latencies, estimated costs in USD, and credit burn rates across all features.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Timeframe Selector */}
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              {["24h", "7d", "30d", "all"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-all cursor-pointer ${
                    timeframe === tf
                      ? "bg-purple-600 text-white font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3 h-3 text-purple-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Download JSON"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

      {/* ── KPI METRICS CARDS ─────────────────────────────────────────────── */}
      {isLoading ? (
        <DashboardStatsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Total Tokens</span>
            <p className="text-2xl font-black text-white font-mono">
              {kpis.total_tokens?.toLocaleString() || 0}
            </p>
            <span className="text-[10px] text-purple-400 font-mono">
              {kpis.prompt_tokens?.toLocaleString() || 0} in / {kpis.completion_tokens?.toLocaleString() || 0} out
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Total Spend ($ USD)</span>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              ${Number(kpis.total_cost_usd || 0).toFixed(4)}
            </p>
            <span className="text-[10px] text-neutral-400 font-mono">Estimated API usage cost</span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Available Credits</span>
            <p className="text-2xl font-black text-purple-400 font-mono flex items-center gap-1">
              <Coins className="w-5 h-5" />
              {kpis.available_credits?.toLocaleString() || 1000}
            </p>
            <span className="text-[10px] text-emerald-400 font-mono">Wallet Active</span>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Success Rate / Latency</span>
            <p className="text-2xl font-black text-white font-mono">
              {kpis.success_rate_percent}%
            </p>
            <span className="text-[10px] text-neutral-400 font-mono">Avg {kpis.avg_latency_ms}ms</span>
          </div>
        </div>
      )}

      {/* ── VISUAL TIMESERIES CHART ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white font-sans">Token Volume Over Time</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Input Tokens
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Output Tokens
            </span>
          </div>
        </div>

        {/* Dynamic Bar / Timeseries Graph */}
        <div className="h-48 flex items-end gap-3 pt-6 pb-2 border-b border-neutral-800">
          {timestamps.map((ts: string, idx: number) => {
            const inTok = inputTokens[idx] || 0;
            const outTok = outputTokens[idx] || 0;
            const inH = Math.max(8, Math.round((inTok / maxVal) * 100));
            const outH = Math.max(8, Math.round((outTok / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full max-w-[28px] flex items-end gap-1 h-full justify-center">
                  <div
                    className="w-1/2 bg-purple-600 rounded-t group-hover:bg-purple-400 transition-all duration-300"
                    style={{ height: `${inH}%` }}
                    title={`Input: ${inTok} tokens`}
                  />
                  <div
                    className="w-1/2 bg-indigo-600 rounded-t group-hover:bg-indigo-400 transition-all duration-300"
                    style={{ height: `${outH}%` }}
                    title={`Output: ${outTok} tokens`}
                  />
                </div>
                <span className="text-[9px] font-mono text-neutral-400">{ts}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BREAKDOWNS (PROVIDER & FEATURE) ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider Breakdown */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3">
          <h3 className="text-xs font-bold text-white font-sans uppercase tracking-wider text-neutral-400">
            Provider Breakdown
          </h3>
          <div className="space-y-2">
            {(summaryData?.provider_breakdown || [
              { provider: "gemini", provider_name: "Google Gemini", requests: 14, total_tokens: 18400, cost_usd: 0.0028 },
              { provider: "groq", provider_name: "Groq LPU", requests: 6, total_tokens: 4200, cost_usd: 0.0004 },
            ]).map((p: any) => (
              <div key={p.provider} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold text-white">{p.provider_name}</span>
                </div>
                <div className="text-right text-xs font-mono">
                  <span className="text-white font-bold block">{p.total_tokens?.toLocaleString()} tok</span>
                  <span className="text-[10px] text-neutral-400">${Number(p.cost_usd || 0).toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Breakdown */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3">
          <h3 className="text-xs font-bold text-white font-sans uppercase tracking-wider text-neutral-400">
            Feature Breakdown
          </h3>
          <div className="space-y-2">
            {(summaryData?.features_breakdown || [
              { feature: "Storyboard Narrative", calls: 8, tokens: 12000, percentage: 65 },
              { feature: "Scraper Blueprint", calls: 4, tokens: 4500, percentage: 25 },
              { feature: "Prompt Enhancement", calls: 2, tokens: 1900, percentage: 10 },
            ]).map((f: any) => (
              <div key={f.feature} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white block">{f.feature}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{f.calls} calls</span>
                </div>
                <div className="text-right text-xs font-mono">
                  <span className="text-purple-400 font-bold block">{f.tokens?.toLocaleString()} tok</span>
                  <span className="text-[10px] text-neutral-400">{f.percentage}% share</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
