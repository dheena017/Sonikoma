import * as api from "@/api";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  RefreshCw,
  RotateCcw,
  Play,
  Square,
  BookmarkCheck,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { cleanDialogueDisplay, fetchWithAuth } from "@/utils";

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
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  // Sync raw speech text from panels whenever panels change
  useEffect(() => {
    if (scrapedGenre) {
      setGenre(scrapedGenre);
    }
  }, [scrapedGenre]);

  const extractRawLines = () => {
    return panels.length > 0
      ? panels
          .map((p) => cleanDialogueDisplay(p.speech_text).speech)
          .filter(Boolean)
      : [];
  };

  const [rawLines, setRawLines] = useState<string[]>(extractRawLines);

  const handleSyncTimeline = () => {
    const lines = extractRawLines();
    setRawLines(lines);
    addNotification?.(
      `Synced ${lines.length} speech dialogue lines from storyboard timeline!`,
      "info"
    );
  };

  const handleDramatize = async () => {
    setLoading(true);
    try {
      const json = await api.runDramatizeSkill(fetchWithAuth, {
        raw_ocr_text: rawLines,
        genre,
        scene_context: context,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result && json.result.dramatized_scripts) {
        setResults(json.result.dramatized_scripts);
      } else if (json.success && json.result) {
        const resList = Array.isArray(json.result)
          ? json.result
          : [json.result.dramatized_script || JSON.stringify(json.result)];
        setResults(resList);
      }
      addNotification?.(
        "Dramatized speech text script successfully!",
        "success"
      );
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

    addNotification?.(
      "Successfully applied enhanced script to all timeline panels!",
      "success"
    );
  };

  const handleApplySingleLine = (lineIdx: number, text: string) => {
    if (!setPanels || !panels[lineIdx]) return;
    const targetId = panels[lineIdx].id;

    setPanels((prev) =>
      prev.map((p) => {
        if (p.id === targetId) {
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const newDuration = Math.max(
            2.5,
            Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
          );
          return {
            ...p,
            speech_text: text,
            duration: newDuration,
          };
        }
        return p;
      })
    );

    addNotification?.(`Applied line to Panel #${lineIdx + 1}!`, "success");
  };

  const handlePreviewLineTTS = (text: string, idx: number) => {
    if (playingIdx === idx) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingIdx(null);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.onend = () => setPlayingIdx(null);
      utter.onerror = () => setPlayingIdx(null);
      setPlayingIdx(idx);
      window.speechSynthesis.speak(utter);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Dialogue & Script Dramatizer
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Enhance raw OCR webtoon speech bubbles into high-retention
              cinematic voice scripts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncTimeline}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Sync raw dialogue lines from current storyboard panels"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>Sync Timeline</span>
          </button>

          <button
            onClick={handleDramatize}
            disabled={loading || rawLines.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-200" />
            )}
            <span>{loading ? "Dramatizing..." : "✦ Enhance Script"}</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN BALANCED INPUT & OUTPUT LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (5 COLS): GENRE + CONTEXT + RAW DIALOGUE INPUTS */}
        <div className="xl:col-span-5 space-y-4 bg-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-inner">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
                GENRE CONTEXT
              </label>
              {/* Preset pills */}
              <div className="flex items-center gap-1">
                {["Fantasy Action", "Romance", "Thriller"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-neutral-900 text-purple-300 border border-purple-500/20 hover:border-purple-400"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-xl p-2.5 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans font-medium"
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
              className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-xl p-2.5 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans leading-relaxed resize-y"
            />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block font-bold">
                DIALOGUE LINES TO DRAMATIZE ({rawLines.length} LINES)
              </label>
              <button
                type="button"
                onClick={() => setRawLines([...rawLines, ""])}
                className="text-[9px] font-mono text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20"
              >
                + Add Line
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-900/50">
              {rawLines.map((line, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-900 border border-neutral-800 focus-within:border-purple-500/60 rounded-xl p-3 space-y-1.5 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded">
                        LINE #{idx + 1}
                      </span>
                      {panels[idx] && (
                        <span className="text-[8px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                          Panel #{idx + 1}
                        </span>
                      )}
                    </div>

                    {rawLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = rawLines.filter((_, i) => i !== idx);
                          setRawLines(copy);
                        }}
                        className="text-[9px] font-mono text-neutral-500 hover:text-rose-400 px-1 py-0.5 transition-colors cursor-pointer"
                        title="Remove line"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={line}
                    onChange={(e) => {
                      const copy = [...rawLines];
                      copy[idx] = e.target.value;
                      setRawLines(copy);
                    }}
                    placeholder={`Type speech dialogue line #${idx + 1}...`}
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg p-2 text-neutral-200 outline-none focus:border-purple-500 transition-all font-sans leading-relaxed resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): DRAMATIZED SCRIPT OUTPUT & TIMELINE APPLY */}
        <div className="xl:col-span-7 space-y-3">
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

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 min-h-[360px] flex flex-col justify-between shadow-inner">
            {results.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-80 pr-1 scrollbar-thin scrollbar-thumb-purple-900/50">
                {results.map((resLine, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-neutral-900 p-3 rounded-xl border border-neutral-800 hover:border-purple-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-purple-400 font-bold">
                        ENHANCED LINE #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePreviewLineTTS(resLine, idx)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            playingIdx === idx
                              ? "bg-purple-600 text-white animate-pulse"
                              : "bg-neutral-950 text-purple-300 border border-purple-500/30 hover:text-white"
                          }`}
                        >
                          {playingIdx === idx ? (
                            <Square className="w-2.5 h-2.5 fill-current" />
                          ) : (
                            <Play className="w-2.5 h-2.5 fill-current" />
                          )}
                          <span>{playingIdx === idx ? "Stop" : "Listen"}</span>
                        </button>
                        {setPanels && panels[idx] && (
                          <button
                            onClick={() => handleApplySingleLine(idx, resLine)}
                            className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Apply to panel timeline"
                          >
                            <BookmarkCheck className="w-2.5 h-2.5" />
                            <span>Panel #{idx + 1}</span>
                          </button>
                        )}
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
                    Review dialogue lines on the left and click "✦ Enhance
                    Script" to compose high-inflection voice script lines.
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
                <span>Apply Dramatized Script to All Timeline Panels</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
