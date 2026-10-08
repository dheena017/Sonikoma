import React, { useState } from "react";
import {
  Link,
  Clipboard,
  Smartphone,
  Monitor,
  Mic,
  Globe,
  Lock,
  Eye,
  Zap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { VideoFormat, PrivacyStatus } from "../types";
import { div } from "three/tsl";

interface AgentInputCardProps {
  url: string;
  setUrl: (url: string) => void;
  videoFormat: VideoFormat;
  setVideoFormat: (fmt: VideoFormat) => void;
  language: string;
  setLanguage: (lang: string) => void;
  voice: string;
  setVoice: (voice: string) => void;
  privacyStatus: PrivacyStatus;
  setPrivacyStatus: (privacy: PrivacyStatus) => void;
  reviewMode: boolean;
  setReviewMode: (review: boolean) => void;
  maxPanels?: number;
  setMaxPanels?: (panels: number) => void;
  titleOverride?: string;
  setTitleOverride?: (title: string) => void;
  onLaunch: () => void;
  isLoading: boolean;
}


const VOICES = [
  { id: "alloy", label: "Alloy (Neutral & Clear)", gender: "Neutral" },
  { id: "echo", label: "Echo (Deep Narrator)", gender: "Male" },
  { id: "fable", label: "Fable (British Expressive)", gender: "Male" },
  { id: "onyx", label: "Onyx (Authoritative Deep)", gender: "Male" },
  { id: "nova", label: "Nova (Warm & Energetic)", gender: "Female" },
  { id: "shimmer", label: "Shimmer (Soft & Emotional)", gender: "Female" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ko", label: "Korean (한국어)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "zh", label: "Chinese (中文)" },
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
  privacyStatus,
  setPrivacyStatus,
  reviewMode,
  setReviewMode,
  maxPanels,
  setMaxPanels,
  titleOverride,
  setTitleOverride,
  onLaunch,
  isLoading,
}) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Clipboard access rejected or not available
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
      {/* ── URL Input Form ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Link className="w-4 h-4 text-[#3B82F6]" />
            Webtoon / Manga / Comic URL
          </span>
          <span className="text-[11px] text-[#6B7280] font-normal font-sans">
            Supports Webtoons, Bato, MangaDex &amp; standard chapter URLs
          </span>
        </label>

        <div className="relative flex items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.webtoons.com/en/.../viewer?title_no=..."
            className="w-full pl-4 pr-24 py-3.5 bg-[#121212] border border-[#2F2F2F] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 rounded-xl text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none transition-all font-mono"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handlePaste}
            className="absolute right-2 px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#252525] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Paste
          </button>
        </div>
      </div>

      {/* ── Key Pipeline Controls ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
            Video Format
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121212] rounded-xl border border-[#2F2F2F]">
            <button
              type="button"
              onClick={() => setVideoFormat("shorts")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                videoFormat === "shorts"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-mono"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] font-mono"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Shorts (9:16)
            </button>
            <button
              type="button"
              onClick={() => setVideoFormat("landscape")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                videoFormat === "landscape"
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30 font-mono"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] font-mono"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              16:9 Video
            </button>
          </div>
        </div>

        {/* Voice Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-[#3B82F6]" />
            Voice Actor
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-colors font-sans"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Language / Translation Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            Script Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-colors font-sans"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* YouTube Privacy Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
            YouTube Privacy
          </label>
          <select
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value as PrivacyStatus)}
            className="w-full px-3 py-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-colors font-sans"
          >
            <option value="unlisted">Unlisted (Safe Preview)</option>
            <option value="public">Public (Instant Release)</option>
            <option value="private">Private (Channel Only)</option>
          </select>
        </div>
      </div>

      {/* ── Mode Selection (Autonomous Autopilot - All Panels) ───────────── */}
      <div className="border-t border-[#2F2F2F] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Autonomous Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReviewMode(!reviewMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              reviewMode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]"
            }`}
          >
            {reviewMode ? (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Mode: Review Checkpoint Enabled</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#3B82F6]" />
                <span>Mode: 1-Click Autonomous Autopilot (All Chapter Panels)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── BIG GLOWING ACTION BUTTON ───────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLaunch}
          disabled={isLoading || !url.trim()}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-black text-xs sm:text-sm tracking-wider uppercase font-mono flex items-center justify-center gap-3 shadow-lg shadow-[#3B82F6]/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#60A5FA]/30"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Launching Autonomous Agent Pipeline...</span>
            </>
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
