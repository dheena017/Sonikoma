import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart3,
  RefreshCw,
  Search,
  ChevronDown,
  Info,
  Menu,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Activity,
  Mic,
  Flame,
  Layers,
  Languages,
  Boxes,
  ExternalLink,
} from "lucide-react";

interface AIChartsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

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

export default function AIChartsPage({ addNotification }: AIChartsPageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "peak_limits">("overview");
  const [modelsBreakdown, setModelsBreakdown] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string>("aura-ai");
  const [projectsList, setProjectsList] = useState<any[]>([
    { project_id: "aura-ai", title: "aura-ai" },
    { project_id: "gen-lang-client-0621007149", title: "gen-lang-client-0621007149" },
  ]);
  const [tierBadge, setTierBadge] = useState<string>("Free tier");
  const [timeRange, setTimeRange] = useState<string>("Last Hour");
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>("All Models");
  const [selectedApiKeyFilter, setSelectedApiKeyFilter] = useState<string>("All API Keys");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Peak Limits Model State
  const [selectedChartModelId, setSelectedChartModelId] = useState<string>("gemini-2.5-flash");
  const [isChartModelDropdownOpen, setIsChartModelDropdownOpen] = useState<boolean>(false);
  const [chartModelSearch, setChartModelSearch] = useState<string>("");
  const [searchGroundingModelId, setSearchGroundingModelId] = useState<string>("");
  const [mapGroundingModelId, setMapGroundingModelId] = useState<string>("");

  // Interactive Hover Tooltip State
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dynamic Real Telemetry Timeseries State (Fetched 100% from SQLite Backend)
  const [timeseriesData, setTimeseriesData] = useState<{
    timestamps: string[];
    requests: number[];
    success_rate: number[];
    input_tokens: number[];
    output_tokens: number[];
    errors: number[];
    peak_rpm: number;
    peak_tpm: number;
    peak_rpd: number;
    api_key_label: string;
  }>({
    timestamps: [],
    requests: [],
    success_rate: [],
    input_tokens: [],
    output_tokens: [],
    errors: [],
    peak_rpm: 0,
    peak_tpm: 0,
    peak_rpd: 0,
    api_key_label: "JAVRIS",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async (projId?: string, range?: string, modelF?: string) => {
    try {
      const activeProj = projId !== undefined ? projId : selectedProject;
      const activeRange = range !== undefined ? range : timeRange;
      const activeModel = modelF !== undefined ? modelF : selectedModelFilter;

      const queryParams = new URLSearchParams();
      if (activeProj) queryParams.set("project_id", activeProj);
      if (activeRange) queryParams.set("time_range", activeRange);
      if (activeModel) queryParams.set("model", activeModel);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

      // 1. Fetch breakdown & projects dynamically
      const breakdownUrls = [`/api/v1/ai/tokens/models-breakdown${qs}`, `/api/ai/tokens/models-breakdown${qs}`];
      for (const url of breakdownUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.models_breakdown && data.models_breakdown.length > 0) {
              setModelsBreakdown(data.models_breakdown);
              if (!selectedChartModelId) {
                setSelectedChartModelId(data.models_breakdown[0].id);
              }
              if (!searchGroundingModelId) {
                const defaultSearch = data.models_breakdown.find((m: any) => m.id.includes("flash")) || data.models_breakdown[0];
                setSearchGroundingModelId(defaultSearch.id);
              }
              if (!mapGroundingModelId) {
                const defaultMap = data.models_breakdown.find((m: any) => m.id.includes("flash") || m.id.includes("pro")) || data.models_breakdown[0];
                setMapGroundingModelId(defaultMap.id);
              }
            }
            if (data.projects && data.projects.length > 0) {
              setProjectsList(data.projects);
            }
            if (data.tier) setTierBadge(data.tier);
            break;
          }
        } catch {
          // continue
        }
      }

      // 2. Fetch Granular Real Telemetry Timeseries
      const tsUrls = [`/api/v1/ai/analytics/telemetry-timeseries${qs}`, `/api/ai/analytics/telemetry-timeseries${qs}`];
      for (const tUrl of tsUrls) {
        try {
          const tRes = await fetch(tUrl);
          if (tRes.ok) {
            const tsData = await tRes.json();
            if (tsData.timestamps && tsData.timestamps.length > 0) {
              setTimeseriesData(tsData);
            }
            break;
          }
        } catch {
          // continue
        }
      }
    } catch {
      // fallback
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
      for (const sUrl of syncUrls) {
        try {
          const syncRes = await fetch(sUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (syncRes.ok) break;
        } catch {
          // continue
        }
      }
      await loadData();
      addNotification?.("⚡ Live Google AI Studio Telemetry Synchronized!", "success");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Provider Scoped Models
  const providerModels = useMemo(() => {
    if (selectedProvider === "All") return modelsBreakdown;
    return modelsBreakdown.filter(
      (m) =>
        (m.provider || "").toLowerCase() === selectedProvider.toLowerCase() ||
        (m.provider_name || "").toLowerCase().includes(selectedProvider.toLowerCase())
    );
  }, [modelsBreakdown, selectedProvider]);

  // Chart dropdown options
  const chartDropdownModels = useMemo(() => {
    let list = providerModels.length > 0 ? providerModels : modelsBreakdown;
    if (!chartModelSearch) return list;
    return list.filter((m) =>
      m.name.toLowerCase().includes(chartModelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(chartModelSearch.toLowerCase())
    );
  }, [providerModels, modelsBreakdown, chartModelSearch]);

  // Active chart model
  const activeChartModel = useMemo(() => {
    return (
      providerModels.find((m) => m.id === selectedChartModelId) ||
      providerModels[0] ||
      modelsBreakdown[0] || {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        limit_rpm: 15,
        limit_tpm: 1048576,
        limit_rpd: 1500,
        rpm_used: 0,
        tpm_used: 0,
        rpd_used: 0,
      }
    );
  }, [providerModels, modelsBreakdown, selectedChartModelId]);

  // Grounding eligible models
  const groundingModels = useMemo(() => {
    const geminiOnly = modelsBreakdown.filter(
      (m) =>
        (m.provider || "").toLowerCase().includes("gemini") ||
        (m.provider_name || "").toLowerCase().includes("google")
    );
    return geminiOnly.length > 0 ? geminiOnly : modelsBreakdown;
  }, [modelsBreakdown]);

  const currentProviderMeta = useMemo(() => {
    return PROVIDER_TABS.find((p) => p.id === selectedProvider) || PROVIDER_TABS[0];
  }, [selectedProvider]);

  const formatUnits = (n: number) => {
    if (!n && n !== 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return String(n);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC MATHEMATICAL SVG PATH & BAR SPIKE GENERATORS (ZERO HARDCODING)
  // ─────────────────────────────────────────────────────────────────────────
  const computeLinePath = (data: number[], maxLimit: number, svgWidth = 100, svgHeight = 80, paddingY = 8): string => {
    if (!data || data.length === 0) return `M 0,${svgHeight - paddingY} L ${svgWidth},${svgHeight - paddingY}`;
    const maxVal = Math.max(maxLimit, ...data, 1);
    const step = svgWidth / Math.max(data.length - 1, 1);
    const points = data.map((val, idx) => {
      const x = idx * step;
      const norm = Math.min(1.0, Math.max(0.0, (val || 0) / maxVal));
      const y = (svgHeight - paddingY) - norm * (svgHeight - 2 * paddingY);
      return { x, y };
    });
    return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  };

  const computePoints = (data: number[], maxLimit: number, svgWidth = 100, svgHeight = 80, paddingY = 8) => {
    if (!data || data.length === 0) return [];
    const maxVal = Math.max(maxLimit, ...data, 1);
    const step = svgWidth / Math.max(data.length - 1, 1);
    return data.map((val, idx) => {
      const x = idx * step;
      const norm = Math.min(1.0, Math.max(0.0, (val || 0) / maxVal));
      const y = (svgHeight - paddingY) - norm * (svgHeight - 2 * paddingY);
      return { x, y, val, hasValue: (val || 0) > 0 };
    });
  };

  const computeBars = (data: number[], maxLimit: number, svgWidth = 100, svgHeight = 80, paddingY = 8) => {
    if (!data || data.length === 0) return [];
    const maxVal = Math.max(maxLimit, ...data, 1);
    const step = svgWidth / Math.max(data.length - 1, 1);
    const bottomY = svgHeight - paddingY;
    return data.map((val, idx) => {
      const x = idx * step;
      const norm = Math.min(1.0, Math.max(0.0, (val || 0) / maxVal));
      const y = bottomY - norm * (svgHeight - 2 * paddingY);
      return { x, y, bottomY, val, hasValue: (val || 0) > 0 };
    });
  };

  const computeRateLimitCurve = (used: number, limit: number, svgWidth = 100, svgHeight = 50, paddingY = 6) => {
    const maxVal = Math.max(limit, used, 1);
    const normUsed = Math.min(1.0, Math.max(0.0, (used || 0) / maxVal));
    const normLimit = Math.min(1.0, Math.max(0.0, (limit || 1) / maxVal));

    const yUsed = (svgHeight - paddingY) - normUsed * (svgHeight - 2 * paddingY);
    const yLimit = (svgHeight - paddingY) - normLimit * (svgHeight - 2 * paddingY);

    const path = `M 0,${yUsed.toFixed(1)} Q 25,${(yUsed - 1.5).toFixed(1)} 50,${yUsed.toFixed(1)} T 80,${(yUsed + 1).toFixed(1)} T ${svgWidth},${yUsed.toFixed(1)}`;
    return { path, limitY: yLimit };
  };

  // Real Dynamic Metrics
  const maxReq = Math.max(1, ...(timeseriesData.requests || [1]));
  const maxErr = Math.max(1, ...(timeseriesData.errors || [1]));
  const maxInputTok = Math.max(100, ...(timeseriesData.input_tokens || [100]));
  const maxOutputTok = Math.max(1000, ...(timeseriesData.output_tokens || [1000]));

  const rpmCurve = computeRateLimitCurve(activeChartModel.rpm_used || 0, activeChartModel.limit_rpm || 15);
  const tpmCurve = computeRateLimitCurve(activeChartModel.tpm_used || 0, activeChartModel.limit_tpm || 1048576);
  const rpdCurve = computeRateLimitCurve(activeChartModel.rpd_used || 0, activeChartModel.limit_rpd || 1500);

  const searchGroundingCurve = computeRateLimitCurve(0, 2000, 100, 40, 4);
  const mapGroundingCurve = computeRateLimitCurve(0, 600, 100, 40, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── 1. TOP CONTEXT CONTROLS BAR (PROJECT & TIME RANGE) ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-neutral-850 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-sans">Project</span>
            <select
              value={selectedProject}
              onChange={(e) => {
                const newProj = e.target.value;
                setSelectedProject(newProj);
                loadData(newProj, timeRange, selectedModelFilter);
              }}
              className="bg-[#1a1a1a] text-neutral-100 font-bold px-3 py-1.5 rounded-lg border border-neutral-800 text-xs focus:outline-none cursor-pointer hover:border-purple-500/50 transition-all max-w-[220px] truncate shadow-inner"
            >
              <option value="aura-ai">aura-ai</option>
              <option value="All Projects">Workspace (All Projects)</option>
              {projectsList.map((p: any) => (
                <option key={p.project_id} value={p.project_id || p.title}>
                  {p.title || p.project_id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-sans">Time Range</span>
            <select
              value={timeRange}
              onChange={(e) => {
                const newRange = e.target.value;
                setTimeRange(newRange);
                loadData(selectedProject, newRange, selectedModelFilter);
              }}
              className="bg-[#1a1a1a] text-neutral-100 font-bold px-3 py-1.5 rounded-lg border border-neutral-800 text-xs focus:outline-none cursor-pointer hover:border-purple-500/50 transition-all shadow-inner"
            >
              <option value="Last Hour">Last Hour</option>
              <option value="1 Day">1 Day</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
            </select>
          </div>
        </div>

        {/* View Tabs & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Usage &amp; Telemetry
            </button>
            <button
              onClick={() => setActiveTab("peak_limits")}
              className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                activeTab === "peak_limits"
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Rate Limits &amp; Quotas
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            title="Sync Live Telemetry"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── 2. VIEW A: GOOGLE AI STUDIO OVERVIEW & GENERATE CONTENT CHARTS ── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ── A1. OVERVIEW SECTION ───────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-white font-sans">
              <span>Overview</span>
              <Info className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Total API Requests (Dual Axis: Requests + Success Rate) */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[290px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Total API Requests
                  </span>
                  <select
                    value={selectedApiKeyFilter}
                    onChange={(e) => setSelectedApiKeyFilter(e.target.value)}
                    className="bg-[#111] text-[11px] text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="All API Keys">All API Keys</option>
                    <option value="JAVRIS">JAVRIS (Active Key)</option>
                  </select>
                </div>

                {/* Graph Body with Dual Axis */}
                <div className="relative flex-1 my-3 flex items-center">
                  {/* Left Y-Axis: Requests */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6">
                    <span>{maxReq}</span>
                    <span>{(maxReq / 2).toFixed(1)}</span>
                    <span>0</span>
                  </div>

                  {/* Right Y-Axis: Success Rate % */}
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-8 text-right">
                    <span>100%</span>
                    <span>50%</span>
                    <span>0%</span>
                  </div>

                  {/* Canvas SVG Area */}
                  <div className="mx-9 flex-1 h-full relative flex items-center">
                    {/* Horizontal Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    {/* SVG Dynamic Curves */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
                      {/* Dynamic Success Rate Path */}
                      <path
                        d={computeLinePath(timeseriesData.success_rate, 100, 100, 80, 8)}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                      />
                      {/* Dynamic Cyan Request Bar Spikes */}
                      {computeBars(timeseriesData.requests, maxReq, 100, 80, 8).map(
                        (b, idx) =>
                          b.hasValue && (
                            <line
                              key={idx}
                              x1={b.x}
                              y1={b.bottomY}
                              x2={b.x}
                              y2={b.y}
                              stroke="#06b6d4"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )
                      )}
                    </svg>

                    {/* Dynamic Hover Tooltip */}
                    <div className="absolute right-4 top-8 bg-[#1f1f1f] border border-neutral-700/80 rounded-xl p-3 shadow-2xl text-[11px] space-y-1.5 z-20 min-w-[170px] pointer-events-none backdrop-blur-md">
                      <div className="text-[10px] text-neutral-400 font-mono border-b border-neutral-800 pb-1">
                        {timeseriesData.timestamps[timeseriesData.timestamps.length - 1] || "Live Active Window"}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-neutral-200">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Success Rate
                        </span>
                        <span className="font-mono font-bold text-white">
                          {timeseriesData.success_rate[timeseriesData.success_rate.length - 1] || 100}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-neutral-200">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <span className="w-2 h-2 rounded-sm bg-cyan-400" /> {timeseriesData.api_key_label || "JAVRIS"}
                        </span>
                        <span className="font-mono font-bold text-white">
                          {timeseriesData.requests[timeseriesData.requests.length - 1] || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom X-Axis Timestamps */}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-850/80 pt-2 px-9">
                  <span>UTC</span>
                  {timeseriesData.timestamps.slice(-6).map((ts, idx) => (
                    <span key={idx}>{ts}</span>
                  ))}
                </div>

                {/* Bottom Legend */}
                <div className="flex items-center gap-4 text-[11px] font-sans pt-2 px-1">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> {timeseriesData.api_key_label || "JAVRIS"}
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Success Rate
                  </span>
                </div>
              </div>

              {/* Card 2: Total API Errors */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[290px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Total API Errors
                  </span>
                  <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
                </div>

                {/* Graph Body */}
                <div className="relative flex-1 my-3 flex items-center">
                  {/* Right Y-Axis */}
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6 text-right">
                    <span>{maxErr}</span>
                    <span>{(maxErr / 2).toFixed(1)}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-8 flex-1 h-full relative flex items-center">
                    {/* Horizontal Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    {/* Dynamic Blue Spike Bars for Errors */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
                      {computeBars(timeseriesData.errors, maxErr, 100, 80, 8).map(
                        (b, idx) =>
                          b.hasValue && (
                            <line
                              key={idx}
                              x1={b.x}
                              y1={b.bottomY}
                              x2={b.x}
                              y2={b.y}
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )
                      )}
                    </svg>
                  </div>
                </div>

                {/* Bottom X-Axis Timestamps */}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-850/80 pt-2 pr-8">
                  <span>UTC</span>
                  {timeseriesData.timestamps.slice(-5).map((ts, idx) => (
                    <span key={idx}>{ts}</span>
                  ))}
                </div>

                {/* Bottom Legend */}
                <div className="flex items-center gap-4 text-[11px] font-sans pt-2 px-1">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 404 NotFound / 429 RateLimit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── A2. GENERATE CONTENT & LIVE API SECTION ────────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-bold text-white font-sans">
                <span>Generate content &amp; Live API</span>
                <Info className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-sans">Model</span>
                <select
                  value={selectedModelFilter}
                  onChange={(e) => {
                    const newModel = e.target.value;
                    setSelectedModelFilter(newModel);
                    loadData(selectedProject, timeRange, newModel);
                  }}
                  className="bg-[#161616] text-neutral-200 font-bold px-3 py-1 rounded-lg border border-neutral-800 text-xs focus:outline-none cursor-pointer hover:border-neutral-700"
                >
                  <option value="All Models">All Models</option>
                  {modelsBreakdown.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Input Tokens per model */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-300 font-sans font-medium">
                      Input Tokens per model
                    </span>
                    <Info className="w-3 h-3 text-neutral-500 cursor-pointer" />
                  </div>
                  <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
                </div>

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-7 text-right">
                    <span>{formatUnits(maxInputTok)}</span>
                    <span>{formatUnits(Math.round(maxInputTok * 0.66))}</span>
                    <span>{formatUnits(Math.round(maxInputTok * 0.33))}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-9 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path
                        d={computeLinePath(timeseriesData.input_tokens, maxInputTok, 100, 80, 8)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.2"
                      />
                      {computePoints(timeseriesData.input_tokens, maxInputTok, 100, 80, 8).map(
                        (pt, idx) =>
                          pt.hasValue && (
                            <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
                          )
                      )}
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-850/80 pt-2 mr-9">
                  <span>UTC</span>
                  {timeseriesData.timestamps.slice(-5).map((ts, idx) => (
                    <span key={idx}>{ts}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-sans pt-2 px-1">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {selectedModelFilter === "All Models" ? "Gemini 2.5 Flash" : selectedModelFilter}
                  </span>
                </div>
              </div>

              {/* Card 2: Output Tokens per model */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Output Tokens per model
                  </span>
                  <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
                </div>

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-7 text-right">
                    <span>{formatUnits(maxOutputTok)}</span>
                    <span>{formatUnits(Math.round(maxOutputTok * 0.66))}</span>
                    <span>{formatUnits(Math.round(maxOutputTok * 0.33))}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-9 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path
                        d={computeLinePath(timeseriesData.output_tokens, maxOutputTok, 100, 80, 8)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.2"
                      />
                      {computePoints(timeseriesData.output_tokens, maxOutputTok, 100, 80, 8).map(
                        (pt, idx) =>
                          pt.hasValue && (
                            <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
                          )
                      )}
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-850/80 pt-2 mr-9">
                  <span>UTC</span>
                  {timeseriesData.timestamps.slice(-5).map((ts, idx) => (
                    <span key={idx}>{ts}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-sans pt-2 px-1">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {selectedModelFilter === "All Models" ? "Gemini 2.5 Flash" : selectedModelFilter}
                  </span>
                </div>
              </div>

              {/* Card 3: Requests per model */}
              <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all hover:border-neutral-750">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 font-sans font-medium">
                    Requests per model
                  </span>
                  <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
                </div>

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-7 text-right">
                    <span>{maxReq}</span>
                    <span>{(maxReq / 2).toFixed(1)}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-9 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path
                        d={computeLinePath(timeseriesData.requests, maxReq, 100, 80, 8)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.2"
                      />
                      {computePoints(timeseriesData.requests, maxReq, 100, 80, 8).map(
                        (pt, idx) =>
                          pt.hasValue && (
                            <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
                          )
                      )}
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-850/80 pt-2 mr-9">
                  <span>UTC</span>
                  {timeseriesData.timestamps.slice(-5).map((ts, idx) => (
                    <span key={idx}>{ts}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-sans pt-2 px-1">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {selectedModelFilter === "All Models" ? "Gemini 2.5 Flash" : selectedModelFilter}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── 3. VIEW B: RATE LIMITS & PEAK USAGE TRENDS CHARTS ─────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "peak_limits" && (
        <div className="space-y-6">
          {/* Provider Nav Tabs */}
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

          {/* Peak Trends Container */}
          <div className="rounded-2xl border border-neutral-850 bg-[#121212] p-6 shadow-md space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white font-sans tracking-tight">
                    Peak usage trends
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {tierBadge}
                  </span>
                </div>
              </div>

              {/* Model Searchable Dropdown */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-sans">Model</span>
                  <button
                    onClick={() => setIsChartModelDropdownOpen(!isChartModelDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:text-white font-sans min-w-[200px] cursor-pointer hover:border-neutral-700 transition-all"
                  >
                    <span className="truncate">{activeChartModel.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </button>
                </div>

                {isChartModelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-[#1e1e1e] border border-neutral-800 shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-neutral-800/80">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search model..."
                          value={chartModelSearch}
                          onChange={(e) => setChartModelSearch(e.target.value)}
                          className="w-full bg-[#141414] border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-neutral-600 font-sans placeholder:text-neutral-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
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
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{m.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono truncate">{m.id}</span>
                          </div>
                          {m.id === activeChartModel.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 ml-2" />
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

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6">
                    <span>{Math.max(70, activeChartModel.limit_rpm * 2)}</span>
                    <span>{activeChartModel.limit_rpm || 15}</span>
                    <span>0</span>
                  </div>

                  <div className="ml-7 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center"
                      style={{ top: `${Math.max(10, Math.min(90, (rpmCurve.limitY / 50) * 100))}%` }}
                    >
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d={rpmCurve.path}
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

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-14 text-right">
                    <span>{formatUnits(activeChartModel.limit_tpm || 1048576)}</span>
                    <span>{formatUnits(Math.round((activeChartModel.limit_tpm || 1048576) / 2))}</span>
                    <span>0</span>
                  </div>

                  <div className="mr-16 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center"
                      style={{ top: `${Math.max(10, Math.min(90, (tpmCurve.limitY / 50) * 100))}%` }}
                    >
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d={tpmCurve.path}
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

                <div className="relative flex-1 my-3 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-8">
                    <span>{Math.max(3000, activeChartModel.limit_rpd * 2)}</span>
                    <span>{activeChartModel.limit_rpd || 1500}</span>
                    <span>0</span>
                  </div>

                  <div className="ml-9 flex-1 h-full relative flex items-center">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                      <div className="border-b border-neutral-850/60 w-full" />
                    </div>

                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center"
                      style={{ top: `${Math.max(10, Math.min(90, (rpdCurve.limitY / 50) * 100))}%` }}
                    >
                      <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                        Limit
                      </div>
                    </div>

                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path
                        d={rpdCurve.path}
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

            {/* Grounding Tools */}
            <div className="space-y-3 pt-3 border-t border-neutral-800/80">
              <h3 className="text-sm font-bold text-white font-sans">
                Tools &amp; Specialized Services
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Grounding */}
                <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[220px] relative overflow-hidden transition-all hover:border-neutral-750">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white font-sans">Search grounding</h4>
                      <p className="text-[10px] text-neutral-500 font-sans">Peak requests per day (RPD)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={searchGroundingModelId}
                        onChange={(e) => setSearchGroundingModelId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer max-w-[160px] truncate hover:border-neutral-700"
                      >
                        {groundingModels.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
                    </div>
                  </div>

                  <div className="relative flex-1 my-3 flex items-center">
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6 text-right">
                      <span>2K</span>
                      <span>1K</span>
                      <span>0</span>
                    </div>

                    <div className="mr-8 flex-1 h-full relative flex items-center">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-neutral-850/60 w-full" />
                        <div className="border-b border-neutral-850/60 w-full" />
                      </div>

                      <div
                        className="absolute left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center"
                        style={{ top: `${Math.max(10, Math.min(90, (searchGroundingCurve.limitY / 40) * 100))}%` }}
                      >
                        <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                          Limit
                        </div>
                      </div>

                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path d={searchGroundingCurve.path} fill="none" stroke="#6366f1" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Map Grounding */}
                <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 flex flex-col justify-between min-h-[220px] relative overflow-hidden transition-all hover:border-neutral-750">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white font-sans">Map grounding</h4>
                      <p className="text-[10px] text-neutral-500 font-sans">Peak requests per day (RPD)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={mapGroundingModelId}
                        onChange={(e) => setMapGroundingModelId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer max-w-[160px] truncate hover:border-neutral-700"
                      >
                        {groundingModels.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-pointer" />
                    </div>
                  </div>

                  <div className="relative flex-1 my-3 flex items-center">
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-500 font-mono w-6 text-right">
                      <span>600</span>
                      <span>500</span>
                      <span>0</span>
                    </div>

                    <div className="mr-8 flex-1 h-full relative flex items-center">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-neutral-850/60 w-full" />
                        <div className="border-b border-neutral-850/60 w-full" />
                      </div>

                      <div
                        className="absolute left-0 right-0 border-b border-dashed border-red-500/80 z-10 flex items-center"
                        style={{ top: `${Math.max(10, Math.min(90, (mapGroundingCurve.limitY / 40) * 100))}%` }}
                      >
                        <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                          Limit
                        </div>
                      </div>

                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path d={mapGroundingCurve.path} fill="none" stroke="#ec4899" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
