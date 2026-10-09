import React from "react";
import {
  Link,
  Clipboard,
  Smartphone,
  Monitor,
  Mic,
  Globe,
  Eye,
  Sparkles,
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

const VOICE_OPTIONS: CyberSelectOption[] = [
  { value: "alloy", label: "Alloy (Neutral & Clear)" },
  { value: "echo", label: "Echo (Deep Male Narrator)" },
  { value: "fable", label: "Fable (British Expressive)" },
  { value: "onyx", label: "Onyx (Authoritative Deep)" },
  { value: "nova", label: "Nova (Warm & Energetic)" },
  { value: "shimmer", label: "Shimmer (Soft & Emotional)" },
  { value: "en-US-GuyNeural", label: "Guy (Anime Action Male)" },
  { value: "en-US-AriaNeural", label: "Aria (Dramatic Female)" },
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
  privacyStatus,
  setPrivacyStatus,
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
    <div className="bg-[#1E1E1E]/90 border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 text-left">
      {/* ── URL Input Form ─────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center">
          <span className="flex items-center gap-2 text-[#E5E5E5]">
            <Link className="w-4 h-4 text-[#3B82F6]" />
            Series / Chapter URL
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

      {/* ── Key Pipeline Controls (Identical #121212 Background & 44px Height) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
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

        {/* Voice Selector with CyberSelect */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-[#3B82F6]" />
            Voice Actor
          </label>
          <CyberSelect
            value={voice}
            onChange={setVoice}
            options={VOICE_OPTIONS}
            variant="blue"
            size="lg"
            searchable={false}
            className="[&>button]:!bg-[#121212] [&>button]:!border-[#2F2F2F] [&>button]:!h-[44px] [&>button]:!text-xs [&>button]:!font-sans"
            placeholder="Select voice actor..."
            ariaLabel="Select voice actor"
          />
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

      {/* ── BIG GLOWING ACTION BUTTON ───────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLaunch}
          disabled={isLoading || !url.trim()}
          className="w-full h-13 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-black text-xs sm:text-sm tracking-wider uppercase font-mono flex items-center justify-center gap-3 shadow-lg shadow-[#3B82F6]/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#60A5FA]/30"
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
