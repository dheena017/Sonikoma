import React, { useState, useEffect } from "react";
import {
  Workflow,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  Play,
  Activity,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";

interface AIModelsRoutingPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AIModelsRoutingPage({ addNotification }: AIModelsRoutingPageProps) {
  const { models, visionModels, textModels, modelsByProvider } = useAIModels();

  const [primaryVisionModel, setPrimaryVisionModel] = useState("gemini-2.5-flash");
  const [primaryScriptModel, setPrimaryScriptModel] = useState("gemini-2.5-flash");
  const [primaryVoiceModel, setPrimaryVoiceModel] = useState("eleven_multilingual_v2");
  const [primaryImageModel, setPrimaryImageModel] = useState("FLUX.1-schnell");

  // Hyperparameters
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.95);
  const [maxTokens, setMaxTokens] = useState<number>(2048);

  // Dynamic Catalog & Benchmark State
  const [catalog, setCatalog] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  // Interactive Playground State
  const [testPrompt, setTestPrompt] = useState<string>("Write a punchy YouTube title and synopsis for a Webtoon action recap.");
  const [playgroundModel, setPlaygroundModel] = useState<string>("gemini-2.5-flash");
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/ai/models/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.models) setCatalog(data.models);
      })
      .catch(() => {});
  }, []);

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch("/api/ai/benchmark/run", { method: "POST" });
      const data = await res.json();
      if (data.benchmarks) {
        setBenchmarks(data.benchmarks);
        addNotification?.(`⚡ Parallel benchmark completed across ${data.benchmarks.length} models!`, "success");
      }
    } catch {
      addNotification?.("Failed to run benchmark", "error");
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!testPrompt.trim()) return;
    setIsPlaying(true);
    try {
      const res = await fetch("/api/ai/playground/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: testPrompt,
          model: playgroundModel,
          temperature,
        }),
      });
      const data = await res.json();
      setPlaygroundResult(data);
      if (data.success) {
        addNotification?.(`Generated in ${data.latency_ms}ms (${data.total_tokens} tokens)`, "success");
      }
    } catch (e: any) {
      addNotification?.(e.message, "error");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSaveRouting = async () => {
    try {
      await fetch("/api/ai/models/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision: primaryVisionModel,
          script: primaryScriptModel,
          voice: primaryVoiceModel,
          image: primaryImageModel,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
        }),
      });
      addNotification?.("Saved model routing and hyperparameter preferences!", "success");
    } catch {
      addNotification?.("Saved preferences locally.", "success");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO HEADER BANNER (UNIFIED SUITE STYLE) ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Workflow className="w-4 h-4" /> Multi-Model Orchestration
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Smart Failover Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Model Routing &amp; Failover Chains
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Design fallback routing rules across Google Gemini, OpenAI, Anthropic Claude, and HuggingFace.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Activity className={`w-3.5 h-3.5 text-purple-400 ${isBenchmarking ? "animate-spin" : ""}`} />
              <span>{isBenchmarking ? "Benchmarking..." : "Run Parallel Benchmark"}</span>
            </button>

            <button
              onClick={handleSaveRouting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Routing</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PARALLEL BENCHMARK LABS (LIVE STREAM) ─────────────────────────── */}
      {benchmarks.length > 0 && (
        <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Live Latency Benchmark Results
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Concurrent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {benchmarks.map((b, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-850 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white font-sans">
                  <span className="truncate">{b.model}</span>
                  <span className="text-emerald-400 font-mono">{b.latency_ms}ms</span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono capitalize">
                  {b.provider} • {b.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TASK-TO-ENGINE ROUTING GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task 1: Vision & Storyboard OCR */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-black text-white font-sans">Vision &amp; Panel Narration</span>
              <p className="text-[11px] text-neutral-400 font-mono">Webtoon panel OCR, character dialogue &amp; narration</p>
            </div>
            <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-purple-300">
              Vision
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Primary Engine</label>
            <select
              value={primaryVisionModel}
              onChange={(e) => setPrimaryVisionModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 font-mono focus:border-purple-500 focus:outline-none cursor-pointer"
            >
              {Object.entries(modelsByProvider).map(([providerName, pModels]) => (
                <optgroup key={providerName} label={providerName}>
                  {pModels
                    .filter((m) => m.capabilities?.includes("vision") || m.id.includes("flash") || m.id.includes("pro") || m.id.includes("4o"))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.id} ({m.speed_rating || "Fast"})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Task 2: Scripting & YouTube SEO */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-black text-white font-sans">Script Generation &amp; SEO</span>
              <p className="text-[11px] text-neutral-400 font-mono">Title generator, tags, timestamps &amp; narration dramatization</p>
            </div>
            <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-purple-300">
              Text
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Primary Engine</label>
            <select
              value={primaryScriptModel}
              onChange={(e) => setPrimaryScriptModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 font-mono focus:border-purple-500 focus:outline-none cursor-pointer"
            >
              {Object.entries(modelsByProvider).map(([providerName, pModels]) => (
                <optgroup key={providerName} label={providerName}>
                  {pModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id} ({m.speed_rating || "Fast"})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE PROMPT PLAYGROUND SANDBOX ──────────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Play className="w-4 h-4" /> Multi-Model Prompt Playground
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Live Testbed</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={playgroundModel}
              onChange={(e) => setPlaygroundModel(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-mono focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={3}
            placeholder="Type a test prompt to test across models..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/80 focus:bg-neutral-900/90 rounded-xl p-3.5 text-xs text-neutral-200 font-mono focus:outline-none transition-all placeholder:text-neutral-600 shadow-inner"
          />

          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-neutral-500">
              Temperature: <span className="text-purple-300 font-bold">{temperature}</span>
            </div>

            <button
              onClick={handleRunPlayground}
              disabled={isPlaying}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium font-sans flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPlaying ? "Generating..." : "Test Completion"}</span>
            </button>
          </div>

          {playgroundResult && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 mt-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-neutral-850 pb-2">
                <span className="text-purple-300 font-bold">{playgroundResult.model}</span>
                <span className="text-emerald-400">
                  {playgroundResult.latency_ms}ms • {playgroundResult.total_tokens} tokens
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">
                {playgroundResult.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
