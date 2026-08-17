import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Key,
  BarChart3,
  CreditCard,
  Workflow,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Cpu,
  ArrowRight,
  Activity,
  Layers,
  Tv,
  FolderOpen,
  FolderSync,
  Radio,
  Play,
  Film,
  Globe,
  Mic,
  Youtube,
  Lock,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

interface AICoreDashboardPageProps {
  navigateTo: (path: string) => void;
  addNotification?: (msg: string, type?: string) => void;
  user?: any;
}

export default function AICoreDashboardPage({
  navigateTo,
  addNotification,
  user,
}: AICoreDashboardPageProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinging, setIsPinging] = useState(false);

  const { activeProjectId, activeProjectData, setDrawerOpen } = useProjectStore();
  const activeProject = activeProjectData?.project || null;
  const activePanels = activeProjectData?.panels || [];

  const loadData = async () => {
    try {
      const [provRes, analRes, logsRes] = await Promise.all([
        fetch("/api/ai/providers"),
        fetch("/api/ai/analytics/summary"),
        fetch("/api/ai/analytics/logs?limit=6"),
      ]);

      if (provRes.ok) {
        const pData = await provRes.json();
        setProviders(pData.providers || []);
      }
      if (analRes.ok) {
        const aData = await analRes.json();
        setAnalytics(aData);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setRecentLogs(lData.logs || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGlobalPing = async () => {
    setIsPinging(true);
    try {
      await fetch("/api/ai/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini" }),
      });
      await loadData();
      addNotification?.("⚡ AI Engine latency checks updated!", "success");
    } finally {
      setIsPinging(false);
    }
  };

  // 1. Stats Ribbon (Strictly Real Data)
  const totalAudioSeconds = activePanels.reduce(
    (acc: number, p: any) => acc + (p.duration || 0),
    0
  );

  const statsRibbon = [
    {
      label: "Audio Compiled",
      value: totalAudioSeconds > 0 ? `${totalAudioSeconds.toFixed(1)}s` : "0.0s",
      desc: "Soundtrack & Voice tracks",
      icon: Mic,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Tokens Processed",
      value: analytics?.total_tokens !== undefined ? Number(analytics.total_tokens).toLocaleString() : "0",
      desc: `${Number(analytics?.total_prompt_tokens || 0).toLocaleString()} In / ${Number(analytics?.total_completion_tokens || 0).toLocaleString()} Out`,
      icon: Cpu,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Engines Online",
      value: `${providers.filter((p) => p.is_configured).length} / ${providers.length || 9} Active`,
      desc: "Multi-tier failover ready",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Wallet Balance",
      value: `${Number(analytics?.available_credits ?? user?.credits ?? 0).toLocaleString()}`,
      desc: "Available credits",
      icon: Zap,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
  ];

  // 2. Tools
  const aiTools = [
    {
      id: "api_keys",
      label: "API Keys & Provider Vault",
      desc: "Configure keys for Google Gemini, OpenAI GPT-4o, Claude 3.5, ElevenLabs, Groq, DeepSeek, and SD.",
      icon: Key,
      path: "/ai-core/api-keys",
      badge: "Engines",
    },
    {
      id: "models_routing",
      label: "Model Routing & Fallbacks",
      desc: "Set primary engines per task (Vision, Narration, SEO, Voice) and configure automated failover chains.",
      icon: Workflow,
      path: "/ai-core/models",
      badge: "Router",
    },
    {
      id: "analytics",
      label: "AI Analytics & Telemetry",
      desc: "Inspect real-time token volume, prompt/output ratios, cost distribution, and latency benchmarks.",
      icon: BarChart3,
      path: "/ai-core/analytics",
      badge: "Telemetry",
    },
    {
      id: "billing",
      label: "Billing & Credit Wallet",
      desc: "View transparent tool consumption rates, credit ledger transactions, and top up wallet credits.",
      icon: CreditCard,
      path: "/ai-core/billing",
      badge: "Billing",
    },
    {
      id: "safety_quotas",
      label: "Safety & Quota Limits",
      desc: "Enforce requests-per-minute (RPM) throttles, daily spend caps, and Content ID copyright filters.",
      icon: ShieldCheck,
      path: "/ai-core/safety-quotas",
      badge: "Governance",
    },
    {
      id: "model_benchmarks",
      label: "Parallel Benchmarking Lab",
      desc: "Execute live concurrent latency tests across all active providers to detect the fastest engine.",
      icon: Activity,
      path: "/ai-core/models",
      badge: "Labs",
    },
  ];

  const recentActivities = [
    {
      time: "2 mins ago",
      text: "Synthesized text-to-speech dialogue for chapter 3 panel #5",
    },
    {
      time: "15 mins ago",
      text: "Translated Solo Leveling script to Portuguese (Brazil)",
    },
    {
      time: "1 hour ago",
      text: "Generated high-CTR YouTube thumbnail concept with Gemini 2.5 Flash",
    },
    {
      time: "3 hours ago",
      text: "Executed parallel latency benchmark across 8 neural models",
    },
  ];

  return (
    <div className="flex-1 w-full space-y-6 animate-fade-in text-left">
      {/* ── WELCOME HERO PANEL (MATCHING CREATIVE SUITE HERO) ───────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-neutral-900/60 to-neutral-950/70 backdrop-blur-md p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
          <Sparkles className="w-36 h-36 text-purple-400" />
        </div>

        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 font-bold uppercase tracking-wider rounded-full font-mono mb-3 inline-block">
            AI CORE MULTI-ENGINE HUB
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Welcome to the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              AI Core Studio
            </span>
          </h1>
          <p className="text-neutral-300 mt-2 text-xs leading-relaxed font-mono">
            Fine-tune visual boundaries, compose orchestral backings, cast AI
            narrators, translate speech dialogues, and evaluate engagement
            ratings in a single location.
          </p>
        </div>
      </div>

      {/* ── STATISTICS RIBBON (4-CARD FLOATING ROW) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsRibbon.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Telemetry
                </span>
              </div>
              <div className="text-2xl font-black text-white font-sans">{stat.value}</div>
              <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
                {stat.label}
              </div>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── MAIN GRID: 2 COLS TOOLS (LEFT 2/3) & ACTIVE STATUS (RIGHT 1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Tools Grid (2 cols width) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono pl-1">
            Creative AI Tools Launcher
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <div
                  key={tool.id}
                  onClick={() => navigateTo(tool.path)}
                  className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 rounded-2xl p-5 hover:bg-neutral-850 hover:border-purple-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-all">
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded text-neutral-400 uppercase border border-neutral-800">
                        {tool.badge}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors font-sans">
                      {tool.label}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed font-mono">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-850 flex justify-end">
                    <button className="text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all">
                      <span>Launch Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Context & Activity Logs (1 col width) */}
        <div className="space-y-6">
          {/* Active Context Card */}
          <div className="relative bg-neutral-900/60 backdrop-blur-md border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Tv className="w-4 h-4" /> Active Context
                </h3>
                <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                  Active
                </span>
              </div>

              {activeProjectId && activeProject ? (
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    {activeProject?.cover_image ? (
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-neutral-800 shadow-inner shrink-0">
                        <img
                          src={activeProject.cover_image}
                          className="w-full h-full object-cover"
                          alt={activeProject.title}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-20 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 text-xs font-bold font-mono shrink-0">
                        Cover
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="text-base font-extrabold text-white truncate font-sans">
                          {activeProject.title || "Untitled Series"}
                        </h4>
                      </div>

                      <p className="text-xs text-purple-300 truncate mt-0.5 font-mono">
                        {activeProject.episode || "Default Episode"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                          <span className="text-purple-300 font-bold">{activePanels.length}</span>
                          <span className="text-neutral-400">panels</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-mono rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>Switch Project</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 py-3 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-xs mx-auto">
                    No active project is selected. Choose a project from the Projects page to ground AI generations.
                  </p>
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium font-sans shadow-md shadow-purple-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Choose Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Activity Logs Card */}
          <div className="relative bg-neutral-900/60 backdrop-blur-md border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Live AI Operations
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">
                {recentLogs.length} Records
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {recentLogs.length > 0 ? (
                recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-purple-400 shrink-0">●</span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-neutral-300 leading-snug truncate font-bold">{log.feature}</p>
                        <span className="text-purple-400 font-bold">{log.total_tokens} tok</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>{log.model}</span>
                        <span>
                          {new Date(log.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs font-mono text-neutral-500">
                  No AI operations recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
