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
} from "lucide-react";
import { AgentYouTubeMetadata } from "../types";

interface AgentYouTubeSuccessCardProps {
  youtubeUrl?: string | null;
  videoUrl?: string;
  metadata?: AgentYouTubeMetadata;
  scrapedTitle?: string;
  onReset: () => void;
}

export const AgentYouTubeSuccessCard: React.FC<AgentYouTubeSuccessCardProps> = ({
  youtubeUrl,
  videoUrl,
  metadata,
  scrapedTitle,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

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
          <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-xl text-red-500 shadow-inner">
            <Youtube className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                {youtubeUrl ? "Live & Published" : "Render Complete"}
              </span>
              <span className="text-[10px] font-mono uppercase font-bold text-[#9CA3AF]">
                1-Click Agent Complete
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#E5E5E5] mt-1">
              {youtubeUrl ? "Your YouTube Video Is Ready!" : "Video Successfully Compiled!"}
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

      {/* ── Primary Link Box ────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121212] border border-[#2F2F2F] shadow-inner space-y-3">
        {youtubeUrl ? (
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
                <Youtube className="w-4 h-4 text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
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
          </>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-[#10B981] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                Cinematic MP4 Ready for Channel Upload
              </span>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Your video is compiled and saved. Connect your YouTube channel under Creative Suite &gt; YouTube to publish directly, or stream the video below.
              </p>
            </div>
            {videoUrl && (
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all self-start sm:self-center shrink-0 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Stream / Download MP4</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Content Grid: Video Player + Metadata ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player Preview (if videoUrl is present) */}
        {videoUrl && (
          <div className="lg:col-span-5 space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#9CA3AF] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
              Compiled Video Preview
            </span>
            <div className="relative rounded-xl overflow-hidden border border-[#2F2F2F] bg-black aspect-[9/16] sm:aspect-video lg:aspect-[9/16] flex items-center justify-center max-h-[460px] mx-auto">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            </div>
          </div>
        )}

        {/* Right: AI-Generated YouTube Headers */}
        <div className={videoUrl ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
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
