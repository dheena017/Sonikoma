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

  // Gemini & Hugging Face models states
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "huggingface" | "openai" | "anthropic">("gemini");

  // Latency & Connection Tester states
  const [testPrompt, setTestPrompt] = useState("Say: Connection Successful!");
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  const activeFetch = fetchWithInterceptor || fetch;

  const getPricingTag = (provider: string, modelName: string) => {
    if (provider === "huggingface") {
      return { text: "Free", className: "bg-emerald-950/40 text-emerald-400 border-emerald-800/30" };
    }
    if (provider === "gemini") {
      return { text: "Free Tier", className: "bg-purple-950/40 text-purple-300 border-purple-800/30" };
    }
    return { text: "Paid", className: "bg-amber-950/40 text-amber-400 border-amber-800/30" };
  };

  const fetchModels = async (prov: "gemini" | "huggingface" | "openai" | "anthropic" = selectedProvider) => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const res = await activeFetch("/api/list-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ provider: prov })
      });
      const data = await res.json();
      if (data.success) {
        setModels(data.models);
      } else {
        setModelsError(data.error || "Failed to load models");
      }
    } catch (err: any) {
      setModelsError(err.message || "Failed to fetch models");
    } finally {
      setLoadingModels(false);
    }
  };

  const handleProviderChange = (prov: "gemini" | "huggingface" | "openai" | "anthropic") => {
    setSelectedProvider(prov);
    setSelectedModel(null);
    setFilterQuery("");
    setModels([]);
    setTestResult(null);
    setTestPrompt("Say: Connection Successful!");
    fetchModels(prov);
  };

  const handleSelectModel = (m: any) => {
    if (selectedModel?.fullName === m.fullName) {
      setSelectedModel(null);
    } else {
      setSelectedModel(m);
      setTestResult(null);
      setTestPrompt("Say: Connection Successful!");
    }
  };

  const runLatencyTest = async (modelName: string) => {
    setTestingModelId(modelName);
    setTestResult(null);
    try {
      const res = await activeFetch("/api/test-model-latency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: selectedProvider,
          model: modelName,
          prompt: testPrompt
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || "Request failed" });
    } finally {
      setTestingModelId(null);
    }
  };

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
                Note: A missing Gemini API Key disables AI storyboard generation. Missing Hugging Face, OpenAI, or Anthropic keys disable optional models and benchmarks for those providers.
              </p>
            </div>
          </div>
                {/* Gemini, Hugging Face, OpenAI & Anthropic Model Inspector */}
          {(healthData?.env?.GEMINI_API_KEY || healthData?.env?.HUGGINGFACE_API_KEY || healthData?.env?.OPENAI_API_KEY || healthData?.env?.ANTHROPIC_API_KEY) && (
            <div className="bg-neutral-955/40 border border-neutral-850 p-6 rounded-3xl space-y-4 animate-[fadeIn_0.18s_ease-out]">
              <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  Model Inspector Matrix
                </div>
                {models.length > 0 && (
                  <span className="text-[10px] font-mono bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded text-purple-300">
                    {models.length} Models
                  </span>
                )}
              </h3>

              {/* Provider Tab Group */}
              <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-xs font-mono">
                {healthData?.env?.GEMINI_API_KEY && (
                  <button
                    onClick={() => handleProviderChange("gemini")}
                    className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                      selectedProvider === "gemini" 
                        ? "bg-purple-650 text-white font-bold" 
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Gemini
                  </button>
                )}
                {healthData?.env?.HUGGINGFACE_API_KEY && (
                  <button
                    onClick={() => handleProviderChange("huggingface")}
                    className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                      selectedProvider === "huggingface" 
                        ? "bg-purple-650 text-white font-bold" 
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Hugging Face
                  </button>
                )}
                {healthData?.env?.OPENAI_API_KEY && (
                  <button
                    onClick={() => handleProviderChange("openai")}
                    className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                      selectedProvider === "openai" 
                        ? "bg-purple-650 text-white font-bold" 
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    OpenAI
                  </button>
                )}
                {healthData?.env?.ANTHROPIC_API_KEY && (
                  <button
                    onClick={() => handleProviderChange("anthropic")}
                    className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                      selectedProvider === "anthropic" 
                        ? "bg-purple-650 text-white font-bold" 
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Anthropic
                  </button>
                )}
              </div>
                        {models.length === 0 && !loadingModels && (
                <div className="text-center py-4">
                  <p className="text-xs text-neutral-400 mb-3 font-mono leading-relaxed">
                    Query the active {selectedProvider === "gemini" ? "Gemini" : selectedProvider === "huggingface" ? "Hugging Face" : selectedProvider === "openai" ? "OpenAI" : "Anthropic"} configurations to explore supported AI models.
                  </p>
                  <button
                    onClick={() => fetchModels(selectedProvider)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Fetch {selectedProvider === "gemini" ? "Gemini" : selectedProvider === "huggingface" ? "Hugging Face" : selectedProvider === "openai" ? "OpenAI" : "Anthropic"} Matrix
                  </button>
                  {modelsError && (
                    <p className="text-xs text-rose-455 mt-2 font-mono">
                      Error: {modelsError}
                    </p>
                  )}
                </div>
              )}

              {loadingModels && (
                <div className="text-center py-6 text-xs text-neutral-500 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  Querying {selectedProvider === "gemini" ? "Gemini" : selectedProvider === "huggingface" ? "Hugging Face" : selectedProvider === "openai" ? "OpenAI" : "Anthropic"} models...
                </div>
              )}

              {models.length > 0 && (
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Search ${selectedProvider === "gemini" ? "Gemini" : selectedProvider === "huggingface" ? "HF" : selectedProvider === "openai" ? "OpenAI" : "Anthropic"} models...`}
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* List Container */}
                  <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1 font-mono text-xs scrollbar-thin animate-[fadeIn_0.18s_ease-out]">
                    {models
                      .filter((m) =>
                        m.name.toLowerCase().includes(filterQuery.toLowerCase())
                      )
                      .map((m) => (
                        <div
                          key={m.fullName}
                          onClick={() => handleSelectModel(m)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                            selectedModel?.fullName === m.fullName
                              ? "bg-purple-950/15 border-purple-500/50 shadow-inner"
                              : "bg-neutral-900/40 border-neutral-850 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-200 truncate pr-2" title={m.name}>
                              {m.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${getPricingTag(selectedProvider, m.name).className}`}>
                                {getPricingTag(selectedProvider, m.name).text}
                              </span>
                              <span className="text-[9px] bg-neutral-950 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5 uppercase font-bold">
                                {selectedProvider === "gemini" 
                                  ? (m.supportedActions.includes("generateContent") ? "Gen" : "Embed")
                                  : selectedProvider === "huggingface"
                                  ? (m.supportedActions[0] || "Model")
                                  : (m.supportedActions[0] || "Chat")
                                }
                              </span>
                            </div>
                          </div>
                          
                          {selectedModel?.fullName === m.fullName ? (
                            <div className="mt-2 pt-2 border-t border-neutral-800 space-y-2 text-[10px] leading-relaxed text-neutral-350">
                              {selectedProvider === "gemini" ? (
                                <>
                                  <div>
                                    <span className="text-neutral-550 font-bold">Display Name:</span> {m.displayName || "N/A"}
                                  </div>
                                  {m.description && (
                                    <div>
                                      <span className="text-neutral-555">Description:</span> {m.description}
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                      <span className="text-neutral-500 block uppercase text-[8px] tracking-wider">Input Limit</span>
                                      <span className="text-neutral-200 font-bold">{m.inputTokenLimit ? m.inputTokenLimit.toLocaleString() : "-"}</span>
                                    </div>
                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                      <span className="text-neutral-500 block uppercase text-[8px] tracking-wider">Output Limit</span>
                                      <span className="text-neutral-200 font-bold">{m.outputTokenLimit ? m.outputTokenLimit.toLocaleString() : "-"}</span>
                                    </div>
                                  </div>
                                </>
                              ) : selectedProvider === "huggingface" ? (
                                <>
                                  {m.description && (
                                    <div>
                                      <span className="text-neutral-500">Meta:</span> {m.description}
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1 border-t border-neutral-850">
                                    <span>Task: {m.supportedActions[0] || "N/A"}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {m.description && (
                                    <div>
                                      <span className="text-neutral-500 font-bold">Description:</span> {m.description}
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                      <span className="text-neutral-500 block uppercase text-[8px] tracking-wider">Input Limit</span>
                                      <span className="text-neutral-200 font-bold">{m.inputTokenLimit ? m.inputTokenLimit.toLocaleString() : "-"}</span>
                                    </div>
                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                      <span className="text-neutral-500 block uppercase text-[8px] tracking-wider">Output Limit</span>
                                      <span className="text-neutral-200 font-bold">{m.outputTokenLimit ? m.outputTokenLimit.toLocaleString() : "-"}</span>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Live Model Latency Tester */}
                              <div className="mt-3.5 pt-3.5 border-t border-neutral-850 space-y-2.5">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-purple-400">
                                  ⚡ Connection & Latency Tester
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter test prompt..."
                                    value={testPrompt}
                                    onChange={(e) => setTestPrompt(e.target.value)}
                                    className="flex-1 bg-black/40 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      runLatencyTest(m.name);
                                    }}
                                    disabled={testingModelId !== null}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                                  >
                                    {testingModelId === m.name ? (
                                      <>
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Testing...
                                      </>
                                    ) : (
                                      "Run Test"
                                    )}
                                  </button>
                                </div>

                                {testResult && (
                                  <div className="bg-black/30 border border-neutral-850 p-2.5 rounded-lg space-y-1.5 text-[9px] font-mono leading-relaxed select-text" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                                      <span className="text-neutral-500 uppercase">Status</span>
                                      <span className={testResult.success ? "text-emerald-450 font-bold" : "text-rose-455 font-bold"}>
                                        {testResult.success ? "SUCCESS" : "FAILED"}
                                      </span>
                                    </div>
                                    {testResult.success ? (
                                      <>
                                        <div className="flex justify-between items-center">
                                          <span className="text-neutral-500 uppercase">Latency</span>
                                          <span className="text-cyan-400 font-bold">{testResult.latencyMs} ms</span>
                                        </div>
                                        {testResult.inputTokens !== undefined && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-neutral-500 uppercase">Tokens</span>
                                            <span className="text-neutral-300">
                                              {testResult.inputTokens} in / {testResult.outputTokens} out
                                            </span>
                                          </div>
                                        )}
                                        <div className="pt-1 border-t border-neutral-900 mt-1">
                                          <span className="text-neutral-500 block uppercase mb-1">Response</span>
                                          <div className="bg-black/60 p-2 rounded text-neutral-200 overflow-x-auto whitespace-pre-wrap max-h-[100px] border border-neutral-900">
                                            {testResult.response}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-rose-350 bg-rose-950/10 p-2 rounded border border-rose-900/30 whitespace-pre-wrap overflow-x-auto">
                                        Error: {testResult.error}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            selectedProvider === "gemini" || selectedProvider === "openai" || selectedProvider === "anthropic" ? (
                              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                                <span>In: {m.inputTokenLimit ? m.inputTokenLimit.toLocaleString() : "-"}</span>
                                <span>Out: {m.outputTokenLimit ? m.outputTokenLimit.toLocaleString() : "-"}</span>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                                <span>Library: {m.description.split("Library: ")[1]?.split(".")[0] || "N/A"}</span>
                              </div>
                            )
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchModels(selectedProvider)}
                      className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Reload
                    </button>
                    <button
                      onClick={() => setModels([])}
                      className="py-1.5 px-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-rose-455 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
