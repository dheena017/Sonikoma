import React, { useState } from "react";
import {
  Link,
  Clipboard,
  Smartphone,
  Monitor,
  Mic,
  Globe,
  Eye,
  Sparkles,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  Volume2,
  ShieldCheck,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { VideoFormat, PrivacyStatus } from "../types";
import { CyberSelect, CyberSelectOption } from "@/shared/ui/common/CyberSelect";

interface AgentInputCardProps {
  url: string;
  setUrl: (url: string) => void;
  videoFormat: VideoFormat;
  setVideoFormat: (fmt: VideoFormat) => void;
  language: string;
  setLanguage: (lang: string) => void;
  voice: string;
  setVoice: (voice: string) => void;
  narratorVoice?: string;
  setNarratorVoice?: (voice: string) => void;
  protagonistVoice?: string;
  setProtagonistVoice?: (voice: string) => void;
  chapterRangeStart?: number;
  setChapterRangeStart?: (val: number | undefined) => void;
  chapterRangeEnd?: number;
  setChapterRangeEnd?: (val: number | undefined) => void;
  privacyStatus: PrivacyStatus;
  setPrivacyStatus: (privacy: PrivacyStatus) => void;
  reviewMode?: boolean;
  setReviewMode?: (review: boolean) => void;
  maxPanels?: number;
  setMaxPanels?: (panels: number) => void;
  titleOverride?: string;
  setTitleOverride?: (title: string) => void;
  onLaunch: () => void;
  isLoading: boolean;
}

const NARRATOR_VOICES: CyberSelectOption[] = [
  { value: "en-US-ChristopherNeural", label: "Christopher (Deep Cinematic - Dark Fantasy/Solo Leveling)" },
  { value: "en-US-DavisNeural", label: "Davis (Menacing Low-Bass - Boss/Sovereign)" },
  { value: "en-US-EricNeural", label: "Eric (Gravelly Baritone - Elder/Mentor)" },
  { value: "en-US-GuyNeural", label: "Guy (Determined Action Baritone)" },
  { value: "en-US-AriaNeural", label: "Aria (Serious Dramatic Female Narrator)" },
];

const PROTAGONIST_VOICES: CyberSelectOption[] = [
  { value: "en-US-GuyNeural", label: "Guy (Cold / Determined Lead MC)" },
  { value: "en-US-RyanNeural", label: "Ryan (Composed Tactical Hunter)" },
  { value: "en-US-DavisNeural", label: "Davis (Shadow Monarch Low-Bass MC)" },
  { value: "en-US-AriaNeural", label: "Aria (Cold / Fierce Female Lead)" },
  { value: "en-US-JennyNeural", label: "Jenny (Composed S-Rank Female Hunter)" },
];

const LANGUAGE_OPTIONS: CyberSelectOption[] = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "zh", label: "Chinese (中文)" },
];

const PRIVACY_OPTIONS: CyberSelectOption[] = [
  { value: "unlisted", label: "Unlisted (Safe Preview)" },
  { value: "public", label: "Public (Instant Release)" },
  { value: "private", label: "Private (Channel Only)" },
];

