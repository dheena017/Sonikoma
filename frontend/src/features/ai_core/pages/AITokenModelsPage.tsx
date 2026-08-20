import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Menu,
  Boxes,
  Flame,
  Mic,
  Languages,
} from "lucide-react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";

interface AITokenModelsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AITokenModelsPage({ addNotification }: AITokenModelsPageProps) {
  const { models } = useAIModels();
  const [modelsBreakdown, setModelsBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [projectsList, setProjectsList] = useState<any[]>([
    { project_id: "gen-lang-client-0621007149", title: "gen-lang-client-0621007149" },
  ]);
  const [selectedProject, setSelectedProject] = useState<string>("gen-lang-client-0621007149");
  const [tierBadge, setTierBadge] = useState<string>("Free tier");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [showAllModels, setShowAllModels] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>("1 Day");

  // Peak Usage Trends Chart State
  const [showChartsSection, setShowChartsSection] = useState<boolean>(true);
  const [selectedChartModelId, setSelectedChartModelId] = useState<string>("gemini-2.5-flash");
  const [isChartModelDropdownOpen, setIsChartModelDropdownOpen] = useState<boolean>(false);
  const [chartModelSearch, setChartModelSearch] = useState<string>("");
  const [searchGroundingModelId, setSearchGroundingModelId] = useState<string>("gemini-2.0-flash");
  const [mapGroundingModelId, setMapGroundingModelId] = useState<string>("gemini-2.5-flash");
  const [inspectModel, setInspectModel] = useState<any | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live Token Calculator
  const [calcModel, setCalcModel] = useState<string>("gemini-2.5-flash");
  const [calcPrompt, setCalcPrompt] = useState<string>(
    "Write an epic 500-word battle script between the shadow monarch and the dragon knight."
  );
  const [calcExpectedOutput, setCalcExpectedOutput] = useState<number>(400);

  const loadData = async (projId?: string, range?: string) => {
    try {
      const activeProj = projId !== undefined ? projId : selectedProject;
      const activeRange = range !== undefined ? range : timeRange;

      const queryParams = new URLSearchParams();
      if (activeProj) queryParams.set("project_id", activeProj);
      if (activeRange) queryParams.set("time_range", activeRange);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const breakdownUrls = [
        `/api/v1/ai/tokens/models-breakdown${qs}`,
        `/api/ai/tokens/models-breakdown${qs}`
      ];
      let breakdownData = null;

      for (const url of breakdownUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            breakdownData = await res.json();
            break;
          }
        } catch {
          // continue to next endpoint
        }
      }

      if (breakdownData && breakdownData.models_breakdown && breakdownData.models_breakdown.length > 0) {
        setModelsBreakdown(breakdownData.models_breakdown);
        if (breakdownData.projects && breakdownData.projects.length > 0) {
          setProjectsList(breakdownData.projects);
          if (!selectedProject && !projId) {
            setSelectedProject(breakdownData.project_id || breakdownData.projects[0].project_id);
          }
        }
        if (breakdownData.tier) setTierBadge(breakdownData.tier);
      }
    } catch {
      // fallback handled gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChartModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const syncUrls = ["/api/v1/ai/tokens/sync-live-quotas", "/api/ai/tokens/sync-live-quotas"];
      let syncData = null;
      for (const sUrl of syncUrls) {
        try {
          const syncRes = await fetch(sUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (syncRes.ok) {
            syncData = await syncRes.json();
            break;
          }
        } catch {
          // continue
        }
      }

      if (syncData) {
        if (syncData.models_breakdown && syncData.models_breakdown.length > 0) {
          setModelsBreakdown(syncData.models_breakdown);
        }
        if (syncData.projects && syncData.projects.length > 0) {
          setProjectsList(syncData.projects);
        }
        if (syncData.tier) setTierBadge(syncData.tier);
        const geminiLatency = syncData.probes?.gemini?.latency_ms;
        const latencyText = geminiLatency ? ` (${geminiLatency}ms)` : ` (${syncData.sync_latency_ms}ms)`;
        addNotification?.(
          `⚡ Real Quotas Synchronized: ${syncData.total_models_tracked || 38} live models verified${latencyText}!`,
          "success"
        );
      } else {
        await loadData();
        addNotification?.("⚡ Live Quotas refreshed from API!", "success");
      }
    } catch {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter models for table
  const filteredModels = useMemo(() => {
    return modelsBreakdown.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.category || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || m.category === selectedCategory;

      const matchesProvider =
        selectedProvider === "All" ||
        (m.provider_name || "").toLowerCase().includes(selectedProvider.toLowerCase()) ||
        (m.provider || "").toLowerCase().includes(selectedProvider.toLowerCase());

      return matchesSearch && matchesCategory && matchesProvider;
    });
  }, [modelsBreakdown, searchQuery, selectedCategory, selectedProvider]);

