import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Wand2 } from "lucide-react";
import { GeneratedPanel } from "../../types";

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
      const res = await fetch("/api/skills/dramatize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_ocr_text: rawLines,
          genre,
          scene_context: context,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result && json.result.dramatized_scripts) {
        setResults(json.result.dramatized_scripts);
      } else if (json.success && json.result) {
        // Fallback in case of slightly different structure
        const resList = Array.isArray(json.result)
          ? json.result
          : [json.result.dramatized_script || JSON.stringify(json.result)];
        setResults(resList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTimeline = () => {
    if (!setPanels || results.length === 0) return;

    setPanels((prev) => {
      let resultIdx = 0;
      return prev.map((p) => {
        // If the panel has dialogue text originally
        if (p.speech_text && resultIdx < results.length) {
          const newText = results[resultIdx++];
          // Calculate new duration based on word count to keep text and audio matched
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
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Text Enhancer
          </h4>
        </div>
        <button
          onClick={handleDramatize}
          disabled={loading || rawLines.length === 0}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Dramatizing..." : "✦ Enhance Script"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Genre Context
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-lg p-2 text-neutral-300 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Scene Context / Plot details
            </label>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-lg p-2 text-neutral-300 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Dialogue Lines to dramatize
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rawLines.map((line, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={line}
                  onChange={(e) => {
                    const copy = [...rawLines];
                    copy[idx] = e.target.value;
                    setRawLines(copy);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-lg p-2 text-neutral-300 outline-none focus:border-purple-600 transition-all font-sans"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">
            Dramatized Script Output
          </label>
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 h-full min-h-[220px] flex flex-col justify-between">
            {results.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-60">
                {results.map((resLine, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-850/50"
                  >
                    <p className="text-xs text-neutral-200 pr-8 leading-relaxed font-sans">
                      {resLine}
                    </p>
                    <button
                      onClick={() => copyToClipboard(resLine, idx)}
                      className="absolute top-2 right-2 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                <Sparkles className="h-8 w-8 text-neutral-700 animate-pulse" />
                <p className="text-xs font-sans">
                  No dramatized lines yet. Set the context and click "Enhance
                  Script".
                </p>
              </div>
            )}

            {results.length > 0 && setPanels && (
              <button
                onClick={handleApplyToTimeline}
                className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-650 to-indigo-600 hover:from-purple-550 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95"
              >
                <Check className="h-4 w-4" />
                Apply to Timeline Cards
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
