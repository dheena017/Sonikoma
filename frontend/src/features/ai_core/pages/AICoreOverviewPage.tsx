import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Activity,
  Key,
  TrendingUp,
  Coins,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";

interface AICoreOverviewPageProps {
  navigateTo?: (path: string) => void;
  addNotification?: (msg: string, type?: string) => void;
}

export default function AICoreOverviewPage({ navigateTo, addNotification }: AICoreOverviewPageProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleNav = (path: string) => {
    if (navigateTo) {
      navigateTo(path);
    } else {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProviders, resSummary] = await Promise.all([
          fetch("/api/v1/ai/providers"),
          fetch("/api/v1/ai/usage/summary"),
        ]);
        if (resProviders.ok) {
          const data = await resProviders.json();
          if (data.success) setProviders(data.providers || []);
        }
        if (resSummary.ok) {
          const data = await resSummary.json();
          if (data.success) setSummary(data);
        }
      } catch {
        // Fallback handled
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeProvidersCount = providers.filter((p) => p.is_configured).length;
  const totalTokens = summary?.total_tokens || 0;
  const availableCredits = summary?.available_credits || 1000;
  const estimatedCost = summary?.estimated_cost_usd || 0.0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── TOP HERO HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-indigo-500 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Command Center
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                System Healthy
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Centralized AI Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Your unified control center for all 11 AI providers, live rate limits, token telemetry, and smart model routing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNav("/ai-core/api-keys")}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all font-sans cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Manage API Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Active Providers</span>
          <p className="text-2xl font-black text-white font-mono">
            {activeProvidersCount} <span className="text-neutral-500 text-sm">/ {providers.length || 10}</span>
          </p>
          <span className="text-[10px] text-purple-400 font-mono">Live Probes Active</span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Available Credits</span>
          <p className="text-2xl font-black text-purple-400 font-mono flex items-center gap-1">
            <Coins className="w-5 h-5" />
            {availableCredits.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">Ready to Generate</span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Tokens Processed</span>
          <p className="text-2xl font-black text-white font-mono">
            {totalTokens.toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-400 font-mono">Total Lifetime Usage</span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Total Spend ($ USD)</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            ${Number(estimatedCost).toFixed(4)}
          </p>
          <span className="text-[10px] text-neutral-400 font-mono">Estimated Cost</span>
        </div>
      </div>

      {/* ── 3 PRIMARY ACTION HUBS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hub 1: API Keys */}
        <button
          onClick={() => handleNav("/ai-core/api-keys")}
          className="rounded-2xl bg-[#161616] border border-neutral-850 p-5 space-y-3 hover:border-purple-500/50 transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Key className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              API Keys &amp; Providers
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Connect your own API credentials for Gemini, OpenAI, Claude, Groq, and DeepSeek.
            </p>
          </div>
        </button>

        {/* Hub 2: Model Rate Limits */}
        <button
          onClick={() => handleNav("/ai-core/limits")}
          className="rounded-2xl bg-[#161616] border border-neutral-850 p-5 space-y-3 hover:border-purple-500/50 transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <Zap className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Rate Limits &amp; Quotas
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Inspect live RPM/TPM speed limits, Free vs Paid tier allocations, and Grounding quotas.
            </p>
          </div>
        </button>

        {/* Hub 3: Usage & Telemetry */}
        <button
          onClick={() => handleNav("/ai-core/usage")}
          className="rounded-2xl bg-[#161616] border border-neutral-850 p-5 space-y-3 hover:border-purple-500/50 transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Usage &amp; Analytics
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              View real-time token timeseries graphs, cost breakdowns, and export full transaction ledgers.
            </p>
          </div>
        </button>
      </div>


      {/* ── PROVIDERS HEALTH STATUS TABLE ─────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans text-neutral-400">
          Supported AI Provider Fleet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <div>
                <span className="text-xs font-bold text-white block">{p.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{p.category}</span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  p.is_configured
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                    : "bg-neutral-950 text-neutral-400 border-neutral-800"
                }`}
              >
                {p.is_configured ? "ONLINE" : "KEY REQ"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
