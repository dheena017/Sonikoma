import React, { useState } from "react";
import { Download, Youtube, Loader2, ExternalLink, Music, Mic } from "lucide-react";
import * as api from "../../../api/index.js";
import { fetchWithAuth } from "../../../utils.js";

interface OutputMetadataPanelProps {
  musicTheme: string;
  voiceActor: string;
  videoUrl: string | null;
  navigateTo?: (path: string) => void;
}

const OutputMetadataPanel = React.memo(
  ({
    musicTheme,
    voiceActor,
    videoUrl,
    navigateTo,
  }: OutputMetadataPanelProps) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
    const [publishMessage, setPublishMessage] = useState<string | null>(null);

    const handlePublishYouTube = () => {
      if (navigateTo) {
        navigateTo("/youtube");
      } else {
        window.history.pushState({}, "", "/youtube");
        window.dispatchEvent(new Event("popstate"));
      }
    };

    return (
      <div className="flex items-center flex-wrap md:flex-nowrap gap-3">
        {/* Specs */}
        <div className="hidden lg:flex items-center gap-2">
          {musicTheme && (
            <div
              className="bg-neutral-950/40 border border-neutral-800/80 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[150px] xl:max-w-[200px]"
              title={`Soundtrack: ${musicTheme}`}
            >
              <Music className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-[10px] text-neutral-300 truncate font-mono">
                {musicTheme}
              </span>
            </div>
          )}

          {voiceActor && (
            <div
              className="bg-neutral-950/40 border border-neutral-800/80 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[150px] xl:max-w-[200px]"
              title={`Active Speaker: ${voiceActor}`}
            >
              <Mic className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-[10px] text-neutral-300 truncate font-mono">
                {voiceActor}
              </span>
            </div>
          )}

          <div className="bg-neutral-950/40 border border-neutral-800/80 px-2 py-1 rounded-lg flex items-center gap-1">
            <span className="text-[10px] text-neutral-500 font-sans">Codec:</span>
            <span className="text-[10px] text-neutral-300 font-mono font-semibold">H.264</span>
          </div>
        </div>

        {/* Separator between specs and actions (only if specs show and actions exist) */}
        {videoUrl && (
          <div className="hidden lg:block w-px h-4 bg-neutral-800" />
        )}

        {/* Compiled Output Link */}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-mono text-[10px] bg-emerald-950/20 border border-emerald-900/35 px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-emerald-950/40 hover:border-emerald-800/50 transition-all truncate max-w-[140px] xl:max-w-[200px] font-bold"
            title={`Compiled Output URL: ${videoUrl}`}
          >
            <ExternalLink className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="truncate">{videoUrl}</span>
          </a>
        )}

        {/* Action Buttons */}
        {videoUrl && (
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <a
              href={videoUrl}
              download={`webtoon_cinemamaster_${Math.random()
                .toString(36)
                .substring(2, 6)}.mp4`}
              target="_blank"
              rel="noreferrer"
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] xl:text-[11px] font-bold font-sans transition-all cursor-pointer select-none active:scale-95 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download MP4</span>
            </a>

            {/* YouTube Publish */}
            {!youtubeUrl ? (
              <button
                onClick={handlePublishYouTube}
                disabled={isPublishing}
                className={`text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] xl:text-[11px] font-bold font-sans transition-all select-none border border-red-500/30 shadow-sm ${
                  isPublishing
                    ? "bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-70"
                    : "bg-[#FF0000] hover:bg-[#CC0000] cursor-pointer active:scale-95 shadow-red-950/20"
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
                className="bg-green-600 hover:bg-green-500 text-white border border-green-500/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] xl:text-[11px] font-bold font-sans transition-all cursor-pointer select-none active:scale-95 shadow-sm shadow-green-950/20"
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

export default OutputMetadataPanel;
