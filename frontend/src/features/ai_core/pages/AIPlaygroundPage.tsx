import React, { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  RefreshCw,
  Send,
  Zap,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react";

interface AIPlaygroundPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface DynamicModelOption {
  id: string;
  name: string;
  provider: string;
  provider_name: string;
}

const PRESET_PROMPTS = [
  { label: "Comic Narration Script", prompt: "Convert this action-packed manga sequence into a dramatic Japanese anime voiceover script with sound effects and emotional character lines." },
  { label: "Panel Visual Analysis", prompt: "Analyze this comic panel: identify character expressions, background setting, mood lighting, and key dialogue focus." },
  { label: "YouTube Title & Chapters", prompt: "Generate 5 viral YouTube title concepts and timestamped storyboard chapter breakdowns for this manga recap episode." },
  { label: "Dialogue Translation", prompt: "Translate this Japanese dialogue bubble into punchy English comic dialogue while preserving tone and character persona." },
];

export default function AIPlaygroundPage({ addNotification }: AIPlaygroundPageProps) {
  const [availableModels, setAvailableModels] = useState<DynamicModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [promptText, setPromptText] = useState<string>("");
  const [outputResult, setOutputResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
            if (list.length > 0) {
              setSelectedModel(list[0].id);
            }
          }
        }
      } catch {
        // Fallback handled
      }
    };
    fetchModels();
  }, []);

  const handleRun = async () => {
    if (!promptText.trim()) {
      addNotification?.("Please enter a prompt to execute", "error");
      return;
    }

    setIsLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/v1/ai/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt: promptText,
          capability: "text",
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setLatencyMs(elapsed);

      if (data.success) {
        setOutputResult(data.data?.text || data.text || JSON.stringify(data.data, null, 2) || "Execution completed successfully.");
        addNotification?.(`Executed in ${elapsed}ms`, "success");
      } else {
        setOutputResult(`Error: ${data.error || "Failed to execute prompt."}`);
        addNotification?.(data.error || "Execution failed", "error");
      }
    } catch {
      setOutputResult("Network request error occurred.");
      addNotification?.("Playground network error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    addNotification?.("Copied output to clipboard", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
            AI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Playground
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
            Test any model in real-time with customizable prompts, presets, and live latency readouts.
          </p>
        </div>
      </div>

      {/* Model Selector & Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#161616] border border-neutral-850 p-4 space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase font-mono block">Target Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider_name})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 rounded-2xl bg-[#161616] border border-neutral-850 p-4 space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase font-mono block">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPromptText(p.prompt)}
                className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer font-mono"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Output Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase font-mono block">Input Prompt</span>
            <textarea
              rows={8}
              placeholder="Enter your prompt here..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-neutral-500 font-mono">{promptText.length} characters</span>
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-500/20"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Generating..." : "Execute Prompt"}</span>
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase font-mono block">Model Output</span>
              {latencyMs && (
                <span className="text-[10px] text-purple-400 font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {latencyMs}ms
                </span>
              )}
            </div>
            <div className="w-full h-52 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 overflow-y-auto whitespace-pre-wrap">
              {outputResult || <span className="text-neutral-600 italic">Execution response will appear here...</span>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCopy}
              disabled={!outputResult}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied" : "Copy Output"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
