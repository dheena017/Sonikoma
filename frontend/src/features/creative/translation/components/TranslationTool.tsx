import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  AlertTriangle,
  Layers3,
  Copy,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Film,
  Globe2,
  SlidersHorizontal,
  ShieldCheck,
  ArrowRight,
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

const POPULAR_LANGUAGES = [
  { code: "Japanese", label: "Japanese", flag: "🇯🇵" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { code: "Korean", label: "Korean", flag: "🇰🇷" },
  { code: "French", label: "French", flag: "🇫🇷" },
  { code: "German", label: "German", flag: "🇩🇪" },
  { code: "Tamil", label: "Tamil", flag: "🇮🇳" },
  { code: "Chinese", label: "Chinese", flag: "🇨🇳" },
];

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
  const [scrubbing, setScrubbing] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Editable translation state
  const [targetDraft, setTargetDraft] = useState<string>("");
  const [appliedRecently, setAppliedRecently] = useState(false);

  const [scrubResult, setScrubResult] = useState<{
    contains_violation: boolean;
    violation_type: string;
    sanitized_text: string;
    explanation: string;
  } | null>(null);

  // Derive source text based on active scope
  const sourceText = targetScope === "dialogue"
    ? (panel?.speech_text || "")
    : (panel?.visual_description || "");

  // Update targetDraft when panel changes or targetScope toggles
  useEffect(() => {
    setTargetDraft("");
    setScrubResult(null);
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
      const toneHint = TONE_PRESETS.find((t) => t.id === selectedTone)?.label || "Natural";
      const payloadText = selectedTone !== "natural"
        ? `[Tone: ${toneHint}] ${sourceText}`
        : sourceText;

      const json = await api.runTranslateSkill(fetchWithAuth, {
        text: payloadText,
        target_lang: lang,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (json.success && json.result) {
        setTargetDraft(json.result.translated_text || "");
        addNotification?.(`Translated to ${lang} successfully!`, "success");
      } else {
        addNotification?.("Translation service did not return text.", "error");
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
            model: localStorage.getItem("ai_comic_model") || undefined,
          });

          if (json.success && json.result?.translated_text) {
            successCount++;
            if (targetScope === "dialogue") {
              updatedPanels.push({ ...item, speech_text: json.result.translated_text });
            } else {
              updatedPanels.push({ ...item, visual_description: json.result.translated_text });
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

  const handleScrub = async () => {
    const textToCheck = targetDraft.trim() || sourceText.trim();
    if (!textToCheck) {
      addNotification?.("No text to scan for safety compliance.", "error");
      return;
    }

    setScrubbing(true);
    try {
      const json = await api.runCopyrightScrubSkill(fetchWithAuth, {
        text: textToCheck,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setScrubResult(json.result);
        if (json.result.contains_violation) {
          addNotification?.("Compliance check flagged potential policy violations.", "warning");
        } else {
          addNotification?.("Script conforms fully to content & copyright guidelines!", "success");
        }
      }
    } catch (e: any) {
      console.error("Compliance scrub error:", e);
      addNotification?.("Failed to run compliance scanner.", "error");
    } finally {
      setScrubbing(false);
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
        {/* ROW 1: SCOPE SWITCHER & TONE PRESETS */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950/80 rounded-xl border border-neutral-850">
          {/* SCOPE TABS */}
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

          {/* TONE PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-[#60A5FA]" /> Tone:
            </span>
            {TONE_PRESETS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTone(t.id)}
                title={t.hint}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer border ${
                  selectedTone === t.id
                    ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA] font-bold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: TARGET LANGUAGE BAR */}
        <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-850 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[#3B82F6]" /> Target Language
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400">
                AI Engine: <strong className="text-[#60A5FA]">{localStorage.getItem("ai_comic_model") || "Auto-Routed (Smart)"}</strong>
              </span>
              <span className="text-neutral-600">&bull;</span>
              <span className="text-[10px] font-mono text-neutral-400">
                Selected: <strong className="text-white">{lang}</strong>
              </span>
            </div>
          </div>

          {/* QUICK LANGUAGE CHIPS */}
          <div className="flex flex-wrap items-center gap-1.5">
            {POPULAR_LANGUAGES.map((item) => (
              <button
                key={item.code}
                onClick={() => setLang(item.code)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  lang === item.code
                    ? "bg-[#3B82F6]/25 border-[#3B82F6] text-white font-bold shadow-sm"
                    : "bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {/* CYBERSELECT FOR COMPLETE LANGUAGE LIST */}
            <div className="w-48 ml-auto">
              <CyberSelect
                value={lang}
                onChange={setLang}
                size="sm"
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
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION: SIDE-BY-SIDE TRANSLATION WORKBENCH ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
        {/* SOURCE SCRIPT CARD */}
        <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950/90 p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
              Source {targetScope === "dialogue" ? "Speech" : "Narrative"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {sourceWordCount} words · {sourceCharCount} chars
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[170px] pr-1">
            {sourceText ? (
              <p className="text-xs text-neutral-200 leading-relaxed font-sans select-text whitespace-pre-wrap">
                {sourceText}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 italic">
                No {targetScope === "dialogue" ? "dialogue speech" : "narrative description"} registered for this panel frame.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-850/60 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Source: English / Original</span>
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

      {/* ── BOTTOM SECTION: COMPLIANCE & SAFETY STUDIO ── */}
      <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-850 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
              Content & Copyright Compliance
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScrub}
              disabled={scrubbing || (!targetDraft && !sourceText)}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              {scrubbing ? (
                <>
                  <Sparkles className="w-3 h-3 animate-pulse text-[#3B82F6]" />
                  Scanning Script...
                </>
              ) : (
                <>✦ Run Safety & Trademark Check</>
              )}
            </button>
          </div>
        </div>

        {scrubResult ? (
          <div className="p-3 bg-neutral-900/90 rounded-lg border border-neutral-800 space-y-2 animate-fade-in text-xs font-sans">
            <div className="flex items-center justify-between">
              {scrubResult.contains_violation ? (
                <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Policy Flag: {scrubResult.violation_type}
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Safe for Webtoon / Tapas Publication
                </span>
              )}
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed">
              {scrubResult.explanation}
            </p>

            {scrubResult.contains_violation && scrubResult.sanitized_text && (
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                    Sanitized Clean Script:
                  </span>
                  <p className="text-xs text-neutral-200 font-mono">
                    "{scrubResult.sanitized_text}"
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTargetDraft(scrubResult.sanitized_text);
                    if (targetScope === "dialogue") {
                      onUpdateDialogue(scrubResult.sanitized_text);
                    } else if (onUpdateNarrative) {
                      onUpdateNarrative(scrubResult.sanitized_text);
                    }
                    setScrubResult(null);
                    addNotification?.("Replaced with sanitized clean script!", "success");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold shrink-0 cursor-pointer shadow-sm"
                >
                  ✓ Apply Clean Script
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] font-mono text-neutral-400 leading-normal">
            Verifies dialogue against trademark infringements, copyright terms, and content publishing standards before syndication.
          </p>
        )}
      </div>
    </div>
  );
}

export const PanelTranslationTool = TranslationTool;
export default TranslationTool;

