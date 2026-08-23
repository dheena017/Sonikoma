import React, { useState, useEffect } from "react";
import {
  Scale,
  Sparkles,
  Play,
  Zap,
  CheckCircle2,
  Clock,
  Coins,
} from "lucide-react";

interface AIModelArenaPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface DynamicModelOption {
  id: string;
  name: string;
  provider: string;
  provider_name: string;
}

export default function AIModelArenaPage({ addNotification }: AIModelArenaPageProps) {
  const [availableModels, setAvailableModels] = useState<DynamicModelOption[]>([]);
  const [modelA, setModelA] = useState<string>("");
  const [modelB, setModelB] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("Describe the dramatic reveal of a hidden superhero identity in a manga climax.");
  const [outputA, setOutputA] = useState<string>("");
  const [outputB, setOutputB] = useState<string>("");
  const [latencyA, setLatencyA] = useState<number | null>(null);
  const [latencyB, setLatencyB] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch all models dynamically from REST API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/v1/ai/models");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.models_breakdown)) {
            const list = data.models_breakdown.map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
              provider: m.provider,
              provider_name: m.provider_name || m.provider,
            }));
            setAvailableModels(list);
            if (list.length >= 2) {
              setModelA((prev) => prev || list[0].id);
              setModelB((prev) => prev || list[1].id);
            } else if (list.length === 1) {
              setModelA((prev) => prev || list[0].id);
              setModelB((prev) => prev || list[0].id);
            }
          }
        }
      } catch {
        // Fallback handled
      }
    };
    fetchModels();
  }, []);


  const handleCompare = async () => {
    if (!promptText.trim()) {
      addNotification?.("Please enter a prompt for the arena", "error");
      return;
    }

    setIsLoading(true);
    setOutputA("");
    setOutputB("");
    setLatencyA(null);
    setLatencyB(null);

    const runModel = async (model: string, setOutput: (s: string) => void, setLat: (n: number) => void) => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/v1/ai/playground/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: promptText, capability: "text" }),
        });
        const data = await res.json();
        const elapsed = Math.round(performance.now() - t0);
        setLat(elapsed);
        if (data.success) {
          setOutput(data.data?.text || data.text || JSON.stringify(data.data, null, 2));
        } else {
          setOutput(`Error: ${data.error || "Model execution failed"}`);
        }
      } catch {
        setOutput("Network error.");
      }
    };

    try {
      await Promise.all([
        runModel(modelA, setOutputA, setLatencyA),
        runModel(modelB, setOutputB, setLatencyB),
      ]);
      addNotification?.("Model Arena battle completed!", "success");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
            AI Model{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Arena
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
            Execute the exact same comic prompt on two engines simultaneously to evaluate creative tone, speed, and formatting.
          </p>
        </div>
      </div>

      {/* Arena Prompt Bar */}
      <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3">
        <label className="text-xs font-bold text-neutral-400 uppercase font-mono block">Arena Prompt</label>
        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Enter benchmark prompt..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-purple-500 resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-500/20"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Battling Engines..." : "Run Side-by-Side Comparison"}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side split comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model A */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider_name})
                </option>
              ))}
            </select>
            {latencyA && (
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {latencyA}ms
              </span>
            )}
          </div>
          <div className="h-64 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 overflow-y-auto whitespace-pre-wrap">
            {outputA || <span className="text-neutral-600 italic">Model A output will appear here...</span>}
          </div>
        </div>

        {/* Model B */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <select
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider_name})
                </option>
              ))}
            </select>
            {latencyB && (
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {latencyB}ms
              </span>
            )}
          </div>
          <div className="h-64 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 overflow-y-auto whitespace-pre-wrap">
            {outputB || <span className="text-neutral-600 italic">Model B output will appear here...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
