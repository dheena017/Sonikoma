import React, { useState, useEffect } from "react";
import {
  X,
  Eye,
  ThumbsUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  MessageSquare,
  Sparkles,
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        .slice(0, 12)
    : [];

  const embedUrl = playlistId
    ? `https://www.youtube.com/embed/${video.id}?list=${playlistId}&rel=0&modestbranding=1&autoplay=1`
    : `https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1&autoplay=1`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800/90 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 bg-red-600 rounded-md text-[10px] font-mono font-bold text-white uppercase">
              Player
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate font-sans">
              {video.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player + Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* IFrame Player */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Details & Telemetry Row */}
          <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <strong className="text-white">{video.view_count}</strong> views
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <strong className="text-white">{video.like_count}</strong> likes
                </span>
                {video.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    {formatDate(video.published_at)}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${
                    video.privacy_status === "public"
                      ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/50"
                      : "text-amber-400 border-amber-900/40 bg-amber-950/50"
                  }`}
                >
                  {video.privacy_status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  Comments ({video.comment_count})
                </button>
                <a
                  href={video.youtube_url || `https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl text-xs font-mono transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  YouTube
                </a>
              </div>
            </div>

            {/* Description Expander */}
            {video.description && (
              <div>
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-1.5 text-xs font-bold font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  {showDescription ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {showDescription ? "Hide Description" : "Show Description"}
                </button>
                {showDescription && (
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap mt-2 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80">
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
                    className="px-2 py-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Panel */}
          {showComments && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <YouTubeCommentsViewer
                videoId={video.id}
                onClose={() => setShowComments(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
