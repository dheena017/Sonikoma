import React, { useState } from "react";
import { Download, Youtube, Loader2, ExternalLink, Music, Mic, Film } from "lucide-react";
import { resolveDownloadNaming } from "@/shared/utils/downloadNaming";

export interface VideoPreviewMetadataPanelProps {
  musicTheme: string;
  voiceActor: string;
  videoUrl: string | null;
  navigateTo?: (path: string) => void;
  // Dynamic naming context
  seriesTitle?: string;
  chapterNumber?: string | number;
  chapterTitle?: string;
  targetUrl?: string;
}

/** Derive a short codec label from the video URL extension. */
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
    const [publishMessage] = useState<string | null>(null);

    const handlePublishYouTube = () => {
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
      <div className="flex items-center flex-wrap gap-2">
        {/* Track Specs Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {musicTheme && (
            <div
              className="h-7 px-2.5 rounded-lg bg-neutral-900/80 border border-purple-500/25 flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors max-w-[170px] xl:max-w-[210px]"
              title={`Soundtrack: ${musicTheme}`}
            >
              <Music className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="text-[11px] font-medium font-mono truncate">{musicTheme}</span>
            </div>
          )}

          {voiceActor && (
            <div
              className="h-7 px-2.5 rounded-lg bg-neutral-900/80 border border-purple-500/25 flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors max-w-[170px] xl:max-w-[210px]"
              title={`Active Voice: ${voiceActor}`}
            >
              <Mic className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-medium font-mono truncate">{voiceActor}</span>
            </div>
          )}

          <div
            className="h-7 px-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center gap-1 text-[11px] font-mono text-neutral-400"
            title="Video Compression Codec"
          >
            <span className="text-neutral-500 font-sans text-[10px] uppercase font-bold">Codec</span>
            <span className="text-neutral-200 font-semibold">{codec}</span>
          </div>
        </div>

        {/* Separator */}
        {videoUrl && <div className="hidden sm:block w-px h-4 bg-neutral-800 mx-0.5" />}

        {/* Compiled Output URL Link */}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="h-7 px-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all truncate max-w-[150px] xl:max-w-[220px]"
            title={`Compiled Video URL: ${videoUrl}`}
          >
            <ExternalLink className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate">{videoUrl}</span>
          </a>
        )}

        {/* Action Buttons: Download & YouTube */}
        {videoUrl && (
          <div className="flex items-center gap-2">
            <a
              href={videoUrl}
              download={downloadFilename}
              target="_blank"
              rel="noreferrer"
              className="h-7 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700 text-neutral-200 text-[11px] font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
              title={`Download MP4: ${downloadFilename}`}
            >
              <Download className="h-3.5 w-3.5 text-neutral-300" />
              <span>Download MP4</span>
            </a>

            {!youtubeUrl ? (
              <button
                type="button"
                onClick={handlePublishYouTube}
                disabled={isPublishing}
                className={`h-7 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-bold font-sans transition-all select-none border border-red-500/30 shadow-sm ${
                  isPublishing
                    ? "bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-70 text-neutral-400"
                    : "bg-[#FF0000] hover:bg-[#CC0000] text-white cursor-pointer active:scale-95 shadow-red-950/30"
                }`}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Youtube className="h-3.5 w-3.5" />
                    <span>Publish to YouTube</span>
                  </>
                )}
              </button>
            ) : (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 flex items-center gap-1.5 text-[11px] font-bold font-sans transition-all cursor-pointer select-none active:scale-95 shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View on YouTube</span>
              </a>
            )}
            {publishMessage && (
              <div className="text-[10px] font-mono text-neutral-400">
                {publishMessage}
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

