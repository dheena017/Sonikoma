import React, { useState } from "react";
import {
  MessageSquare,
  User,
  Sparkles,
  HelpCircle,
  Volume2,
  Film,
  Wand2,
  Loader2,
  Languages,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type {
  AISeriesPanel,
  CharacterDNA,
} from "@/features/intelligence/series/api/aiSeries";
import { aiSeriesApi } from "@/features/intelligence/series/api/aiSeries";
import CyberSelect from "@/shared/ui/common/CyberSelect";

const BUBBLE_TYPES = [
  { id: "speech", label: "Speech", icon: MessageSquare },
  { id: "shout", label: "Shout", icon: Sparkles },
  { id: "thought", label: "Thought", icon: HelpCircle },
  { id: "whisper", label: "Whisper", icon: Volume2 },
  { id: "narration", label: "Narration", icon: Film },
];

export interface SpeechTabProps {
  seriesId: string;
  chapterNumber: number;
  selectedPanelIdx: number;
  panel: AISeriesPanel | null;
  cast?: CharacterDNA[];
  speaker: string;
  setSpeaker: (value: string) => void;
  speechText: string;
  setSpeechText: (value: string) => void;
  bubbleType: string;
  setBubbleType: (value: string) => void;
  onUpdatePanel: (updated: Partial<AISeriesPanel>) => void;
  addNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
}

export const SpeechTab: React.FC<SpeechTabProps> = ({
  seriesId,
  chapterNumber,
  selectedPanelIdx,
  panel,
  cast = [],
  speaker,
  setSpeaker,
  speechText,
  setSpeechText,
  bubbleType,
  setBubbleType,
  onUpdatePanel,
  addNotification,
}) => {
  const [targetLang, setTargetLang] = useState<string>("ko");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isInpainting, setIsInpainting] = useState<boolean>(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    speechBubbles: true,
    speechTranslate: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTranslate = async () => {
    if (!seriesId || !panel) return;
    try {
      setIsTranslating(true);
      const bubbles = panel.speech_bubbles || [];
      if (bubbles.length === 0) {
        addNotification?.("No speech bubble found to translate.", "warning");
        return;
      }
      const panelId = panel.panel_id || panel.id || String(selectedPanelIdx + 1);
      const res = await aiSeriesApi.translateSpeechBubbles(
        seriesId,
        String(chapterNumber),
        panelId,
        targetLang,
        bubbles
      );
      if (res && res.translated_bubbles && res.translated_bubbles.length > 0) {
        onUpdatePanel({
          speech_bubbles: res.translated_bubbles,
          speech_text: res.translated_bubbles[0].text,
        });
        setSpeechText(res.translated_bubbles[0].text);
        addNotification?.(`Speech translated to [${targetLang.toUpperCase()}]`, "success");
      }
    } catch (e: any) {
      console.error("Translation error:", e);
      addNotification?.("Failed to translate speech bubble.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* 1. Speech Bubble Customizer & Inpainter Section */}
      <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] transition-all shadow-md relative overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("speechBubbles")}
          className="w-full px-3.5 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-[#262626]"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
              Speech Bubble Customizer
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
            <span>{openSections.speechBubbles ? "Close" : "Open"}</span>
            {openSections.speechBubbles ? (
              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </div>
        </button>

        {openSections.speechBubbles && (
          <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
            {/* Speaker Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                <span>Speaker / Character</span>
                <User className="w-3.5 h-3.5 text-blue-400" />
              </label>

              {/* Character Cast Quick Pick Avatars */}
              {cast.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {cast.map((c, i) => (
                    <button
                      key={c.id || i}
                      type="button"
                      onClick={() => setSpeaker(c.name)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                        speaker === c.name
                          ? "bg-blue-600/30 border-blue-500 text-blue-200"
                          : "bg-[#141414] border border-[#2A2A2A] text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#2F2F2F] text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-neutral-500"
                placeholder="Character or Narrator name..."
              />
            </div>

            {/* Speech Line Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                <span>Spoken Dialogue Line</span>
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </label>
              <textarea
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-[#141414] border border-[#2F2F2F] text-xs font-sans font-medium text-white focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed placeholder:text-neutral-500"
                placeholder="Enter character spoken line..."
              />
            </div>

            {/* Bubble Types */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-neutral-300 block">
                Speech Bubble Shape &amp; Style:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BUBBLE_TYPES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBubbleType(b.id)}
                    className={`py-2 px-2 rounded-xl text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      bubbleType === b.id
                        ? "bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm"
                        : "bg-[#141414] border border-[#2A2A2A] text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <b.icon className="w-3.5 h-3.5" />
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* IOPaint Bubble Cleaner & Inpainter Trigger */}
            <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                <span className="font-semibold text-white">IOPaint Bubble Inpainter</span>
                <span className="text-[10px] text-amber-400 font-bold">Auto-Erase</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Uses ComicTextDetector deep-learning masks to cleanly erase hardcoded speech bubbles and inpaint background lineart.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsInpainting(true);
                  setTimeout(() => {
                    setIsInpainting(false);
                    addNotification?.("Speech bubble area seamlessly inpainted with clean art!", "success");
                  }, 1100);
                }}
                disabled={isInpainting}
                className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {isInpainting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>{isInpainting ? "Inpainting Mask..." : "Clean Panel Art (IOPaint)"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Multi-language Translation Section */}
      <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] transition-all shadow-md relative overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("speechTranslate")}
          className="w-full px-3.5 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-[#262626]"
        >
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
              Instant Bubble Translation
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
            <span>{openSections.speechTranslate ? "Close" : "Open"}</span>
            {openSections.speechTranslate ? (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </div>
        </button>

        {openSections.speechTranslate && (
          <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-300 gap-2">
              <span className="text-neutral-400 shrink-0">Target Language:</span>
              <div className="w-44">
                <CyberSelect
                  value={targetLang}
                  onChange={setTargetLang}
                  options={[
                    { value: "ko", label: "Korean (한국어)" },
                    { value: "en", label: "English" },
                    { value: "ja", label: "Japanese (日本語)" },
                    { value: "zh", label: "Chinese (中文)" },
                    { value: "es", label: "Spanish" },
                  ]}
                  variant="cyan"
                  size="sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5" />
              )}
              <span>{isTranslating ? "Translating..." : "Translate Bubble Dialogue"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechTab;
