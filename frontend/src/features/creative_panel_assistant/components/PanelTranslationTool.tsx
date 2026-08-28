import React, { useState } from "react";
import { Sparkles, Check, AlertTriangle, Layers3 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface PanelTranslationToolProps {
  panel: GeneratedPanel;
  panels?: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onUpdateDialogue: (val: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function PanelTranslationTool({
  panel,
  panels,
  setPanels,
  onUpdateDialogue,
  addNotification,
}: PanelTranslationToolProps) {
  const [lang, setLang] = useState("Spanish");
  const [translating, setTranslating] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
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
      const json = await api.runTranslateSkill(fetchWithAuth, {
        text: panel.speech_text,
        target_lang: lang,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setTranslationResult(json.result.translated_text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTranslating(false);
    }
  };

  const handleBatchTranslate = async () => {
    if (!panels?.length) return;
    setBatchTranslating(true);
    try {
      const translatedPanels = await Promise.all(
        panels.map(async (panelItem) => {
          try {
            const json = await api.runTranslateSkill(fetchWithAuth, {
              text: panelItem.speech_text,
              target_lang: lang,
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
            if (json.success && json.result) {
              return { ...panelItem, speech_text: json.result.translated_text };
            }
            return panelItem;
          } catch (error) {
            console.error(error);
            return panelItem;
          }
        })
      );

      if (setPanels) {
        setPanels(translatedPanels);
      }
      if (addNotification) {
        addNotification(
          `Translated ${translatedPanels.length} panels`,
          "success"
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchTranslating(false);
    }
  };

  const handleScrub = async () => {
    setScrubbing(true);
    try {
      const json = await api.runCopyrightScrubSkill(fetchWithAuth, {
        text: panel.speech_text,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setScrubResult(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScrubbing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-purple-300">
              Translation workflow
            </h5>
            <p className="mt-1 text-sm text-neutral-400">
              Localize dialogue and review compliance in one place.
            </p>
          </div>
          <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
            AI assisted
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Dialogue translation
            </h5>
            <span className="rounded-full border border-neutral-800 bg-neutral-900/60 px-2 py-1 text-[9px] font-mono text-neutral-500">
              Multilingual
            </span>
          </div>

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
            <div className="flex items-center gap-2">
              <Tooltip text="Translate speech for this panel" placement="top">
                <button
                  onClick={handleTranslate}
                  disabled={translating || !panel.speech_text}
                  aria-label="Translate this panel"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 text-white transition-all cursor-pointer"
                >
                  {translating ? (
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              </Tooltip>

              <Tooltip text="Translate all panels in timeline" placement="top">
                <button
                  onClick={handleBatchTranslate}
                  disabled={batchTranslating || !panels?.length}
                  aria-label="Translate all panels"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {batchTranslating ? (
                    <Layers3 className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Layers3 className="h-4 w-4" />
                  )}
                </button>
              </Tooltip>
            </div>
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

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Compliance scan
            </h5>
            <span className="rounded-full border border-neutral-800 bg-neutral-900/60 px-2 py-1 text-[9px] font-mono text-neutral-500">
              Safety check
            </span>
          </div>

          <Tooltip text="Scan speech dialogue against safety policies" placement="top">
            <button
              onClick={handleScrub}
              disabled={scrubbing || !panel.speech_text}
              aria-label="Scan compliance for this panel"
              className="w-full px-3 py-1.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {scrubbing ? "Scanning script..." : "✦ Scan Compliance"}
            </button>
          </Tooltip>

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
    </div>
  );
}
