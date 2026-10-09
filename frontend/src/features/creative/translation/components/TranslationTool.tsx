import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  Layers3,
  Copy,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Film,
  Globe2,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { GeneratedPanel } from "@/shared/types";
import * as api from "@/shared/api";
import { fetchWithAuth } from "@/shared/utils";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import CyberSelect from "@/shared/ui/common/CyberSelect";

interface TranslationToolProps {
  panel: GeneratedPanel;
  panels?: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onUpdateDialogue: (val: string) => void;
  onUpdateNarrative?: (val: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

export type PanelTranslationToolProps = TranslationToolProps;


const TONE_PRESETS = [
  { id: "natural", label: "Natural Conversational", hint: "Everyday authentic dialogue" },
  { id: "shonen", label: "Dynamic / Shonen", hint: "High-energy comic impact" },
  { id: "sakuga", label: "Dramatic Sakuga", hint: "Poetic & cinematic tone" },
  { id: "slang", label: "Colloquial / Slang", hint: "Modern street expressions" },
];

export function TranslationTool({
  panel,
  panels,
  setPanels,
  onUpdateDialogue,
  onUpdateNarrative,
  addNotification,
}: TranslationToolProps) {
  const [lang, setLang] = useState("Spanish");
  const [targetScope, setTargetScope] = useState<"dialogue" | "narrative">("dialogue");
  const [selectedTone, setSelectedTone] = useState("natural");

  const [translating, setTranslating] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Editable translation state
  const [targetDraft, setTargetDraft] = useState<string>("");
  const [appliedRecently, setAppliedRecently] = useState(false);

  // Derive source text based on active scope
  const sourceText = targetScope === "dialogue"
    ? (panel?.speech_text || "")
    : (panel?.visual_description || "");

  // Update targetDraft when panel changes or targetScope toggles
  useEffect(() => {
    setTargetDraft("");
    setAppliedRecently(false);
  }, [panel?.id, targetScope]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      addNotification?.(
        `No ${targetScope === "dialogue" ? "dialogue speech" : "narrative description"} found on this panel to translate.`,
        "error"
      );
      return;
    }

    setTranslating(true);
    try {
      const json = await api.runTranslateSkill(fetchWithAuth, {
        text: sourceText,
        target_lang: lang,
        tone: selectedTone,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      const translated = json.result?.translated_text || json.translated_text || "";
      if (json.success && translated) {
        setTargetDraft(translated);
        addNotification?.(`Translated to ${lang} successfully!`, "success");
      } else {
        addNotification?.(json.error || "Translation service did not return text.", "error");
      }
    } catch (e: any) {
      console.error("Translation error:", e);
      addNotification?.(`Translation failed: ${e?.message || "Server error"}`, "error");
    } finally {
      setTranslating(false);
    }
  };

  const handleApplyToStoryboard = () => {
    if (!targetDraft.trim()) return;

    if (targetScope === "dialogue") {
      onUpdateDialogue(targetDraft);
    } else if (onUpdateNarrative) {
      onUpdateNarrative(targetDraft);
    }

    setAppliedRecently(true);
    setTimeout(() => setAppliedRecently(false), 2500);

    addNotification?.(
      `Applied localized ${targetScope === "dialogue" ? "speech dialogue" : "narrative text"} to Panel storyboard!`,
      "success"
    );
  };

  const handleBatchTranslate = async () => {
    if (!panels?.length) return;
    setBatchTranslating(true);
    setBatchProgress({ current: 0, total: panels.length });

    try {
      const updatedPanels: GeneratedPanel[] = [];
      let successCount = 0;

      for (let i = 0; i < panels.length; i++) {
        const item = panels[i];
        setBatchProgress({ current: i + 1, total: panels.length });

        const itemSource = targetScope === "dialogue" ? item.speech_text : item.visual_description;
        if (!itemSource || !itemSource.trim()) {
          updatedPanels.push(item);
          continue;
        }

        try {
          const json = await api.runTranslateSkill(fetchWithAuth, {
            text: itemSource,
            target_lang: lang,
            tone: selectedTone,
            model: localStorage.getItem("ai_comic_model") || undefined,
          });

          const translated = json.result?.translated_text || json.translated_text || "";
          if (json.success && translated) {
            successCount++;
            if (targetScope === "dialogue") {
              updatedPanels.push({ ...item, speech_text: translated });
            } else {
              updatedPanels.push({ ...item, visual_description: translated });
            }
          } else {
            updatedPanels.push(item);
          }
        } catch (err) {
          console.error(`Batch item ${i} translation failed:`, err);
          updatedPanels.push(item);
        }
      }

      if (setPanels) {
        setPanels(updatedPanels);
      }

      // If active panel was in this batch, sync local targetDraft
      const activeIdx = panels.findIndex((p) => p.id === panel.id);
      if (activeIdx !== -1 && updatedPanels[activeIdx]) {
        const activeUpdated = targetScope === "dialogue"
          ? updatedPanels[activeIdx].speech_text
          : updatedPanels[activeIdx].visual_description;
        setTargetDraft(activeUpdated || "");
      }

      addNotification?.(
        `Batch translated ${successCount} of ${panels.length} panels into ${lang}!`,
        "success"
      );
    } catch (error) {
      console.error(error);
      addNotification?.("Batch translation encountered an unexpected error.", "error");
    } finally {
      setBatchTranslating(false);
      setBatchProgress(null);
    }
  };



  const handleCopyTarget = () => {
    if (!targetDraft) return;
    navigator.clipboard.writeText(targetDraft);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
    addNotification?.("Copied localized text to clipboard!", "success");
  };

  // Metrics
  const sourceWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const sourceCharCount = sourceText.length;
  const targetWordCount = targetDraft.trim() ? targetDraft.trim().split(/\s+/).length : 0;
  const targetCharCount = targetDraft.length;
  const charDeltaPct = sourceCharCount > 0 && targetCharCount > 0
    ? Math.round(((targetCharCount - sourceCharCount) / sourceCharCount) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col justify-between space-y-4">
      {/* ── TOP SECTION: CONTROLS & LANGUAGE SELECTION ── */}
      <div className="space-y-3">
        {/* ROW 1: SCOPE SWITCHER */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-850">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
            <button
              onClick={() => setTargetScope("dialogue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                targetScope === "dialogue"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Speech Dialogue
            </button>
            <button
              onClick={() => setTargetScope("narrative")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                targetScope === "narrative"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Visual Narrative
            </button>
          </div>

          <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
            Active: {targetScope === "dialogue" ? "Character Speech Bubbles" : "Scene Description"}
          </span>
        </div>

        {/* ROW 2: TARGET LANGUAGE & TONE DROPDOWNS (SIDE-BY-SIDE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* TARGET LANGUAGE */}
          <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#3B82F6]" /> Target Language
              </span>
              <span className="text-[10px] font-mono text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-2 py-0.5 rounded-full font-semibold">
                Selected: {lang}
              </span>
            </div>

            <CyberSelect
              value={lang}
              onChange={setLang}
              size="md"
              searchable
              options={[
                { value: "Spanish", label: "Spanish (Español)", description: "Neutral Spanish" },
                { value: "Japanese", label: "Japanese (日本語)", description: "Authentic manga style" },
                { value: "Korean", label: "Korean (한국어)", description: "Authentic webtoon style" },
                { value: "Chinese", label: "Chinese (简体中文)", description: "Manhua localization" },
                { value: "French", label: "French (Français)", description: "Standard French" },
                { value: "German", label: "German (Deutsch)", description: "Standard German" },
                { value: "Tamil", label: "Tamil (தமிழ்)", description: "Direct native localization" },
                { value: "Hindi", label: "Hindi (हिन्दी)", description: "Devanagari localization" },
                { value: "Portuguese", label: "Portuguese (Português)", description: "BR/PT localization" },
                { value: "Italian", label: "Italian (Italiano)", description: "Standard Italian" },
                { value: "Russian", label: "Russian (Русский)", description: "Standard Russian" },
                { value: "Arabic", label: "Arabic (العربية)", description: "Modern standard Arabic" },
                { value: "Indonesian", label: "Indonesian (Bahasa)", description: "Standard Indonesian" },
                { value: "Vietnamese", label: "Vietnamese (Tiếng Việt)", description: "Standard Vietnamese" },
                { value: "Thai", label: "Thai (ไทย)", description: "Standard Thai" },
                { value: "English", label: "English", description: "Standard English" },
              ]}
            />
          </div>

          {/* TRANSLATION TONE DROPDOWN */}
          <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B82F6]" /> Translation Tone
              </span>
              <span className="text-[10px] font-mono text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-2 py-0.5 rounded-full font-semibold">
                {TONE_PRESETS.find(t => t.id === selectedTone)?.label || selectedTone}
              </span>
            </div>

            <CyberSelect
              value={selectedTone}
              onChange={setSelectedTone}
              size="md"
              options={TONE_PRESETS.map((t) => ({
                value: t.id,
                label: t.label,
                description: t.hint,
              }))}
            />
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION: SIDE-BY-SIDE TRANSLATION WORKBENCH ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
        {/* SOURCE SCRIPT CARD */}
        <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950/90 p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
                Source {targetScope === "dialogue" ? "Speech" : "Narrative"}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                Editable
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {sourceWordCount} words · {sourceCharCount} chars
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[110px]">
            <textarea
              value={sourceText}
              onChange={(e) => {
                if (targetScope === "dialogue") {
                  onUpdateDialogue(e.target.value);
                } else if (onUpdateNarrative) {
                  onUpdateNarrative(e.target.value);
                }
              }}
              placeholder={
                targetScope === "dialogue"
                  ? "Enter original comic dialogue to translate..."
                  : "Enter original scene visual narrative to translate..."
              }
              className="w-full flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 resize-none focus:outline-none font-sans leading-relaxed min-h-[100px]"
            />
          </div>

          <div className="pt-2 border-t border-neutral-850/60 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Source: Original Script</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (sourceText) {
                    navigator.clipboard.writeText(sourceText);
                    addNotification?.("Copied source text!", "success");
                  }
                }}
                disabled={!sourceText}
                className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Copy source text"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              {sourceText && (
                <button
                  onClick={() => {
                    if (targetScope === "dialogue") {
                      onUpdateDialogue("");
                    } else if (onUpdateNarrative) {
                      onUpdateNarrative("");
                    }
                  }}
                  className="text-neutral-400 hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                  title="Clear source text"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TARGET TRANSLATION EDITOR CARD */}
        <div className="flex flex-col rounded-xl border border-[#3B82F6]/30 bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 p-3.5 space-y-2 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#60A5FA] font-bold">
                Localized ({lang})
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                Editable
              </span>
            </div>
            <div className="flex items-center gap-2">
              {charDeltaPct !== 0 && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    charDeltaPct > 20
                      ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400"
                  }`}
                  title="Text expansion indicator relative to source (important for speech bubbles)"
                >
                  <TrendingUp className="w-2.5 h-2.5 inline mr-1" />
                  {charDeltaPct > 0 ? `+${charDeltaPct}%` : `${charDeltaPct}%`}
                </span>
              )}
              <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {targetWordCount} words · {targetCharCount} chars
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[110px]">
            {translating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-4">
                <Sparkles className="w-6 h-6 text-[#3B82F6] animate-spin" />
                <span className="text-xs font-mono text-[#60A5FA]">
                  Translating into {lang}...
                </span>
              </div>
            ) : (
              <textarea
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                placeholder={`Localized ${lang} script will appear here. Click 'Translate Active Panel' below or edit directly...`}
                className="w-full flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-400 resize-none focus:outline-none font-sans leading-relaxed min-h-[100px]"
              />
            )}
          </div>

          <div className="pt-2 border-t border-neutral-850/60 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTarget}
                disabled={!targetDraft}
                className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                {copiedTarget ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
              {targetDraft && (
                <button
                  onClick={() => setTargetDraft("")}
                  className="text-neutral-400 hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                  title="Clear output"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {targetDraft && (
              <span className="text-[9px] text-[#60A5FA] font-mono">
                Ready to commit to panel
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION CONTROLS ROW ── */}
      <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 flex flex-wrap items-center justify-between gap-3">
        {/* LEFT ACTIONS: TRANSLATE & BATCH */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTranslate}
            disabled={translating || !sourceText}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-[#3B82F6] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {translating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Translating Panel...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Translate Active Panel
              </>
            )}
          </button>

          <Tooltip
            text="Batch translate every panel along the timeline in 1 click"
            placement="top"
          >
            <button
              onClick={handleBatchTranslate}
              disabled={batchTranslating || !panels?.length}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA] hover:bg-[#3B82F6]/20 disabled:opacity-40 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Layers3 className={`w-3.5 h-3.5 ${batchTranslating ? "animate-spin" : ""}`} />
              {batchTranslating ? (
                <span>
                  Translating ({batchProgress?.current}/{batchProgress?.total})...
                </span>
              ) : (
                <span>Batch Translate Timeline ({panels?.length || 0})</span>
              )}
            </button>
          </Tooltip>
        </div>

        {/* RIGHT ACTIONS: APPLY TO STORYBOARD */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleApplyToStoryboard}
            disabled={!targetDraft.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              appliedRecently
                ? "bg-emerald-500 text-black border-emerald-400"
                : targetDraft.trim()
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-md shadow-emerald-500/20"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 opacity-50 cursor-not-allowed"
            }`}
          >
            {appliedRecently ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Applied to Storyboard!
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply to Storyboard
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

export const PanelTranslationTool = TranslationTool;
export default TranslationTool;