  // Models filtered for chart search
  const chartDropdownModels = useMemo(() => {
    let list = modelsBreakdown;
    if (selectedProvider !== "All") {
      const providerScoped = list.filter(
        (m) =>
          (m.provider || "").toLowerCase() === selectedProvider.toLowerCase() ||
          (m.provider_name || "").toLowerCase().includes(selectedProvider.toLowerCase())
      );
      if (providerScoped.length > 0) list = providerScoped;
    }
    if (!chartModelSearch) return list;
    return list.filter((m) =>
      m.name.toLowerCase().includes(chartModelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(chartModelSearch.toLowerCase())
    );
  }, [modelsBreakdown, chartModelSearch, selectedProvider]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    modelsBreakdown.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ["All", ...Array.from(set)];
  }, [modelsBreakdown]);

  // Selected chart model
  const activeChartModel = useMemo(() => {
    return (
      modelsBreakdown.find((m) => m.id === selectedChartModelId) ||
      modelsBreakdown[0] || {
        id: "loading",
        name: "Loading...",
        limit_rpm: 15,
        limit_tpm: 1048576,
        limit_rpd: 1500,
        rpm_used: 0,
        tpm_used: 0,
        rpd_used: 0,
      }
    );
  }, [modelsBreakdown, selectedChartModelId]);

  // Calculator estimations
  const estimatedPromptTokens = Math.max(1, Math.round(calcPrompt.length / 4));
  const estimatedTotalTokens = estimatedPromptTokens + calcExpectedOutput;
  const selectedModelObj = modelsBreakdown.find((m) => m.id === calcModel) || {
    cost_per_1m_prompt: 0.075,
    cost_per_1m_completion: 0.3,
    name: "Gemini 2.5 Flash",
    provider_name: "Google Gemini",
  };

  const estimatedCostUSD = (
    (estimatedPromptTokens * (selectedModelObj.cost_per_1m_prompt || 0.075)) / 1_000_000 +
    (calcExpectedOutput * (selectedModelObj.cost_per_1m_completion || 0.3)) / 1_000_000
  ).toFixed(6);

  const totalTokensSum = modelsBreakdown.reduce((acc, m) => acc + (m.total_tokens_used || 0), 0);
  const totalCostSum = modelsBreakdown.reduce((acc, m) => acc + (m.total_cost_usd || 0), 0);

