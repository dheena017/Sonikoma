import React, { useState, useRef, useEffect } from "react";
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
    const moreRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
          setShowMore(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handlePublishYouTube = () => {
      setShowMore(false);
      if (navigateTo) {
        navigateTo("/youtube");
      } else {
        window.history.pushState({}, "", "/youtube");
        window.dispatchEvent(new Event("popstate"));
      }
    };

    const { formattedPrefix } = resolveDownloadNaming({
      seriesTitle: seriesTitle || undefined,
      chapterNumber: chapterNumber != null ? String(chapterNumber) : undefined,
      chapterTitle: chapterTitle || undefined,
      targetUrl: targetUrl || undefined,
    });

    const codec = deriveCodec(videoUrl);
    const downloadFilename = `${formattedPrefix}_CinemaMaster.mp4`;

    return (
      <div className="flex items-center gap-2 flex-nowrap overflow-hidden">

        {/* ── Track Spec Badges ─────────────────────── */}
        {musicTheme && (
          <div
            className="h-7 px-2.5 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center gap-1.5 text-purple-200 shrink-0 max-w-[160px]"
            title={`Soundtrack: ${musicTheme}`}
          >
            <Music className="h-3 w-3 text-purple-400 shrink-0" />
            <span className="text-[10px] font-semibold font-mono truncate">{musicTheme}</span>
          </div>
        )}

        {voiceActor && (
          <div
            className="h-7 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1.5 text-indigo-200 shrink-0 max-w-[160px]"
            title={`Voice: ${voiceActor}`}
          >
            <Mic className="h-3 w-3 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-semibold font-mono truncate">{voiceActor}</span>
          </div>
        )}

        <div
          className="h-7 px-2.5 rounded-lg bg-neutral-900/80 border border-neutral-700/60 flex items-center gap-1.5 text-[10px] font-mono shrink-0"
          title="Video Compression Codec"
        >
          <Clapperboard className="h-3 w-3 text-neutral-500 shrink-0" />
          <span className="text-neutral-500 uppercase text-[9px] font-bold tracking-wide">Codec</span>
          <span className="text-cyan-300 font-bold">{codec}</span>
        </div>

        {/* ── Compiled URL pill (truncated) ─────────── */}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="h-7 px-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5 transition-all shrink min-w-0 max-w-[140px] overflow-hidden"
            title={`Compiled Video URL: ${videoUrl}`}
          >
            <ExternalLink className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate">{videoUrl}</span>
          </a>
        )}

        {/* ── ⋯ More Options Dropdown ───────────────── */}
        {videoUrl && (
          <div className="relative shrink-0" ref={moreRef}>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              title="More actions"
              className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                showMore
                  ? "bg-neutral-800 border-neutral-600 text-white"
                  : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700"
              }`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {/* Dropdown */}
            {showMore && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[#111116] border border-neutral-800/80 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Gradient top accent */}
                <div className="h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-70" />

                <div className="p-1.5 space-y-0.5">
                  {/* Download MP4 */}
                  <a
                    href={videoUrl}
                    download={downloadFilename}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/70 transition-all cursor-pointer group"
                  >
                    <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 border border-neutral-700 transition-colors shrink-0">
                      <Download className="h-3 w-3 text-neutral-300" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span>Download MP4</span>
                      <span className="text-[9px] text-neutral-600 font-mono truncate">{downloadFilename}</span>
                    </div>
                  </a>

                  {/* Divider */}
                  <div className="h-px bg-neutral-800/80 mx-2" />

                  {/* Publish to YouTube */}
                  {!youtubeUrl ? (
                    <button
                      type="button"
                      onClick={handlePublishYouTube}
                      disabled={isPublishing}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/70 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-neutral-800/70 transition-all cursor-pointer group"
                    >
                      <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/15 group-hover:bg-emerald-500/25 border border-emerald-600/30 transition-colors shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      </span>
                      <span>View on YouTube</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default VideoPreviewMetadataPanel;
export { VideoPreviewMetadataPanel };
