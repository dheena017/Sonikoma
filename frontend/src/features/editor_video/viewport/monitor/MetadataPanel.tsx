import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Youtube,
  Loader2,
  ExternalLink,
  Music,
  Mic,
  Clapperboard,
  MoreHorizontal,
  CheckCircle2,
  Copy,
  Share2,
  FileAudio,
} from "lucide-react";
import { resolveDownloadNaming } from "@/shared/utils/downloadNaming";

export interface VideoPreviewMetadataPanelProps {
  musicTheme: string;
  voiceActor: string;
  videoUrl: string | null;
  navigateTo?: (path: string) => void;
  seriesTitle?: string;
  chapterNumber?: string | number;
  chapterTitle?: string;
  targetUrl?: string;
}

function deriveCodec(url: string | null): string {
  if (!url) return "H.264";
  if (url.includes(".webm")) return "VP9";
  if (url.includes(".mov")) return "ProRes";
  return "H.264";
}

const VideoPreviewMetadataPanel = React.memo(
  ({
    musicTheme,
    voiceActor,
    videoUrl,
    navigateTo,
    seriesTitle,
    chapterNumber,
    chapterTitle,
    targetUrl,
  }: VideoPreviewMetadataPanelProps) => {
    const [isPublishing] = useState(false);
    const [youtubeUrl] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedShare, setCopiedShare] = useState(false);

    const btnRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Compute portal position from button's bounding rect
    const openDropdown = useCallback(() => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
      setShowMore(true);
    }, []);

    // Close on outside click
    useEffect(() => {
      if (!showMore) return;
      function handleClick(e: MouseEvent) {
        if (
          btnRef.current?.contains(e.target as Node) ||
          dropdownRef.current?.contains(e.target as Node)
        ) return;
        setShowMore(false);
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [showMore]);

    // Close on scroll / resize
    useEffect(() => {
      if (!showMore) return;
      const close = () => setShowMore(false);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
      return () => {
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close);
      };
    }, [showMore]);

    const handlePublishYouTube = () => {
      setShowMore(false);
      if (navigateTo) {
        navigateTo("/youtube");
      } else {
        window.history.pushState({}, "", "/youtube");
        window.dispatchEvent(new Event("popstate"));
      }
    };

    const handleCopyVideoUrl = () => {
      if (videoUrl) {
        navigator.clipboard.writeText(videoUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    };

    const handleCopyShareLink = () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    };

    const { formattedPrefix } = resolveDownloadNaming({
      seriesTitle: seriesTitle || undefined,
      chapterNumber: chapterNumber != null ? String(chapterNumber) : undefined,
      chapterTitle: chapterTitle || undefined,
      targetUrl: targetUrl || undefined,
    });

    const codec = deriveCodec(videoUrl);
    const downloadFilename = `${formattedPrefix}_CinemaMaster.mp4`;
    const audioFilename = `${formattedPrefix}_AudioTrack.mp3`;

    // Portal dropdown element
    const dropdownPortal = showMore
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 9999,
            }}
            className="w-64 sm:w-72 bg-[#111116] border border-neutral-800/90 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Top gradient accent */}
            <div className="h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-80" />

            <div className="p-2 space-y-1.5">
              {/* SECTION 0: Track Specs & Info Card (for repositioned/hidden header badges) */}
              <div className="px-2.5 pt-1 text-[9px] font-black uppercase tracking-wider text-purple-400 font-mono flex items-center justify-between">
                <span>Media Specs & Info</span>
                <span className="text-[8px] text-neutral-500 font-normal">Track Details</span>
              </div>

              <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800/90 space-y-2">
                {musicTheme && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-neutral-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Music className="h-3.5 w-3.5 text-purple-400" /> Soundtrack:
                    </span>
                    <span className="font-mono text-purple-200 font-semibold truncate max-w-[140px]" title={musicTheme}>
                      {musicTheme}
                    </span>
                  </div>
                )}

                {voiceActor && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-neutral-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Mic className="h-3.5 w-3.5 text-indigo-400" /> Voice Actor:
                    </span>
                    <span className="font-mono text-indigo-200 font-semibold truncate max-w-[140px]" title={voiceActor}>
                      {voiceActor}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-neutral-400 font-medium flex items-center gap-1.5 shrink-0">
                    <Clapperboard className="h-3.5 w-3.5 text-cyan-400" /> Codec:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold text-[10px] uppercase">
                    {codec}
                  </span>
                </div>
              </div>

              <div className="h-px bg-neutral-800/80 my-1 mx-2" />

              {/* SECTION: Downloads */}
              <div className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-400/80 font-mono">
                Downloads & Media
              </div>

              {/* 1. Download MP4 */}
              <a
                href={videoUrl!}
                download={downloadFilename}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMore(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-900 group-hover:bg-neutral-700 border border-neutral-800 transition-colors shrink-0">
                  <Download className="h-3 w-3 text-purple-400" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span>Download MP4</span>
                  <span className="text-[9px] text-neutral-500 font-mono truncate">{downloadFilename}</span>
                </div>
              </a>

              {/* 2. Download Audio Only */}
              <a
                href={videoUrl!}
                download={audioFilename}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMore(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-900 group-hover:bg-neutral-700 border border-neutral-800 transition-colors shrink-0">
                  <FileAudio className="h-3 w-3 text-indigo-400" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span>Download Audio</span>
                  <span className="text-[9px] text-neutral-500 font-mono truncate">{audioFilename}</span>
                </div>
              </a>

              <div className="h-px bg-neutral-800/80 my-1 mx-2" />

              {/* SECTION: Sharing & Links */}
              <div className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-400/80 font-mono">
                Sharing & Links
              </div>

              {/* 3. Copy Video Stream URL */}
              <button
                type="button"
                onClick={handleCopyVideoUrl}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group text-left"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-900 group-hover:bg-neutral-700 border border-neutral-800 transition-colors shrink-0">
                  {copiedUrl ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-cyan-400" />
                  )}
                </span>
                <div className="flex flex-col min-w-0">
                  <span>{copiedUrl ? "Copied to Clipboard!" : "Copy Stream URL"}</span>
                  <span className="text-[9px] text-neutral-500 font-mono truncate">{videoUrl}</span>
                </div>
              </button>

              {/* 4. Copy Share Link */}
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group text-left"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-900 group-hover:bg-neutral-700 border border-neutral-800 transition-colors shrink-0">
                  {copiedShare ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Share2 className="h-3 w-3 text-emerald-400" />
                  )}
                </span>
                <span>{copiedShare ? "Project Link Copied!" : "Share Project Link"}</span>
              </button>

              {/* 5. Open Source in New Tab */}
              <a
                href={videoUrl!}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMore(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-900 group-hover:bg-neutral-700 border border-neutral-800 transition-colors shrink-0">
                  <ExternalLink className="h-3 w-3 text-amber-400" />
                </span>
                <span>Open Video in New Tab</span>
              </a>

              <div className="h-px bg-neutral-800/80 my-1 mx-2" />

              {/* SECTION: Publishing */}
              {!youtubeUrl ? (
                <button
                  type="button"
                  onClick={handlePublishYouTube}
                  disabled={isPublishing}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-[#FF0000]/15 group-hover:bg-[#FF0000]/25 border border-red-600/30 transition-colors shrink-0">
                    {isPublishing ? (
                      <Loader2 className="h-3 w-3 text-red-400 animate-spin" />
                    ) : (
                      <Youtube className="h-3 w-3 text-red-400" />
                    )}
                  </span>
                  <span>{isPublishing ? "Publishing..." : "Publish to YouTube"}</span>
                </button>
              ) : (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-neutral-800/80 transition-all cursor-pointer group"
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/15 group-hover:bg-emerald-500/25 border border-emerald-600/30 transition-colors shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </span>
                  <span>View on YouTube</span>
                </a>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

    return (
      <>
        {/* Γï» More Options 3-Dots Button */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => {
            if (showMore) {
              setShowMore(false);
            } else {
              openDropdown();
            }
          }}
          title="More actions & options"
          className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
            showMore
              ? "bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              : "bg-neutral-900/90 border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-purple-500/40"
          }`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {/* Portal dropdown ΓÇö rendered on document.body */}
        {dropdownPortal}
      </>
    );
  }
);

export default VideoPreviewMetadataPanel;
export { VideoPreviewMetadataPanel };