export const AgentInputCard: React.FC<AgentInputCardProps> = ({
  url,
  setUrl,
  videoFormat,
  setVideoFormat,
  language,
  setLanguage,
  voice,
  setVoice,
  narratorVoice = "en-US-ChristopherNeural",
  setNarratorVoice,
  protagonistVoice = "en-US-GuyNeural",
  setProtagonistVoice,
  chapterRangeStart,
  setChapterRangeStart,
  chapterRangeEnd,
  setChapterRangeEnd,
  privacyStatus,
  setPrivacyStatus,
  reviewMode,
  setReviewMode,
  titleOverride,
  setTitleOverride,
  onLaunch,
  isLoading,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-detect chapter/episode number from target URL (e.g. episode_no=146)
  const detectedEp = React.useMemo(() => {
    if (!url) return null;
    const match = url.match(/episode_no=(\d+)/i) || url.match(/[/-](?:chapter|ep|episode)[/-]?(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }, [url]);

  // Track previous detectedEp to detect when user changes or pastes a new URL
  const prevDetectedEpRef = React.useRef<number | null>(null);

  // Automatically align starting episode with the detected chapter in URL, resetting end if URL changed
  React.useEffect(() => {
    if (detectedEp !== null) {
      if (prevDetectedEpRef.current !== null && prevDetectedEpRef.current !== detectedEp) {
        setChapterRangeStart?.(detectedEp);
        setChapterRangeEnd?.(undefined);
      } else if (chapterRangeStart === undefined || chapterRangeStart === null) {
        setChapterRangeStart?.(detectedEp);
      }
      prevDetectedEpRef.current = detectedEp;
    }
  }, [detectedEp]);

  const isRangeMismatched = detectedEp !== null && chapterRangeStart !== undefined && Math.abs(chapterRangeStart - detectedEp) > 5;
  const isInvalidInvertedRange = chapterRangeStart !== undefined && chapterRangeEnd !== undefined && chapterRangeStart > chapterRangeEnd;
  const isRangeTooLarge =
    detectedEp !== null &&
    chapterRangeEnd !== undefined &&
    chapterRangeEnd > (chapterRangeStart || detectedEp) + 5;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim();
        setUrl(clean);
        const match = clean.match(/episode_no=(\d+)/i) || clean.match(/[/-](?:chapter|ep|episode)[/-]?(\d+)/i);
        if (match) {
          const epNum = parseInt(match[1]);
          setChapterRangeStart?.(epNum);
          setChapterRangeEnd?.(undefined);
        }
      }
    } catch {
      // Clipboard access rejected or not available
    }
  };

  return (
    <div className="bg-[#1E1E1E]/90 border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 text-left">
      {/* ── URL Input Form ─────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center justify-between">
          <span className="flex items-center gap-2 text-[#E5E5E5]">
            <Link className="w-4 h-4 text-[#3B82F6]" />
            Series / Chapter URL
          </span>
          <span className="text-[11px] text-[#60A5FA] font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Serious Manhwa Dubbing Active
          </span>
        </label>

        <div className="flex items-center gap-2.5 w-full h-12 px-3.5 sm:px-4 bg-[#121212] border border-[#2F2F2F] rounded-xl focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste comic chapter URL (e.g. https://www.webtoons.com/.../viewer?episode_no=...)"
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none font-mono"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handlePaste}
            className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#252525] border border-[#2F2F2F] hover:border-neutral-600 text-[#9CA3AF] hover:text-[#E5E5E5] text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>
        </div>
      </div>

      {/* ── Key Pipeline Controls ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
            Video Format
          </label>
          <div className="flex items-center h-[44px] p-1 bg-[#121212] rounded-xl border border-[#2F2F2F] shadow-inner">
            <button
              type="button"
              onClick={() => setVideoFormat("shorts")}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                videoFormat === "shorts"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-mono"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] font-mono"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Shorts (9:16)</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoFormat("landscape")}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                videoFormat === "landscape"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-mono"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] font-mono"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 shrink-0" />
              <span>16:9 Video</span>
            </button>
          </div>
        </div>

        {/* Script Language with CyberSelect */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            Script Language
          </label>
          <CyberSelect
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            variant="blue"
            size="lg"
            searchable={false}
            className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs [&>button]:!font-sans"
            placeholder="Select script language..."
            ariaLabel="Select script language"
          />
        </div>

        {/* YouTube Privacy with CyberSelect */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
            YouTube Privacy
          </label>
          <CyberSelect
            value={privacyStatus}
            onChange={(val) => setPrivacyStatus(val as PrivacyStatus)}
            options={PRIVACY_OPTIONS}
            variant="blue"
            size="lg"
            searchable={false}
            className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs [&>button]:!font-sans"
            placeholder="Select privacy..."
            ariaLabel="Select YouTube privacy"
          />
        </div>
      </div>

      {/* ── Character Voice Continuity Engine Controls ─────────────────────── */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E5E5E5]">
              Character Voice Continuity Casting
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40 w-fit">
            <Volume2 className="w-3 h-3" />
            <span>Zero Random Voices • Locked Continuity</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Master Narrator Voice */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#3B82F6]" />
                Cinematic Narrator
              </span>
              <span className="text-[10px] text-[#60A5FA]">Exposition &amp; Storyteller</span>
            </label>
            <CyberSelect
              value={narratorVoice}
              onChange={(v) => {
                setNarratorVoice?.(v);
                setVoice(v);
              }}
              options={NARRATOR_VOICES}
              variant="blue"
              size="lg"
              searchable={false}
              className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs [&>button]:!font-sans"
              placeholder="Select narrator voice..."
              ariaLabel="Select narrator voice"
            />
          </div>

          {/* Lead Protagonist (MC) Voice */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                Lead Protagonist (MC)
              </span>
              <span className="text-[10px] text-[#60A5FA]">Main Character Dialogue</span>
            </label>
            <CyberSelect
              value={protagonistVoice}
              onChange={(v) => setProtagonistVoice?.(v)}
              options={PROTAGONIST_VOICES}
              variant="blue"
              size="lg"
              searchable={false}
              className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs [&>button]:!font-sans"
              placeholder="Select protagonist voice..."
              ariaLabel="Select protagonist voice"
            />
          </div>
        </div>
      </div>

      {/* ── Collapsible Multi-Chapter & Advanced Settings ───────────────────── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Multi-Chapter Auto-Pilot &amp; Advanced Options</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-4 animate-fade-in">
            {/* Multi-Chapter Batch Range */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Multi-Chapter Batch Auto-Pilot (Optional)
                </label>
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  {detectedEp ? `Detected in URL: Ep ${detectedEp}` : "Leave blank for single chapter"}
                </span>
              </div>

              {/* Quick Presets Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (detectedEp) {
                      setChapterRangeStart?.(detectedEp);
                      setChapterRangeEnd?.(detectedEp);
                    } else {
                      setChapterRangeStart?.(undefined);
                      setChapterRangeEnd?.(undefined);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-all border ${
                    (chapterRangeStart === detectedEp && (!chapterRangeEnd || chapterRangeEnd === detectedEp)) ||
                    (chapterRangeStart === undefined && chapterRangeEnd === undefined)
                      ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#93C5FD] font-bold"
                      : "bg-[#181818] border-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E5E5] hover:border-[#383838]"
                  }`}
                >
                  Single Chapter {detectedEp ? `(Ep ${detectedEp})` : "(Current)"}
                </button>

                {detectedEp && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp);
                        setChapterRangeEnd?.(detectedEp + 1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-all border ${
                        chapterRangeStart === detectedEp && chapterRangeEnd === detectedEp + 1
                          ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#93C5FD] font-bold"
                          : "bg-[#181818] border-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E5E5] hover:border-[#383838]"
                      }`}
                    >
                      Batch 2 ({detectedEp} → {detectedEp + 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp);
                        setChapterRangeEnd?.(detectedEp + 2);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-all border ${
                        chapterRangeStart === detectedEp && chapterRangeEnd === detectedEp + 2
                          ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#93C5FD] font-bold"
                          : "bg-[#181818] border-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E5E5] hover:border-[#383838]"
                      }`}
                    >
                      Batch 3 ({detectedEp} → {detectedEp + 2})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp);
                        setChapterRangeEnd?.(detectedEp + 4);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-all border ${
                        chapterRangeStart === detectedEp && chapterRangeEnd === detectedEp + 4
                          ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#93C5FD] font-bold"
                          : "bg-[#181818] border-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E5E5] hover:border-[#383838]"
                      }`}
                    >
                      Batch 5 ({detectedEp} → {detectedEp + 4})
                    </button>
                  </>
                )}
              </div>

              {/* Mismatch Alert Notice */}
              {isRangeMismatched && !isInvalidInvertedRange && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    ⚠️ Target URL is Episode <strong>{detectedEp}</strong>, but batch range is set to Ep {chapterRangeStart}–{chapterRangeEnd}.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Cap auto-aligned count to max 3 chapters so oversized numbers never occur
                        const rawCount = Math.max(1, (chapterRangeEnd ?? 1) - (chapterRangeStart ?? 1) + 1);
                        const safeCount = Math.min(3, rawCount);
                        setChapterRangeStart?.(detectedEp);
                        setChapterRangeEnd?.(detectedEp + safeCount - 1);
                      }}
                      className="px-2.5 py-1 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Auto-Align ({detectedEp} → {detectedEp + Math.min(3, Math.max(1, (chapterRangeEnd ?? 1) - (chapterRangeStart ?? 1) + 1)) - 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp);
                        setChapterRangeEnd?.(detectedEp);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Reset to Ep {detectedEp}
                    </button>
                  </div>
                </div>
              )}

              {/* Excessive Range Warning Notice (e.g. 297 when comic only has ~149) */}
              {isRangeTooLarge && !isInvalidInvertedRange && !isRangeMismatched && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    ⚠️ Range Warning: "To Ep" (<strong>{chapterRangeEnd}</strong>) is {chapterRangeEnd! - (chapterRangeStart || detectedEp || 1)} episodes ahead! This comic has ~149 total episodes.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const start = chapterRangeStart || detectedEp || 1;
                        setChapterRangeStart?.(start);
                        setChapterRangeEnd?.(start + 2);
                      }}
                      className="px-2.5 py-1 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Cap to 3 Chapters ({chapterRangeStart || detectedEp} → {(chapterRangeStart || detectedEp || 1) + 2})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp || chapterRangeStart);
                        setChapterRangeEnd?.(detectedEp || chapterRangeStart);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Single Ep {detectedEp || chapterRangeStart}
                    </button>
                  </div>
                </div>
              )}

              {/* Inverted Range Error Notice */}
              {isInvalidInvertedRange && (
                <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 text-[11px] text-red-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    ❌ Backwards Range: "From Ep" ({chapterRangeStart}) cannot be greater than "To Ep" ({chapterRangeEnd}).
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const temp = chapterRangeStart;
                        setChapterRangeStart?.(chapterRangeEnd);
                        setChapterRangeEnd?.(temp);
                      }}
                      className="px-2.5 py-1 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Swap ({chapterRangeEnd} to {chapterRangeStart})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterRangeStart?.(detectedEp ?? undefined);
                        setChapterRangeEnd?.(undefined);
                      }}
                      className="px-2.5 py-1 rounded bg-red-900/80 hover:bg-red-800 text-white font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Clear Range
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 h-10 px-3 bg-[#121212] border border-[#2F2F2F] rounded-lg">
                  <span className="text-xs font-mono text-[#6B7280]">From Ep:</span>
                  <input
                    type="number"
                    min={1}
                    value={chapterRangeStart ?? ""}
                    onChange={(e) => setChapterRangeStart?.(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={detectedEp ? `e.g. ${detectedEp}` : "e.g. 1"}
                    className="w-full bg-transparent text-xs font-mono text-[#E5E5E5] outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 h-10 px-3 bg-[#121212] border border-[#2F2F2F] rounded-lg">
                  <span className="text-xs font-mono text-[#6B7280]">To Ep:</span>
                  <input
                    type="number"
                    min={chapterRangeStart || 1}
                    value={chapterRangeEnd ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setChapterRangeEnd?.(val);
                      if (val && !chapterRangeStart && detectedEp) {
                        setChapterRangeStart?.(detectedEp);
                      }
                    }}
                    placeholder={detectedEp ? `e.g. ${detectedEp + 2}` : "e.g. 3"}
                    className="w-full bg-transparent text-xs font-mono text-[#E5E5E5] outline-none"
                  />
                </div>
              </div>

              {url && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#222]">
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    Scraping range starts directly from target Episode <strong>{detectedEp || chapterRangeStart || 1}</strong>.
                  </span>
                  <a
                    href={`/chapter-scraper?url=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-[#3B82F6] hover:text-blue-400 flex items-center gap-1.5 transition-colors shrink-0"
                    title="Open full series chapter list in Scraper Studio"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse All Chapters in Scraper Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Title Override & Review Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-[#9CA3AF]">Custom Title Override</label>
                <input
                  type="text"
                  value={titleOverride ?? ""}
                  onChange={(e) => setTitleOverride?.(e.target.value)}
                  placeholder="Optional custom title..."
                  className="w-full h-10 px-3 bg-[#121212] border border-[#2F2F2F] rounded-lg text-xs font-mono text-[#E5E5E5] outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#121212] border border-[#2F2F2F] rounded-lg">
                <div className="text-left">
                  <div className="text-xs font-mono font-bold text-[#E5E5E5]">Review Checkpoint</div>
                  <div className="text-[10px] text-[#6B7280]">Pause before render &amp; upload</div>
                </div>
                <input
                  type="checkbox"
                  checked={reviewMode ?? false}
                  onChange={(e) => setReviewMode?.(e.target.checked)}
                  className="w-4 h-4 accent-[#3B82F6] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BIG GLOWING ACTION BUTTON ───────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLaunch}
          disabled={isLoading || !url.trim() || isInvalidInvertedRange}
          className={`w-full h-13 py-3.5 sm:py-4 px-6 rounded-xl text-white font-black text-xs sm:text-sm tracking-wider uppercase font-mono flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-all border ${
            isInvalidInvertedRange
              ? "bg-red-900/60 border-red-700/60 text-red-200 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-[#3B82F6]/25 border-[#60A5FA]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Launching Autonomous Agent Pipeline...</span>
            </>
          ) : isInvalidInvertedRange ? (
            <span>Fix Chapter Range: "From Ep" ({chapterRangeStart}) cannot exceed "To Ep" ({chapterRangeEnd})</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Launch Autonomous Agent &amp; Publish to YouTube</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AgentInputCard;
