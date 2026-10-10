import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Eye,
  ThumbsUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageSquare,
  Play,
  Share2,
  Check,
  Film,
  Lock,
  Globe,
  HelpCircle,
} from "lucide-react";
import { YouTubeCommentsViewer } from "./YouTubeCommentsViewer";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";

interface YouTubeTheaterPlayerProps {
  video: YouTubeVideoItem;
  playlistId?: string;
  onClose: () => void;
}

export default function YouTubeTheaterPlayer({
  video,
  playlistId,
  onClose,
}: YouTubeTheaterPlayerProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  // Body scroll lock & Escape key handling (matching DeleteConfirmModal behavior)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tags = video.description
    ? Array.from(video.description.matchAll(/#[\w\d_]+/g))
        .map((m) => m[0])
        .slice(0, 10)
    : [];

  const originParam =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.origin)
      : "";

  const embedUrl = playlistId
    ? `https://www.youtube-nocookie.com/embed/${video.id}?list=${playlistId}&enablejsapi=1&origin=${originParam}&rel=0&modestbranding=1&autoplay=1`
    : `https://www.youtube-nocookie.com/embed/${video.id}?enablejsapi=1&origin=${originParam}&rel=0&modestbranding=1&autoplay=1`;

  const youtubeWatchUrl =
    video.youtube_url || `https://www.youtube.com/watch?v=${video.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(youtubeWatchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog (Structured like DeleteConfirmModal) */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#121212]/95 backdrop-blur-2xl border border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 blur-[0.5px]" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#2F2F2F] shrink-0 bg-[#141414]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#E5E5E5] tracking-tight font-sans truncate">
                {video.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#E5E5E5] bg-[#1E1E1E] hover:bg-[#2A2A2A] rounded-full transition-all cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* IFrame Player with strict origin referrer policy to prevent Error 153 */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#2F2F2F] shadow-2xl">
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Details & Telemetry Row */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2F2F2F]">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-sans text-[#9CA3AF]">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#60A5FA] font-medium">
                  <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>{video.view_count || "0"} views</span>
                </span>

                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#34D399] font-medium">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{video.like_count || "0"} likes</span>
                </span>

                {video.published_at && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF]">
                    <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>{formatDate(video.published_at)}</span>
                  </span>
                )}

                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border uppercase ${
                    video.privacy_status === "public"
                      ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/40"
                      : video.privacy_status === "unlisted"
                      ? "text-amber-400 border-amber-900/40 bg-amber-950/40"
                      : "text-[#9CA3AF] border-[#2F2F2F] bg-[#1E1E1E]"
                  }`}
                >
                  {video.privacy_status || "Public"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={youtubeWatchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold font-sans shadow-sm transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Watch on YouTube</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] rounded-xl text-xs font-medium font-sans transition-all cursor-pointer"
                  title="Copy video link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium font-sans transition-all cursor-pointer ${
                    showComments
                      ? "bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#60A5FA]"
                      : "bg-[#1E1E1E] hover:bg-[#2A2A2A] border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Comments ({video.comment_count || 0})</span>
                </button>
              </div>
            </div>

            {/* Description Expander */}
            {video.description && (
              <div>
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-1.5 text-xs font-semibold font-sans text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer"
                >
                  {showDescription ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span>{showDescription ? "Hide Description" : "Show Description"}</span>
                </button>
                {showDescription && (
                  <p className="text-xs text-[#9CA3AF] font-sans leading-relaxed whitespace-pre-wrap mt-2 p-3.5 bg-[#1E1E1E] rounded-xl border border-[#2F2F2F]">
                    {video.description}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-[10px] font-sans text-[#9CA3AF]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Panel */}
          {showComments && (
            <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4">
              <YouTubeCommentsViewer
                videoId={video.id}
                onClose={() => setShowComments(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
