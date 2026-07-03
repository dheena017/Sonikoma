import * as api from "@/api";
import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, HelpCircle, Check, Copy } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface OutroCliffhangerAnalyzerProps {
  addNotification?: (msg: string, type: any) => void;
  panels?: GeneratedPanel[];
}

interface CliffhangerOption {
  cliffhanger_concept: string;
  suspense_rating: number;
  retention_tactic: string;
}

interface CliffhangerResult {
  cliffhangers: CliffhangerOption[];
}

export default function OutroCliffhangerAnalyzer({
  addNotification,
  panels,
}: OutroCliffhangerAnalyzerProps) {
  const [loading, setLoading] = useState(false);

  const getDeducedOutline = () => {
    if (panels && panels.length > 0) {
      const parts = panels
        .map((p) => p.visual_description || p.speech_text)
        .filter(Boolean);
      if (parts.length > 0) {
        return parts.slice(-3).join(". ");
      }
    }
    return "";
  };

  const [outline, setOutline] = useState(getDeducedOutline());

  useEffect(() => {
    if (panels && panels.length > 0) {
      const parts = panels
        .map((p) => p.visual_description || p.speech_text)
        .filter(Boolean);
      if (parts.length > 0) {
        setOutline(parts.slice(-3).join(". "));
      }
    }
  }, [panels]);
  const [results, setResults] = useState<CliffhangerResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const json = await api.runCliffhangerSkill(fetchWithAuth, {
        story_outline: outline,
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
      if (json.success && json.result) {
        setResults(json.result);
        if (addNotification) {
          addNotification("Cliffhanger scenarios mapped!", "success");
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Cliffhanger analysis encountered an error", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Outro Cliffhanger Analyzer
          </h4>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !outline}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Analyzing story..." : "✦ Draft Cliffhanger"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Episode Story Outline / Ending Event
            </label>
            <textarea
              rows={4}
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              placeholder="Describe what occurs towards the end of the script..."
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-355 outline-none focus:border-purple-600 transition-all font-sans leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">
            Suggested Cliffhanger Hooks
          </label>
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 h-full min-h-[220px] flex flex-col justify-between">
            {results && results.cliffhangers ? (
              <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
                {results.cliffhangers.map((opt, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-850/60 flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center pr-8">
                      <span className="text-[10px] font-bold text-purple-300 font-sans">
                        Option {idx + 1}
                      </span>
                      <span className="text-[9px] font-mono bg-purple-950 border border-purple-900/60 text-purple-400 px-1.5 py-0.5 rounded font-bold">
                        Suspense: {opt.suspense_rating || 9}/10
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                      {opt.cliffhanger_concept}
                    </p>
                    <div className="text-[9px] text-neutral-500 font-mono pt-1.5 border-t border-neutral-900/40">
                      Tactic: {opt.retention_tactic}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(opt.cliffhanger_concept, idx)
                      }
                      className="absolute top-2.5 right-2 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 text-neutral-500 space-y-2">
                <HelpCircle className="h-8 w-8 text-neutral-700 animate-pulse" />
                <p className="text-xs font-sans">
                  No endings analysed yet. Put your plot outline to suggest
                  high-impact cliffhangers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
