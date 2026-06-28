import * as api from "../../api/index.js";
import React, { useState, useEffect } from "react";
import { Sparkles, BarChart2, Check, Copy } from "lucide-react";
import { GeneratedPanel } from "../../types";
import { fetchWithAuth } from "../../utils.js";

interface TitleABValidatorProps {
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  panels?: GeneratedPanel[];
}

interface TestedTitle {
  title: string;
  ctr_score: number;
  clickbait_level: string;
  reasoning: string;
}

interface ABResult {
  original_score: number;
  suggested_alternatives: TestedTitle[];
}

export default function TitleABValidator({
  addNotification,
  scrapedTitle,
  panels,
}: TitleABValidatorProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(scrapedTitle || "");

  const getDeducedEvent = () => {
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

  const [event, setEvent] = useState(getDeducedEvent());

  useEffect(() => {
    if (scrapedTitle) {
      setTitle(scrapedTitle);
    }
  }, [scrapedTitle]);

  useEffect(() => {
    if (panels && panels.length > 0) {
      const parts = panels
        .map((p) => p.visual_description || p.speech_text)
        .filter(Boolean);
      if (parts.length > 0) {
        setEvent(parts.slice(-3).join(". "));
      }
    }
  }, [panels]);
  const [results, setResults] = useState<ABResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const json = await api.runTitleAbSkill(fetchWithAuth, {
        title,
        key_climax_event: event,
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
      if (json.success && json.result) {
        setResults(json.result);
        if (addNotification) {
          addNotification("Title A/B evaluation report ready!", "success");
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("A/B evaluation encountered an error", "error");
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
          <BarChart2 className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            A/B Title Validator
          </h4>
        </div>
        <button
          onClick={handleValidate}
          disabled={loading || !title || !event}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Evaluating..." : "✦ Validate Title"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Current Video Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Climax / Story Hook Event
            </label>
            <textarea
              rows={3}
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Highlight the key event (e.g. Sung Jinwoo defeats the dungeon boss solo)..."
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-mono text-neutral-500 uppercase font-semibold">
            Evaluation Results
          </label>
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 h-full min-h-[220px] flex flex-col justify-between">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-neutral-900/50 p-3 rounded-lg border border-neutral-850">
                  <span className="text-xs font-bold text-neutral-300 font-sans">
                    Original Title Score:
                  </span>
                  <span className="text-sm font-mono font-bold text-purple-400">
                    {(results.original_score || 6.2).toFixed(1)}/10
                  </span>
                </div>

                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {(results.suggested_alternatives || []).map((alt, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850/65 flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center pr-8">
                        <span className="text-xs font-bold text-white font-sans">
                          {alt.title}
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                          {(alt.ctr_score || 8.5).toFixed(1)}/10
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-450 font-sans leading-relaxed">
                        Reason: {alt.reasoning} (Bait Level:{" "}
                        <span className="text-purple-300 uppercase font-mono text-[9px]">
                          {alt.clickbait_level || "Medium"}
                        </span>
                        )
                      </p>
                      <button
                        onClick={() => copyToClipboard(alt.title, idx)}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 text-neutral-500 space-y-2">
                <Sparkles className="h-8 w-8 text-neutral-700 animate-pulse" />
                <p className="text-xs font-sans">
                  No scores generated yet. Run validation to see click-through
                  suggestions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