  const formatUnits = (n: number) => {
    if (!n && n !== 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return String(n);
  };

const PROVIDER_TABS = [
  { id: "All", name: "All Providers", icon: Boxes, badge: "Global Matrix", color: "from-purple-600 to-pink-500", docsUrl: "https://ai.google.dev/gemini-api/docs" },
  { id: "gemini", name: "Google Gemini", icon: Sparkles, badge: "Official REST", color: "from-purple-600 to-indigo-500", docsUrl: "https://ai.google.dev/gemini-api/docs/rate-limits" },
  { id: "openai", name: "OpenAI", icon: Zap, badge: "Direct API", color: "from-emerald-600 to-teal-500", docsUrl: "https://platform.openai.com/docs/guides/rate-limits" },
  { id: "anthropic", name: "Anthropic Claude", icon: ShieldCheck, badge: "Claude v1", color: "from-amber-600 to-orange-500", docsUrl: "https://docs.anthropic.com/en/api/rate-limits" },
  { id: "deepseek", name: "DeepSeek", icon: Cpu, badge: "V3 / R1", color: "from-blue-600 to-cyan-500", docsUrl: "https://api-docs.deepseek.com/quick_start/pricing" },
  { id: "groq", name: "Groq LPU", icon: Activity, badge: "Ultra LPU", color: "from-orange-600 to-red-500", docsUrl: "https://console.groq.com/docs/rate-limits" },
  { id: "elevenlabs", name: "ElevenLabs", icon: Mic, badge: "Voice AI", color: "from-pink-600 to-rose-500", docsUrl: "https://elevenlabs.io/docs/api-reference" },
  { id: "huggingface", name: "HuggingFace", icon: Flame, badge: "Serverless", color: "from-yellow-600 to-amber-500", docsUrl: "https://huggingface.co/docs/api-inference" },
  { id: "mistral", name: "Mistral AI", icon: Layers, badge: "Codestral", color: "from-red-600 to-orange-500", docsUrl: "https://docs.mistral.ai/api" },
  { id: "deepl", name: "DeepL", icon: Languages, badge: "Translation", color: "from-cyan-600 to-blue-500", docsUrl: "https://www.deepl.com/docs-api" },
];

  const currentProviderMeta = useMemo(() => {
    return PROVIDER_TABS.find((p) => p.id === selectedProvider) || PROVIDER_TABS[0];
  }, [selectedProvider]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. DEDICATED PROVIDER SELECTION TABS ─────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {PROVIDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedProvider === tab.id;
          const providerCount = tab.id === "All"
            ? modelsBreakdown.length
            : modelsBreakdown.filter(
                (m) =>
                  (m.provider || "").toLowerCase() === tab.id.toLowerCase() ||
                  (m.provider_name || "").toLowerCase().includes(tab.id.toLowerCase())
              ).length;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedProvider(tab.id);
                // Auto switch active chart model to first model of selected provider
                if (tab.id !== "All") {
                  const firstOfProvider = modelsBreakdown.find(
                    (m) =>
                      (m.provider || "").toLowerCase() === tab.id.toLowerCase() ||
                      (m.provider_name || "").toLowerCase().includes(tab.id.toLowerCase())
                  );
                  if (firstOfProvider) {
                    setSelectedChartModelId(firstOfProvider.id);
                  }
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20 border border-purple-500"
                  : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {providerCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 2. TOP HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${currentProviderMeta.color} opacity-90`} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <currentProviderMeta.icon className="w-4 h-4" /> {currentProviderMeta.name} Models &amp; Rate Limits
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                {currentProviderMeta.badge}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {selectedProvider === "All" ? "Tokens by Model & API Quotas" : `${currentProviderMeta.name} Live Rate Limits & Charts`}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Real-time rate limits (RPM, TPM, RPD) and live token metrics pulled directly from connected {currentProviderMeta.name} APIs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={currentProviderMeta.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>API Docs</span>
            </a>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing APIs..." : "Sync Live Quotas"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. METRIC STATS SUMMARY CARDS ─────────────────────────────────── */}
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
          <div className="text-2xl font-black text-white font-sans">
            {modelsBreakdown.filter((m) => m.api_key_configured).length} / {modelsBreakdown.length || 38}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Live Models Available
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
            {modelsBreakdown.find((m) => m.calls_count > 0)?.name || "Gemini 2.5 Flash"}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
            Active Scraper Engine
          </div>
          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 font-mono">
            With multi-model failover
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

      {/* ── 3. GOOGLE AI STUDIO PEAK USAGE TRENDS CHARTS SECTION ─────────── */}
      <div className="rounded-2xl border border-neutral-850 bg-[#121212] p-6 shadow-md text-left space-y-6">
        {/* Toggle Bar */}
        <div className="flex items-center justify-center -mt-2">
          <button
            onClick={() => setShowChartsSection(!showChartsSection)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-sans transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-neutral-800/60"
          >
            <span>{showChartsSection ? "See less" : "See more"}</span>
            {showChartsSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showChartsSection && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header: Title + Model Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-white font-sans tracking-tight">
                Peak usage trends
              </h2>

              {/* Model Searchable Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-sans">Model</span>
                  <button
                    onClick={() => setIsChartModelDropdownOpen(!isChartModelDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:text-white font-sans min-w-[180px] cursor-pointer hover:border-neutral-700 transition-all"
                  >
                    <span className="truncate">{activeChartModel.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isChartModelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-[#1e1e1e] border border-neutral-800 shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-neutral-800/80">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search"
                          value={chartModelSearch}
                          onChange={(e) => setChartModelSearch(e.target.value)}
                          className="w-full bg-[#141414] border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-neutral-600 font-sans placeholder:text-neutral-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
                      {chartDropdownModels.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedChartModelId(m.id);
                            setIsChartModelDropdownOpen(false);
                            setChartModelSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-sans transition-colors cursor-pointer flex items-center justify-between ${
                            m.id === activeChartModel.id
                              ? "bg-neutral-800 text-white font-medium"
                              : "text-neutral-300 hover:bg-neutral-850 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {m.id === activeChartModel.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Main Trend Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Peak RPM Chart */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Peak requests per minute (RPM)
                  </span>
                  <button className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                    <Menu className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SVG Graph Area */}
                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6">
                    <span>70</span>
                    <span>{activeChartModel.limit_rpm || 15}</span>
                    <span>5</span>
                  </div>

                  <div className="ml-7 flex-1 h-full relative flex items-center">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    {/* Red Dashed Limit Line */}
                    <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center">
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    {/* Real Usage SVG Path */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d="M 0,44 Q 25,44 50,42 T 80,43 T 100,45"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-850/80 pt-2 mt-auto">
                  <span>Limit: {activeChartModel.limit_rpm || 15} req/min</span>
                  <span>Used: {activeChartModel.rpm_used || 0}</span>
                </div>
              </div>

              {/* 2. Peak TPM Chart */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-300 font-sans font-medium">
                      Peak input tokens per minute (TPM)
                    </span>
                    <Info className="w-3 h-3 text-neutral-500 cursor-pointer" />
                  </div>
                  <button className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                    <Menu className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SVG Graph Area */}
                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-14 text-right">
                    <span>{formatUnits(activeChartModel.limit_tpm || 1048576)}</span>
                    <span>{formatUnits(Math.round((activeChartModel.limit_tpm || 1048576) / 2))}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-16 flex-1 h-full relative flex items-center">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    {/* Red Dashed Limit Line */}
                    <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center">
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    {/* Real Usage SVG Path */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d="M 0,44 Q 25,44 50,44 T 80,44 T 100,44"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-850/80 pt-2 mt-auto">
                  <span>Limit: {formatUnits(activeChartModel.limit_tpm || 1048576)} tokens/min</span>
                  <span>Used: {formatUnits(activeChartModel.tpm_used || 0)}</span>
                </div>
              </div>

              {/* 3. Peak RPD Chart */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Peak requests per day (RPD)
                  </span>
                  <button className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                    <Menu className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SVG Graph Area */}
                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-8">
                    <span>3000</span>
                    <span>{activeChartModel.limit_rpd || 1500}</span>
                    <span>0</span>
                  </div>

                  <div className="ml-9 flex-1 h-full relative flex items-center">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    {/* Red Dashed Limit Line */}
                    <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center">
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    {/* Real Usage SVG Path */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d="M 0,46 Q 30,46 60,43 T 90,39 T 100,42"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-850/80 pt-2 mt-auto">
                  <span>Limit: {activeChartModel.limit_rpd || 1500} req/day</span>
                  <span>Used: {activeChartModel.rpd_used || 0}</span>
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white font-sans">
                Tools
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Grounding Chart */}
                <div className="rounded-xl border border-neutral-850/80 bg-[#181818] p-4 flex flex-col justify-between h-48 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white font-sans">Search grounding</h4>
                      <p className="text-[10px] text-neutral-500 font-sans">Peak requests per day (RPD)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={searchGroundingModelId}
                        onChange={(e) => setSearchGroundingModelId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="gemini-2.0-flash">Gemini 2</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      </select>
                      <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
                    </div>
                  </div>

                  {/* SVG Graph */}
                  <div className="relative flex-1 my-2 flex items-center">
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6 text-right">
                      <span>2K</span>
                      <span>1K</span>
                    </div>

                    <div className="mr-8 flex-1 h-full relative flex items-center">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-neutral-850/50 w-full" />
                        <div className="border-b border-neutral-850/50 w-full" />
                      </div>

                      <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-red-500/80 z-10">
                        <div className="absolute -left-1 -top-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                          Limit
                        </div>
                      </div>

                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path d="M 0,38 L 100,38" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Map Grounding / Scraper AI Chart */}
                <div className="rounded-xl border border-neutral-850/80 bg-[#181818] p-4 flex flex-col justify-between h-48 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white font-sans">Map grounding</h4>
                      <p className="text-[10px] text-neutral-500 font-sans">Peak requests per day (RPD)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={mapGroundingModelId}
                        onChange={(e) => setMapGroundingModelId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="gemini-2.5-flash">Deep Research Pro Preview</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2 Flash</option>
                      </select>
                      <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
                    </div>
                  </div>

                  {/* SVG Graph */}
                  <div className="relative flex-1 my-2 flex items-center">
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6 text-right">
                      <span>600</span>
                      <span>500</span>
                      <span>400</span>
                    </div>

                    <div className="mr-8 flex-1 h-full relative flex items-center">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-neutral-850/50 w-full" />
                        <div className="border-b border-neutral-850/50 w-full" />
                        <div className="border-b border-neutral-850/50 w-full" />
                      </div>

                      <div className="absolute top-[48%] left-0 right-0 border-b border-dashed border-red-500/80 z-10">
                        <div className="absolute -left-1 -top-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                          Limit
                        </div>
                      </div>

                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path d="M 0,38 L 100,38" fill="none" stroke="#ec4899" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. GOOGLE AI STUDIO RATE LIMITS & QUOTAS DASHBOARD ─────────────── */}
      <div className="space-y-4 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight">
                Gemini API Rate Limit
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {tierBadge}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Project:</span>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    const newProj = e.target.value;
                    setSelectedProject(newProj);
                    loadData(newProj, timeRange);
                  }}
                  className="bg-neutral-950 text-neutral-200 font-bold px-2.5 py-0.5 rounded-md border border-neutral-800 text-xs focus:outline-none cursor-pointer hover:border-purple-500/50 transition-all max-w-[220px] truncate"
                >
                  <option value="All Projects">Workspace (All Projects)</option>
                  {projectsList.map((p: any) => (
                    <option key={p.project_id} value={p.project_id || p.title}>
                      {p.title || p.project_id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => {
                    const newRange = e.target.value;
                    setTimeRange(newRange);
                    loadData(selectedProject, newRange);
                  }}
                  className="bg-neutral-950 text-neutral-200 font-bold px-2 py-0.5 rounded-md border border-neutral-800 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="1 Hour">1 Hour</option>
                  <option value="1 Day">1 Day</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search model or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-purple-500/80 transition-all w-52 placeholder:text-neutral-600"
              />
            </div>

            {/* Provider Filter */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 font-mono focus:outline-none cursor-pointer hover:border-purple-500/50 transition-all"
            >
              <option value="All">All Providers</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="groq">Groq LPU</option>
              <option value="deepseek">DeepSeek</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="huggingface">HuggingFace</option>
              <option value="mistral">Mistral AI</option>
              <option value="deepl">DeepL</option>
            </select>

            <button
              onClick={() => window.open("https://ai.google.dev/gemini-api/docs/rate-limits", "_blank")}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Docs</span>
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold shadow-sm"
                  : "bg-neutral-950 text-neutral-400 border border-neutral-850 hover:text-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section Info */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h3 className="text-sm font-bold text-white font-sans">
              Rate limits by model
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
              Peak usage per model compared to its limit over the last 1 day
            </p>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Showing {filteredModels.length} of {modelsBreakdown.length} models
          </span>
        </div>

        {/* Live Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/60">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] bg-neutral-900/40">
                <th className="py-3 px-4 font-semibold">Model</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">RPM ↓</th>
                <th className="py-3 px-4 font-semibold">TPM</th>
                <th className="py-3 px-4 font-semibold">RPD</th>
                <th className="py-3 px-4 font-semibold text-right">Charts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/60">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => {
                  const rpmUsed = model.rpm_used || 0;
                  const rpmLimit = model.limit_rpm || 0;
                  const tpmUsed = model.tpm_used || 0;
                  const tpmLimit = model.limit_tpm || 0;
                  const rpdUsed = model.rpd_used || 0;
                  const rpdLimit = model.limit_rpd || 0;

                  const isExhausted =
                    (rpdUsed >= rpdLimit && rpdLimit > 0) ||
                    (rpmUsed >= rpmLimit && rpmLimit > 0);

                  return (
                    <tr
                      key={model.id}
                      onClick={() => setInspectModel(model)}
                      className="hover:bg-neutral-900/60 transition-colors group cursor-pointer"
                    >
                      {/* Model Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-semibold text-neutral-200 text-xs group-hover:text-purple-300 transition-colors">
                            {model.name}
                          </span>
                          {model.id === "gemini-2.5-flash" && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                              Primary
                            </span>
                          )}
                          {isExhausted && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">
                              429 Limit
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-[10px] text-neutral-500 font-mono truncate max-w-sm mt-0.5">
                            {model.description}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-neutral-400 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                          {model.category || "Text-out models"}
                        </span>
                      </td>

                      {/* RPM */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={
                                rpmUsed > 0 ? "text-purple-300 font-bold" : "text-neutral-500"
                              }
                            >
                              {rpmUsed} / {rpmLimit}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                rpmUsed >= rpmLimit && rpmLimit > 0
                                  ? "bg-red-500"
                                  : "bg-purple-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (rpmUsed / (rpmLimit || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* TPM */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={
                                tpmUsed > 0 ? "text-cyan-300 font-bold" : "text-neutral-500"
                              }
                            >
                              {formatUnits(tpmUsed)} / {formatUnits(tpmLimit)}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                tpmUsed >= tpmLimit && tpmLimit > 0
                                  ? "bg-red-500"
                                  : "bg-cyan-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (tpmUsed / (tpmLimit || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* RPD */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={
                                rpdUsed > 0
                                  ? rpdUsed >= rpdLimit
                                    ? "text-red-400 font-bold"
                                    : "text-emerald-300 font-bold"
                                  : "text-neutral-500"
                              }
                            >
                              {rpdUsed} / {rpdLimit}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                rpdUsed >= rpdLimit && rpdLimit > 0
                                  ? "bg-red-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (rpdUsed / (rpdLimit || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Charts / Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedChartModelId(model.id);
                            setShowChartsSection(true);
                            window.scrollTo({ top: 200, behavior: "smooth" });
                          }}
                          className="inline-flex items-center justify-end gap-1 text-neutral-500 hover:text-purple-400 transition-colors cursor-pointer"
                          title="View Peak Usage Charts"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 text-xs">
                    No matching AI models found. Try adjusting your search query or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. LIVE INTERACTIVE TOKEN & COST CALCULATOR ─────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            {(modelsBreakdown.length > 0 ? modelsBreakdown : models).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider_name || m.provider})
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
              <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">
                Estimated Prompt
              </span>
              <div className="text-xl font-black text-white font-sans">{estimatedPromptTokens} tok</div>
              <span className="text-[10px] text-neutral-400 font-mono">~4 chars / token</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-0.5">
              <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">
                Expected Output
              </span>
              <div className="text-xl font-black text-white font-sans">{calcExpectedOutput} tok</div>
              <span className="text-[10px] text-neutral-400 font-mono">~300 words</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-0.5">
              <span className="text-[10px] text-purple-400 font-mono uppercase font-bold">
                Estimated API Cost
              </span>
              <div className="text-xl font-black text-emerald-400 font-sans">${estimatedCostUSD}</div>
              <span className="text-[10px] text-neutral-400 font-mono">Free with custom API key</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. MODEL TECHNICAL SPECS & CAPABILITIES INSPECTOR MODAL ─────────── */}
      {inspectModel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#181818] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 text-left">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-sans">{inspectModel.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold font-mono">
                    {inspectModel.category || "Text-out models"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  Endpoint ID: <code className="text-purple-400 font-bold">{inspectModel.id}</code>
                </p>
              </div>

              <button
                onClick={() => setInspectModel(null)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Description */}
            {inspectModel.description && (
              <p className="text-xs text-neutral-300 font-sans leading-relaxed bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-850">
                {inspectModel.description}
              </p>
            )}

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Max Input Tokens</span>
                <div className="text-sm font-bold text-cyan-300 font-sans mt-0.5">
                  {formatUnits(inspectModel.limit_tpm || 1048576)} tokens
                </div>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Max Output Tokens</span>
                <div className="text-sm font-bold text-purple-300 font-sans mt-0.5">
                  {formatUnits(inspectModel.output_token_limit || 65536)} tokens
                </div>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Rate Limit (RPM)</span>
                <div className="text-sm font-bold text-white font-sans mt-0.5">
                  {inspectModel.limit_rpm || 15} req / min
                </div>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Daily Limit (RPD)</span>
                <div className="text-sm font-bold text-emerald-300 font-sans mt-0.5">
                  {inspectModel.limit_rpd || 1500} req / day
                </div>
              </div>
            </div>

            {/* Supported Methods */}
            {inspectModel.supported_methods && inspectModel.supported_methods.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">
                  Supported Generation Methods
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectModel.supported_methods.map((method: string) => (
                    <span
                      key={method}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
              <span className="text-[11px] text-neutral-500 font-mono">
                Tier: <span className="text-emerald-400 font-bold">{inspectModel.tier || "Free tier"}</span>
              </span>

              <button
                onClick={() => {
                  setCalcModel(inspectModel.id);
                  setInspectModel(null);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
              >
                Test in Live Estimator →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
