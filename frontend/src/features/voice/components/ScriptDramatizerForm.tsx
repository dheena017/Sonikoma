import * as api from "@/api";
import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Wand2, RefreshCw } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface ScriptDramatizerFormProps {
  panels: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification?: (msg: string, type: any) => void;
  scrapedGenre?: string;
}

export default function ScriptDramatizerForm({
  panels,
  setPanels,
  addNotification,
  scrapedGenre,
}: ScriptDramatizerFormProps) {
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(scrapedGenre || "Fantasy Action");
  const [context, setContext] = useState(
    "The protagonist unlocks an ancient forbidden shadow power."
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (scrapedGenre) {
      setGenre(scrapedGenre);
    }
  }, [scrapedGenre]);

  // Collect raw speech text from panels
  const initialRawLines =
    panels.length > 0
      ? panels.map((p) => p.speech_text || "").filter(Boolean)
      : [
          "Who are you? Stay away from me!",
          "I am the sovereign of the dark realm.",
          "This ends here. Prepare to vanish!",
        ];

  const [rawLines, setRawLines] = useState<string[]>(initialRawLines);

  const handleDramatize = async () => {
    setLoading(true);
    try {
      const json = await api.runDramatizeSkill(fetchWithAuth, {
        raw_ocr_text: rawLines,
        genre,
        scene_context: context,
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
      if (json.success && json.result && json.result.dramatized_scripts) {
        setResults(json.result.dramatized_scripts);
      } else if (json.success && json.result) {
        const resList = Array.isArray(json.result)
          ? json.result
          : [json.result.dramatized_script || JSON.stringify(json.result)];
        setResults(resList);
      }
      addNotification?.("Dramatized speech text script successfully!", "success");
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to dramatize script lines.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTimeline = () => {
    if (!setPanels || results.length === 0) return;

    setPanels((prev) => {
      let resultIdx = 0;
      return prev.map((p) => {
        if (p.speech_text && resultIdx < results.length) {
          const newText = results[resultIdx++];
          const words = newText.trim().split(/\s+/).filter(Boolean).length;
          const newDuration = Math.max(
            2.5,
            Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
          );
          return {
            ...p,
            speech_text: newText,
            duration: newDuration,
          };
        }
        return p;
      });
    });

    if (addNotification) {
      addNotification(
        "Successfully applied enhanced text to the timeline!",
        "success"
      );
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#0c0a15] border border-[#1f1b2e] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b172b] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Dialogue & Script Dramatizer
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Enhance raw OCR webtoon speech bubbles into high-retention cinematic voice scripts.
            </p>
          </div>
        </div>

        <button
          onClick={handleDramatize}
          disabled={loading || rawLines.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-200" />}
          <span>{loading ? "Dramatizing..." : "✦ Enhance Script"}</span>
        </button>
      </div>

      {/* 2-COLUMN BALANCED INPUT & OUTPUT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (5 COLS): GENRE + CONTEXT + RAW DIALOGUE INPUTS */}
        <div className="lg:col-span-5 space-y-4 bg-[#07060c] border border-[#1d182e] p-4 rounded-xl shadow-inner">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
              GENRE CONTEXT
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-[#0c0a15] border border-[#241f38] text-xs rounded-xl p-2.5 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
              SCENE CONTEXT / PLOT DETAILS
            </label>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-[#0c0a15] border border-[#241f38] text-xs rounded-xl p-2.5 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans leading-relaxed resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
              DIALOGUE LINES TO DRAMATIZE ({rawLines.length} LINES)
            </label>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-purple-900/50">
              {rawLines.map((line, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[9px] font-mono text-neutral-500 font-bold">
                    LINE #{idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={line}
                    onChange={(e) => {
                      const copy = [...rawLines];
                      copy[idx] = e.target.value;
                      setRawLines(copy);
                    }}
                    className="w-full bg-[#0c0a15] border border-[#241f38] text-xs rounded-xl p-2.5 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans leading-relaxed resize-y"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): DRAMATIZED SCRIPT OUTPUT & TIMELINE APPLY */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
              DRAMATIZED SCRIPT OUTPUT
            </label>
            {results.length > 0 && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                {results.length} Lines Dramatized
              </span>
            )}
          </div>

          <div className="bg-[#07060c] p-4 rounded-xl border border-[#1d182e] min-h-[360px] flex flex-col justify-between shadow-inner">
            {results.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-80 pr-1 scrollbar-thin scrollbar-thumb-purple-900/50">
                {results.map((resLine, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-[#0c0a15] p-3 rounded-xl border border-[#241f38] hover:border-purple-500/40 transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-purple-400 font-bold">
                        ENHANCED LINE #{idx + 1}
                      </span>
                      <button
                        onClick={() => copyToClipboard(resLine, idx)}
                        className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                        title="Copy Line"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans font-medium pr-2">
                      {resLine}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto text-center py-12 text-neutral-500 space-y-3">
                <Sparkles className="h-9 w-9 text-purple-500/50 animate-pulse" />
                <div>
                  <p className="text-xs font-mono text-neutral-300 font-bold">
                    No dramatized lines generated yet.
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1 max-w-xs">
                    Review dialogue lines on the left and click "✦ Enhance Script" to compose high-inflection voice script lines.
                  </p>
                </div>
              </div>
            )}

            {results.length > 0 && setPanels && (
              <button
                onClick={handleApplyToTimeline}
                className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 border border-purple-500/30"
              >
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Apply Dramatized Script to Timeline Panels</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
