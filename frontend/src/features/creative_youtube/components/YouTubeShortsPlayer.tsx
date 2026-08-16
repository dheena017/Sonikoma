import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  MessageSquare,
  Share2,
  ExternalLink,
  Zap,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";
import { YouTubeCommentsViewer } from "./YouTubeCommentsViewer";

interface YouTubeShortsPlayerProps {
  shorts: YouTubeVideoItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigateIndex: (newIndex: number) => void;
}

export default function YouTubeShortsPlayer({
  shorts,
  currentIndex,
  onClose,
  onNavigateIndex,
}: YouTubeShortsPlayerProps) {
  const currentShort = shorts[currentIndex];
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const hasNext = currentIndex < shorts.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigateIndex(currentIndex + 1);
      setShowComments(false);
    }
  }, [hasNext, currentIndex, onNavigateIndex]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigateIndex(currentIndex - 1);
      setShowComments(false);
    }
  }, [hasPrev, currentIndex, onNavigateIndex]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") handleNext();
      else if (e.key === "ArrowUp" || e.key === "k") handlePrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handleCopyLink = () => {
    if (currentShort) {
      navigator.clipboard.writeText(
        currentShort.youtube_url ||
          `https://youtube.com/shorts/${currentShort.id}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentShort) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Top Bar with Title & Close */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3.5 py-1.5 rounded-full pointer-events-auto shadow-lg">
          <Zap className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
          <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
            Shorts Reel ({currentIndex + 1}/{shorts.length})
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-full transition-all cursor-pointer pointer-events-auto shadow-lg"
          aria-label="Close reel player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Reel Container */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 max-h-[92vh] w-full max-w-4xl">
        {/* 9:16 Vertical Video Frame */}
        <div className="relative w-full max-w-[360px] sm:max-w-[390px] aspect-[9/16] bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl shadow-red-950/30 flex items-center justify-center">
          <iframe
            key={currentShort.id}
            src={`https://www.youtube.com/embed/${currentShort.id}?autoplay=1&loop=1&playlist=${currentShort.id}&modestbranding=1&rel=0&controls=1`}
            title={currentShort.title}
            className="w-full h-full object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Video Info Overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                #Shorts
              </span>
              <span className="text-[10px] text-neutral-300 font-mono">
                {currentShort.view_count} views
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white font-sans line-clamp-2 drop-shadow-md leading-snug">
              {currentShort.title}
            </h3>
          </div>
        </div>

        {/* Right Actions Bar */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 shrink-0 z-20">
          {/* Previous Short Button */}
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="p-3 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-800 text-white rounded-full transition-all cursor-pointer shadow-lg hover:scale-110 active:scale-95"
            title="Previous Short (Up Arrow)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Likes */}
          <div className="flex flex-col items-center gap-1">
            <div className="p-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 rounded-full text-white shadow-lg transition-all">
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-300">
              {currentShort.like_count || "0"}
            </span>
          </div>

          {/* Comments Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-3 border rounded-full text-white shadow-lg transition-all cursor-pointer hover:scale-110 ${
                showComments
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800"
              }`}
              title="View Comments"
            >
              <MessageSquare className="w-5 h-5 text-purple-300" />
            </button>
            <span className="text-[10px] font-mono font-bold text-neutral-300">
              {currentShort.comment_count || "0"}
            </span>
          </div>

          {/* Share / Copy Link */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-white rounded-full shadow-lg transition-all cursor-pointer hover:scale-110"
              title="Copy Short Link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Share2 className="w-5 h-5 text-sky-400" />
              )}
            </button>
            <span className="text-[10px] font-mono text-neutral-400">
              {copied ? "Copied!" : "Share"}
            </span>
          </div>

          {/* Open on YouTube */}
          <a
            href={
              currentShort.youtube_url ||
              `https://youtube.com/shorts/${currentShort.id}`
            }
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-full shadow-lg transition-all"
            title="Open in YouTube App"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Next Short Button */}
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-3 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-800 text-white rounded-full transition-all cursor-pointer shadow-lg hover:scale-110 active:scale-95"
            title="Next Short (Down Arrow)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Comments Drawer Modal when toggled */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] z-30 bg-neutral-950/95 border-l border-neutral-800 p-5 overflow-y-auto shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <h4 className="text-xs font-black font-mono uppercase text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Short Comments ({currentShort.comment_count})
            </h4>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <YouTubeCommentsViewer
              videoId={currentShort.id}
              onClose={() => setShowComments(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
