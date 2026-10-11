import React, { useState } from "react";
import {
  Youtube,
  ExternalLink,
  Copy,
  Check,
  Film,
  Sparkles,
  Share2,
  Tag,
  Clock,
  RotateCcw,
  AlertCircle,
  Smartphone,
  Monitor,
} from "lucide-react";
import { AgentYouTubeMetadata } from "../types";
import YouTubeOfficialLogo from "@/features/creative/youtube/components/YouTubeOfficialLogo";

interface AgentYouTubeSuccessCardProps {
  youtubeUrl?: string | null;
  videoUrl?: string;
  metadata?: AgentYouTubeMetadata;
  scrapedTitle?: string;
  videoFormat?: string;
  onReset: () => void;
  onConnectYouTube?: () => void;
}

export const AgentYouTubeSuccessCard: React.FC<AgentYouTubeSuccessCardProps> = ({
  youtubeUrl,
  videoUrl,
  metadata,
  scrapedTitle,
  videoFormat = "shorts",
  onReset,
  onConnectYouTube,
}) => {
  const [copied, setCopied] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const isShort = videoFormat === "shorts" || metadata?.is_short === true;
  const isPublished = Boolean(youtubeUrl && !youtubeUrl.includes("preview"));

  const handleCopy = async () => {
    if (!youtubeUrl) return;
    try {
      await navigator.clipboard.writeText(youtubeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
      {/* ── Top Success Ribbon ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/10 border border-red-500/30 rounded-xl shadow-inner flex items-center justify-center">
            <YouTubeOfficialLogo className="w-8 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isPublished ? (
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#10B981]" />
                  Live on YouTube
                </span>
              ) : (
                <>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    MP4 Rendered (100%)
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Channel Not Connected
                  </span>
                </>
              )}
              <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 flex items-center gap-1">
                {isShort ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                {isShort ? "Shorts (9:16)" : "16:9 Video"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#E5E5E5] mt-1">
              {isPublished ? "Your YouTube Video Is Live & Ready!" : "Cinematic Video Compiled & Ready!"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#2F2F2F] text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] transition-all cursor-pointer self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Generate Another Video
        </button>
      </div>

      {/* ── Primary Link / Channel Connection Box ───────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121212] border border-[#2F2F2F] shadow-inner space-y-3">
        {isPublished && youtubeUrl ? (
          <>
            <span className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              Official YouTube Publication Link
            </span>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-[#2F2F2F] rounded-xl text-[#3B82F6] hover:text-blue-300 text-sm font-mono font-bold truncate flex items-center gap-2 transition-colors group"
              >
                <YouTubeOfficialLogo className="w-5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{youtubeUrl}</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#252525] border border-[#2F2F2F] text-[#E5E5E5] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-md shadow-red-950/40 cursor-pointer"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {videoUrl && (
              <div className="flex items-center justify-between pt-2.5 border-t border-[#222]">
                <span className="text-[11px] font-mono text-[#9CA3AF] flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Cinematic MP4 Video Asset
                </span>
                <a
                  href={videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Film className="w-3 h-3 text-blue-400" />
                  <span>Download MP4</span>
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2">
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                Why isn't this video on YouTube yet?
              </span>
              <p className="text-xs text-[#A3A3A3] font-sans leading-relaxed max-w-2xl">
                Google requires you to connect and authorize your YouTube account before uploading videos to your channel. Your 9:16 Shorts video is <span className="text-white font-semibold">100% rendered and saved</span>. Connect your channel to publish with 1 click, or download the MP4 file to upload manually to YouTube Studio with the AI metadata below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
              {onConnectYouTube && (
                <button
                  type="button"
                  onClick={onConnectYouTube}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-red-950/40 cursor-pointer active:scale-95"
                >
                  <YouTubeOfficialLogo className="w-4.5 h-3.5" />
                  <span>Connect YouTube</span>
                </button>
              )}

              {videoUrl && (
                <a
                  href={videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-950/40 cursor-pointer active:scale-95"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              )}

              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl bg-[#222] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                title="Open YouTube Studio to drag-and-drop the MP4"
              >
                <span>YouTube Studio</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Content Grid: Video Player + Metadata ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player Preview (if videoUrl is present) */}
        {videoUrl && (
          <div className={isShort ? "lg:col-span-5 space-y-2" : "lg:col-span-6 space-y-2"}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
                Compiled Video Preview
              </span>
              <span className="text-[10px] font-mono font-bold text-[#3B82F6] px-2 py-0.5 bg-[#3B82F6]/10 rounded border border-[#3B82F6]/20 flex items-center gap-1">
                {isShort ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                {isShort ? "9:16 Shorts" : "16:9 Video"}
              </span>
            </div>
            <div
              className={`relative rounded-xl overflow-hidden border border-[#2F2F2F] bg-black flex items-center justify-center max-h-[460px] mx-auto ${
                isShort
                  ? "aspect-[9/16] w-full max-w-[270px]"
                  : "aspect-video w-full"
              }`}
            >
              {videoError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-200">Video Preview Unavailable</p>
                    <p className="text-[11px] text-[#9CA3AF] max-w-[200px]">
                      The compiled video file was not found or failed to load.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoError(false);
                      const v = document.querySelector("video");
                      if (v) v.load();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333] border border-[#3F3F3F] text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                  onError={() => setVideoError(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Right: AI-Generated YouTube Headers */}
        <div className={videoUrl ? (isShort ? "lg:col-span-7 space-y-4" : "lg:col-span-6 space-y-4") : "lg:col-span-12 space-y-4"}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              AI YouTube Metadata &amp; Headers
            </span>
            {metadata?.privacy_status && (
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF]">
                Privacy: {metadata.privacy_status}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="p-4 bg-[#121212] rounded-xl border border-[#2F2F2F] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">Video Title</span>
            <h3 className="text-sm font-bold text-[#E5E5E5] leading-snug">
              {metadata?.title || scrapedTitle || "Untitled Story Recap"}
            </h3>
          </div>

          {/* Description */}
          <div className="p-4 bg-[#121212] rounded-xl border border-[#2F2F2F] space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">
              Description &amp; Timestamps
            </span>
            <pre className="text-xs text-[#9CA3AF] font-sans whitespace-pre-wrap leading-relaxed">
              {metadata?.description || "No description provided."}
            </pre>
          </div>

          {/* Tags */}
          {metadata?.tags && metadata.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#6B7280] flex items-center gap-1">
                <Tag className="w-3 h-3" /> SEO Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {metadata.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentYouTubeSuccessCard;
