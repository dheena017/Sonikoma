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
  Volume2,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  X,
  CheckCircle2,
  ArrowRight,
  Film,
  Zap,
  Share2,
  Check,
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

const VIDEO_FORMAT_OPTIONS: CyberSelectOption[] = [
  { value: "shorts", label: "Shorts (9:16) — Vertical Mobile (1080 × 1920)" },
  { value: "landscape", label: "Landscape (16:9) — Widescreen Desktop/TV (1920 × 1080)" },
];

const DISTRIBUTION_OPTIONS: CyberSelectOption[] = [
  { value: "all", label: "All Channels (YouTube + TikTok + Reels)" },
  { value: "youtube", label: "YouTube Shorts Only" },
  { value: "tiktok", label: "TikTok Direct Only" },
  { value: "instagram", label: "Instagram Reels Only" },
  { value: "yt_tiktok", label: "YouTube + TikTok Direct" },
  { value: "yt_ig", label: "YouTube + Instagram Reels" },
];

const BATCH_MODE_OPTIONS: CyberSelectOption[] = [
  { value: "single", label: "Single Episode" },
  { value: "batch_2", label: "Batch: 2 Episodes" },
  { value: "batch_3", label: "Batch: 3 Episodes" },
  { value: "batch_5", label: "Batch: 5 Episodes" },
  { value: "custom", label: "Custom Range (Manual)" },
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
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([
    "youtube",
    "tiktok",
    "instagram",
  ]);

  const currentDistributionValue = React.useMemo(() => {
    const hasYT = targetPlatforms.includes("youtube");
    const hasTT = targetPlatforms.includes("tiktok");
    const hasIG = targetPlatforms.includes("instagram");
    if (hasYT && hasTT && hasIG) return "all";
    if (hasYT && hasTT && !hasIG) return "yt_tiktok";
    if (hasYT && hasIG && !hasTT) return "yt_ig";
    if (hasYT && !hasTT && !hasIG) return "youtube";
    if (hasTT && !hasYT && !hasIG) return "tiktok";
    if (hasIG && !hasYT && !hasTT) return "instagram";
    return "all";
  }, [targetPlatforms]);

  const handleDistributionChange = (val: string) => {
    switch (val) {
      case "all":
        setTargetPlatforms(["youtube", "tiktok", "instagram"]);
        break;
      case "youtube":
        setTargetPlatforms(["youtube"]);
        break;
      case "tiktok":
        setTargetPlatforms(["tiktok"]);
        break;
      case "instagram":
        setTargetPlatforms(["instagram"]);
        break;
      case "yt_tiktok":
        setTargetPlatforms(["youtube", "tiktok"]);
        break;
      case "yt_ig":
        setTargetPlatforms(["youtube", "instagram"]);
        break;
      default:
        setTargetPlatforms(["youtube"]);
    }
  };

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

  // Helper labels for Blueprint summary
  const currentNarratorLabel = NARRATOR_VOICES.find((o) => o.value === narratorVoice)?.label.split("(")[0].trim() || "Christopher";
  const currentProtagonistLabel = PROTAGONIST_VOICES.find((o) => o.value === protagonistVoice)?.label.split("(")[0].trim() || "Guy";
  const currentLangLabel = LANGUAGE_OPTIONS.find((o) => o.value === language)?.label || "English";
  const currentPrivacyLabel = PRIVACY_OPTIONS.find((o) => o.value === privacyStatus)?.label.split("(")[0].trim() || "Unlisted";

  const totalBatchCount =
    chapterRangeEnd && chapterRangeEnd >= (chapterRangeStart || detectedEp || 1)
      ? chapterRangeEnd - (chapterRangeStart || detectedEp || 1) + 1
      : 1;

  const currentBatchMode = React.useMemo(() => {
    const start = chapterRangeStart || detectedEp || 1;
    const end = chapterRangeEnd || start;
    const count = Math.max(1, end - start + 1);
    if (!chapterRangeEnd || count === 1) return "single";
    if (count === 2) return "batch_2";
    if (count === 3) return "batch_3";
    if (count === 5) return "batch_5";
    return "custom";
  }, [chapterRangeStart, chapterRangeEnd, detectedEp]);

  const handleBatchModeChange = (val: string) => {
    const start = chapterRangeStart || detectedEp || 1;
    if (!chapterRangeStart && detectedEp) {
      setChapterRangeStart?.(detectedEp);
    }
    switch (val) {
      case "single":
        setChapterRangeStart?.(start);
        setChapterRangeEnd?.(start);
        break;
      case "batch_2":
        setChapterRangeStart?.(start);
        setChapterRangeEnd?.(start + 1);
        break;
      case "batch_3":
        setChapterRangeStart?.(start);
        setChapterRangeEnd?.(start + 2);
        break;
      case "batch_5":
        setChapterRangeStart?.(start);
        setChapterRangeEnd?.(start + 4);
        break;
      case "custom":
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
      {/* ──────────────────────────────────────────────────────────────────────────
          LEFT COLUMN: The Configuration Studio (Cards 1 to 4)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-5">
        {/* ── CARD 1: SOURCE COMIC & CHAPTER RANGE ──────────────────────────── */}
        <section className="bg-[#181818]/90 border border-[#2A2A2A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6]">
                <Link className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#E5E5E5] tracking-tight">
                  1. Source Comic &amp; Episode Range
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Paste chapter URL from Webtoons, MangaDex, or supported platform
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[11px] font-mono text-[#60A5FA]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Smart Dub Active</span>
            </div>
          </div>

          {/* URL Input Bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 w-full h-12 px-3.5 bg-[#121212] border border-[#2F2F2F] rounded-xl focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.webtoons.com/.../viewer?episode_no=1..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-[#E5E5E5] placeholder-[#555] outline-none font-mono"
                disabled={isLoading}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setChapterRangeStart?.(undefined);
                    setChapterRangeEnd?.(undefined);
                  }}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] transition-all cursor-pointer"
                  title="Clear URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-600 text-[#9CA3AF] hover:text-[#E5E5E5] text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            </div>

            {detectedEp && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#9CA3AF]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Detected in URL:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#93C5FD] font-bold">
                  Episode {detectedEp}
                </span>
              </div>
            )}
          </div>

          {/* Episode Batch Mode & Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Episode Batch Mode
                </span>
                <span className="text-[10px] text-[#60A5FA] font-mono">
                  {totalBatchCount > 1 ? `${totalBatchCount} Episodes` : "Single Ep"}
                </span>
              </label>
              <CyberSelect
                value={currentBatchMode}
                onChange={handleBatchModeChange}
                options={BATCH_MODE_OPTIONS}
                variant="blue"
                size="lg"
                searchable={false}
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select batch mode..."
                ariaLabel="Select batch mode"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Target Episode Range
                </span>
                {url && (
                  <a
                    href={`/chapter-scraper?url=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-[#3B82F6] hover:text-blue-400 flex items-center gap-1"
                  >
                    <span>Scraper Studio</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1.5 h-[44px] px-3 bg-[#121212] border border-[#2F2F2F] rounded-xl focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all">
                  <span className="text-[11px] font-mono font-semibold text-[#888] shrink-0">From</span>
                  <input
                    type="number"
                    min={1}
                    value={chapterRangeStart ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setChapterRangeStart?.(val);
                    }}
                    placeholder={detectedEp ? `${detectedEp}` : "1"}
                    className="w-full bg-transparent text-xs font-mono text-[#E5E5E5] placeholder-[#555] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <span className="text-[#555] font-mono select-none">→</span>

                <div className="flex-1 flex items-center gap-1.5 h-[44px] px-3 bg-[#121212] border border-[#2F2F2F] rounded-xl focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all">
                  <span className="text-[11px] font-mono font-semibold text-[#888] shrink-0">To</span>
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
                    placeholder={detectedEp ? `${detectedEp + 2}` : "3"}
                    className="w-full bg-transparent text-xs font-mono text-[#E5E5E5] placeholder-[#555] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Large Batch Alert */}
          {isRangeTooLarge && !isInvalidInvertedRange && !isRangeMismatched && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span>
                ⚠️ Large Batch: <strong>{totalBatchCount} episodes</strong> selected ({chapterRangeStart || detectedEp || 1} → {chapterRangeEnd}).
              </span>
              <button
                type="button"
                onClick={() => {
                  const start = chapterRangeStart || detectedEp || 1;
                  setChapterRangeStart?.(start);
                  setChapterRangeEnd?.(start + 2);
                }}
                className="px-2.5 py-1 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] cursor-pointer shrink-0"
              >
                Cap to 3
              </button>
            </div>
          )}

          {/* Inverted Range Error */}
          {isInvalidInvertedRange && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                ❌ Invalid Range: "From Ep" ({chapterRangeStart}) cannot exceed "To Ep" ({chapterRangeEnd}).
              </span>
              <button
                type="button"
                onClick={() => {
                  const temp = chapterRangeStart;
                  setChapterRangeStart?.(chapterRangeEnd);
                  setChapterRangeEnd?.(temp);
                }}
                className="px-2.5 py-1 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] cursor-pointer shrink-0"
              >
                Swap Numbers
              </button>
            </div>
          )}
        </section>

        {/* ── CARD 2: VIDEO FORMAT & DISTRIBUTION ────────────────────────────── */}
        <section className="bg-[#181818]/90 border border-[#2A2A2A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#E5E5E5] tracking-tight">
                  2. Video Format &amp; Distribution
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Configure video dimensions, distribution channels, language, and privacy
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono text-purple-300">
              {videoFormat === "shorts" ? "9:16 Vertical" : "16:9 Full HD"}
            </span>
          </div>

          {/* 2x2 Grid of Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Video Format Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {videoFormat === "shorts" ? (
                    <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-[#3B82F6]" />
                  )}
                  Video Aspect Ratio
                </span>
                <span className="text-[10px] text-[#60A5FA] font-mono">
                  {videoFormat === "shorts" ? "1080 × 1920" : "1920 × 1080"}
                </span>
              </label>
              <CyberSelect
                value={videoFormat}
                onChange={(val) => setVideoFormat(val as VideoFormat)}
                options={VIDEO_FORMAT_OPTIONS}
                variant="blue"
                size="lg"
                searchable={false}
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select video format..."
                ariaLabel="Select video format"
              />
            </div>

            {/* Distribution Channels Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Distribution Target
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto Broadcast
                </span>
              </label>
              <CyberSelect
                value={currentDistributionValue}
                onChange={handleDistributionChange}
                options={DISTRIBUTION_OPTIONS}
                variant="blue"
                size="lg"
                searchable={false}
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select distribution..."
                ariaLabel="Select distribution target"
              />
            </div>

            {/* Script Language Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center gap-1.5">
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
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select script language..."
                ariaLabel="Select script language"
              />
            </div>

            {/* YouTube Privacy Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center gap-1.5">
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
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select privacy..."
                ariaLabel="Select YouTube privacy"
              />
            </div>
          </div>
        </section>

        {/* ── CARD 3: CHARACTER VOICE CASTING ───────────────────────────────── */}
        <section className="bg-[#181818]/90 border border-[#2A2A2A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#E5E5E5] tracking-tight">
                  3. Character Voice Continuity Casting
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Lock neural voices to character roles across panels and scenes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 w-fit">
              <Volume2 className="w-3 h-3" />
              <span>Zero Random Voices</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Cinematic Narrator
                </span>
                <span className="text-[10px] text-[#60A5FA]">Exposition &amp; Story</span>
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
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select narrator voice..."
                ariaLabel="Select narrator voice"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Lead Protagonist (MC)
                </span>
                <span className="text-[10px] text-[#60A5FA]">Character Dialogue</span>
              </label>
              <CyberSelect
                value={protagonistVoice}
                onChange={(v) => setProtagonistVoice?.(v)}
                options={PROTAGONIST_VOICES}
                variant="blue"
                size="lg"
                searchable={false}
                className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs"
                placeholder="Select protagonist voice..."
                ariaLabel="Select protagonist voice"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          RIGHT COLUMN: The Sticky Blueprint & Action Panel (35-40% width)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 space-y-4">
        <div className="bg-[#181818]/95 border border-[#2F2F2F] rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur space-y-5">
          {/* Blueprint Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#242424]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-[#3B82F6] border border-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E5E5E5]">
                Pipeline Blueprint
              </span>
            </div>

            {url.trim() ? (
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ready to Launch
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#888] bg-[#141414] border border-[#262626] px-2 py-0.5 rounded-full">
                Awaiting URL
              </span>
            )}
          </div>

          {/* Configuration Parameters Checklist */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#222]">
              <span className="text-[#888]">Target Chapters</span>
              <span className="text-[#E5E5E5] font-bold">
                {totalBatchCount > 1
                  ? `Ep ${chapterRangeStart || detectedEp || 1} → ${chapterRangeEnd} (${totalBatchCount} eps)`
                  : `Episode ${chapterRangeStart || detectedEp || 1}`}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#222]">
              <span className="text-[#888]">Video Format</span>
              <span className="text-[#E5E5E5] font-semibold">
                {videoFormat === "shorts" ? "Vertical 9:16 (Shorts)" : "Widescreen 16:9"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#222]">
              <span className="text-[#888]">Language</span>
              <span className="text-[#E5E5E5] font-semibold">{currentLangLabel}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#222]">
              <span className="text-[#888]">Narrator Voice</span>
              <span className="text-[#60A5FA] font-semibold">{currentNarratorLabel}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#222]">
              <span className="text-[#888]">Lead MC Voice</span>
              <span className="text-[#93C5FD] font-semibold">{currentProtagonistLabel}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#888]">Platforms</span>
              <span className="text-white font-bold uppercase text-[11px]">
                {targetPlatforms.map((p) => (p === "youtube" ? "YT" : p === "tiktok" ? "TT" : "IG")).join(" • ")}
              </span>
            </div>
          </div>

          {/* ── BIG PRIMARY LAUNCH BUTTON ── */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onLaunch}
              disabled={isLoading || !url.trim() || isInvalidInvertedRange}
              className={`w-full py-4 px-5 rounded-xl text-white font-black text-xs sm:text-sm tracking-wider uppercase font-mono flex items-center justify-center gap-2.5 shadow-xl transition-all border active:scale-[0.99] cursor-pointer ${
                isInvalidInvertedRange
                  ? "bg-red-900/60 border-red-700/60 text-red-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF]   border-[#60A5FA]/30 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Launching Agent Pipeline...</span>
                </>
              ) : isInvalidInvertedRange ? (
                <span>Fix Chapter Order ({chapterRangeStart} &gt; {chapterRangeEnd})</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white fill-white" />
                  <span>Launch Autonomous Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentInputCard;
