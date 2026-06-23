import React, { useState } from "react";
import { Sparkles, Check, AlertTriangle } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface PanelTranslationToolProps {
  panel: GeneratedPanel;
  onUpdateDialogue: (val: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function PanelTranslationTool({
  panel,
  onUpdateDialogue,
  addNotification,
}: PanelTranslationToolProps) {
  const [lang, setLang] = useState("Spanish");
  const [translating, setTranslating] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  const [translationResult, setTranslationResult] = useState<string | null>(
    null
  );
  const [scrubResult, setScrubResult] = useState<{
    contains_violation: boolean;
    violation_type: string;
    sanitized_text: string;
    explanation: string;
  } | null>(null);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/skills/translate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: panel.speech_text,
          target_lang: lang,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setTranslationResult(json.result.translated_text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTranslating(false);
    }
  };

  const handleScrub = async () => {
    setScrububbing(true);
    try {
      const res = await fetch("/api/skills/copyright-scrub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: panel.speech_text,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setScrubResult(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScrububbing(false);
    }
  };

  const setScrububbing = (val: boolean) => {
    setScrubbing(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Dialogue Translator */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">
          AI Dialogue Translation Studio
        </h5>

        <div className="flex gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-300 outline-none"
          >
            <option>Spanish</option>
            <option>French</option>
            <option>Japanese</option>
            <option>Hindi</option>
            <option>German</option>
            <option>Korean</option>
          </select>
          <button
            onClick={handleTranslate}
            disabled={translating || !panel.speech_text}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
          >
            {translating ? "Translating..." : "Translate"}
          </button>
        </div>

        {translationResult && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 animate-fade-in">
            <span className="text-[9px] font-mono text-neutral-500 uppercase block">
              Result:
            </span>
            <p className="text-xs text-neutral-200">{translationResult}</p>
            <button
              onClick={() => {
                onUpdateDialogue(translationResult);
                setTranslationResult(null);
                if (addNotification)
                  addNotification("Applied translated script!", "success");
              }}
              className="text-[9px] font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ✓ Apply to Storyboard Card
            </button>
          </div>
        )}
      </div>

      {/* Safety compliance scrubber */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">
          Monetization Guidelines Scan
        </h5>

        <button
          onClick={handleScrub}
          disabled={scrubbing || !panel.speech_text}
          className="w-full px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          {scrubbing ? "Scanning script..." : "✦ Scan Compliance"}
        </button>

        {scrubResult && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-1.5">
              {scrubResult.contains_violation ? (
                <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Flagged:{" "}
                  {scrubResult.violation_type}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  ✓ Conforms to Guidelines
                </span>
              )}
            </div>
            <p className="text-[10px] font-sans text-neutral-450 leading-relaxed">
              {scrubResult.explanation}
            </p>
            {scrubResult.contains_violation && (
              <div className="pt-1.5 space-y-1 border-t border-neutral-850 mt-1">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block">
                  Sanitized Recommendation:
                </span>
                <p className="text-xs text-neutral-200">
                  {scrubResult.sanitized_text}
                </p>
                <button
                  onClick={() => {
                    onUpdateDialogue(scrubResult.sanitized_text);
                    setScrubResult(null);
                    if (addNotification)
                      addNotification(
                        "Applied clean script replacement!",
                        "success"
                      );
                  }}
                  className="text-[9px] font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  ✓ Apply Clean Script
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
