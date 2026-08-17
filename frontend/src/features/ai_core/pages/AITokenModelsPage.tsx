import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Key,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Calculator,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface AITokenModelsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AITokenModelsPage({ addNotification }: AITokenModelsPageProps) {
  const [modelsBreakdown, setModelsBreakdown] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Token Calculator
  const [calcModel, setCalcModel] = useState<string>("gemini-2.5-flash");
  const [calcPrompt, setCalcPrompt] = useState<string>("Write an epic 500-word battle script between the shadow monarch and the dragon knight.");
  const [calcExpectedOutput, setCalcExpectedOutput] = useState<number>(400);

  const loadData = async () => {
    try {
      const [breakdownRes, logsRes] = await Promise.all([
        fetch("/api/ai/tokens/models-breakdown"),
        fetch("/api/ai/analytics/logs?limit=15"),
      ]);

      if (breakdownRes.ok) {
        const data = await breakdownRes.json();
        setModelsBreakdown(data.models_breakdown || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData.logs || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      addNotification?.("⚡ Model & API Key token telemetry synchronized!", "success");
    }, 400);
  };

  // Calculator estimations
  const estimatedPromptTokens = Math.max(1, Math.round(calcPrompt.length / 4));
  const estimatedTotalTokens = estimatedPromptTokens + calcExpectedOutput;
  const selectedModelObj = modelsBreakdown.find((m) => m.id === calcModel) || {
    cost_per_1m_prompt: 0.075,
    cost_per_1m_completion: 0.30,
    name: "Gemini 2.5 Flash",
    provider_name: "Google Gemini",
  };

  const estimatedCostUSD = (
    (estimatedPromptTokens * (selectedModelObj.cost_per_1m_prompt || 0.075)) / 1_000_000 +
    (calcExpectedOutput * (selectedModelObj.cost_per_1m_completion || 0.30)) / 1_000_000
  ).toFixed(6);

  const totalTokensSum = modelsBreakdown.reduce((acc, m) => acc + (m.total_tokens_used || 0), 0);
  const totalCostSum = modelsBreakdown.reduce((acc, m) => acc + (m.total_cost_usd || 0), 0);
  const activeKeysCount = modelsBreakdown.filter((m) => m.api_key_configured).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO HEADER BANNER (UNIFIED SUITE STYLE) ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> AI Models &amp; API Key Telemetry
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Real-Time Quota Tracking
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Tokens by Model &amp; API Key
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Granular breakdown of tokens consumed per AI model under your personal connected API keys vs platform credits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Token Limits"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── METRIC STATS RIBBON ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-purple-400 bg-purple-500/10 border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Aggregated</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">{Number(totalTokensSum).toLocaleString()}</div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Total Tokens Tracked
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Across all active AI models
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <Key className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Zero-Credit Mode</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">{activeKeysCount} / {modelsBreakdown.length || 8}</div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            API Keys Configured
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Direct personal pass-through
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Primary Workhorse</span>
          </div>
          <div className="text-2xl font-black text-white font-sans truncate">
            {modelsBreakdown.find((m) => m.calls_count > 0)?.name || (activeKeysCount > 0 ? "Ready" : "Idle")}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Active Engine
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Direct quota pass-through
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl border text-pink-400 bg-pink-500/10 border-pink-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Cost Accounting</span>
          </div>
          <div className="text-2xl font-black text-white font-sans">${Number(totalCostSum).toFixed(4)}</div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Total Compute USD
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            Direct API usage value
          </p>
        </div>
      </div>

      {/* ── MODELS & API KEY QUOTA GRID ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white font-sans tracking-tight">
            AI Models &amp; Rate Limit Status by API Key
          </h3>
          <span className="text-[10px] font-mono text-neutral-500">
            {modelsBreakdown.length} Models Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelsBreakdown.map((model) => (
            <div
              key={model.id}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all space-y-4 flex flex-col justify-between shadow-md"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-sans">{model.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-purple-300 font-bold">
                        {model.provider_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {model.category}
                    </p>
                  </div>

                  {model.api_key_configured ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Key Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono font-bold">
                      Platform Tier
                    </span>
                  )}
                </div>

                {/* Quota Limits & Progress */}
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Tokens Per Minute Limit:</span>
                    <span className="text-white font-bold">{Number(model.limit_tpm).toLocaleString()} TPM</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Requests Per Minute Limit:</span>
                    <span className="text-white font-bold">{model.limit_rpm} RPM</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Pricing / 1M Prompt:</span>
                    <span className="text-purple-300">${model.cost_per_1m_prompt}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                      <span>Usage</span>
                      <span>{Number(model.total_tokens_used || 0).toLocaleString()} / {Number(model.limit_tpm).toLocaleString()} tok ({model.quota_percent_used || 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.max(0, model.quota_percent_used || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Granular Token Counts */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 block">Prompt In</span>
                    <span className="text-neutral-300 font-bold">{Number(model.prompt_tokens_used || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 block">Output Out</span>
                    <span className="text-neutral-300 font-bold">{Number(model.completion_tokens_used || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 block">Avg Latency</span>
                    <span className="text-emerald-400 font-bold">{model.calls_count > 0 ? `${model.avg_latency_ms}ms` : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE INTERACTIVE TOKEN & COST CALCULATOR ───────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Live Model Token &amp; Cost Estimator
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Instant Math</span>
          </div>

          <select
            value={calcModel}
            onChange={(e) => setCalcModel(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-mono focus:outline-none cursor-pointer"
          >
            {modelsBreakdown.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider_name})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-400 uppercase font-bold">
              Prompt Input Text ({calcPrompt.length} characters)
            </label>
            <textarea
              value={calcPrompt}
              onChange={(e) => setCalcPrompt(e.target.value)}
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/80 rounded-xl p-3 text-xs text-neutral-200 font-mono focus:outline-none transition-all placeholder:text-neutral-600 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-0.5">
              <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">Estimated Prompt</span>
              <div className="text-xl font-black text-white font-sans">{estimatedPromptTokens} tok</div>
              <span className="text-[10px] text-neutral-400 font-mono">~4 chars / token</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-0.5">
              <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">Expected Output</span>
              <div className="text-xl font-black text-white font-sans">{calcExpectedOutput} tok</div>
              <span className="text-[10px] text-neutral-400 font-mono">~300 words</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-0.5">
              <span className="text-[10px] text-purple-400 font-mono uppercase font-bold">Estimated API Cost</span>
              <div className="text-xl font-black text-emerald-400 font-sans">${estimatedCostUSD}</div>
              <span className="text-[10px] text-neutral-400 font-mono">Free with custom API key</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL DATES TOKEN OPERATIONS TABLE ─────────────────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Live Token Operations &amp; Real Timestamps
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {recentLogs.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950/40">
                <th className="py-3 px-4">Feature / Action</th>
                <th className="py-3 px-4">AI Model Engine</th>
                <th className="py-3 px-4">Prompt In</th>
                <th className="py-3 px-4">Output Out</th>
                <th className="py-3 px-4">Total Tokens</th>
                <th className="py-3 px-4">Cost (USD)</th>
                <th className="py-3 px-4">Real Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/60">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-850/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white font-sans">{log.feature}</td>
                    <td className="py-3 px-4 text-purple-300">{log.model}</td>
                    <td className="py-3 px-4 text-neutral-400">{log.prompt_tokens}</td>
                    <td className="py-3 px-4 text-neutral-400">{log.completion_tokens}</td>
                    <td className="py-3 px-4 font-bold text-purple-400">{log.total_tokens}</td>
                    <td className="py-3 px-4 text-emerald-400">${Number(log.cost_estimate_usd || 0).toFixed(6)}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-500 text-xs">
                    No token operations recorded yet. Start by generating panel narration, translations, or YouTube SEO!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
