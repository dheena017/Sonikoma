import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  MessageSquare,
  Share2,
  ExternalLink,
  Zap,
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

  // Body scroll lock & Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") handleNext();
      else if (e.key === "ArrowUp" || e.key === "k") handlePrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
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

  const originParam =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.origin)
      : "";

  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentShort.id}?autoplay=1&loop=1&playlist=${currentShort.id}&modestbranding=1&rel=0&controls=1&enablejsapi=1&origin=${originParam}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      data-modal="true"
    >
      {/* Top Bar with Title & Close */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#141414]/95 border border-[#2F2F2F] px-4 py-2 rounded-full pointer-events-auto shadow-xl">
          <Zap className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="text-xs font-bold text-[#E5E5E5] font-sans">
            Shorts ({currentIndex + 1} of {shorts.length})
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 bg-[#141414]/95 hover:bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] rounded-full transition-all cursor-pointer pointer-events-auto shadow-xl"
          aria-label="Close reel player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Reel Container */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 max-h-[92vh] w-full max-w-4xl">
        {/* 9:16 Vertical Video Frame */}
        <div className="relative w-full max-w-[360px] sm:max-w-[390px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-[#2F2F2F] shadow-2xl flex items-center justify-center">
          <iframe
            key={currentShort.id}
            src={embedUrl}
            title={currentShort.title}
            className="w-full h-full object-cover border-0"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Video Info Overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                #Shorts
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-sans">
                {currentShort.view_count || "0"} views
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
            className="p-3 bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2F2F2F] text-[#E5E5E5] rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
            title="Previous Short (Up Arrow)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Likes */}
          <div className="flex flex-col items-center gap-1">
            <div className="p-3 bg-[#141414] border border-[#2F2F2F] rounded-full text-[#34D399] shadow-lg">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-sans font-medium text-[#9CA3AF]">
              {currentShort.like_count || "0"}
            </span>
          </div>

          {/* Comments Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-3 border rounded-full shadow-lg transition-all cursor-pointer ${
                showComments
                  ? "bg-[#3B82F6]/20 border-[#3B82F6]/60 text-[#60A5FA]"
                  : "bg-[#141414] hover:bg-[#1E1E1E] border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5]"
              }`}
              title="View Comments"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-sans font-medium text-[#9CA3AF]">
              {currentShort.comment_count || "0"}
            </span>
          </div>

          {/* Share / Copy Link */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-3 bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] rounded-full shadow-lg transition-all cursor-pointer"
              title="Copy Short Link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
            <span className="text-[10px] font-sans text-[#9CA3AF]">
              {copied ? "Copied" : "Share"}
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
            className="p-3 bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-red-400 rounded-full shadow-lg transition-all"
            title="Open on YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Next Short Button */}
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-3 bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2F2F2F] text-[#E5E5E5] rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
            title="Next Short (Down Arrow)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Comments Drawer Modal when toggled */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] z-30 bg-[#121212]/95 backdrop-blur-2xl border-l border-[#2F2F2F] p-5 overflow-y-auto shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#2F2F2F] pb-3 mb-3">
            <h4 className="text-xs font-bold font-sans text-[#E5E5E5] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
              Comments ({currentShort.comment_count || 0})
            </h4>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 text-[#9CA3AF] hover:text-[#E5E5E5] cursor-pointer"
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
    </div>,
    document.body
  );
}
