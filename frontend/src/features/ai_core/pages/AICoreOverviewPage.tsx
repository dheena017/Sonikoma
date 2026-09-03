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
  DollarSign,
} from "lucide-react";
import { DashboardStatsSkeleton, Skeleton } from "@/shared/ui/loading";

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
    <div className="flex-1 w-full max-w-7xl mx-auto animate-in fade-in duration-200 text-left">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* ── TOP HERO HEADER BANNER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F] relative z-10">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight font-sans">
              AI Command{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]">
                Center
              </span>
            </h1>
            <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
              Unified control center for AI providers, live rate limits, token telemetry, and smart model routing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNav("/ai-core/api-keys")}
              className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md border border-[#3B82F6]/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Key className="w-4 h-4" />
              <span>Manage API Keys</span>
            </button>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        {isLoading ? (
          <DashboardStatsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-4 hover:border-[#3B82F6]/50 transition-all group">
              <div className="p-3.5 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shrink-0 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-[#E5E5E5] font-mono leading-none">
                  {activeProvidersCount} <span className="text-[#6B7280] text-sm font-normal">/ {providers.length || 10}</span>
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
                  Active Providers
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-4 hover:border-[#10B981]/50 transition-all group">
              <div className="p-3.5 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-[#E5E5E5] font-mono leading-none">
                  {availableCredits.toLocaleString()}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
                  Available Credits
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-4 hover:border-[#3B82F6]/50 transition-all group">
              <div className="p-3.5 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-[#E5E5E5] font-mono leading-none">
                  {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
                  Total Tokens
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-4 hover:border-[#F59E0B]/50 transition-all group">
              <div className="p-3.5 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-[#E5E5E5] font-mono leading-none">
                  ${estimatedCost.toFixed(3)}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
                  Est. Spend (USD)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── QUICK ACCESS MODULES ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => handleNav("/ai-core/routing")}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/50 hover:bg-[#242424] transition-all cursor-pointer flex flex-col justify-between group shadow-md"
          >
            <div>
              <div className="p-3 w-fit rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#E5E5E5] group-hover:text-[#3B82F6] transition-colors">
                Smart Model Routing
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Configure primary, fallback, and tertiary models across all 11 storyboard, OCR, translation, and TTS tasks.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold font-mono text-[#3B82F6] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Configure Routing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => handleNav("/ai-core/usage")}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#10B981]/50 hover:bg-[#242424] transition-all cursor-pointer flex flex-col justify-between group shadow-md"
          >
            <div>
              <div className="p-3 w-fit rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 mb-4 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#E5E5E5] group-hover:text-[#10B981] transition-colors">
                Usage Analytics
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Inspect real-time token consumption, cost breakdown per model, and task-by-task generation logs.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold font-mono text-[#10B981] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => handleNav("/ai-core/rate-limits")}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/50 hover:bg-[#242424] transition-all cursor-pointer flex flex-col justify-between group shadow-md"
          >
            <div>
              <div className="p-3 w-fit rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#E5E5E5] group-hover:text-[#3B82F6] transition-colors">
                Rate Limits & Quotas
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">
                Live monitoring of RPM (requests per minute) and TPM (tokens per minute) limits across active providers.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold font-mono text-[#3B82F6] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Check Limits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* ── PROVIDERS ROSTER ── */}
        <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#E5E5E5] uppercase tracking-wider font-mono">
                Integrated AI Providers
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Current status and configuration health of connected AI services.
              </p>
            </div>
            <button
              onClick={() => handleNav("/ai-core/api-keys")}
              className="text-xs font-mono font-bold text-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              Manage All Keys →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F]">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-2.5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))
            ) : (
              providers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all"
                >
                  <div>
                    <span className="text-xs font-bold text-[#E5E5E5] block">{p.name}</span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">{p.category}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      p.is_configured
                        ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                        : "bg-[#1E1E1E] text-[#6B7280] border-[#2F2F2F]"
                    }`}
                  >
                    {p.is_configured ? "ONLINE" : "KEY REQ"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
